"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Volume2 } from "lucide-react"
import Link from "next/link"
import GameResults from "@/components/game-results"
import { GalaxyBackground } from "@/components/galaxy-background"

type Question = {
  id: string
  sentence: string // Full sentence with blank represented as ___
  missingWord: string
  audioText: string // What the audio says
  displayBefore: string // Text before blank
  displayAfter: string // Text after blank
}

const sampleQuestions: Question[] = [
  {
    id: "q1",
    sentence: "She wants a ___ hat",
    missingWord: "red",
    audioText: "She wants a red hat",
    displayBefore: "She wants a",
    displayAfter: "hat",
  },
  {
    id: "q2",
    sentence: "I need a ___ helmet",
    missingWord: "blue",
    audioText: "I need a blue helmet",
    displayBefore: "I need a",
    displayAfter: "helmet",
  },
  {
    id: "q3",
    sentence: "The rocket is very ___",
    missingWord: "fast",
    audioText: "The rocket is very fast",
    displayBefore: "The rocket is very",
    displayAfter: "",
  },
  {
    id: "q4",
    sentence: "We see a ___ star",
    missingWord: "bright",
    audioText: "We see a bright star",
    displayBefore: "We see a",
    displayAfter: "star",
  },
  {
    id: "q5",
    sentence: "The astronaut feels ___",
    missingWord: "happy",
    audioText: "The astronaut feels happy",
    displayBefore: "The astronaut feels",
    displayAfter: "",
  },
  {
    id: "q6",
    sentence: "I found a ___ planet",
    missingWord: "small",
    audioText: "I found a small planet",
    displayBefore: "I found a",
    displayAfter: "planet",
  },
  {
    id: "q7",
    sentence: "The spaceship is ___",
    missingWord: "ready",
    audioText: "The spaceship is ready",
    displayBefore: "The spaceship is",
    displayAfter: "",
  },
  {
    id: "q8",
    sentence: "We need ___ oxygen",
    missingWord: "more",
    audioText: "We need more oxygen",
    displayBefore: "We need",
    displayAfter: "oxygen",
  },
]

export default function RescueMissionPage() {
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const router = useRouter()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [isChecked, setIsChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<
    Array<{
      questionId: string
      prompt: string
      yourAnswer: string
      correctAnswer: string
    }>
  >([])
  const [gameComplete, setGameComplete] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentQuestion = sampleQuestions[currentQuestionIndex]
  const totalQuestions = sampleQuestions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  // Auto-play audio on mount and when question changes
  useEffect(() => {
    playAudio()
  }, [currentQuestionIndex])

  // Auto-close and move to next after 10 seconds when checked
  useEffect(() => {
    if (isChecked) {
      setCountdown(10)

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      const timer = setTimeout(() => {
        handleNext()
      }, 10000)

      return () => {
        clearTimeout(timer)
        clearInterval(countdownInterval)
      }
    }
  }, [isChecked, currentQuestionIndex])

  useEffect(() => {
    if (!isChecked && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentQuestionIndex, isChecked])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if not checked and not in an input already
      if (!isChecked && document.activeElement !== inputRef.current) {
        // If it's a letter, number, or backspace, focus the input and let it handle
        if (e.key.length === 1 || e.key === "Backspace") {
          inputRef.current?.focus()
        }
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [isChecked])

  useEffect(() => {
    const handleEnterForNext = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isChecked) {
        handleNext()
      }
    }

    window.addEventListener("keydown", handleEnterForNext)
    return () => window.removeEventListener("keydown", handleEnterForNext)
  }, [isChecked, currentQuestionIndex])

  const playAudio = () => {
    setIsPlaying(true)
    const utterance = new SpeechSynthesisUtterance(currentQuestion.audioText)
    utterance.lang = "en-US"
    utterance.onend = () => setIsPlaying(false)
    speechSynthesis.speak(utterance)
  }

  const handleCheck = () => {
    const correct = userInput.trim().toLowerCase() === currentQuestion.missingWord.toLowerCase()
    setIsChecked(true)
    setIsCorrect(correct)

    if (correct) {
      setCorrectCount((prev) => prev + 1)
    } else {
      setWrongAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          prompt: currentQuestion.sentence,
          yourAnswer: userInput,
          correctAnswer: currentQuestion.missingWord,
        },
      ])
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setUserInput("")
      setIsChecked(false)
      setIsCorrect(false)
    } else {
      setGameComplete(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && userInput.trim() && !isChecked) {
      handleCheck()
    }
  }

  const handleComplete = () => {
    if (unitId && lessonId) {
      router.push(`/client/units/${unitId}/lessons`)
    } else {
      router.push("/client/units")
    }
  }

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0)
    setCorrectCount(0)
    setWrongAnswers([])
    setGameComplete(false)
    setUserInput("")
    setIsChecked(false)
    setIsCorrect(false)
  }

  if (gameComplete) {
    return (
      <GameResults
        totalQuestions={totalQuestions}
        correctAnswers={correctCount}
        wrongAnswers={wrongAnswers}
        onComplete={handleComplete}
        onPlayAgain={handlePlayAgain}
      />
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GalaxyBackground />

      <Link
        href={unitId && lessonId ? `/client/units/${unitId}/lessons` : "/client/units"}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-96 z-40">
        <div className="bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-white text-sm font-medium">
              Question {currentQuestionIndex + 1}/{totalQuestions}
            </span>
            <span className="text-cyan-400 text-sm font-bold">{correctCount} correct</span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-12 py-32">
        <div className="max-w-2xl w-full space-y-16">
          {/* Play button with waveform */}
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={playAudio}
              className="relative p-8 bg-purple-600/30 backdrop-blur-sm border-4 border-purple-400 rounded-full hover:bg-purple-500/40 transition-all duration-300 group shadow-xl shadow-purple-500/50"
            >
              <Volume2 className="w-16 h-16 text-cyan-400 group-hover:scale-110 transition-transform" />
              {isPlaying && <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping" />}
            </button>
          </div>

          {/* Sentence with blank input */}
          <div className="bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-400 rounded-2xl p-8">
            <div className="flex flex-wrap items-center justify-center gap-3 text-2xl font-semibold">
              {currentQuestion.displayBefore && (
                <span className={isChecked ? (isCorrect ? "text-green-400" : "text-red-400") : "text-cyan-400"}>
                  {currentQuestion.displayBefore}
                </span>
              )}

              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isChecked}
                placeholder="  "
                className={`w-[12ch] px-4 py-2 text-center bg-slate-700/50 border-2 rounded-lg outline-none transition-all duration-300 ${
                  isChecked
                    ? isCorrect
                      ? "border-green-400 text-green-400"
                      : "border-red-400 text-red-400 animate-shake"
                    : "border-cyan-400/50 text-cyan-400 focus:border-cyan-400"
                } disabled:cursor-not-allowed`}
                autoFocus
              />

              {currentQuestion.displayAfter && (
                <span className={isChecked ? (isCorrect ? "text-green-400" : "text-red-400") : "text-cyan-400"}>
                  {currentQuestion.displayAfter}
                </span>
              )}
            </div>

            {isChecked && !isCorrect && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-white text-center text-lg">{currentQuestion.audioText}</p>
              </div>
            )}
          </div>

          {/* Check/Next button */}
          {!isChecked ? (
            <div className="flex justify-center">
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className="px-12 py-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-600 disabled:opacity-50 text-purple-700 font-bold text-xl rounded-2xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg shadow-cyan-400/50 disabled:shadow-none disabled:text-white"
              >
                Check Answer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm px-4">
                <span className="text-gray-400">Auto-next in</span>
                <span className="text-cyan-400 font-bold">{countdown}s</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 10) * 100}%` }}
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleNext}
                  className="px-12 py-4 bg-cyan-400 hover:bg-cyan-300 text-purple-700 font-bold text-xl rounded-2xl transition-all duration-300 shadow-lg shadow-cyan-400/50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
