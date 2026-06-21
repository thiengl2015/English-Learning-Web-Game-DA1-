"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Volume2, Loader2 } from "lucide-react"
import Link from "next/link"
import GameResults from "@/components/game-results"
import { GalaxyBackground } from "@/components/galaxy-background"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE_URL = RAW_API.replace(/\/$/, "").replace(/\/api$/, "")

type ApiQuestion = {
  index: number
  type: string
  words?: string[]
  question?: string
  question_vi?: string
  translation?: string
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

export default function PlanetaryOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const gameConfigId = searchParams.get("gameConfigId")

  const [sessionId, setSessionId] = useState<string | null>(searchParams.get("sessionId"))
  const [questions, setQuestions] = useState<ApiQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [arrangedWords, setArrangedWords] = useState<string[]>([])
  const [availableWords, setAvailableWords] = useState<string[]>([])
  const [isChecked, setIsChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [revealedAnswer, setRevealedAnswer] = useState("")
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [gameComplete, setGameComplete] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())

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
          cache: "no-store",
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

  // Reset arrangement on question change
  useEffect(() => {
    if (!currentQuestion) return
    const shuffled = [...(currentQuestion.words || [])].sort(() => Math.random() - 0.5)
    setAvailableWords(shuffled)
    setArrangedWords([])
    setIsChecked(false)
    setIsCorrect(false)
  }, [currentIndex, currentQuestion])

  // Feedback dialog countdown + auto-advance
  useEffect(() => {
    if (!showFeedbackDialog) return
    setCountdown(10)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    const timer = setTimeout(() => {
      handleNext()
    }, 10000)
    return () => {
      clearTimeout(timer)
      clearInterval(countdownInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFeedbackDialog])

  const handleWordClick = (word: string, index: number) => {
    setArrangedWords([...arrangedWords, word])
    setAvailableWords(availableWords.filter((_, i) => i !== index))
  }

  const handleArrangedWordClick = (word: string, index: number) => {
    setAvailableWords([...availableWords, word])
    setArrangedWords(arrangedWords.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setAvailableWords([...availableWords, ...arrangedWords])
    setArrangedWords([])
    setIsChecked(false)
    setIsCorrect(false)
  }

  const handleCheck = async () => {
    if (isSubmitting) return
    const userAnswer = arrangedWords.join(" ")
    setIsSubmitting(true)
    const beResult = await submitAnswerToBE(currentIndex, userAnswer)
    setIsSubmitting(false)

    const correct = beResult?.is_correct ?? false
    setIsChecked(true)
    setIsCorrect(correct)
    setRevealedAnswer(correct ? userAnswer : beResult?.correct_answer || userAnswer)

    if (correct) {
      setCorrectCount((prev) => prev + 1)
    } else {
      setWrongAnswers((prev) => [
        ...prev,
        {
          questionId: `q-${currentIndex}`,
          prompt: currentQuestion?.translation || currentQuestion?.question_vi || "",
          yourAnswer: userAnswer,
          correctAnswer: beResult?.correct_answer || "",
        },
      ])
    }
    setShowFeedbackDialog(true)
  }

  const handleNext = () => {
    setShowFeedbackDialog(false)
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      finishGame()
    }
  }

  const playAudio = () => {
    if (!revealedAnswer) return
    const utterance = new SpeechSynthesisUtterance(revealedAnswer)
    utterance.lang = "en-US"
    speechSynthesis.speak(utterance)
  }

  const handleComplete = () => {
    if (unitId && lessonId) router.push(`/client/units/${unitId}/lessons`)
    else router.push("/client/units")
  }

  const handlePlayAgain = () => {
    if (gameConfigId) {
      window.location.href = `/client/games/planetary-order?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`
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

      <div className="relative z-10 min-h-[120px] flex items-center justify-center px-12 pt-38">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <div className="bg-purple-600/80 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-purple-400 shadow-xl">
              <p className="text-white text-xl font-semibold">{currentQuestion.translation}</p>
            </div>
          </div>

          <div className="min-h-[100px] flex items-center justify-center ">
            <div className="flex flex-wrap gap-3 justify-center min-h-[60px] items-center">
              {arrangedWords.length === 0 ? (
                <p className="text-cyan-300 text-lg opacity-50">Click các từ bên dưới để xếp câu...</p>
              ) : (
                arrangedWords.map((word, index) => (
                  <button
                    key={`arranged-${index}`}
                    onClick={() => !isChecked && handleArrangedWordClick(word, index)}
                    disabled={isChecked}
                    className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                      isChecked
                        ? isCorrect
                          ? "bg-green-500 border-2 border-green-300 text-white shadow-[0_0_20px_rgba(34,197,94,0.6)] shadow-lg"
                          : "bg-red-500 border-2 border-red-300 text-white animate-shake"
                        : "bg-cyan-500 border-2 border-cyan-300 text-white hover:scale-110 hover:bg-cyan-400 cursor-pointer shadow-lg shadow-cyan-400/50"
                    }`}
                  >
                    {word}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="min-h-[120px] flex items-center justify-center">
            <div className="flex flex-wrap gap-4 justify-center min-h-[60px] items-center">
              {availableWords.map((word, index) => (
                <button
                  key={`available-${index}`}
                  onClick={() => !isChecked && handleWordClick(word, index)}
                  disabled={isChecked}
                  className="px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 bg-purple-700 border-2 border-purple-400 text-cyan-300 hover:scale-110 hover:bg-purple-600 disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/50 animate-float"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {arrangedWords.length > 0 && !isChecked && (
              <button
                onClick={handleReset}
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl rounded-2xl transition-all duration-300 border-2 border-slate-500"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleCheck}
              disabled={arrangedWords.length === 0 || isChecked || isSubmitting}
              className="px-12 py-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-600 disabled:opacity-50 text-purple-700 font-bold text-xl rounded-2xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg shadow-cyan-400/50 disabled:shadow-none disabled:text-white flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              Check Answer
            </button>
          </div>
        </div>
      </div>

      <Dialog
        open={showFeedbackDialog}
        onOpenChange={(open) => {
          if (!open) handleNext()
        }}
      >
        <DialogContent className="sm:max-w-md bg-slate-900 border-2 border-cyan-500/50">
          <div className="flex flex-col items-center gap-6 py-4">
            <div className={`text-3xl font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
              {isCorrect ? "  Correct! 🎉" : "  Incorrect ❌"}
            </div>

            <div className="w-full space-y-3">
              <p className="text-white text-center font-medium">
                {isCorrect ? "Great job!" : "The correct answer is:"}
              </p>
              <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-4">
                <button
                  onClick={playAudio}
                  className="flex-shrink-0 p-2 text-cyan-300 rounded-lg transition-all duration-300"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <p className="text-white text-lg font-semibold">{revealedAnswer}</p>
              </div>
            </div>

            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Auto-closing in</span>
                <span className="text-cyan-400 font-bold">{countdown}s</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 10) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-purple-700 font-bold text-lg rounded-xl transition-all duration-300 shadow-lg"
            >
              Next
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
