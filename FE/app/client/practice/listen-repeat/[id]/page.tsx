"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Play, CheckCircle2, RotateCcw, Mic, MicOff } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import { PracticeDetailState } from "@/components/practice-detail-state"
import {
  completePracticeAttempt,
  getPracticeTopic,
  MissingPracticeTokenError,
  PracticeItem,
  startPracticeAttempt,
} from "@/lib/api/practice"

interface Card {
  id: string
  word: string
  audioText: string
  image: string
}

type SpeechRecognitionConstructor = new () => SpeechRecognition

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult {
  length: number
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

function getContent(item: PracticeItem) {
  return item.contentData || item.content_data || {}
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ListenRepeatDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState("")
  const [sentence, setSentence] = useState("I like to say...")
  const [cards, setCards] = useState<Card[]>([])
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

    Promise.all([getPracticeTopic("listen-repeat", id), startPracticeAttempt("listen-repeat", id)])
      .then(([detail, attempt]) => {
        if (!active) return
        const mappedCards = detail.items.map((item) => {
          const content = getContent(item)
          return {
            id: item.id,
            word: asString(content.word, item.title || ""),
            audioText: asString(content.audioText, item.audioText || item.title || ""),
            image: asString(content.image, detail.topic.emoji || ""),
          }
        })
        setTitle(detail.topic.title)
        setSentence(asString(getContent(detail.items[0] || {}).prompt, detail.items[0]?.prompt || "I like to say..."))
        setCards(mappedCards)
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

  const shuffledCards = useMemo(() => shuffleArray(cards), [cards])

  const [correct, setCorrect] = useState<Record<string, boolean>>({})
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [listeningId, setListeningId] = useState<string | null>(null)
  const [spokenText, setSpokenText] = useState<Record<string, string>>({})
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    setCorrect({})
    setSpokenText({})
    setListeningId(null)
    recognitionRef.current?.abort()
  }, [id])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const correctCount = Object.values(correct).filter(Boolean).length
  const allDone = shuffledCards.length > 0 && correctCount === shuffledCards.length

  useEffect(() => {
    if (!allDone || !attemptId || completionSentRef.current) return
    completionSentRef.current = true
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    completePracticeAttempt(attemptId, {
      correctCount,
      totalCount: shuffledCards.length,
      completedItems: shuffledCards.length,
      timeSpent,
      answers: { spokenText },
    }).catch(() => {
      completionSentRef.current = false
    })
  }, [allDone, attemptId, correctCount, shuffledCards.length, spokenText])

  const handlePlay = (card: Card) => {
    setPlayingId(card.id)
    const utterance = new SpeechSynthesisUtterance(card.audioText)
    utterance.lang = "en-US"
    utterance.rate = 0.85
    utterance.onend = () => setPlayingId(null)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const handleMicClick = (card: Card) => {
    if (correct[card.id]) return

    if (listeningId === card.id) {
      recognitionRef.current?.abort()
      setListeningId(null)
      return
    }

    recognitionRef.current?.abort()

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.")
      return
    }

    const recognition = new Recognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setListeningId(card.id)
    }

    recognition.onresult = (event) => {
      const results = event.results[0]
      let matched = false

      for (let i = 0; i < results.length; i++) {
        const transcript = results[i].transcript.toLowerCase().trim()
        setSpokenText((prev) => ({ ...prev, [card.id]: transcript }))

        if (transcript === card.word.toLowerCase()) {
          matched = true
          break
        }
      }

      if (matched) {
        setCorrect((prev) => ({ ...prev, [card.id]: true }))
      }
      setListeningId(null)
    }

    recognition.onerror = () => {
      setListeningId(null)
    }

    recognition.onend = () => {
      setListeningId(null)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleReset = () => {
    setCorrect({})
    setSpokenText({})
    completionSentRef.current = false
    startTimeRef.current = Date.now()
    startPracticeAttempt("listen-repeat", id)
      .then((attempt) => setAttemptId(attempt.attemptId))
      .catch(() => undefined)
    window.speechSynthesis.cancel()
    setPlayingId(null)
    recognitionRef.current?.abort()
    setListeningId(null)
  }

  if (loading) return <PracticeDetailState backHref="/client/practice/listen-repeat" message="Loading practice topic..." />
  if (missingToken) return <PracticeDetailState backHref="/client/practice/listen-repeat" message="Sign in to practice and save your progress." showSignIn />
  if (error) return <PracticeDetailState backHref="/client/practice/listen-repeat" message={error} />
  if (!cards.length) return <PracticeDetailState backHref="/client/practice/listen-repeat" message="No cards are available for this topic." />

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />

      <Link
        href="/client/practice/listen-repeat"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      <button
        onClick={handleReset}
        className="fixed top-6 right-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <RotateCcw className="w-4 h-4 text-white" />
        <span className="text-white font-medium text-sm">Reset</span>
      </button>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8">
        <div className="mb-4 text-center">
          <div className="inline-block px-8 py-2 rounded-2xl border-2 border-cyan-400/60 bg-white/5 backdrop-blur-md shadow-[0_0_24px_rgba(34,211,238,0.15)]">
            <span className="text-white text-xl font-semibold tracking-wide">{sentence}</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-cyan-300/70 text-sm">{title}</span>
            <span className="text-white/30 text-sm">-</span>
            <span className="text-white/50 text-sm">{correctCount}/{shuffledCards.length} correct</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 w-full max-w-2xl">
          {shuffledCards.map((card) => {
            const isCorrect = correct[card.id] === true
            const isListening = listeningId === card.id

            return (
              <div key={card.id} className="flex flex-col items-center gap-2">
                <div
                  className={`
                    relative w-full aspect-square rounded-2xl
                    backdrop-blur-md
                    border-2 transition-all duration-500 overflow-hidden
                    ${isCorrect
                      ? "border-green-400/80 bg-white/15 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                      : "border-white/20 bg-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                    }
                  `}
                >
                  <div
                    className={`
                      absolute inset-0 flex items-center justify-center transition-all duration-500
                      ${isCorrect ? "opacity-100 scale-100" : "opacity-0 scale-75"}
                    `}
                  >
                    <span className="text-7xl select-none">{card.image}</span>
                  </div>

                  {!isCorrect && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-7xl opacity-10 blur-sm select-none">{card.image}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handlePlay(card)}
                    className={`
                      absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center
                      transition-all duration-300 shadow-lg
                      ${playingId === card.id
                        ? "bg-cyan-400 scale-110 shadow-cyan-500"
                        : "bg-purple-500 hover:bg-cyan-400 hover:scale-110"
                      }
                    `}
                    aria-label={`Play audio for ${card.word}`}
                  >
                    <Play className="w-4 h-4 text-white fill-white" />
                  </button>

                  {isCorrect && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400 drop-shadow-md" />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleMicClick(card)}
                  disabled={isCorrect}
                  className={`
                    w-full px-3 py-2 rounded-xl text-sm font-medium
                    border-2 backdrop-blur-sm
                    flex items-center justify-center gap-2
                    transition-all duration-300
                    ${isCorrect
                      ? "border-green-400/60 text-green-300 bg-green-400/10 cursor-default"
                      : isListening
                        ? "border-cyan-400 text-cyan-300 bg-cyan-400/20 animate-pulse"
                        : "border-white/25 text-white/60 border-dashed hover:border-cyan-400/70 hover:bg-white/8 hover:text-white"
                    }
                  `}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{card.word}</span>
                    </>
                  ) : isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>tap to speak</span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {allDone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
              <div className="px-10 py-6 rounded-2xl bg-[#1a2a3a]/90 border-2 border-green-400/50 backdrop-blur-md shadow-cyan-300 gap-4">
                <p className="text-green-400 text-2xl font-bold text-center">Great speaking!</p>
                <p className="text-white/60 text-sm text-center mt-2 mb-4">
                  You completed all {shuffledCards.length} words
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a2a3a]/90 hover:bg-[#2a3a4a] font-medium border border-white/20 text-gray-300 transition-all duration-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Again
                  </button>
                  {nextTopic && (
                    <Link
                      href={`/client/practice/listen-repeat/${nextTopic}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-all duration-300 shadow-lg shadow-cyan-500/30"
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
    </div>
  )
}
