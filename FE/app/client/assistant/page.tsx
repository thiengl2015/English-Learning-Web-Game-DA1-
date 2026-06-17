"use client"

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ChevronRight,
  ImagePlus,
  Menu,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CosmicBackground } from "@/components/cosmic-background"

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const API_BASE_URL = RAW_API_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_URL.replace(/\/$/, "")
  : `${RAW_API_URL.replace(/\/$/, "")}/api`

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  proofreadResult?: ProofreadDisplayResult
}

type ConversationListItem = {
  conversation_id: string
  topic: string
  topic_title: string
  status: string
  total_messages: number
  started_at: string
  ended_at?: string | null
  updated_at?: string | null
}

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ProofreadErrorType =
  | "grammar"
  | "spelling"
  | "punctuation"
  | "word_choice"
  | "sentence_structure"
  | "null"
  | null

type ProofreadWord = {
  text: string
  index: number
  isCorrect: boolean
  errorType?: ProofreadErrorType
  reason?: string | null
  correction?: string | null
  suggestions?: string[]
}

type ProofreadSentenceCorrection = {
  word?: string
  corrected?: string
  type?: string
  explanation?: string
}

type ProofreadSentence = {
  original: string
  corrected: string
  corrections?: ProofreadSentenceCorrection[]
}

type ProofreadSummary = {
  totalErrors?: number
  grammarErrors?: number
  spellingErrors?: number
  punctuationErrors?: number
  vocabularySuggestions?: string[]
}

type ProofreadUploadResponse = {
  ocr: {
    text: string
    confidence: number
    method: string
    geminiUsed: boolean
  }
  proofread: {
    originalText: string
    correctedText: string
    score: number
    grade: string
    words: ProofreadWord[]
    sentences: ProofreadSentence[]
    summary: ProofreadSummary
    feedback: string
  }
  processingTime: number
  timestamp: string
}

type ProofreadDisplayResult = {
  file: {
    name: string
    size: number
    type: string
  }
  uploadedText: string
  ocr: ProofreadUploadResponse["ocr"]
  proofread: ProofreadUploadResponse["proofread"]
  processingTime: number
  timestamp: string
}

const suggestions = [
  "Tạo hội thoại theo chủ đề trường học",
  "Từ vựng topic gia đình",
  "Community nghĩa là gì?",
]

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "Updated recently"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Updated recently"

  return `Updated: ${new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)}`
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const json = await response.json().catch(() => null)

  if (!response.ok || !json?.success) {
    throw new Error(json?.message || "Request failed")
  }

  return json
}

function normalizeErrorType(type?: ProofreadErrorType) {
  return !type || type === "null" ? null : type
}

function getErrorLabel(type: NonNullable<ReturnType<typeof normalizeErrorType>>) {
  const labels: Record<NonNullable<ReturnType<typeof normalizeErrorType>>, string> = {
    grammar: "Ngữ pháp",
    spelling: "Chính tả",
    punctuation: "Dấu câu",
    word_choice: "Từ/cụm từ",
    sentence_structure: "Cấu trúc câu",
  }

  return labels[type]
}

function getWordClassName(word: ProofreadWord) {
  const type = normalizeErrorType(word.errorType)
  if (!type || word.isCorrect) return "text-white"

  if (type === "grammar" || type === "sentence_structure") {
    return "text-red-100 underline decoration-red-400 decoration-2 underline-offset-4"
  }

  return "rounded bg-red-500/25 px-1 text-red-100 ring-1 ring-red-400/40"
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB"
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function ProofreadResultCard({ result }: { result: ProofreadDisplayResult }) {
  const words = result.proofread.words || []
  const errors = words.filter((word) => {
    const type = normalizeErrorType(word.errorType)
    return type && !word.isCorrect
  })

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <div className="text-sm font-semibold text-cyan-200">OCR Proofread Result</div>
          <div className="mt-0.5 text-xs text-white/50">
            {result.file.name} · {formatFileSize(result.file.size)}
          </div>
        </div>
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-100">
          {result.proofread.grade || "-"} · {result.proofread.score ?? "-"}%
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-white/70">Văn bản đã nhận diện</div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 leading-8 text-white/90">
          {words.length > 0 ? (
            words.map((word, index) => {
              const type = normalizeErrorType(word.errorType)
              const detail = [
                type ? getErrorLabel(type) : null,
                word.reason || null,
                word.correction ? `Sửa: ${word.correction}` : null,
              ]
                .filter(Boolean)
                .join(" - ")

              return (
                <span
                  key={`${word.index}-${word.text}-${index}`}
                  className={getWordClassName(word)}
                  title={detail || undefined}
                >
                  {index > 0 ? " " : ""}
                  {word.text}
                </span>
              )
            })
          ) : (
            <span className="whitespace-pre-wrap">{result.uploadedText}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-white/55">
          <span>
            <span className="rounded bg-red-500/25 px-1 text-red-100 ring-1 ring-red-400/40">
              đỏ
            </span>{" "}
            = chính tả / từ / cụm từ
          </span>
          <span>
            <span className="text-red-100 underline decoration-red-400 decoration-2 underline-offset-4">
              gạch chân
            </span>{" "}
            = ngữ pháp / cấu trúc câu
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-white/70">Bản đã sửa</div>
        <div className="whitespace-pre-wrap rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 leading-7 text-emerald-50">
          {result.proofread.correctedText || result.uploadedText}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-white/70">Lỗi cụ thể</div>
          <div className="space-y-2">
            {errors.slice(0, 12).map((word, index) => {
              const type = normalizeErrorType(word.errorType)
              return (
                <div
                  key={`${word.index}-${word.text}-error-${index}`}
                  className="rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-50"
                >
                  <div className="font-semibold">
                    {word.text}
                    {type ? ` · ${getErrorLabel(type)}` : ""}
                  </div>
                  {word.reason && <div className="mt-1 text-white/70">{word.reason}</div>}
                  {word.correction && (
                    <div className="mt-1 text-emerald-200">Sửa thành: {word.correction}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {result.proofread.feedback && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75">
          {result.proofread.feedback}
        </div>
      )}
    </div>
  )
}

export default function AssistantPage() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userName, setUserName] = useState("Odixee")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const hasStartedConversation = messages.length > 0 || isLoading || isUploading

  const fetchConversations = useCallback(async () => {
    const token = getToken()
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/ai/conversations?limit=30`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await parseApiResponse<{
        conversations: ConversationListItem[]
      }>(response)

      const sorted = [...(data.data.conversations || [])].sort((a, b) => {
        const aTime = new Date(a.updated_at || a.started_at).getTime()
        const bTime = new Date(b.updated_at || b.started_at).getTime()
        return bTime - aTime
      })

      setConversations(sorted)
    } catch (error) {
      console.error("Conversation list error:", error)
    }
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = getToken()
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await parseApiResponse<{
          display_name?: string
          username?: string
        }>(response)

        setUserName(data.data.display_name || data.data.username || "Odixee")
      } catch (error) {
        console.error("User profile error:", error)
      }
    }

    fetchUserProfile()
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading, isUploading])

  const startConversation = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/conversations/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic_id: "daily-life" }),
    })

    const data = await parseApiResponse<{ conversation_id: string }>(response)
    setConversationId(data.data.conversation_id)
    return data.data.conversation_id
  }

  const sendChatMessage = async (content: string, displayContent = content) => {
    const trimmed = content.trim()
    if (!trimmed || isLoading || isUploading) return

    const token = getToken()
    if (!token) {
      alert("Please sign in to use the assistant.")
      return
    }

    setMessages((prev) => [...prev, { role: "user", content: displayContent }])
    setMessage("")
    setIsLoading(true)

    try {
      const activeConversationId = conversationId || (await startConversation(token))

      const response = await fetch(
        `${API_BASE_URL}/ai/conversations/${activeConversationId}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: trimmed }),
        }
      )

      const data = await parseApiResponse<{
        ai_response: string
        conversation_title?: string
      }>(response)

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.data.ai_response },
      ])

      if (data.data.conversation_title) {
        setConversations((prev) =>
          prev.map((item) =>
            item.conversation_id === activeConversationId
              ? { ...item, topic_title: data.data.conversation_title || item.topic_title }
              : item
          )
        )
      }

      fetchConversations()
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I am having trouble connecting right now.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = () => {
    sendChatMessage(message)
  }

  const handleSelectConversation = async (id: string) => {
    const token = getToken()
    if (!token || isHistoryLoading) return

    setIsHistoryLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/ai/conversations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await parseApiResponse<{
        conversation_id: string
        messages: Array<{ role: string; content: string }>
      }>(response)

      setConversationId(data.data.conversation_id)
      setMessages(
        data.data.messages
          .filter((item) => item.role === "user" || item.role === "assistant")
          .map((item) => ({
            role: item.role as "user" | "assistant",
            content: item.content,
          }))
      )
    } catch (error) {
      console.error("Conversation history error:", error)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  const handleNewChat = () => {
    setConversationId(null)
    setMessages([])
    setMessage("")
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || isLoading || isUploading) return

    const token = getToken()
    if (!token) {
      alert("Please sign in to upload an image.")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`${API_BASE_URL}/proofread`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await parseApiResponse<ProofreadUploadResponse>(response)

      const extractedText = data.data.ocr.text.trim()

      if (!extractedText) {
        throw new Error("No readable text found in the image.")
      }

      const proofreadResult: ProofreadDisplayResult = {
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
        uploadedText: extractedText,
        ocr: data.data.ocr,
        proofread: data.data.proofread,
        processingTime: data.data.processingTime,
        timestamp: data.data.timestamp,
      }

      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Image: ${file.name}` },
        {
          role: "assistant",
          content: "OCR proofread result",
          proofreadResult,
        },
      ])
    } catch (error) {
      console.error("Image OCR error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Could not read text from this image.",
        },
      ])
    } finally {
      setIsUploading(false)
    }
  }

  const renderComposer = (variant: "landing" | "chat") => (
    <div className={variant === "landing" ? "relative" : "relative pt-2"}>
      <Input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            handleSendMessage()
          }
        }}
        disabled={isLoading || isUploading}
        placeholder="Ask Techdies something..."
        className={`w-full rounded-2xl bg-white/5 border-white/20 text-white placeholder:text-gray-300 pr-28 text-lg focus-visible:!border-cyan-400 focus-visible:!ring-cyan-400/30 ${
          variant === "landing" ? "h-16" : "h-14"
        }`}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleImageChange}
      />

      <div className="absolute right-2 top-1/2 mt-1 flex -translate-y-1/2 items-center gap-2">
        <Button
          onClick={() => imageInputRef.current?.click()}
          disabled={isLoading || isUploading}
          size="icon"
          title="Upload image"
          className={`rounded-xl border border-cyan-300/40 bg-transparent text-cyan-300 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${
            variant === "landing" ? "h-11 w-11" : "h-10 w-10"
          }`}
        >
          <ImagePlus className="w-5 h-5" />
        </Button>

        <Button
          onClick={handleSendMessage}
          disabled={isLoading || isUploading || !message.trim()}
          size="icon"
          className={`rounded-xl bg-cyan-500 transition-all hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50 ${
            variant === "landing" ? "h-11 w-11" : "h-10 w-10"
          }`}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      <Link
        href="/client"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Menu</span>
      </Link>

      {!isSidebarOpen && (
        <Button
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open chat history"
          title="Open chat history"
          size="icon"
          className="fixed right-4 top-6 z-30 h-11 w-11 rounded-xl bg-[#130c33]/85 hover:bg-[#1b1244] border border-cyan-400/30 text-cyan-200 shadow-xl"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div
        className={`relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20 transition-[padding] duration-300 ${
          isSidebarOpen ? "lg:pr-[25rem]" : ""
        }`}
      >
        <div className="w-full max-w-5xl mx-auto">
          {!hasStartedConversation ? (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold text-white">Hi, {userName}!</h1>
                <p className="text-xl text-cyan-300">How can I help you?</p>
              </div>

              <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
                {renderComposer("landing")}
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setMessage(suggestion)}
                    disabled={isLoading || isUploading}
                    className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:border-cyan-400 transition-all duration-300 shadow-lg text-sm disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-[#573fa0]/80 p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col h-[min(680px,calc(100vh-10rem))] min-h-[440px]">
              <div className="pointer-events-none absolute -left-10 -top-14 h-32 w-32 rounded-full bg-cyan-300/60 blur-2xl" />
              <div className="pointer-events-none absolute left-32 top-20 h-20 w-20 rounded-full bg-lime-300/60 blur-xl" />
              <div className="pointer-events-none absolute left-20 top-44 h-28 w-28 rounded-full bg-violet-300/50 blur-2xl" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-72 rounded-full bg-cyan-300/35 blur-2xl" />

              <div className="relative z-10 flex-1 overflow-y-auto mb-6 pr-2 space-y-4 custom-scrollbar">
                {messages.length === 0 && !isUploading && !isLoading && (
                  <div className="h-full flex items-center justify-center text-white/50 italic">
                    Start a conversation by typing below...
                  </div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={`${msg.role}-${index}`}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`px-5 py-3 rounded-2xl max-w-[85%] text-base whitespace-pre-wrap break-words ${
                        msg.role === "user"
                          ? "bg-cyan-500 text-white rounded-br-none"
                          : "bg-white/20 text-white rounded-bl-none border border-white/10"
                      }`}
                    >
                      {msg.proofreadResult ? (
                        <ProofreadResultCard result={msg.proofreadResult} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {isUploading && (
                  <div className="flex justify-start">
                    <div className="px-5 py-3 rounded-2xl bg-white/20 text-white rounded-bl-none border border-white/10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
                      <span className="animate-pulse">Reading and grading...</span>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="px-5 py-3 rounded-2xl bg-white/20 text-white rounded-bl-none border border-white/10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="relative z-10">{renderComposer("chat")}</div>
            </div>
          )}
        </div>
      </div>

      <aside
        className={`fixed right-0 top-0 z-40 h-screen w-[min(24rem,100vw)] border-l border-white/10 bg-[#150d35]/95 text-white shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-24 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <MessageSquareText className="h-6 w-6 text-cyan-300" />
            <h2 className="whitespace-nowrap text-xl font-bold tracking-wide">Chat History</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewChat}
              variant="ghost"
              className="gap-2 text-cyan-300 hover:bg-white/10 hover:text-cyan-200"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              onClick={() => setIsSidebarOpen(false)}
              size="icon"
              variant="ghost"
              title="Close"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="h-[calc(100vh-6rem)] overflow-y-auto px-5 py-5 custom-scrollbar">
          {isHistoryLoading && (
            <div className="mb-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              Loading...
            </div>
          )}

          {conversations.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/60">
              No conversations yet.
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((item) => {
                const active = item.conversation_id === conversationId

                return (
                  <button
                    key={item.conversation_id}
                    onClick={() => handleSelectConversation(item.conversation_id)}
                    className={`w-full rounded-xl border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-cyan-300/70 bg-cyan-400/15"
                        : "border-white/10 bg-white/5 hover:border-cyan-300/40 hover:bg-white/10"
                    }`}
                  >
                    <div className="line-clamp-1 text-lg font-bold text-white">
                      {item.topic_title || "New Chat"}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/45">
                      {formatUpdatedAt(item.updated_at || item.started_at)}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
