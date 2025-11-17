'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Volume2 } from 'lucide-react'
import Link from 'next/link'

type Question = {
  questionId: string
  type: 'vocabulary' | 'grammar'
  prompt: string
  options: {
    id: string
    text: string
  }[]
  correctAnswerId: string
}

export default function LessonGamePage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.unitId as string
  const lessonId = params.lessonId as string

  useEffect(() => {
    // TODO: Fetch lesson configuration from backend to determine which game to load
    // For now, default to signal-check game
    const gameType = 'signal-check' // This will be dynamic based on lesson config
    
    // Redirect to the appropriate game with query params
    router.push(`/client/games/${gameType}?unitId=${unitId}&lessonId=${lessonId}`)
  }, [unitId, lessonId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-white text-xl">Loading game...</div>
    </div>
  )
}
