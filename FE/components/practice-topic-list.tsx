"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import {
  getPracticeTopics,
  MissingPracticeTokenError,
  PracticeApiError,
  PracticeMode,
  PracticeTopicCard,
} from "@/lib/api/practice"

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
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
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

function StateMessage({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-6 text-center text-white/70">
      {children}
    </div>
  )
}

interface PracticeTopicListProps {
  mode: PracticeMode
  title: string
  subtitle: string
  hrefBase: string
}

export function PracticeTopicList({ mode, title, subtitle, hrefBase }: PracticeTopicListProps) {
  const [topics, setTopics] = useState<PracticeTopicCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missingToken, setMissingToken] = useState(false)

  useEffect(() => {
    let active = true

    getPracticeTopics(mode)
      .then((data) => {
        if (!active) return
        setTopics(data)
        setError(null)
        setMissingToken(false)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof MissingPracticeTokenError) {
          setMissingToken(true)
          setError(null)
        } else if (err instanceof PracticeApiError) {
          setError(err.message)
        } else {
          setError("Could not load practice topics.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [mode])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />

      <Link
        href="/client/practice"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-cyan-300 text-lg">{subtitle}</p>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          {loading && <StateMessage>Loading practice topics...</StateMessage>}

          {!loading && missingToken && (
            <StateMessage>
              Sign in to load your practice progress.{" "}
              <Link href="/sign-in" className="text-cyan-300 font-semibold hover:text-cyan-200">
                Go to sign in
              </Link>
            </StateMessage>
          )}

          {!loading && error && <StateMessage>{error}</StateMessage>}

          {!loading && !missingToken && !error && topics.length === 0 && (
            <StateMessage>No practice topics are available yet.</StateMessage>
          )}

          {!loading &&
            !missingToken &&
            !error &&
            topics.map((topic) => (
              <Link
                key={topic.slug}
                href={`${hrefBase}/${topic.slug}`}
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/15 border border-white/10 hover:border-white/25 transition-all duration-300 hover:scale-[1.02] group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}
                >
                  {topic.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-white/50 text-sm truncate">{topic.description}</p>
                </div>

                <div className="flex-shrink-0">
                  <CircularProgress progress={topic.progressPercent} color={topic.color} />
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
