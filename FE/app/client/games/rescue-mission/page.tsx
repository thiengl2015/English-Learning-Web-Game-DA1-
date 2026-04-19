"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Volume2, Loader2 } from "lucide-react"
import Link from "next/link"
import GameResults from "@/components/game-results"
import { GalaxyBackground } from "@/components/galaxy-background"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Question {
  index: number
  vocab_id: number
  question: string
  question_vi?: string
  type: string
  options?: { id: string; text: string }[]
  translation?: string
}

interface CompleteGameResponse {
  score: number
  correct_answers: number
  total_questions: number
  passed: boolean
  xp_earned: number
  message: string
}

export default function RescueMissionPage() {
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const sessionId = searchParams.get("sessionId")
  const gameConfigId = searchParams.get("gameConfigId")
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!sessionId && !gameConfigId) {
      setError("Không có thông tin game")
      setIsLoading(false)
      return
    }
    loadGame()
  }, [sessionId, gameConfigId])

  const loadGame = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/sign-in")
      return
    }

    setIsLoading(true)

    try {
      let qs: Question[] = []

      if (sessionId) {
        const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/results`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.success && json.data?.questions) {
          qs = json.data.questions
        }
      } else if (gameConfigId) {
        const res = await fetch(`${API_BASE_URL}/api/games/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ game_config_id: parseInt(gameConfigId) }),
        })
        const json = await res.json()
        if (json.success && json.data?.questions) {
          qs = json.data.questions
          const sid = json.data.session_id
          if (sid) {
            history.replaceState(null, "", `?sessionId=${sid}&unitId=${unitId}&lessonId=${lessonId}&gameConfigId=${gameConfigId}`)
          }
        }
      }

      if (qs.length === 0) {
        throw new Error("Không có câu hỏi nào")
      }

      setQuestions(qs)
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải game")
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswerToBE = async (questionIndex: number, answer: string) => {
    if (!sessionId) return null

    const token = localStorage.getItem("token")
    if (!token) return null

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question_index: questionIndex, answer }),
      })
      const json = await res.json()
      return json.success ? json.data : null
    } catch {
      return null
    }
  }

  const completeGameBE = async () => {
    if (!sessionId) return null

    const token = localStorage.getItem("token")
    if (!token) return null

    const timeSpent = Math.round((Date.now() - startTime) / 1000)

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ time_spent: timeSpent }),
      })
      const json = await res.json()
      return json.success ? json.data : null
    } catch {
      return null
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

  useEffect(() => {
    if (!isChecked && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentQuestionIndex, isChecked])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isChecked && document.activeElement !== inputRef.current) {
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

  const playAudio = () => {
    const text = currentQuestion?.options?.find((o) => o.id === "A")?.text || currentQuestion?.translation || ""
    if (text) {
      setIsPlaying(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.onend = () => setIsPlaying(false)
      speechSynthesis.speak(utterance)
    }
  }

  const handleOptionClick = async (optionId: string, optionText: string) => {
    if (isChecked || isSubmitting) return

    setSelectedOptionId(optionId)
    setIsSubmitting(true)

    const beResult = await submitAnswerToBE(currentQuestionIndex, optionText)
    setIsSubmitting(false)

    const correct = beResult?.is_correct ?? false
    setIsChecked(true)
    setIsCorrect(correct)

    if (correct) {
      setCorrectCount((prev) => prev + 1)
    } else {
      const correctOption = currentQuestion?.options?.find(
        (o) => o.id === beResult?.correct_answer || o.text === beResult?.correct_answer
      )
      setWrongAnswers((prev) => [
        ...prev,
        {
          questionId: `q-${currentQuestionIndex}`,
          prompt: currentQuestion?.question_vi || currentQuestion?.question || "",
          yourAnswer: optionText,
          correctAnswer: correctOption?.text || beResult?.correct_answer || "",
        },
      ])
    }
  }

  const handleNext = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedOptionId(null)
      setIsChecked(false)
      setIsCorrect(false)
    } else {
      const result = await completeGameBE()
      if (result) setCompletionResult(result)
      setGameComplete(true)
    }
  }

  const handleFinishGame = async () => {
    setIsCompleting(true)
    const result = await completeGameBE()
    setIsCompleting(false)

    if (result) setCompletionResult(result)
    setGameComplete(true)
  }

  const handleComplete = () => {
    if (unitId && lessonId) {
      router.push(`/client/units/${unitId}/lessons`)
    } else {
      router.push("/client/units")
    }
  }

  const handlePlayAgain = () => {
    if (gameConfigId) {
      router.push(`/client/games/rescue-mission?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`)
    } else {
      window.location.reload()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
          <p className="text-xl font-medium">Đang tải câu hỏi...</p>
        </div>
      </div>
    )
  }

  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-xl">{error || "Không có câu hỏi"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-cyan-400 text-purple-900 font-bold rounded-xl"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  if (gameComplete) {
    return (
      <GameResults
        totalQuestions={totalQuestions}
        correctAnswers={completionResult?.correct_answers ?? correctCount}
        wrongAnswers={wrongAnswers}
        onComplete={handleComplete}
        onPlayAgain={handlePlayAgain}
        xpEarned={completionResult?.xp_earned ?? 0}
        passed={completionResult?.passed ?? false}
      />
    )
  }

  const getOptionStyle = (optionId: string, optionText: string) => {
    if (!isChecked) {
      return "bg-purple-700 border-purple-400 hover:bg-purple-600 hover:scale-105 cursor-pointer"
    }
    const correctOption = completionResult?.correct_answers
      ? currentQuestion?.options?.find((o) => o.id === completionResult?.correct_answers?.toString() || o.text === completionResult?.correct_answers?.toString())
      : null
    if (optionId === selectedOptionId && isCorrect) {
      return "bg-green-500 border-green-400"
    }
    if (optionId === selectedOptionId && !isCorrect) {
      return "bg-red-500 border-red-400"
    }
    if (correctOption && optionId === correctOption.id) {
      return "bg-green-500 border-green-400"
    }
    return "bg-purple-700/50 border-purple-400/50 opacity-50"
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GalaxyBackground />

      <Link
        href={unitId && lessonId ? `/client/units/${unitId}/lessons` : "/client/units"}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Quay lại</span>
      </Link>

      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-96 z-40">
        <div className="bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-white text-sm font-medium">
              Câu {currentQuestionIndex + 1}/{totalQuestions}
            </span>
            <span className="text-cyan-400 text-sm font-bold">{correctCount} đúng</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-12 py-32">
        <div className="max-w-2xl w-full space-y-12">
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={playAudio}
              className="relative p-8 bg-purple-600/30 backdrop-blur-sm border-4 border-purple-400 rounded-full hover:bg-purple-500/40 transition-all duration-300 group shadow-xl shadow-purple-500/50"
            >
              <Volume2 className="w-16 h-16 text-cyan-400 group-hover:scale-110 transition-transform" />
              {isPlaying && <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping" />}
            </button>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border-2 border-cyan-400 rounded-2xl p-8">
            <div className="text-center mb-8">
              <p className="text-white text-2xl font-semibold">
                {currentQuestion.question_vi || currentQuestion.question}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id, option.text)}
                  disabled={isChecked || isSubmitting}
                  className={`py-4 px-6 rounded-xl border-2 font-bold text-lg text-white transition-all duration-300 ${getOptionStyle(option.id, option.text)} ${!isChecked ? "cursor-pointer" : "cursor-default"}`}
                >
                  {option.text}
                  {isSubmitting && selectedOptionId === option.id && (
                    <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />
                  )}
                </button>
              ))}
            </div>

            {isChecked && !isCorrect && (
              <div className="mt-6 pt-6 border-t border-white/20 text-center">
                <p className="text-white text-lg">
                  Đáp án đúng: <span className="text-green-400 font-bold">
                    {wrongAnswers[wrongAnswers.length - 1]?.correctAnswer}
                  </span>
                </p>
              </div>
            )}
          </div>

          {isChecked && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm px-4">
                <span className="text-gray-400">Tự động chuyển sau</span>
                <span className="text-cyan-400 font-bold">{countdown}s</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 10) * 100}%` }}
                />
              </div>
              <button
                onClick={handleNext}
                className="w-full px-12 py-4 bg-cyan-400 hover:bg-cyan-300 text-purple-700 font-bold text-xl rounded-2xl transition-all duration-300 shadow-lg shadow-cyan-400/50"
              >
                {currentQuestionIndex < totalQuestions - 1 ? "Câu tiếp theo" : "Xem kết quả"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}