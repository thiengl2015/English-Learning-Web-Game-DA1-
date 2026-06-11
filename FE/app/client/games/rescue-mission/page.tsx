"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Volume2, Loader2 } from "lucide-react"
import Link from "next/link"
import GameResults from "@/components/game-results"
import { GalaxyBackground } from "@/components/galaxy-background"

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE_URL = RAW_API.replace(/\/$/, "").replace(/\/api$/, "")

type ApiQuestion = {
  index: number
  type: string
  display_before?: string
  display_after?: string
  audio_text?: string
  question?: string
  question_vi?: string
}

type WrongAnswer = {
  questionId: string
  prompt: string
  yourAnswer: string
  correctAnswer: string
}

interface CompleteGameResponse {
  correct_answers: number
  xp_earned: number
  passed: boolean
}

export default function RescueMissionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const gameConfigId = searchParams.get("gameConfigId")

  const [sessionId, setSessionId] = useState<string | null>(searchParams.get("sessionId"))
  const [questions, setQuestions] = useState<ApiQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [isChecked, setIsChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [revealedAnswer, setRevealedAnswer] = useState("")
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [gameComplete, setGameComplete] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())

  const inputRef = useRef<HTMLInputElement>(null)
  const finishingRef = useRef(false)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"))

  useEffect(() => {
    if (!gameConfigId && !sessionId) {
      setError("Không có thông tin game")
      setIsLoading(false)
      return
    }
    loadGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadGame = async () => {
    const token = getToken()
    if (!token) {
      router.push("/sign-in")
      return
    }
    setIsLoading(true)
    try {
      let qs: ApiQuestion[] = []
      if (sessionId) {
        const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/results`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.success && json.data?.questions) qs = json.data.questions
      } else if (gameConfigId) {
        const res = await fetch(`${API_BASE_URL}/api/games/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ game_config_id: parseInt(gameConfigId) }),
        })
        const json = await res.json()
        if (!json.success || !json.data?.questions) throw new Error(json.message || "Không thể bắt đầu game")
        qs = json.data.questions
        const sid = json.data.session_id
        if (sid) {
          setSessionId(sid)
          history.replaceState(null, "", `?sessionId=${sid}&unitId=${unitId}&lessonId=${lessonId}&gameConfigId=${gameConfigId}`)
        }
      }
      if (qs.length === 0) throw new Error("Không có nội dung game")
      setQuestions(qs)
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải game")
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswerToBE = async (questionIndex: number, answer: string) => {
    const token = getToken()
    if (!sessionId || !token) return null
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question_index: questionIndex, answer }),
      })
      const json = await res.json()
      return json.success ? json.data : null
    } catch {
      return null
    }
  }

  const finishGame = async () => {
    if (finishingRef.current) return
    finishingRef.current = true
    setIsFinishing(true)
    const token = getToken()
    if (sessionId && token) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      try {
        const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ time_spent: timeSpent }),
        })
        const json = await res.json()
        if (json.success) setCompletionResult(json.data)
      } catch {
        /* ignore */
      }
    }
    setIsFinishing(false)
    setGameComplete(true)
  }

  const playAudio = () => {
    if (!currentQuestion?.audio_text) return
    setIsPlaying(true)
    const utterance = new SpeechSynthesisUtterance(currentQuestion.audio_text)
    utterance.lang = "en-US"
    utterance.onend = () => setIsPlaying(false)
    speechSynthesis.speak(utterance)
  }

  // Auto-play audio on question change
  useEffect(() => {
    if (currentQuestion) playAudio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentQuestion])

  // Auto-advance 10s after check
  useEffect(() => {
    if (!isChecked) return
    setCountdown(10)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    const timer = setTimeout(() => handleNext(), 10000)
    return () => {
      clearTimeout(timer)
      clearInterval(countdownInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecked])

  useEffect(() => {
    if (!isChecked && inputRef.current) inputRef.current.focus()
  }, [currentIndex, isChecked])

  const handleCheck = async () => {
    if (isSubmitting || !userInput.trim()) return
    setIsSubmitting(true)
    const beResult = await submitAnswerToBE(currentIndex, userInput.trim())
    setIsSubmitting(false)

    const correct = beResult?.is_correct ?? false
    setIsChecked(true)
    setIsCorrect(correct)
    setRevealedAnswer(currentQuestion?.audio_text || beResult?.correct_answer || "")

    if (correct) {
      setCorrectCount((prev) => prev + 1)
    } else {
      setWrongAnswers((prev) => [
        ...prev,
        {
          questionId: `q-${currentIndex}`,
          prompt: currentQuestion?.question || currentQuestion?.question_vi || "",
          yourAnswer: userInput,
          correctAnswer: beResult?.correct_answer || "",
        },
      ])
    }
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
      setUserInput("")
      setIsChecked(false)
      setIsCorrect(false)
    } else {
      finishGame()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && userInput.trim() && !isChecked) handleCheck()
  }

  const handleComplete = () => {
    if (unitId && lessonId) router.push(`/client/units/${unitId}/lessons`)
    else router.push("/client/units")
  }

  const handlePlayAgain = () => {
    if (gameConfigId) {
      window.location.href = `/client/games/rescue-mission?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`
    } else {
      window.location.reload()
    }
  }

  if (isLoading || isFinishing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
          <p className="text-xl font-medium">{isFinishing ? "Đang lưu kết quả..." : "Đang tải game..."}</p>
        </div>
      </div>
    )
  }

  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-xl">{error || "Không có câu hỏi"}</p>
          <button onClick={() => router.back()} className="px-6 py-3 bg-cyan-400 text-purple-900 font-bold rounded-xl">
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
              Question <span className="text-cyan-300 text-sm font-medium"> {currentIndex + 1}/{totalQuestions}</span>
            </span>
            <span className="text-cyan-400 text-sm font-bold">{correctCount}  correct</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-12 py-32">
        <div className="max-w-2xl w-full space-y-16">
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
            <div className="flex flex-wrap items-center justify-center gap-3 text-2xl font-semibold">
              {currentQuestion.display_before && (
                <span className={isChecked ? (isCorrect ? "text-green-400" : "text-red-400") : "text-cyan-400"}>
                  {currentQuestion.display_before}
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

              {currentQuestion.display_after && (
                <span className={isChecked ? (isCorrect ? "text-green-400" : "text-red-400") : "text-cyan-400"}>
                  {currentQuestion.display_after}
                </span>
              )}
            </div>

            {isChecked && !isCorrect && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-white text-center text-lg">{revealedAnswer}</p>
              </div>
            )}
          </div>

          {!isChecked ? (
            <div className="flex justify-center">
              <button
                onClick={handleCheck}
                disabled={!userInput.trim() || isSubmitting}
                className="px-12 py-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-600 disabled:opacity-50 text-purple-700 font-bold text-xl rounded-2xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg shadow-cyan-400/50 disabled:shadow-none disabled:text-white flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
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
