"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

const LISTEN_REPEAT_TOPICS = [
  {
    id: "greetings",
    title: "Greetings",
    description: "Listen and repeat common greeting phrases",
    total: 6,
    completed: 6,
    color: "from-violet-500 to-purple-600",
    emoji: "👋",
  },
  {
    id: "daily-activities",
    title: "Daily Activities",
    description: "Listen and repeat words about daily routines",
    total: 6,
    completed: 3,
    color: "from-cyan-500 to-blue-600",
    emoji: "🏃",
  },
  {
    id: "animals",
    title: "Animals",
    description: "Listen and repeat names of animals",
    total: 6,
    completed: 2,
    color: "from-emerald-500 to-green-600",
    emoji: "🦊",
  },
  {
    id: "food",
    title: "Food & Drinks",
    description: "Listen and repeat names of food and drinks",
    total: 6,
    completed: 1,
    color: "from-orange-500 to-amber-600",
    emoji: "🍎",
  },
  {
    id: "sports",
    title: "Sports",
    description: "Listen and repeat sports vocabulary",
    total: 6,
    completed: 0,
    color: "from-pink-500 to-rose-600",
    emoji: "⚽",
  },
]

function CircularProgress({ progress, color }: { progress: number; color: string }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const strokeColor = color.includes("violet")
    ? "#a78bfa"
    : color.includes("cyan")
      ? "#22d3ee"
      : color.includes("emerald")
        ? "#34d399"
        : color.includes("orange")
          ? "#fb923c"
          : "#f472b6"

  const isComplete = progress === 100

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      {isComplete ? (
        <svg
          className="absolute w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span className="absolute text-xs font-bold text-white">{Math.round(progress)}%</span>
      )}
    </div>
  )
}

export default function ListenRepeatPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />

      {/* Back Button */}
      <Link
        href="/client/practice"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Practice Speaking</h1>
          <p className="text-cyan-300 text-lg">Listen and repeat the words</p>
        </div>

        {/* Topic List */}
        <div className="w-full max-w-2xl space-y-4">
          {LISTEN_REPEAT_TOPICS.map((topic) => (
            <Link
              key={topic.id}
              href={`/client/practice/listen-repeat/${topic.id}`}
              className="flex items-center gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/15 border border-white/10 hover:border-white/25 transition-all duration-300 hover:scale-[1.02] group"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                {topic.emoji}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-white/50 text-sm truncate">{topic.description}</p>
              </div>

              {/* Circular Progress */}
              <div className="flex-shrink-0">
                <CircularProgress progress={(topic.completed / topic.total) * 100} color={topic.color} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
