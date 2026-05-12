"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Volume2, Loader2 } from "lucide-react"
import Link from "next/link"
import GameResults from "@/components/game-results"
import { GalaxyBackground } from "@/components/galaxy3-background"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Question {
  index: number
  vocab_id: number
  question: string
  question_vi?: string
  type: string
  options?: { id: string; text: string }[]
  audio_url?: string | null
  phonetic?: string
  translation?: string
}

interface CompleteGameResponse {
  session_id: string
  status: "completed"
  score: number
  correct_answers: number
  total_questions: number
  accuracy: number
  passed: boolean
  passing_score: number
  xp_earned: number
  time_spent: number
  message: string
}

export default function SignalCheckPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const gameConfigId = searchParams.get("gameConfigId")

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!sessionId && !gameConfigId) {
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
        throw new Error("Không có câu hỏi nào được tải")
      }

      setQuestions(qs)
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải câu hỏi")
    } finally {
      setIsLoading(false)
    }
  }

  const getToken = () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
  }

  const submitAnswerToBE = async (questionIndex: number, answer: string) => {
    if (!sessionId) return null

    const token = getToken()
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

    const token = getToken()
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

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0

  const playAudio = () => {
    if (currentQuestion?.audio_url && audioRef.current) {
      audioRef.current.src = currentQuestion.audio_url
      audioRef.current.play().catch(() => {})
    }
  }

  const handleAnswerClick = async (answerId: string) => {
    if (isAnswered || isSubmitting) return

    setSelectedAnswer(answerId)
    setIsSubmitting(true)

    const selectedOption = currentQuestion?.options?.find((o) => o.id === answerId)
    const answerText = selectedOption?.text || answerId

    const beResult = await submitAnswerToBE(currentIndex, answerText)

    setIsSubmitting(false)
    setIsAnswered(true)

    const correct = beResult?.is_correct ?? false
    setIsCorrect(correct)

    if (correct) {
      setCorrectCount((prev) => prev + 1)
    } else {
      const correctOption = currentQuestion?.options?.find((o) => {
        return o.id === beResult?.correct_answer || o.text === beResult?.correct_answer
      })
      setWrongAnswers((prev) => [
        ...prev,
        {
          questionId: `q-${currentIndex}`,
          prompt: currentQuestion?.question_vi || currentQuestion?.question || "",
          yourAnswer: answerText,
          correctAnswer: correctOption?.text || beResult?.correct_answer || "",
        },
      ])
    }

    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1)
        setSelectedAnswer(null)
        setIsAnswered(false)
        setIsCorrect(false)
      } else {
        handleFinishGame()
      }
    }, correct ? 1000 : 2000)
  }

  const handleFinishGame = async () => {
    setIsCompleting(true)
    const result = await completeGameBE()
    setIsCompleting(false)

    if (result) {
      setCompletionResult(result)
    }
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
      router.push(`/client/games/signal-check?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`)
    } else {
      window.location.reload()
    }
  }

  const getButtonColor = (optionId: string) => {
    if (!isAnswered) {
      return "bg-purple-600/90 border-purple-500 hover:bg-purple-500/90"
    }
    if (optionId === selectedAnswer && isCorrect) {
      return "bg-green-500 border-green-400"
    }
    if (optionId === selectedAnswer && !isCorrect) {
      return "bg-red-500 border-red-400"
    }
    const correctOptionId = currentQuestion?.options?.find(
      (o) => o.text === completionResult?.correct_answers?.toString() || o.id === completionResult?.correct_answers?.toString()
    )?.id
    if (optionId === correctOptionId) {
      return "bg-green-500 border-green-400"
    }
    return "bg-purple-600/50 border-purple-500/50"
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

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {currentQuestion.audio_url && (
        <audio ref={audioRef} preload="auto" />
      )}

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
              Câu {currentIndex + 1}/{totalQuestions}
            </span>
            <span className="text-cyan-400 text-sm font-bold">{correctCount} đúng</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-4">
        <div className="relative bg-gradient-to-br from-slate-300 to-slate-400 rounded-[3rem] p-8 shadow-2xl">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-16 h-3 bg-yellow-400 rounded-full shadow-inner" />
            <div className="w-16 h-3 bg-yellow-400 rounded-full shadow-inner" />
            <div className="w-16 h-3 bg-yellow-400 rounded-full shadow-inner" />
          </div>

          <div className="absolute left-12 top-1/2 -translate-y-1/2">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-purple-500 rounded-t-lg" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-purple-400 rounded-b-lg" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-6 bg-purple-500 rounded-l-lg" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-6 bg-purple-400 rounded-r-lg" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-purple-600 rounded-full" />
            </div>
          </div>

          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-400 rounded-full shadow-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full shadow-lg" />
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-8 h-8 bg-yellow-400 rounded-full shadow-lg" />
              <div className="absolute top-1/2 -translate-y-1/2 right-1/2 translate-x-1/2 w-8 h-8 bg-purple-500 rounded-full shadow-lg" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-8 shadow-inner min-h-[400px] flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-purple-700/90 backdrop-blur-sm rounded-2xl p-6 w-full border-2 border-purple-500 shadow-xl mb-6">
                <div className="flex items-start gap-3">
                  <button
                    onClick={playAudio}
                    disabled={!currentQuestion.audio_url}
                    className={`flex-shrink-0 mt-1 transition-all duration-200 ${
                      currentQuestion.audio_url
                        ? "hover:scale-110 cursor-pointer text-cyan-400 hover:text-cyan-300"
                        : "text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <p className="text-white text-xl font-semibold leading-relaxed">
                    {currentQuestion.question_vi || currentQuestion.question}
                  </p>
                </div>
              </div>

              <div className="w-full space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerClick(option.id)}
                    disabled={isAnswered || isSubmitting}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${getButtonColor(option.id)} ${
                      !isAnswered ? "hover:scale-105 cursor-pointer" : "cursor-default"
                    } shadow-lg`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-2xl font-bold text-white">{index + 1}.</span>
                      <span className="text-lg text-white font-medium text-left flex-1">{option.text}</span>
                    </div>
                    {isSubmitting && selectedAnswer === option.id && (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-8">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={`left-${i}`} className="w-8 h-3 bg-cyan-400/50 rounded border border-cyan-300" />
              ))}
            </div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={`right-${i}`} className="w-8 h-3 bg-cyan-400/50 rounded border border-cyan-300" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}