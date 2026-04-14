"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Volume2 } from "lucide-react"
import Link from "next/link"
import GameResults from "@/components/game-results"
import { CosmicBackground } from "@/components/cosmic-background"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type Sentence = {
  id: string
  words: string[]
  correctOrder: string[]
  translation: string
}

const sampleSentences: Sentence[] = [
  {
    id: "s1",
    words: ["want", "I", "to", "be", "an", "astronaut"],
    correctOrder: ["I", "want", "to", "be", "an", "astronaut"],
    translation: "Tôi muốn làm phi hành gia",
  },
  {
    id: "s2",
    words: ["beautiful", "is", "The", "very", "sky"],
    correctOrder: ["The", "sky", "is", "very", "beautiful"],
    translation: "Bầu trời rất đẹp",
  },
  {
    id: "s3",
    words: ["flies", "rocket", "quickly", "The", "very"],
    correctOrder: ["The", "rocket", "flies", "very", "quickly"],
    translation: "Tên lửa bay rất nhanh",
  },
  {
    id: "s4",
    words: ["studying", "She", "English", "is", "hard"],
    correctOrder: ["She", "is", "studying", "English", "hard"],
    translation: "Cô ấy đang học tiếng Anh chăm chỉ",
  },
  {
    id: "s5",
    words: ["planets", "around", "the", "orbit", "The", "sun"],
    correctOrder: ["The", "planets", "orbit", "around", "the", "sun"],
    translation: "Các hành tinh quay quanh mặt trời",
  },
  {
    id: "s6",
    words: ["stars", "night", "shine", "at", "The", "brightly"],
    correctOrder: ["The", "stars", "shine", "brightly", "at", "night"],
    translation: "Các ngôi sao tỏa sáng rực rỡ vào ban đêm",
  },
  {
    id: "s7",
    words: ["explore", "to", "want", "We", "space"],
    correctOrder: ["We", "want", "to", "explore", "space"],
    translation: "Chúng tôi muốn khám phá không gian",
  },
  {
    id: "s8",
    words: ["amazing", "is", "galaxy", "Our", "truly"],
    correctOrder: ["Our", "galaxy", "is", "truly", "amazing"],
    translation: "Thiên hà của chúng ta thực sự tuyệt vời",
  },
]

export default function PlanetaryOrderPage() {
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const router = useRouter()

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

  const currentSentence = sampleSentences[currentSentenceIndex]
  const totalSentences = sampleSentences.length

  useEffect(() => {
    const shuffled = [...currentSentence.words].sort(() => Math.random() - 0.5)
    setAvailableWords(shuffled)
    setArrangedWords([])
    setIsChecked(false)
    setIsCorrect(false)
  }, [currentSentenceIndex, currentSentence.words])

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
          setGameComplete(true)
        }
      }, 10000)

      return () => {
        clearTimeout(timer)
        clearInterval(countdownInterval)
      }
    }
  }, [showFeedbackDialog, currentSentenceIndex, totalSentences])

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

  const handleCheck = () => {
    const correct = JSON.stringify(arrangedWords) === JSON.stringify(currentSentence.correctOrder)
    setIsChecked(true)
    setIsCorrect(correct)

    if (correct) {
      setCorrectCount((prev) => prev + 1)
    } else {
      setWrongAnswers((prev) => [
        ...prev,
        {
          questionId: currentSentence.id,
          prompt: currentSentence.translation,
          yourAnswer: arrangedWords.join(" "),
          correctAnswer: currentSentence.correctOrder.join(" "),
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
      setGameComplete(true)
    }
  }

  const playAudio = () => {
    const utterance = new SpeechSynthesisUtterance(currentSentence.correctOrder.join(" "))
    utterance.lang = "en-US"
    speechSynthesis.speak(utterance)
  }

  const handleComplete = () => {
    if (unitId && lessonId) {
      router.push(`/client/units/${unitId}/lessons`)
    } else {
      router.push("/client/units")
    }
  }

  const handlePlayAgain = () => {
    setCurrentSentenceIndex(0)
    setCorrectCount(0)
    setWrongAnswers([])
    setGameComplete(false)
  }

  if (gameComplete) {
    return (
      <GameResults
        totalQuestions={totalSentences}
        correctAnswers={correctCount}
        wrongAnswers={wrongAnswers}
        onComplete={handleComplete}
        onPlayAgain={handlePlayAgain}
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
        <span className="text-white font-medium">Back</span>
      </Link>

      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-96 z-40">
        <div className="bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-white text-sm font-medium">
              Question <span className="text-cyan-300 text-sm font-medium"> {currentSentenceIndex + 1}/{totalSentences}</span></span>
            <span className="text-cyan-400 text-sm font-bold">{correctCount}  correct</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 min-h-[120px] flex items-center justify-center px-12 pt-38">
        <div className="max-w-4xl w-full space-y-8">
          {/* Translation hint zone - top */}
          <div className="text-center">
            <div className="bg-purple-600/80 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-purple-400 shadow-xl">
              <p className="text-white text-xl font-semibold">{currentSentence.translation}</p>
            </div>
          </div>

          {/* Orbit zone - middle */}
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

          {/* Universe zone - bottom */}
          <div className="min-h-[120px] flex items-center justify-center">
            <div className="flex flex-wrap gap-4 justify-center min-h-[60px] items-center">
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

          {/* Check Answer button */}
          <div className="flex justify-center">
            <button
              onClick={handleCheck}
              disabled={arrangedWords.length !== currentSentence.words.length || isChecked}
              className="px-12 py-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-600 disabled:opacity-50 text-purple-700 font-bold text-xl rounded-2xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg shadow-cyan-400/50 disabled:shadow-none disabled:text-white"
            >
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
              {isCorrect ? "  Correct! 🎉" : "  Incorrect ❌"}
            </div>

            <div className="w-full space-y-3">
              <p className="text-white text-center font-medium">
                {isCorrect ? "Great job!" : "The correct answer is:"}
              </p>
              <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-4">
                <button
                  onClick={playAudio}
                  className="flex-shrink-0 p-2 text-cyan-300 rounded-lg transition-all duration-300 nimate-pulse-scale"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <p className="text-white text-lg font-semibold">{currentSentence.correctOrder.join(" ")}</p>
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
