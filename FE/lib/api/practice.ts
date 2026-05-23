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
  contentData?: Record<string, unknown>
  content_data?: Record<string, unknown>
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

export function getPracticeTopics(mode: PracticeMode) {
  return practiceFetch<PracticeTopicCard[]>(`/practice/${mode}/topics`)
}

export function getPracticeTopic(mode: PracticeMode, slug: string) {
  return practiceFetch<PracticeTopicDetail>(`/practice/${mode}/topics/${slug}`)
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
