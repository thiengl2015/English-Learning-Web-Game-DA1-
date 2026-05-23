"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import { PracticeDetailState } from "@/components/practice-detail-state"
import {
  completePracticeAttempt,
  getPracticeTopic,
  MissingPracticeTokenError,
  PracticeItem,
  startPracticeAttempt,
} from "@/lib/api/practice"

interface BlankSegment { type: "blank"; id: string; answer: string }
interface TextSegment { type: "text"; content: string }
type Segment = TextSegment | BlankSegment

interface Part {
  id: string
  passage: Segment[]
  title: string
  image: string
}

function getContent(item: PracticeItem) {
  return item.contentData || item.content_data || {}
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

function readSegments(item: PracticeItem): Segment[] {
  const content = getContent(item)
  return Array.isArray(content.segments) ? (content.segments as Segment[]) : []
}

export default function ListenFillDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [topicTitle, setTopicTitle] = useState("")
  const [parts, setParts] = useState<Part[]>([])
  const [nextTopic, setNextTopic] = useState<string | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missingToken, setMissingToken] = useState(false)
  const startTimeRef = useRef(Date.now())
  const completionSentRef = useRef(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setMissingToken(false)
    completionSentRef.current = false
    startTimeRef.current = Date.now()

    Promise.all([getPracticeTopic("listen-fill", id), startPracticeAttempt("listen-fill", id)])
      .then(([detail, attempt]) => {
        if (!active) return
        setTopicTitle(detail.topic.title)
        setParts(detail.items.map((item) => ({
          id: item.id,
          title: item.title || detail.topic.title,
          image: item.imageUrl || detail.topic.imageUrl || "",
          passage: readSegments(item),
        })))
        setNextTopic(detail.nextTopicSlug)
        setAttemptId(attempt.attemptId)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof MissingPracticeTokenError) {
          setMissingToken(true)
        } else {
          setError(err instanceof Error ? err.message : "Could not load this practice topic.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  const [currentPart, setCurrentPart] = useState(0)
  const part = parts[currentPart]
  const total = parts.length
  const blanks = part?.passage.filter((s): s is BlankSegment => s.type === "blank") || []
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [checkedParts, setCheckedParts] = useState<Set<number>>(new Set())
  const [completedParts, setCompletedParts] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    setInputs({})
  }, [currentPart])

  useEffect(() => {
    setCurrentPart(0)
    setInputs({})
    setCheckedParts(new Set())
    setCompletedParts(new Set())
    setShowModal(false)
  }, [id])

  const isChecked = checkedParts.has(currentPart)
  const allFilled = blanks.every((b) => (inputs[b.id] ?? "").trim().length > 0)

  const getBlankState = (blankId: string): "idle" | "correct" | "wrong" => {
    if (!isChecked) return "idle"
    const blank = blanks.find((b) => b.id === blankId)!
    return normalize(inputs[blankId] ?? "") === normalize(blank.answer) ? "correct" : "wrong"
  }

  const sendCompletion = (completed: Set<number>) => {
    if (!attemptId || completionSentRef.current) return
    completionSentRef.current = true
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    completePracticeAttempt(attemptId, {
      correctCount: completed.size,
      totalCount: total,
      completedItems: completed.size,
      timeSpent,
      answers: { inputs },
    }).catch(() => {
      completionSentRef.current = false
    })
  }

  const handleCheck = () => {
    const newChecked = new Set(checkedParts).add(currentPart)
    setCheckedParts(newChecked)
    const partCorrect = blanks.every((b) => normalize(inputs[b.id] ?? "") === normalize(b.answer))
    let newCompleted = completedParts
    if (partCorrect) {
      newCompleted = new Set(completedParts).add(currentPart)
      setCompletedParts(newCompleted)
    }
    if (newChecked.size === total) {
      sendCompletion(newCompleted)
      setTimeout(() => setShowModal(true), 400)
    }
  }

  const handleNext = () => {
    if (currentPart < total - 1) setCurrentPart(currentPart + 1)
  }

  const handleReset = () => {
    setCurrentPart(0)
    setInputs({})
    setCheckedParts(new Set())
    setCompletedParts(new Set())
    setShowModal(false)
    completionSentRef.current = false
    startTimeRef.current = Date.now()
    startPracticeAttempt("listen-fill", id)
      .then((attempt) => setAttemptId(attempt.attemptId))
      .catch(() => undefined)
  }

  const handleSpeak = () => {
    if (!part) return
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }
    const text = part.passage.map((seg) => (seg.type === "text" ? seg.content : seg.answer)).join("")
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "en-US"
    utter.rate = 0.9
    utter.onend = () => setIsPlaying(false)
    synthRef.current = utter
    setIsPlaying(true)
    window.speechSynthesis.speak(utter)
  }

  const dotColor = (i: number) => {
    if (completedParts.has(i)) return "bg-green-400"
    if (i === currentPart) return "bg-cyan-400"
    if (checkedParts.has(i)) return "bg-red-400/70"
    return "bg-white/25"
  }

  if (loading) return <PracticeDetailState backHref="/client/practice/listen-fill" message="Loading practice topic..." />
  if (missingToken) return <PracticeDetailState backHref="/client/practice/listen-fill" message="Sign in to practice and save your progress." showSignIn />
  if (error) return <PracticeDetailState backHref="/client/practice/listen-fill" message={error} />
  if (!part) return <PracticeDetailState backHref="/client/practice/listen-fill" message="No listening parts are available for this topic." />

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      <Link
        href="/client/practice/listen-fill"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      <div className="relative z-10 flex items-stretch justify-center gap-0 w-full max-w-5xl px-6 pb-8">
        <div
          className="flex-1 max-w-[420px] rounded-l-2xl flex flex-col items-center justify-between p-8 gap-6"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderRight: "none",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          <h1 className="text-white font-bold text-xl text-center text-balance">{topicTitle}</h1>

          <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
            <img src={part.image} alt={topicTitle} className="w-full h-full object-cover" />
          </div>

          <div className="w-full flex flex-col items-center gap-3">
            <div className="flex items-center gap-[3px] h-10">
              {Array.from({ length: 36 }).map((_, i) => {
                const h = [14, 20, 28, 36, 28, 22, 18, 32, 38, 26, 16, 24, 36, 30, 20, 14, 22, 34, 28, 18, 26, 38, 22, 16, 30, 24, 18, 32, 20, 26, 14, 28, 36, 22, 18, 24][i % 36]
                return (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${isPlaying ? "bg-cyan-400" : "bg-white/40"}`}
                    style={{ width: 3, height: h * 0.9 }}
                  />
                )
              })}
            </div>

            <button
              onClick={handleSpeak}
              className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </button>
          </div>

          <p className="text-white/30 text-xs text-center">Part {currentPart + 1} of {total}</p>
        </div>

        <div
          className="w-4 flex-shrink-0"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))",
          }}
        />

        <div
          className="flex-1 max-w-[420px] rounded-r-2xl flex flex-col p-8 gap-4"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderLeft: "none",
            boxShadow: "8px 0 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          <h2 className="text-white/80 font-semibold text-lg text-center">{topicTitle}</h2>

          <div className="leading-relaxed text-white/90 text-base flex-1 flex flex-col justify-center">
            <p className="inline">
              {part.passage.map((seg, idx) => {
                if (seg.type === "text") return <span key={idx}>{seg.content}</span>
                const state = getBlankState(seg.id)
                const val = inputs[seg.id] ?? ""
                const width = Math.max(seg.answer.length * 11, 60)
                const borderColor =
                  state === "correct" ? "border-green-400" :
                    state === "wrong" ? "border-red-400" : "border-white/30 focus-within:border-cyan-400"
                const textColor =
                  state === "correct" ? "text-green-400" :
                    state === "wrong" ? "text-red-400" : "text-cyan-400"

                return (
                  <span key={idx} className="inline-block align-baseline mx-1">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current[seg.id] = el
                      }}
                      type="text"
                      value={val}
                      disabled={isChecked}
                      onChange={(e) => setInputs({ ...inputs, [seg.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isChecked) {
                          e.preventDefault()
                          const currentIdx = blanks.findIndex((b) => b.id === seg.id)
                          if (currentIdx < blanks.length - 1) {
                            const nextBlank = blanks[currentIdx + 1]
                            inputRefs.current[nextBlank.id]?.focus()
                          }
                        }
                      }}
                      placeholder="..."
                      className={`
                        inline-block border-b-2 bg-transparent outline-none text-center text-sm font-semibold
                        placeholder:text-white/30 transition-colors duration-200
                        ${borderColor} ${textColor}
                        ${!isChecked ? "focus:border-cyan-400" : ""}
                      `}
                      style={{ width }}
                    />
                  </span>
                )
              })}
            </p>

            {isChecked && (
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-white/60 text-xs font-semibold mb-3">Correct Answers:</p>
                <p className="leading-relaxed text-white/70 text-sm">
                  {part.passage.map((seg, idx) => {
                    if (seg.type === "text") return <span key={idx}>{seg.content}</span>
                    return (
                      <span key={idx} className="inline-block mx-1">
                        <span className="bg-green-400/20 text-green-300 px-2 py-1 rounded font-semibold">
                          {seg.answer}
                        </span>
                      </span>
                    )
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between">
            <span className="text-white/50 text-sm px-3 py-1.5 rounded-full bg-white/8 border border-white/15">
              ({currentPart + 1}/{total})
            </span>

            <div className="flex gap-1.5">
              {parts.map((_, i) => (
                <button key={i} onClick={() => setCurrentPart(i)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${dotColor(i)}`} />
              ))}
            </div>

            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={!allFilled}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${allFilled
                  ? "bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30"
                  : "bg-white/8 border-white/15 text-white/40 cursor-not-allowed"
                  }`}
              >
                Check
              </button>
            ) : currentPart < total - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-semibold bg-cyan-500 border border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all"
              >
                Next
              </button>
            ) : (
              <div className="w-16" />
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="px-10 py-6 rounded-2xl bg-[#1a2a3a]/90 border-2 border-green-400/50 backdrop-blur-md shadow-[0_0_40px_rgba(74,222,128,0.25)]">
              <p className="text-green-400 text-2xl font-bold text-center">Great listening!</p>
              <p className="text-white/60 text-sm text-center mt-2 mb-4">
                You completed {completedParts.size}/{total} parts correctly
              </p>
              <div className="flex gap-6">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a2a3a]/90 hover:bg-[#2a3a4a] font-medium border border-white/20 text-gray-300 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Again
                </button>
                {nextTopic && (
                  <Link
                    href={`/client/practice/listen-fill/${nextTopic}`}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/30"
                  >
                    Next Topic
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
