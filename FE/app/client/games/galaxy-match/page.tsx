"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Star, Timer } from 'lucide-react'
import GameResults from "@/components/game-results"
import Image from "next/image"
import { CosmicBackground } from "@/components/cosmic-background"

type Card = {
  id: string
  content: string
  type: "word" | "meaning" | "image"
  pairId: string
  imageUrl?: string
}

type WrongAnswer = {
  questionId: string
  prompt: string
  yourAnswer: string
  correctAnswer: string
}

// Vocabulary data from review
const vocabularyData = [
  {
    id: 1,
    word: "Hello",
    translation: "Xin chào",
    image: "/words/hello-greeting.jpg",
  },
  {
    id: 2,
    word: "Goodbye",
    translation: "Tạm biệt",
    image: "/words/single-word-goodbye.jpg",
  },
  {
    id: 3,
    word: "Thank you",
    translation: "Cảm ơn",
    image: "/words/thank-you-card.jpg",
  },
  {
    id: 4,
    word: "Apple",
    translation: "Quả táo",
    image: "/words/ripe-red-apple.jpg",
  },
  {
    id: 5,
    word: "Book",
    translation: "Quyển sách",
    image: "/words/open-book-library.jpg",
  },
  {
    id: 6,
    word: "Computer",
    translation: "Máy tính",
    image: "/words/modern-computer-setup.jpg",
  },
]

export default function GalaxyMatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId") || "1"
  const lessonId = searchParams.get("lessonId") || "1"

  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(120)
  const [gameOver, setGameOver] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [flashingCards, setFlashingCards] = useState<Set<string>>(new Set())

  // Initialize cards
  useEffect(() => {
    const initialCards: Card[] = []
    vocabularyData.forEach((vocab) => {
      // Add word card
      initialCards.push({
        id: `word-${vocab.id}`,
        content: vocab.word,
        type: "word",
        pairId: `pair-${vocab.id}`,
      })
      // Randomly choose between meaning or image for the pair
      const useMeaning = Math.random() > 0.5
      if (useMeaning) {
        initialCards.push({
          id: `meaning-${vocab.id}`,
          content: vocab.translation,
          type: "meaning",
          pairId: `pair-${vocab.id}`,
        })
      } else {
        initialCards.push({
          id: `image-${vocab.id}`,
          content: vocab.word,
          type: "image",
          pairId: `pair-${vocab.id}`,
          imageUrl: vocab.image,
        })
      }
    })
    // Shuffle cards
    const shuffled = initialCards.sort(() => Math.random() - 0.5)
    setCards(shuffled)
  }, [])

  // Timer
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

  const handleCardClick = (card: Card) => {
    // Ignore if checking, matched, or same card clicked twice
    if (isChecking || matchedPairs.has(card.pairId) || selectedCard?.id === card.id) {
      // Allow deselecting by clicking the same card again
      if (selectedCard?.id === card.id) {
        setSelectedCard(null)
      }
      return
    }

    if (!selectedCard) {
      // First card selected
      setSelectedCard(card)
    } else {
      // Second card selected
      setIsChecking(true)

      if (selectedCard.pairId === card.pairId) {
        // Correct match!
        setFlashingCards(new Set([selectedCard.id, card.id]))
        setTimeout(() => {
          setMatchedPairs((prev) => new Set([...prev, card.pairId]))
          setFlashingCards(new Set())
          setSelectedCard(null)
          setIsChecking(false)

          // Check if all pairs matched
          if (matchedPairs.size + 1 === vocabularyData.length) {
            setGameOver(true)
          }
        }, 500)
      } else {
        // Wrong match
        setFlashingCards(new Set([selectedCard.id, card.id]))
        const newLives = lives - 1
        setLives(newLives)

        // Record wrong answer
        const wrongAnswer: WrongAnswer = {
          questionId: `${selectedCard.id}-${card.id}`,
          prompt: `${selectedCard.content} - ${card.type === "image" ? "Image" : card.content}`,
          yourAnswer: card.content,
          correctAnswer: "Different pair",
        }
        setWrongAnswers((prev) => [...prev, wrongAnswer])

        setTimeout(() => {
          setFlashingCards(new Set())
          setSelectedCard(null)
          setIsChecking(false)

          // Check if out of lives
          if (newLives <= 0) {
            endGame()
          }
        }, 1000)
      }
    }
  }

  const endGame = () => {
    // Count unmatched pairs as wrong
    const unmatchedCount = vocabularyData.length - matchedPairs.size
    const additionalWrongs: WrongAnswer[] = []
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
    setGameOver(true)
  }

  const handleComplete = () => {
    router.push(`/client/units/${unitId}/lessons`)
  }

  const handlePlayAgain = () => {
    window.location.reload()
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

  if (gameOver) {
    return (
      <GameResults
        totalQuestions={vocabularyData.length}
        correctAnswers={matchedPairs.size}
        wrongAnswers={wrongAnswers}
        onComplete={handleComplete}
        onPlayAgain={handlePlayAgain}
      />
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      <div className="relative z-10 flex items-start justify-between p-6 gap-8">
        {/* Game Grid - aligned to left/center */}
        <div className="flex-1 flex items-start justify-center pt-2">
          <div className="grid grid-cols-4 grid-rows-3 gap-4 max-w-4xl w-full">
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

        {/* Timer and Lives - aligned to right */}
        <div className="flex flex-col items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 bg-purple-600/50 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-cyan-400">
            <Timer className="w-6 h-6 text-cyan-400" />
            <span className="text-2xl font-bold text-white">{timeLeft}s</span>
          </div>
          
          {/* Lives (Stars below timer) */}
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
        </div>
      </div>
    </div>
  )
}
