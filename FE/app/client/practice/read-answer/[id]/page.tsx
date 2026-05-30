"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import { PracticeDetailState } from "@/components/practice-detail-state"
import {
  completePracticeAttempt,
  getPracticeTopic,
  MissingPracticeTokenError,
  PracticeItem,
  startPracticeAttempt,
} from "@/lib/api/practice"

interface Question {
  id: number
  statement: string
  answer: boolean
}

interface Part {
  id: string
  passage: string
  questions: Question[]
}

function getQuestions(item: PracticeItem): Question[] {
  const content = item.contentData || item.content_data || {}
  return Array.isArray(content.questions) ? (content.questions as Question[]) : []
}

export default function ReadAnswerDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [topicTitle, setTopicTitle] = useState("")
  const [parts, setParts] = useState<Part[]>([])
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

    Promise.all([getPracticeTopic("read-answer", id), startPracticeAttempt("read-answer", id)])
      .then(([detail, attempt]) => {
        if (!active) return
        setTopicTitle(detail.topic.title)
        setParts(detail.items.map((item) => ({
          id: item.id,
          passage: item.passage || "",
          questions: getQuestions(item),
        })))
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

  const totalParts = parts.length
  const [currentPart, setCurrentPart] = useState(0)
  const [answers, setAnswers] = useState<Record<number, Record<number, boolean | null>>>({})
  const [checkedParts, setCheckedParts] = useState<Set<number>>(new Set())
  const [completedParts, setCompletedParts] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const part = parts[currentPart]
  const isChecked = checkedParts.has(currentPart)
  const currentAnswers = answers[currentPart] ?? {}

  useEffect(() => {
    setCurrentPart(0)
    setAnswers({})
    setCheckedParts(new Set())
    setCompletedParts(new Set())
    setShowModal(false)
  }, [id])

  const handleSelect = (questionId: number, value: boolean) => {
    if (isChecked) return
    setAnswers((prev) => ({
      ...prev,
      [currentPart]: {
        ...(prev[currentPart] ?? {}),
        [questionId]: value,
      },
    }))
  }

  const allAnswered = part?.questions.every((q) => currentAnswers[q.id] !== undefined && currentAnswers[q.id] !== null) || false

  const sendCompletion = (completed: Set<number>) => {
    if (!attemptId || completionSentRef.current) return
    completionSentRef.current = true
    const questionCount = parts.reduce((sum, item) => sum + item.questions.length, 0)
    let correctAnswers = 0
    parts.forEach((item, partIndex) => {
      item.questions.forEach((question) => {
        if (answers[partIndex]?.[question.id] === question.answer) {
          correctAnswers += 1
        }
      })
    })
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    completePracticeAttempt(attemptId, {
      correctCount: correctAnswers,
      totalCount: questionCount || 1,
      completedItems: completed.size,
      timeSpent,
      answers,
    }).catch(() => {
      completionSentRef.current = false
    })
  }

  const handleCheck = () => {
    const newChecked = new Set(checkedParts).add(currentPart)
    setCheckedParts(newChecked)
    const allCorrect = part.questions.every((q) => currentAnswers[q.id] === q.answer)
    let newCompleted = completedParts
    if (allCorrect) {
      newCompleted = new Set(completedParts).add(currentPart)
      setCompletedParts(newCompleted)
    }
    if (newChecked.size === totalParts) {
      sendCompletion(newCompleted)
      setTimeout(() => setShowModal(true), 400)
    }
  }

  const handleNext = () => {
    if (currentPart < totalParts - 1) setCurrentPart((p) => p + 1)
  }

  const handleReset = () => {
    setAnswers({})
    setCheckedParts(new Set())
    setCompletedParts(new Set())
    setCurrentPart(0)
    setShowModal(false)
    completionSentRef.current = false
    startTimeRef.current = Date.now()
    startPracticeAttempt("read-answer", id)
      .then((attempt) => setAttemptId(attempt.attemptId))
      .catch(() => undefined)
  }

  if (loading) return <PracticeDetailState backHref="/client/practice/read-answer" message="Loading practice topic..." />
  if (missingToken) return <PracticeDetailState backHref="/client/practice/read-answer" message="Sign in to practice and save your progress." showSignIn />
  if (error) return <PracticeDetailState backHref="/client/practice/read-answer" message={error} />
  if (!part) return <PracticeDetailState backHref="/client/practice/read-answer" message="No reading questions are available for this topic." />

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />

      <Link
        href="/client/practice/read-answer"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-24">
        <div className="w-full max-w-2xl flex flex-col gap-5">
          <div className="rounded-2xl bg-emerald-700/70 border border-emerald-400/30 backdrop-blur-md p-5 shadow-lg">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">{topicTitle}</p>
            <p className="text-white text-base leading-relaxed">{part.passage}</p>
          </div>

          <div className="flex flex-col gap-3">
            {part.questions.map((q, idx) => {
              const selected = currentAnswers[q.id]
              const isCorrect = selected === q.answer
              const showResult = isChecked

              return (
                <div
                  key={q.id}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 border backdrop-blur-md transition-all duration-300
                    ${showResult && isCorrect
                      ? "bg-green-500/15 border-green-400/50"
                      : showResult && !isCorrect
                        ? "bg-red-500/15 border-red-400/40"
                        : "bg-white/8 border-white/15"
                    }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>

                  <span className="flex-1 text-white text-sm font-medium">{q.statement}</span>

                  <div className="flex gap-2 flex-shrink-0">
                    {([true, false] as const).map((val) => {
                      const label = val ? "True" : "False"
                      const isSelected = selected === val
                      const isThisCorrect = showResult && isSelected && isCorrect
                      const isThisWrong = showResult && isSelected && !isCorrect

                      return (
                        <button
                          key={label}
                          onClick={() => handleSelect(q.id, val)}
                          disabled={isChecked}
                          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 text-white/80
                            ${isThisCorrect
                              ? "bg-green-500 border-green-400 shadow-lg shadow-green-500/30"
                              : isThisWrong
                                ? "bg-red-500/80 border-red-400"
                                : isSelected
                                  ? "bg-white/5 border-cyan-400/50"
                                  : "bg-white/15 border-white/20 hover:bg-white/8"
                            }
                            ${isChecked ? "cursor-default" : "cursor-pointer"}
                          `}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center px-4 py-2 rounded-full bg-white/8 border border-white/15 text-white/60 text-sm font-medium">
              ({currentPart + 1}/{totalParts})
            </span>

            <div className="flex gap-1.5">
              {parts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPart(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${completedParts.has(i)
                    ? "bg-green-400"
                    : i === currentPart
                      ? "bg-cyan-400"
                      : checkedParts.has(i)
                        ? "bg-red-400/70"
                        : "bg-white/25"
                    }`}
                />
              ))}
            </div>

            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={!allAnswered}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200
                  ${allAnswered
                    ? "bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30"
                    : "bg-white/8 border-white/15 text-white/40 cursor-not-allowed"
                  }`}
              >
                Check
              </button>
            ) : (
              currentPart < totalParts - 1 && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold bg-cyan-500 border border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all duration-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )
            )}
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
                You completed {completedParts.size}/{totalParts} all corrected
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
                    href={`/client/practice/read-answer/${nextTopic}`}
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
