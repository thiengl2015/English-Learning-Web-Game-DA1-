"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, RotateCcw } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import { PracticeDetailState } from "@/components/practice-detail-state"
import {
  completePracticeAttempt,
  getPracticeTopic,
  MissingPracticeTokenError,
  PracticeItem,
  startPracticeAttempt,
} from "@/lib/api/practice"

interface Story {
  id: string
  title: string
  english: string
  vietnamese: string
  image: string
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function mapStory(item: PracticeItem): Story {
  const content = item.contentData || item.content_data || {}
  return {
    id: item.id,
    title: item.title || "Story",
    english: asString(content.english, item.passage || ""),
    vietnamese: asString(content.vietnamese, item.translation || ""),
    image: item.imageUrl || "",
  }
}

export default function ReadStoryDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [topicTitle, setTopicTitle] = useState("")
  const [stories, setStories] = useState<Story[]>([])
  const [nextTopic, setNextTopic] = useState<string | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missingToken, setMissingToken] = useState(false)
  const startTimeRef = useRef(Date.now())
  const completionSentRef = useRef(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setMissingToken(false)
    completionSentRef.current = false
    startTimeRef.current = Date.now()

    Promise.all([getPracticeTopic("read-story", id), startPracticeAttempt("read-story", id)])
      .then(([detail, attempt]) => {
        if (!active) return
        setTopicTitle(detail.topic.title)
        setStories(detail.items.map(mapStory))
        setNextTopic(detail.nextTopicSlug)
        setAttemptId(attempt.attemptId)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof MissingPracticeTokenError) {
          setMissingToken(true)
        } else {
          setError(err instanceof Error ? err.message : "Could not load this practice topic.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  const totalStories = stories.length
  const [currentIdx, setCurrentIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [viewedStories, setViewedStories] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const story = stories[currentIdx]

  useEffect(() => {
    setCurrentIdx(0)
    setRevealed(false)
    setViewedStories(new Set())
    setShowModal(false)
  }, [id])

  const sendCompletion = (viewed: Set<number>) => {
    if (!attemptId || completionSentRef.current || viewed.size < totalStories) return
    completionSentRef.current = true
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    completePracticeAttempt(attemptId, {
      correctCount: totalStories,
      totalCount: totalStories,
      completedItems: viewed.size,
      timeSpent,
      answers: { viewedStories: Array.from(viewed) },
    }).catch(() => {
      completionSentRef.current = false
    })
  }

  const markViewed = (index: number) => {
    const newViewed = new Set(viewedStories).add(index)
    setViewedStories(newViewed)
    if (newViewed.size === totalStories) {
      sendCompletion(newViewed)
      setTimeout(() => setShowModal(true), 300)
    }
    return newViewed
  }

  const handlePrev = () => {
    setCurrentIdx((i) => Math.max(0, i - 1))
    setRevealed(false)
  }

  const handleNext = () => {
    const next = currentIdx + 1
    if (next >= totalStories) return
    markViewed(currentIdx)
    setCurrentIdx(next)
    setRevealed(false)
  }

  const handleFinish = () => {
    markViewed(currentIdx)
  }

  const handleReveal = () => setRevealed(true)

  const handleReset = () => {
    setCurrentIdx(0)
    setRevealed(false)
    setViewedStories(new Set())
    setShowModal(false)
    completionSentRef.current = false
    startTimeRef.current = Date.now()
    startPracticeAttempt("read-story", id)
      .then((attempt) => setAttemptId(attempt.attemptId))
      .catch(() => undefined)
  }

  const getDotClass = (i: number) => {
    if (viewedStories.has(i)) return "bg-green-400"
    if (i === currentIdx) return "bg-cyan-400"
    return "bg-white/25"
  }

  if (loading) return <PracticeDetailState backHref="/client/practice/read-story" message="Loading practice topic..." />
  if (missingToken) return <PracticeDetailState backHref="/client/practice/read-story" message="Sign in to practice and save your progress." showSignIn />
  if (error) return <PracticeDetailState backHref="/client/practice/read-story" message={error} />
  if (!story) return <PracticeDetailState backHref="/client/practice/read-story" message="No stories are available for this topic." />

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      <Link
        href="/client/practice/read-story"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      <div className="relative z-10 flex items-stretch justify-center gap-0 w-full max-w-5xl px-6 py-12">
        <div
          className="flex-1 max-w-[420px] rounded-l-2xl flex flex-col items-center justify-between p-8 gap-6"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderRight: "none",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          <h1 className="text-white font-bold text-xl text-center text-balance">{topicTitle}</h1>

          <div className="w-48 h-48 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
            <img src={story.image} alt={story.title} className="w-full h-full object-cover" />
          </div>

          <div className="text-center">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Story</p>
            <h2 className="text-white font-semibold text-lg text-balance">{story.title}</h2>
          </div>

          <p className="text-white/30 text-xs text-center">Story {currentIdx + 1} of {totalStories}</p>
        </div>

        <div
          className="w-4 flex-shrink-0"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))",
          }}
        />

        <div
          className="flex-1 max-w-[420px] rounded-r-2xl flex flex-col p-8 gap-5"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderLeft: "none",
            boxShadow: "8px 0 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          <h2 className="text-white/80 font-semibold text-base text-center">{story.title}</h2>

          <div className="leading-relaxed text-white/90 text-sm flex-1">
            <p>{story.english}</p>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <div className="p-4 leading-relaxed text-white/70 text-sm select-none">
              <p className="text-white/40 text-xs font-semibold mb-2 uppercase tracking-widest">Translation</p>
              <p>{story.vietnamese}</p>
            </div>

            <div
              onClick={handleReveal}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-500
                ${revealed ? "opacity-0 pointer-events-none" : "opacity-100"}
              `}
              style={{ background: "rgba(18,12,52,0.92)" }}
            >
              <p className="absolute inset-0 p-4 pt-8 text-sm text-white/20 blur-sm leading-relaxed select-none pointer-events-none">
                {story.vietnamese}
              </p>
              <div className="relative flex flex-col items-center gap-2 z-10">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-white/70 text-xs font-semibold tracking-wide">Click to reveal translation</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-13">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-white/8 border border-white/15 text-white/60 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <div className="flex gap-1.5">
                {stories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentIdx(i); setRevealed(false) }}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${getDotClass(i)}`}
                  />
                ))}
              </div>

              {currentIdx === totalStories - 1 ? (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-cyan-500 border border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all duration-200"
                >
                  Finish
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-cyan-500 border border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all duration-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="px-10 py-6 rounded-2xl bg-[#1a2a3a]/90 border-2 border-green-400/50 backdrop-blur-md shadow-cyan-300 gap-4">
              <p className="text-green-400 text-2xl font-bold text-center">Great reading!</p>
              <p className="text-white/60 text-sm text-center mt-2 mb-4">
                You completed all {totalStories} stories
              </p>
              <div className="flex gap-6">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a2a3a]/90 hover:bg-[#2a3a4a] font-medium border border-white/20 text-gray-300 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Again
                </button>
                {nextTopic && (
                  <Link
                    href={`/client/practice/read-story/${nextTopic}`}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/30"
                  >
                    Next Topic
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
