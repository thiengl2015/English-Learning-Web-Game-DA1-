"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Star, Timer, Loader2 } from "lucide-react"
import GameResults from "@/components/game-results"
import Image from "next/image"
import { GalaxyBackground } from "@/components/galaxy2-background"

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE_URL = RAW_API.replace(/\/$/, "").replace(/\/api$/, "")

type ApiQuestion = {
  index: number
  type: string
  word?: string
  translation?: string
  image_url?: string | null
  question?: string
}

type Card = {
  id: string
  content: string
  type: "word" | "meaning" | "image"
  pairId: string
  itemIndex: number
  imageUrl?: string
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

export default function GalaxyMatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId") || "1"
  const lessonId = searchParams.get("lessonId") || "1"
  const gameConfigId = searchParams.get("gameConfigId")

  const [sessionId, setSessionId] = useState<string | null>(searchParams.get("sessionId"))
  const [questions, setQuestions] = useState<ApiQuestion[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(120)
  const [gameOver, setGameOver] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [flashingCards, setFlashingCards] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())

  const finishingRef = useRef(false)

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

  const buildCards = (qs: ApiQuestion[]) => {
    const initialCards: Card[] = []
    qs.forEach((q, i) => {
      const word = q.word || q.question || ""
      const translation = q.translation || ""
      initialCards.push({ id: `word-${i}`, content: word, type: "word", pairId: `pair-${i}`, itemIndex: i })
      // Show an image card when available, otherwise the meaning text.
      if (q.image_url) {
        initialCards.push({
          id: `image-${i}`,
          content: word,
          type: "image",
          pairId: `pair-${i}`,
          itemIndex: i,
          imageUrl: q.image_url,
        })
      } else {
        initialCards.push({ id: `meaning-${i}`, content: translation, type: "meaning", pairId: `pair-${i}`, itemIndex: i })
      }
    })
    setCards(initialCards.sort(() => Math.random() - 0.5))
  }

  const loadGame = async () => {
    const token = getToken()
    if (!token) {
      router.push("/sign-in")
      return
    }
    setIsLoading(true)
    try {
      let qs: ApiQuestion[] = []
      let limit = 120
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
        if (typeof json.data.time_limit === "number" && json.data.time_limit > 0) limit = json.data.time_limit
        const sid = json.data.session_id
        if (sid) {
          setSessionId(sid)
          history.replaceState(null, "", `?sessionId=${sid}&unitId=${unitId}&lessonId=${lessonId}&gameConfigId=${gameConfigId}`)
        }
      }
      if (qs.length === 0) throw new Error("Không có nội dung game")
      setQuestions(qs)
      setTimeLeft(limit)
      buildCards(qs)
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
        /* ignore — fall back to local count */
      }
    }
    setIsFinishing(false)
    setGameOver(true)
  }

  // Timer
  useEffect(() => {
    if (isLoading || error || gameOver) return
    if (timeLeft <= 0) {
      endGame()
      return
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameOver, isLoading, error])

  const handleCardClick = (card: Card) => {
    if (isChecking || matchedPairs.has(card.pairId) || selectedCard?.id === card.id) {
      if (selectedCard?.id === card.id) setSelectedCard(null)
      return
    }

    if (!selectedCard) {
      setSelectedCard(card)
      return
    }

    setIsChecking(true)

    if (selectedCard.pairId === card.pairId) {
      // Correct match
      setFlashingCards(new Set([selectedCard.id, card.id]))
      const itemIndex = card.itemIndex
      setTimeout(async () => {
        setMatchedPairs((prev) => new Set([...prev, card.pairId]))
        setFlashingCards(new Set())
        setSelectedCard(null)
        setIsChecking(false)

        await submitAnswerToBE(itemIndex, questions[itemIndex]?.translation || "")

        if (matchedPairs.size + 1 === questions.length) {
          finishGame()
        }
      }, 500)
    } else {
      // Wrong match — local lives + wrong-answer record
      setFlashingCards(new Set([selectedCard.id, card.id]))
      const newLives = lives - 1
      setLives(newLives)
      setWrongAnswers((prev) => [
        ...prev,
        {
          questionId: `${selectedCard.id}-${card.id}`,
          prompt: `${selectedCard.content} - ${card.type === "image" ? "Image" : card.content}`,
          yourAnswer: card.content,
          correctAnswer: "Different pair",
        },
      ])
      setTimeout(() => {
        setFlashingCards(new Set())
        setSelectedCard(null)
        setIsChecking(false)
        if (newLives <= 0) endGame()
      }, 1000)
    }
  }

  const endGame = () => {
    if (finishingRef.current) return
    const additionalWrongs: WrongAnswer[] = []
    cards.forEach((card) => {
      if (!matchedPairs.has(card.pairId) && !additionalWrongs.find((w) => w.questionId === card.pairId)) {
        additionalWrongs.push({
          questionId: card.pairId,
          prompt: card.content,
          yourAnswer: "Not matched",
          correctAnswer: "Should be matched",
        })
      }
    })
    setWrongAnswers((prev) => [...prev, ...additionalWrongs])
    finishGame()
  }

  const handleComplete = () => {
    router.push(`/client/units/${unitId}/lessons`)
  }

  const handlePlayAgain = () => {
    if (gameConfigId) {
      window.location.href = `/client/games/galaxy-match?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`
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

    if (isMatched) return "opacity-0 pointer-events-none"
    if (isCorrectFlash) return "border-green-400 bg-green-500/30 shadow-lg shadow-green-400/50 animate-pulse"
    if (isWrongFlash) return "border-red-500 border-4 bg-purple-700 shadow-lg shadow-red-500/50 animate-pulse"
    if (isSelected) return "border-cyan-400 bg-purple-700 shadow-lg shadow-cyan-400/50 scale-105"
    return "border-purple-400/50 bg-purple-700 hover:bg-purple-600 hover:scale-105"
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-xl">{error}</p>
          <button onClick={() => router.back()} className="px-6 py-3 bg-cyan-400 text-purple-900 font-bold rounded-xl">
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
        correctAnswers={completionResult?.correct_answers ?? matchedPairs.size}
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

      <div className="relative z-10 flex items-start justify-between p-6 gap-8">
        <div className="flex-1 flex items-start justify-center pt-2">
          <div className="grid grid-cols-4 gap-4 max-w-4xl w-full">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={isChecking || matchedPairs.has(card.pairId)}
                className={`aspect-square rounded-2xl border-4 transition-all duration-300 ${getCardStyle(
                  card,
                )} flex items-center justify-center p-4`}
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

          <div className="text-cyan-300 text-sm font-medium">
            Matched: {matchedPairs.size}/{questions.length}
          </div>
        </div>
      </div>
    </div>
  )
}
