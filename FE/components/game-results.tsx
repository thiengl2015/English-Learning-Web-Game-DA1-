'use client'

import { useState } from 'react'
import { Star, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type WrongAnswer = {
  questionId: string
  prompt: string
  yourAnswer: string
  correctAnswer: string
}

type GameResultsProps = {
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: WrongAnswer[]
  onComplete: () => void
  onPlayAgain: () => void
}

export default function GameResults({
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  onComplete,
  onPlayAgain,
}: GameResultsProps) {
  const [showWrongAnswers, setShowWrongAnswers] = useState(false)

  const wrongCount = wrongAnswers.length
  const stars = wrongCount === 0 ? 3 : wrongCount === 1 ? 2 : wrongCount <= 3 ? 1 : 0
  const canUnlockNext = wrongCount < 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/90 backdrop-blur-md rounded-3xl border-2 border-cyan-400/30 shadow-2xl p-8">
        {/* Stars Display */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-6">Game Complete!</h2>
          <div className="flex justify-center gap-4 mb-4">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                className={`w-20 h-20 transition-all duration-500 ${
                  star <= stars
                    ? 'text-yellow-400 fill-yellow-400 animate-pulse'
                    : 'text-gray-600 fill-gray-600'
                }`}
                style={{ animationDelay: `${star * 0.2}s` }}
              />
            ))}
          </div>
          {!canUnlockNext && (
            <p className="text-red-400 font-semibold text-lg">
              Need less than 4 mistakes to unlock next level
            </p>
          )}
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-500/20 border-2 border-green-400 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 text-sm font-medium mb-1">Correct</p>
            <p className="text-4xl font-bold text-white">{correctAnswers}</p>
          </div>
          <div className="bg-red-500/20 border-2 border-red-400 rounded-2xl p-6 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm font-medium mb-1">Wrong</p>
            <p className="text-4xl font-bold text-white">{wrongCount}</p>
          </div>
        </div>

        {/* Wrong Answers Dropdown */}
        {wrongAnswers.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowWrongAnswers(!showWrongAnswers)}
              className="w-full flex items-center justify-between bg-purple-600/80 hover:bg-purple-500 border-2 border-purple-400 rounded-2xl p-4 transition-all duration-300"
            >
              <span className="text-white font-semibold text-lg">
                View Wrong Answers ({wrongCount})
              </span>
              {showWrongAnswers ? (
                <ChevronUp className="w-6 h-6 text-white" />
              ) : (
                <ChevronDown className="w-6 h-6 text-white" />
              )}
            </button>

            {showWrongAnswers && (
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {wrongAnswers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className="bg-slate-700/50 border border-red-400/30 rounded-xl p-4"
                  >
                    <p className="text-white font-medium mb-2">
                      {index + 1}. {answer.prompt}
                    </p>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">Your answer: {answer.yourAnswer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Correct answer: {answer.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onPlayAgain}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-6 text-lg rounded-2xl border-2 border-purple-400 shadow-lg transition-all duration-300"
          >
            Play Again
          </Button>
          <Button
            onClick={onComplete}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-6 text-lg rounded-2xl border-2 border-cyan-400 shadow-lg transition-all duration-300"
          >
            Complete
          </Button>
        </div>
      </div>
    </div>
  )
}
