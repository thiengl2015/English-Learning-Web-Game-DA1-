export type PracticeMode = "listen-fill" | "listen-repeat" | "read-answer" | "read-story"

export interface PracticeTopicCard {
  id: string
  mode: PracticeMode
  slug: string
  title: string
  description: string
  emoji: string
  color: string
  imageUrl?: string
  total: number
  completed: number
  progressPercent: number
  bestScore: number
  attemptsCount: number
  completedAt?: string | null
}

export interface PracticeItem {
  id: string
  orderIndex: number
  title?: string | null
  prompt?: string | null
  passage?: string | null
  imageUrl?: string | null
  audioText?: string | null
  translation?: string | null
  contentData?: Record<string, unknown> | null
  content_data?: Record<string, unknown> | null
}

export interface PracticeTopicDetail {
  topic: PracticeTopicCard
  items: PracticeItem[]
  progress: {
    completedItems: number
    totalItems: number
    bestScore: number
    attemptsCount: number
    lastAttemptAt: string | null
    completedAt: string | null
  }
  nextTopicSlug: string | null
}

export interface CompletePracticePayload {
  correctCount: number
  totalCount: number
  completedItems: number
  timeSpent?: number
  answers?: unknown
}

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/$/, "")
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`

export class MissingPracticeTokenError extends Error {
  constructor() {
    super("Missing token")
    this.name = "MissingPracticeTokenError"
  }
}

export class PracticeApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "PracticeApiError"
    this.status = status
  }
}

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function practiceFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) {
    throw new MissingPracticeTokenError()
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.success === false) {
    throw new PracticeApiError(payload?.message || "Practice API request failed", response.status)
  }

  return payload.data as T
}

function parseContentData(value: unknown): Record<string, unknown> {
  if (!value) return {}

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
    } catch {
      return {}
    }
  }

  return typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizePracticeTopicDetail(detail: PracticeTopicDetail): PracticeTopicDetail {
  return {
    ...detail,
    items: detail.items.map((item) => {
      const contentData = parseContentData(item.contentData ?? item.content_data)
      return {
        ...item,
        contentData,
        content_data: contentData,
      }
    }),
  }
}

export function getPracticeTopics(mode: PracticeMode) {
  return practiceFetch<PracticeTopicCard[]>(`/practice/${mode}/topics`)
}

export async function getPracticeTopic(mode: PracticeMode, slug: string) {
  const detail = await practiceFetch<PracticeTopicDetail>(`/practice/${mode}/topics/${slug}`)
  return normalizePracticeTopicDetail(detail)
}

export function startPracticeAttempt(mode: PracticeMode, slug: string) {
  return practiceFetch<{ attemptId: string; startedAt: string; totalCount: number }>(
    `/practice/${mode}/topics/${slug}/start`,
    { method: "POST", body: JSON.stringify({}) }
  )
}

export function completePracticeAttempt(attemptId: string, payload: CompletePracticePayload) {
  return practiceFetch(`/practice/attempts/${attemptId}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
