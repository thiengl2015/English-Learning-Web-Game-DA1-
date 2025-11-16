'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Crown, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const lessons = [
  {
    id: 1,
    title: 'Intro Vocab 1',
    type: 'vocabulary',
    completed: true,
    stars: 3,
    position: { x: 15, y: 70 },
  },
  {
    id: 2,
    title: 'Practice 1',
    type: 'practice',
    completed: true,
    stars: 3,
    position: { x: 30, y: 45 },
  },
  {
    id: 3,
    title: 'Intro Vocab 2',
    type: 'vocabulary',
    completed: false,
    stars: 0,
    position: { x: 50, y: 50 },
  },
  {
    id: 4,
    title: 'Practice 2',
    type: 'practice',
    completed: false,
    stars: 0,
    position: { x: 70, y: 30 },
  },
  {
    id: 5,
    title: 'Final Test',
    type: 'test',
    completed: false,
    stars: 0,
    position: { x: 85, y: 35 },
  },
]

export default function LessonsPage() {
  const params = useParams()
  const unitId = params.unitId as string
  const router = useRouter()
  const [currentLessons] = useState(lessons)

  const handleLessonClick = (lesson: typeof lessons[0]) => {
    const isUnlocked =
      lesson.id === 1 ||
      currentLessons[lesson.id - 2]?.completed

    if (isUnlocked) {
      router.push(`/client/units/${unitId}/lessons/${lesson.id}`)
    }
  }

  const isLessonUnlocked = (lessonId: number) => {
    return lessonId === 1 || currentLessons[lessonId - 2]?.completed
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Space Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large planet */}
        <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-300 to-blue-400 opacity-40 blur-3xl" />
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-60" />
        
        {/* Stars */}
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

      {/* Back Button */}
      <Link
        href="/client/units"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Units</span>
      </Link>

      {/* Lessons Path */}
      <div className="relative w-full h-screen">
        {/* Connection paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {currentLessons.slice(0, -1).map((lesson, index) => {
            const nextLesson = currentLessons[index + 1]
            return (
              <line
                key={`path-${lesson.id}`}
                x1={`${lesson.position.x}%`}
                y1={`${lesson.position.y}%`}
                x2={`${nextLesson.position.x}%`}
                y2={`${nextLesson.position.y}%`}
                stroke="url(#pathGradient)"
                strokeWidth="4"
                strokeDasharray="10,5"
                className="animate-pulse"
              />
            )
          })}
        </svg>

        {/* Lesson Nodes */}
        {currentLessons.map((lesson) => {
          const unlocked = isLessonUnlocked(lesson.id)
          
          return (
            <div
              key={lesson.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${lesson.position.x}%`,
                top: `${lesson.position.y}%`,
              }}
            >
              {/* Platform */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleLessonClick(lesson)}
                  disabled={!unlocked}
                  className={`relative group ${
                    unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  {/* Stars decoration for completed */}
                  {lesson.completed && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
                      {[...Array(lesson.stars)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-6 w-6 text-yellow-400 fill-yellow-400 drop-shadow-lg animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Lesson Circle */}
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-300 ${
                      lesson.completed
                        ? 'bg-gradient-to-br from-orange-400 to-yellow-500 shadow-lg shadow-orange-500/50 hover:scale-110'
                        : unlocked
                        ? 'bg-gradient-to-br from-orange-400 to-yellow-500 shadow-lg shadow-orange-500/50 hover:scale-110 animate-pulse'
                        : 'bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-500/30'
                    } border-4 ${
                      unlocked ? 'border-white' : 'border-purple-900'
                    }`}
                  >
                    <span className="text-white drop-shadow-lg">
                      {lesson.id}
                    </span>
                  </div>

                  {/* Platform base */}
                  <div
                    className={`mt-2 w-28 h-8 rounded-full ${
                      unlocked
                        ? 'bg-gradient-to-b from-gray-700 to-gray-900'
                        : 'bg-gradient-to-b from-gray-800 to-black'
                    } border-2 ${
                      unlocked ? 'border-cyan-400' : 'border-purple-900'
                    } shadow-xl flex items-center justify-center`}
                  >
                    {lesson.completed && (
                      <div className="text-cyan-400">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                {/* Lesson title */}
                <p className="mt-2 text-white font-semibold text-sm drop-shadow-lg">
                  {lesson.title}
                </p>

                {/* Crown indicator */}
                {!lesson.completed && unlocked && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                    <Crown className="h-5 w-5 text-yellow-400 animate-bounce" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
