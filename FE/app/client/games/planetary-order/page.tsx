"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Volume2, Loader2 } from "lucide-react"
import Link from "next/link"
import GameResults from "@/components/game-results"
import { CosmicBackground } from "@/components/cosmic-background"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Question {
  index: number
  vocab_id: number
  question: string
  question_vi?: string
  type: string
  words?: string[]
  correct_answer: string
  hint?: string
}

interface CompleteGameResponse {
  score: number
  correct_answers: number
  total_questions: number
  passed: boolean
  xp_earned: number
  message: string
}

export default function PlanetaryOrderPage() {
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const sessionId = searchParams.get("sessionId")
  const gameConfigId = searchParams.get("gameConfigId")
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [arrangedWords, setArrangedWords] = useState<string[]>([])
  const [availableWords, setAvailableWords] = useState<string[]>([])
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
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [countdown, setCountdown] = useState(10)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())

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

  const currentQuestion = questions[currentSentenceIndex]
  const totalSentences = questions.length
  const progress = totalSentences > 0 ? ((currentSentenceIndex + 1) / totalSentences) * 100 : 0

  useEffect(() => {
    if (currentQuestion?.words) {
      const shuffled = [...currentQuestion.words].sort(() => Math.random() - 0.5)
      setAvailableWords(shuffled)
      setArrangedWords([])
      setIsChecked(false)
      setIsCorrect(false)
    }
  }, [currentSentenceIndex, currentQuestion])

  useEffect(() => {
    if (showFeedbackDialog) {
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
        setShowFeedbackDialog(false)
        if (currentSentenceIndex < totalSentences - 1) {
          setCurrentSentenceIndex((prev) => prev + 1)
        } else {
          handleFinishGame()
        }
      }, 10000)

      return () => {
        clearTimeout(timer)
        clearInterval(countdownInterval)
      }
    }
  }, [showFeedbackDialog, currentSentenceIndex, totalSentences])

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

  const handleFinishGame = async () => {
    setIsCompleting(true)
    const result = await completeGameBE()
    setIsCompleting(false)

    if (result) {
      setCompletionResult(result)
    }
    setGameComplete(true)
  }

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
    if (!currentQuestion) return

    setIsSubmitting(true)
    const userAnswer = arrangedWords.join(" ")
    const beResult = await submitAnswerToBE(currentSentenceIndex, userAnswer)
    setIsSubmitting(false)

    const correct = beResult?.is_correct ?? userAnswer === currentQuestion.correct_answer
    setIsChecked(true)
    setIsCorrect(correct)

    if (correct) {
      setCorrectCount((prev) => prev + 1)
    } else {
      setWrongAnswers((prev) => [
        ...prev,
        {
          questionId: `q-${currentSentenceIndex}`,
          prompt: currentQuestion.question_vi || currentQuestion.hint || "",
          yourAnswer: userAnswer,
          correctAnswer: currentQuestion.correct_answer,
        },
      ])
    }

    setShowFeedbackDialog(true)
  }

  const handleNext = () => {
    setShowFeedbackDialog(false)
    if (currentSentenceIndex < totalSentences - 1) {
      setCurrentSentenceIndex((prev) => prev + 1)
    } else {
      handleFinishGame()
    }
  }

  const playAudio = () => {
    if (currentQuestion?.correct_answer) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion.correct_answer)
      utterance.lang = "en-US"
      speechSynthesis.speak(utterance)
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
    if (gameConfigId) {
      router.push(`/client/games/planetary-order?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`)
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
        totalQuestions={totalSentences}
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
      <CosmicBackground />

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
              Câu {currentSentenceIndex + 1}/{totalSentences}
            </span>
            <span className="text-cyan-400 text-sm font-bold">{correctCount} đúng</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 min-h-[120px] flex items-center justify-center px-12 pt-38">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <div className="bg-purple-600/90 backdrop-blur-sm px-8 py-4 rounded-2xl border-2 border-purple-400 shadow-xl">
              <p className="text-white text-xl font-semibold">
                {currentQuestion.question_vi || currentQuestion.question}
              </p>
            </div>
          </div>

          <div className="min-h-[120px] bg-cyan-500/20 backdrop-blur-sm border-4 border-cyan-400 border-dashed rounded-3xl p-6">
            <div className="flex flex-wrap gap-3 justify-center min-h-[60px] items-center">
              {arrangedWords.length === 0 ? (
                <p className="text-cyan-300 text-lg opacity-50">Click các từ bên dưới để xếp câu...</p>
              ) : (
                arrangedWords.map((word, index) => (
                  <button
                    key={`arranged-${index}`}
                    onClick={() => !isChecked && handleArrangedWordClick(word, index)}
                    disabled={isChecked}
                    className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${isChecked
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

          <div className="min-h-[120px] bg-purple-900/40 backdrop-blur-sm border-4 border-purple-500 rounded-3xl p-6">
            <div className="flex flex-wrap gap-4 justify-center min-h-[120px] items-center">
              {availableWords.map((word, index) => (
                <button
                  key={`available-${index}`}
                  onClick={() => !isChecked && handleWordClick(word, index)}
                  disabled={isChecked}
                  className="px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 bg-purple-700 border-4 border-purple-400 text-cyan-300 hover:scale-110 hover:bg-purple-600 disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/50 animate-float"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleReset}
              disabled={isChecked}
              className="px-8 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300"
            >
              Reset
            </button>
            <button
              onClick={handleCheck}
              disabled={arrangedWords.length !== currentQuestion.words?.length || isChecked || isSubmitting}
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
          if (!open) {
            handleNext()
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-slate-900 border-2 border-cyan-500/50">
          <div className="flex flex-col items-center gap-6 py-4">
            <div className={`text-3xl font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
              {isCorrect ? "✅ Đúng rồi!" : "❌ Chưa đúng"}
            </div>

            <div className="w-full space-y-3">
              <p className="text-white text-center font-medium">
                {isCorrect ? "Tuyệt vời!" : "Đáp án đúng là:"}
              </p>
              <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-4">
                <button
                  onClick={playAudio}
                  className="flex-shrink-0 p-2 text-cyan-300 rounded-lg transition-all duration-300 hover:scale-110"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <p className="text-white text-lg font-semibold">{currentQuestion.correct_answer}</p>
              </div>
            </div>

            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Tự động chuyển sau</span>
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
              Tiếp tục
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}