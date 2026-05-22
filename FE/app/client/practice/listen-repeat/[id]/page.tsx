"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Play, CheckCircle2, RotateCcw, Mic, MicOff } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

interface Card {
  id: number
  word: string
  audioText: string
  image: string
}

const TOPIC_DATA: Record<string, { title: string; sentence: string; cards: Card[] }> = {
  greetings: {
    title: "Greetings",
    sentence: "I like to say...",
    cards: [
      { id: 1, word: "hello", audioText: "hello", image: "👋" },
      { id: 2, word: "goodbye", audioText: "goodbye", image: "🙋" },
      { id: 3, word: "thank you", audioText: "thank you", image: "🙏" },
      { id: 4, word: "sorry", audioText: "sorry", image: "😔" },
      { id: 5, word: "please", audioText: "please", image: "🥺" },
      { id: 6, word: "welcome", audioText: "welcome", image: "🤗" },
    ],
  },
  "daily-activities": {
    title: "Daily Activities",
    sentence: "Every day I...",
    cards: [
      { id: 1, word: "riding a bike", audioText: "riding a bike", image: "🚴" },
      { id: 2, word: "swimming", audioText: "swimming", image: "🏊" },
      { id: 3, word: "reading", audioText: "reading", image: "📖" },
      { id: 4, word: "cooking", audioText: "cooking", image: "👨‍🍳" },
      { id: 5, word: "sleeping", audioText: "sleeping", image: "😴" },
      { id: 6, word: "running", audioText: "running", image: "🏃" },
    ],
  },
  animals: {
    title: "Animals",
    sentence: "I can see a...",
    cards: [
      { id: 1, word: "cat", audioText: "cat", image: "🐱" },
      { id: 2, word: "dog", audioText: "dog", image: "🐶" },
      { id: 3, word: "fox", audioText: "fox", image: "🦊" },
      { id: 4, word: "bear", audioText: "bear", image: "🐻" },
      { id: 5, word: "rabbit", audioText: "rabbit", image: "🐰" },
      { id: 6, word: "elephant", audioText: "elephant", image: "🐘" },
    ],
  },
  food: {
    title: "Food & Drinks",
    sentence: "I want to eat...",
    cards: [
      { id: 1, word: "apple", audioText: "apple", image: "🍎" },
      { id: 2, word: "banana", audioText: "banana", image: "🍌" },
      { id: 3, word: "pizza", audioText: "pizza", image: "🍕" },
      { id: 4, word: "cake", audioText: "cake", image: "🎂" },
      { id: 5, word: "milk", audioText: "milk", image: "🥛" },
      { id: 6, word: "bread", audioText: "bread", image: "🍞" },
    ],
  },
  sports: {
    title: "Sports",
    sentence: "I love playing...",
    cards: [
      { id: 1, word: "football", audioText: "football", image: "⚽" },
      { id: 2, word: "basketball", audioText: "basketball", image: "🏀" },
      { id: 3, word: "tennis", audioText: "tennis", image: "🎾" },
      { id: 4, word: "baseball", audioText: "baseball", image: "⚾" },
      { id: 5, word: "volleyball", audioText: "volleyball", image: "🏐" },
      { id: 6, word: "swimming", audioText: "swimming", image: "🏊" },
    ],
  },
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
  const topic = TOPIC_DATA[id] ?? TOPIC_DATA["daily-activities"]

  const topicKeys = Object.keys(TOPIC_DATA)
  const currentIndex = topicKeys.indexOf(id)
  const nextTopic = currentIndex !== -1 && currentIndex < topicKeys.length - 1
    ? topicKeys[currentIndex + 1]
    : topicKeys[0]

  // Shuffle card positions on each mount
  const shuffledCards = useMemo(() => shuffleArray(topic.cards), [topic])

  const [correct, setCorrect] = useState<Record<number, boolean>>({})
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [listeningId, setListeningId] = useState<number | null>(null)
  const [spokenText, setSpokenText] = useState<Record<number, string>>({})
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Reset when topic changes
  useEffect(() => {
    setCorrect({})
    setSpokenText({})
    setListeningId(null)
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
  }, [id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

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

    // If already listening to this card, stop
    if (listeningId === card.id) {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      setListeningId(null)
      return
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setListeningId(card.id)
    }

    recognition.onresult = (event) => {
      const results = event.results[0]
      let matched = false

      // Check all alternatives for a match
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
    window.speechSynthesis.cancel()
    setPlayingId(null)
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
    setListeningId(null)
  }

  const correctCount = Object.values(correct).filter(Boolean).length
  const allDone = correctCount === shuffledCards.length

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />

      {/* Back Button */}
      <Link
        href="/client/practice/listen-repeat"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="fixed top-6 right-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <RotateCcw className="w-4 h-4 text-white" />
        <span className="text-white font-medium text-sm">Reset</span>
      </button>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8">
        {/* Sentence / Title */}
        <div className="mb-4 text-center">
          <div className="inline-block px-8 py-2 rounded-2xl border-2 border-cyan-400/60 bg-white/5 backdrop-blur-md shadow-[0_0_24px_rgba(34,211,238,0.15)]">
            <span className="text-white text-xl font-semibold tracking-wide">{topic.sentence}</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-cyan-300/70 text-sm">{topic.title}</span>
            <span className="text-white/30 text-sm">•</span>
            <span className="text-white/50 text-sm">{correctCount}/{shuffledCards.length} correct</span>
          </div>
        </div>

        {/* 3x2 Card Grid */}
        <div className="grid grid-cols-3 gap-5 w-full max-w-2xl">
          {shuffledCards.map((card) => {
            const isCorrect = correct[card.id] === true
            const isListening = listeningId === card.id

            return (
              <div key={card.id} className="flex flex-col items-center gap-2">
                {/* Card */}
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
                  {/* Image area — hidden until correct */}
                  <div
                    className={`
                      absolute inset-0 flex items-center justify-center transition-all duration-500
                      ${isCorrect ? "opacity-100 scale-100" : "opacity-0 scale-75"}
                    `}
                  >
                    <span className="text-7xl select-none">{card.image}</span>
                  </div>

                  {/* Blur overlay when not yet correct */}
                  {!isCorrect && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-7xl opacity-10 blur-sm select-none">{card.image}</span>
                    </div>
                  )}

                  {/* Play button */}
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

                  {/* Correct badge */}
                  {isCorrect && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400 drop-shadow-md" />
                    </div>
                  )}
                </div>

                {/* Microphone button */}
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

        {/* All done modal */}
        {allDone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
              <div className="px-10 py-6 rounded-2xl bg-[#1a2a3a]/90 border-2 border-green-400/50 backdrop-blur-md shadow-cyan-300 gap-4">
                <p className="text-green-400 text-2xl font-bold text-center">
                  Great speaking!
                </p>
                <p className="text-white/60 text-sm text-center mt-2 mb-4">
                  You completed all {shuffledCards.length} words
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-1 rounded-full bg-[#1a2a3a]/90 hover:bg-[#2a3a4a] font-medium border border-white/20 text-gray-300 transition-all duration-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Again
                  </button>
                  <Link
                    href={`/client/practice/listen-repeat/${nextTopic}`}
                    className="flex items-center gap-2 px-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-all duration-300 shadow-lg shadow-cyan-500/30"
                  >
                    Next Topic
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
