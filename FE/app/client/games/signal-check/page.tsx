'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Volume2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { GameResults } from '@/components/game-results'

type Question = {
  questionId: string
  type: 'vocabulary' | 'grammar'
  prompt: string
  imageUrl?: string
  audioUrl?: string 
  options: {
    id: string
    text: string
  }[]
  correctAnswerId: string
}

const sampleQuestions: Question[] = [
  {
    questionId: 'q_vocab_001',
    type: 'vocabulary',
    prompt: "Từ 'Hello' nghĩa là gì?",
    imageUrl: '/words/hello-greeting.jpg',
    audioUrl: '/audio/hello.mp3',
    options: [
      { id: 'A', text: 'Xin chào' },
      { id: 'B', text: 'Tạm biệt' },
      { id: 'C', text: 'Cảm ơn' },
    ],
    correctAnswerId: 'A',
  },
  {
    questionId: 'q_vocab_002',
    type: 'vocabulary',
    prompt: "Từ 'Goodbye' nghĩa là gì?",
    imageUrl: '/words/single-word-goodbye.jpg',
    audioUrl: '/audio/goodbye.mp3', 
    options: [
      { id: 'A', text: 'Xin chào' },
      { id: 'B', text: 'Tạm biệt' },
      { id: 'C', text: 'Cảm ơn' },
    ],
    correctAnswerId: 'B',
  },
  {
    questionId: 'q_vocab_003',
    type: 'vocabulary',
    prompt: "Từ 'Apple' nghĩa là gì?",
    imageUrl: '/words/ripe-red-apple.jpg',
    audioUrl: '/audio/apple.mp3',
    options: [
      { id: 'A', text: 'Quả táo' },
      { id: 'B', text: 'Quyển sách' },
      { id: 'C', text: 'Máy tính' },
    ],
    correctAnswerId: 'A',
  },
  {
    questionId: 'q_grammar_001',
    type: 'grammar',
    prompt: 'He ___ to school every day.',
    options: [
      { id: 'A', text: 'go' },
      { id: 'B', text: 'goes' },
      { id: 'C', text: 'going' },
    ],
    correctAnswerId: 'B',
  },
  {
    questionId: 'q_vocab_004',
    type: 'vocabulary',
    prompt: "Từ 'Book' nghĩa là gì?",
    imageUrl: '/words/open-book-library.jpg',
    audioUrl: '/audio/book.mp3',
    options: [
      { id: 'A', text: 'Quả táo' },
      { id: 'B', text: 'Quyển sách' },
      { id: 'C', text: 'Máy tính' },
    ],
    correctAnswerId: 'B',
  },
  {
    questionId: 'q_vocab_005',
    type: 'vocabulary',
    prompt: "Từ 'Computer' nghĩa là gì?",
    imageUrl: '/words/modern-computer-setup.jpg',
    audioUrl: '/audio/computer.mp3', 
    options: [
      { id: 'A', text: 'Quả táo' },
      { id: 'B', text: 'Quyển sách' },
      { id: 'C', text: 'Máy tính' },
    ],
    correctAnswerId: 'C',
  },
  {
    questionId: 'q_vocab_006',
    type: 'vocabulary',
    prompt: "Từ 'Beautiful' nghĩa là gì?",
    imageUrl: '/words/beautiful.jpg',
    audioUrl: '/audio/beautiful.mp3', 
    options: [
      { id: 'A', text: 'Đẹp' },
      { id: 'B', text: 'Quan trọng' },
      { id: 'C', text: 'Xuất sắc' },
    ],
    correctAnswerId: 'A',
  },
  {
    questionId: 'q_grammar_002',
    type: 'grammar',
    prompt: 'They ___ playing games.',
    options: [
      { id: 'A', text: 'is' },
      { id: 'B', text: 'am' },
      { id: 'C', text: 'are' },
    ],
    correctAnswerId: 'C',
  },
  {
    questionId: 'q_vocab_007',
    type: 'vocabulary',
    prompt: "Từ 'Important' nghĩa là gì?",
    imageUrl: '/words/important.jpg',
    audioUrl: '/audio/important.mp3', 
    options: [
      { id: 'A', text: 'Đẹp' },
      { id: 'B', text: 'Quan trọng' },
      { id: 'C', text: 'Xuất sắc' },
    ],
    correctAnswerId: 'B',
  },
  {
    questionId: 'q_vocab_008',
    type: 'vocabulary',
    prompt: "Từ 'Excellent' nghĩa là gì?",
    imageUrl: '/words/excellent.jpg',
    audioUrl: '/audio/excellent.mp3', 
    options: [
      { id: 'A', text: 'Đẹp' },
      { id: 'B', text: 'Quan trọng' },
      { id: 'C', text: 'Xuất sắc' },
    ],
    correctAnswerId: 'C',
  },
]

export default function SignalCheckPage() {
  const searchParams = useSearchParams()
  const unitId = searchParams.get('unitId')
  const lessonId = searchParams.get('lessonId')
  const router = useRouter()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<Array<{
    questionId: string
    prompt: string
    yourAnswer: string
    correctAnswer: string
  }>>([])
  const [gameComplete, setGameComplete] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentQuestion = sampleQuestions[currentQuestionIndex]
  const totalQuestions = sampleQuestions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const playAudio = () => {
    if (currentQuestion.audioUrl && audioRef.current) {
      audioRef.current.play()
    }
  }

  const handleAnswerClick = (answerId: string) => {
    if (isAnswered) return

    setSelectedAnswer(answerId)
    setIsAnswered(true)

    const isCorrect = answerId === currentQuestion.correctAnswerId

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1)
      
      setTimeout(() => {
        moveToNextQuestion()
      }, 1000)
    } else {
      const selectedOption = currentQuestion.options.find(opt => opt.id === answerId)
      const correctOption = currentQuestion.options.find(opt => opt.id === currentQuestion.correctAnswerId)
      
      setWrongAnswers(prev => [...prev, {
        questionId: currentQuestion.questionId,
        prompt: currentQuestion.prompt,
        yourAnswer: selectedOption?.text || '',
        correctAnswer: correctOption?.text || ''
      }])
      
      setTimeout(() => {
        moveToNextQuestion()
      }, 2000)
    }
  }

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setGameComplete(true)
    }
  }

  const handleComplete = () => {
    if (unitId && lessonId) {
      router.push(`/client/units/${unitId}/lessons`)
    } else {
      router.push('/client/units')
    }
  }

  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setCorrectCount(0)
    setWrongAnswers([])
    setGameComplete(false)
  }

  const getButtonColor = (optionId: string) => {
    if (!isAnswered) {
      return 'bg-purple-600/90 border-purple-500 hover:bg-purple-500/90'
    }

    if (optionId === currentQuestion.correctAnswerId) {
      return 'bg-green-500 border-green-400'
    }

    if (optionId === selectedAnswer) {
      return 'bg-red-500 border-red-400'
    }

    return 'bg-purple-600/50 border-purple-500/50'
  }

  if (gameComplete) {
    return (
      <GameResults
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        wrongAnswers={wrongAnswers}
        onComplete={handleComplete}
        onPlayAgain={handlePlayAgain}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center">
      {currentQuestion.audioUrl && (
        <audio ref={audioRef} src={currentQuestion.audioUrl} preload="auto" />
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <Link
        href={unitId && lessonId ? `/client/units/${unitId}/lessons` : '/client/units'}
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
            <span className="text-cyan-400 text-sm font-bold">
              {correctCount} correct
            </span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
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

          <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-8 shadow-inner min-h-[400px] flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              {currentQuestion.type === 'vocabulary' && currentQuestion.imageUrl && (
                <div className="mb-4">
                  <Image
                    src={currentQuestion.imageUrl || "/placeholder.svg"}
                    alt="Vocabulary illustration"
                    width={160}
                    height={160}
                    className="rounded-2xl border-4 border-purple-500 shadow-xl object-cover"
                  />
                </div>
              )}

              <div className="bg-purple-700/90 backdrop-blur-sm rounded-2xl p-6 w-full border-2 border-purple-500 shadow-xl mb-6">
                <div className="flex items-start gap-3">
                  <button
                    onClick={playAudio}
                    disabled={!currentQuestion.audioUrl}
                    className={`flex-shrink-0 mt-1 transition-all duration-200 ${
                      currentQuestion.audioUrl
                        ? 'hover:scale-110 cursor-pointer text-cyan-400 hover:text-cyan-300'
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <p className="text-white text-xl font-semibold leading-relaxed">
                    {currentQuestion.prompt}
                  </p>
                </div>
              </div>

              <div className="w-full space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerClick(option.id)}
                    disabled={isAnswered}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${getButtonColor(
                      option.id
                    )} ${
                      !isAnswered ? 'hover:scale-105 cursor-pointer' : 'cursor-default'
                    } shadow-lg`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-2xl font-bold text-white">
                        {index + 1}.
                      </span>
                      <span className="text-lg text-white font-medium text-left flex-1">
                        {option.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-8">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={`left-${i}`}
                  className="w-8 h-3 bg-cyan-400/50 rounded border border-cyan-300"
                />
              ))}
            </div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={`right-${i}`}
                  className="w-8 h-3 bg-cyan-400/50 rounded border border-cyan-300"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
