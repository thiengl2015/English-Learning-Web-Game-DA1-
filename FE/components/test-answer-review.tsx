"use client"

import { CheckCircle2, XCircle } from "lucide-react"

export interface AnswerReviewItem {
  questionId: number | string
  section?: string
  questionType?: string
  topicSlug?: string
  userAnswer: unknown
  correctAnswer: unknown
  isCorrect: boolean
  score?: number
}

export interface AnswerReviewSection {
  key: string
  label: string
  name: string
}

interface TestAnswerReviewProps {
  sections: AnswerReviewSection[]
  reviews?: Record<string, AnswerReviewItem[]> | AnswerReviewItem[] | null
  title?: string
  compact?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function formatAnswerValue(value: unknown): string {
  if (value == null || value === "") return "Not answered"
  if (typeof value === "boolean") return value ? "Confirmed" : "Not answered"
  if (typeof value === "number") return String(value)
  if (typeof value === "string") return value || "Not answered"

  if (Array.isArray(value)) {
    const formatted = value.map(formatAnswerValue).filter(Boolean)
    return formatted.length ? formatted.join(", ") : "Not answered"
  }

  if (!isRecord(value)) return String(value)

  const parts: string[] = []
  const selected = value.selected ?? value.choice
  const written = value.written
  const transcript = value.transcript ?? value.spoken
  const answer = value.answer ?? value.value ?? value.word ?? value.correctAnswer ?? value.sampleAnswer
  const answers = value.answers

  if (selected) parts.push(`Choice ${formatAnswerValue(selected)}`)
  if (written) parts.push(`Write: ${formatAnswerValue(written)}`)
  if (transcript) parts.push(`Speak: ${formatAnswerValue(transcript)}`)
  if (answer) parts.push(formatAnswerValue(answer))

  if (isRecord(answers)) {
    const blankAnswers = Object.entries(answers).map(([key, item]) => `${key}: ${formatAnswerValue(item)}`)
    if (blankAnswers.length) parts.push(blankAnswers.join("; "))
  } else if (Array.isArray(answers)) {
    const blankAnswers = answers.map((item) => {
      if (isRecord(item)) {
        const id = item.id ?? item.key ?? ""
        const itemAnswer = item.answer ?? item.value ?? ""
        return id ? `${id}: ${formatAnswerValue(itemAnswer)}` : formatAnswerValue(itemAnswer)
      }

      return formatAnswerValue(item)
    })
    if (blankAnswers.length) parts.push(blankAnswers.join("; "))
  }

  if (parts.length) return parts.join("; ")

  try {
    return JSON.stringify(value)
  } catch {
    return "Not answered"
  }
}

function reviewsForSection(
  reviews: TestAnswerReviewProps["reviews"],
  sectionKey: string
) {
  if (!reviews) return []

  if (Array.isArray(reviews)) {
    return reviews.filter((item) => item.section === sectionKey)
  }

  return reviews[sectionKey] || []
}

export function TestAnswerReview({
  sections,
  reviews,
  title = "Correct answers",
  compact = false,
}: TestAnswerReviewProps) {
  const hasReviews = sections.some((section) => reviewsForSection(reviews, section.key).length > 0)
  if (!hasReviews) return null

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-black/10 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-white/55">{title}</p>
      {sections.map((section) => {
        const sectionReviews = reviewsForSection(reviews, section.key)
        if (!sectionReviews.length) return null

        return (
          <div key={section.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/30 text-[10px] font-bold text-violet-100">
                {section.label}
              </span>
              <span className="text-xs font-semibold text-white/70">{section.name}</span>
            </div>
            <div className="space-y-1.5">
              {sectionReviews.map((item, index) => (
                <div
                  key={`${section.key}-${item.questionId}-${index}`}
                  className={`rounded-md border p-2 ${
                    item.isCorrect
                      ? "border-green-400/25 bg-green-400/10"
                      : "border-red-400/25 bg-red-400/10"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-white/55">
                      Question {index + 1}
                      {item.topicSlug ? ` - ${item.topicSlug}` : ""}
                    </span>
                    {item.isCorrect ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-300" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-red-300" />
                    )}
                  </div>
                  <div className={compact ? "space-y-0.5" : "space-y-1"}>
                    <p className="text-[11px] leading-snug text-white/50">
                      Your answer:{" "}
                      <span className="font-semibold text-white/75">
                        {formatAnswerValue(item.userAnswer)}
                      </span>
                    </p>
                    <p className="text-[11px] leading-snug text-white/50">
                      Correct answer:{" "}
                      <span className="font-semibold text-cyan-200">
                        {formatAnswerValue(item.correctAnswer)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
