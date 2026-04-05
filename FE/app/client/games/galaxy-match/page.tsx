"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Star, Timer, Loader2 } from 'lucide-react'
import GameResults from "@/components/game-results"
import Image from "next/image"
import { GalaxyBackground } from "@/components/galaxy2-background"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Card {
  id: string
  content: string
  type: "word" | "meaning" | "image"
  pairId: string
  imageUrl?: string
  vocab_id?: number
}

interface Question {
  index: number
  vocab_id: number
  question: string
  question_vi?: string
  type: string
  translation?: string
  correct_answer?: never
}

interface CompleteGameResponse {
  session_id: string
  score: number
  correct_answers: number
  total_questions: number
  passed: boolean
  xp_earned: number
  message: string
}

interface WrongAnswerEntry {
  questionId: string
  prompt: string
  yourAnswer: string
  correctAnswer: string
}

export default function GalaxyMatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const gameConfigId = searchParams.get("gameConfigId")

  const [cards, setCards] = useState<Card[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(120)
  const [gameOver, setGameOver] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerEntry[]>([])
  const [flashingCards, setFlashingCards] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())
  const [correctCount, setCorrectCount] = useState(0)

  useEffect(() => {
    if (!sessionId && !gameConfigId) {
      setError("Không có thông tin game")
      setIsLoading(false)
      return
    }
    loadGame()
  }, [sessionId, gameConfigId])

  useEffect(() => {
    if (timeLeft <= 0 || gameOver) {
      if (timeLeft <= 0 && !gameOver) {
        endGame()
      }
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, gameOver])

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

      const initialCards: Card[] = []
      qs.forEach((vocab) => {
        initialCards.push({
          id: `word-${vocab.vocab_id}`,
          content: vocab.question_vi || vocab.question,
          type: "word",
          pairId: `pair-${vocab.vocab_id}`,
          vocab_id: vocab.vocab_id,
        })
        const useMeaning = Math.random() > 0.5
        if (useMeaning) {
          initialCards.push({
            id: `meaning-${vocab.vocab_id}`,
            content: vocab.question,
            type: "meaning",
            pairId: `pair-${vocab.vocab_id}`,
            vocab_id: vocab.vocab_id,
          })
        } else {
          initialCards.push({
            id: `image-${vocab.vocab_id}`,
            content: vocab.question,
            type: "image",
            pairId: `pair-${vocab.vocab_id}`,
            vocab_id: vocab.vocab_id,
          })
        }
      })
      const shuffled = initialCards.sort(() => Math.random() - 0.5)
      setCards(shuffled)
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải game")
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswerToBE = async (vocabId: number, matched: boolean, userAnswer: string, correctAnswer: string) => {
    if (!sessionId) return

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await fetch(`${API_BASE_URL}/api/games/${sessionId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question_index: questions.findIndex((q) => q.vocab_id === vocabId),
          answer: userAnswer,
        }),
      })
    } catch {
      // Silent fail for individual answer submissions
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

  const handleCardClick = (card: Card) => {
    if (isChecking || matchedPairs.has(card.pairId) || selectedCard?.id === card.id) {
      if (selectedCard?.id === card.id) {
        setSelectedCard(null)
      }
      return
    }

    if (!selectedCard) {
      setSelectedCard(card)
    } else {
      setIsChecking(true)

      if (selectedCard.pairId === card.pairId) {
        setFlashingCards(new Set([selectedCard.id, card.id]))
        setCorrectCount((prev) => prev + 1)
        submitAnswerToBE(card.vocab_id!, true, card.content, selectedCard.content)

        setTimeout(() => {
          setMatchedPairs((prev) => new Set([...prev, card.pairId]))
          setFlashingCards(new Set())
          setSelectedCard(null)
          setIsChecking(false)

          if (matchedPairs.size + 1 === questions.length) {
            endGame()
          }
        }, 500)
      } else {
        setFlashingCards(new Set([selectedCard.id, card.id]))
        const newLives = lives - 1
        setLives(newLives)

        const question = questions.find((q) => q.vocab_id?.toString() === card.pairId.replace("pair-", ""))
        setWrongAnswers((prev) => [
          ...prev,
          {
            questionId: card.pairId,
            prompt: question?.question_vi || question?.question || card.content,
            yourAnswer: card.content,
            correctAnswer: "Pair",
          },
        ])

        submitAnswerToBE(card.vocab_id!, false, card.content, selectedCard.content)

        setTimeout(() => {
          setFlashingCards(new Set())
          setSelectedCard(null)
          setIsChecking(false)

          if (newLives <= 0) {
            endGame()
          }
        }, 1000)
      }
    }
  }

  const endGame = async () => {
    const unmatchedCount = questions.length - matchedPairs.size
    const additionalWrongs: WrongAnswerEntry[] = []
    cards.forEach((card) => {
      if (!matchedPairs.has(card.pairId) && !additionalWrongs.find((w) => w.questionId.includes(card.pairId))) {
        additionalWrongs.push({
          questionId: card.pairId,
          prompt: card.content,
          yourAnswer: "Not matched",
          correctAnswer: "Should be matched",
        })
      }
    })
    setWrongAnswers((prev) => [...prev, ...additionalWrongs.slice(0, unmatchedCount)])

    setIsCompleting(true)
    const result = await completeGameBE()
    setIsCompleting(false)

    if (result) {
      setCompletionResult(result)
    }
    setGameOver(true)
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
      router.push(`/client/games/galaxy-match?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`)
    } else {
      window.location.reload()
    }
  }

  const getCardStyle = (card: Card) => {
    const isMatched = matchedPairs.has(card.pairId)
    const isSelected = selectedCard?.id === card.id
    const isFlashing = flashingCards.has(card.id)
    const isCorrectFlash = isFlashing && selectedCard && selectedCard.pairId === card.pairId
    const isWrongFlash = isFlashing && selectedCard && selectedCard.pairId !== card.pairId

    if (isMatched) {
      return "opacity-0 pointer-events-none"
    }
    if (isCorrectFlash) {
      return "border-green-400 bg-green-500/30 shadow-lg shadow-green-400/50 animate-pulse"
    }
    if (isWrongFlash) {
      return "border-red-500 border-4 bg-purple-700 shadow-lg shadow-red-500/50 animate-pulse"
    }
    if (isSelected) {
      return "border-cyan-400 bg-purple-700 shadow-lg shadow-cyan-400/50 scale-105"
    }
    return "border-purple-400/50 bg-purple-700 hover:bg-purple-600 hover:scale-105"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
          <p className="text-xl font-medium">Đang tải game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-xl">{error}</p>
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

  if (gameOver) {
    return (
      <GameResults
        totalQuestions={questions.length}
        correctAnswers={completionResult?.correct_answers ?? correctCount}
        wrongAnswers={wrongAnswers}
        onComplete={handleComplete}
        onPlayAgain={handlePlayAgain}
        xpEarned={completionResult?.xp_earned ?? 0}
        passed={completionResult?.passed ?? false}
      />
    )
  }

  const gridCols = cards.length <= 8 ? 4 : cards.length <= 12 ? 4 : 4

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GalaxyBackground/>

      <div className="relative z-10 flex items-start justify-between p-6 gap-8">
        <div className="flex-1 flex items-start justify-center pt-2">
          <div className={`grid grid-cols-${gridCols} gap-4 max-w-4xl w-full`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={isChecking || matchedPairs.has(card.pairId)}
                className={`aspect-square rounded-2xl border-4 transition-all duration-300 ${getCardStyle(card)} flex items-center justify-center p-4`}
              >
                {card.type === "image" ? (
                  <Image
                    src={card.imageUrl || "/placeholder.svg"}
                    alt={card.content}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-cyan-300 font-bold text-xl text-center break-words">{card.content}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 bg-purple-600/50 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-cyan-400">
            <Timer className="w-6 h-6 text-cyan-400" />
            <span className="text-2xl font-bold text-white">{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 ${
                  star <= lives ? "text-yellow-400 fill-yellow-400" : "text-gray-600 fill-gray-600"
                }`}
              />
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="text-cyan-400 font-bold">{correctCount}/{questions.length}</span>
            <p className="text-gray-400 text-xs mt-1">matched</p>
          </div>
        </div>
      </div>
    </div>
  )
}