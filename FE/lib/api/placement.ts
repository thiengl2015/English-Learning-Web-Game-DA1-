export type PlacementSection = "sectionA" | "sectionB" | "sectionC" | "sectionD" | "sectionE" | "sectionF" | "sectionG"

export interface PlacementTopic {
  id: string
  name: string
  name_vi?: string
  slug: string
  icon?: string
  difficulty_range?: string
  unit_id?: number
  unit_order?: number
}

export interface PlacementQuestions {
  title?: string
  sectionAOptions?: Array<{ letter: string; text: string }>
  sectionA: Array<{ id: number | string; topicSlug?: string; question: string }>
  sectionB: Array<{
    id: number | string
    topicSlug?: string
    audioText: string
    optionAImg: string
    optionBImg: string
  }>
  sectionC: Array<{
    id: number | string
    topicSlug?: string
    lineA: string
    lineB: string
    blankInA: boolean
    options: string[]
  }>
  sectionD: Array<{
    id: number | string
    topicSlug?: string
    scrambled: string[]
    image?: string
  }>
  sectionETable?: Array<{ header?: string; detail?: string; day?: string; activity?: string }>
  sectionE: Array<{ id: number | string; topicSlug?: string; question: string }>
  sectionF: Array<{
    id: number | string
    topicSlug?: string
    word: string
    audioText: string
    image?: string
  }>
  sectionG: Array<{
    id: number | string
    topicSlug?: string
    question: string
    hint?: string
  }>
}

export interface GeneratePlacementResponse {
  session_id: string
  topics: PlacementTopic[]
  level: "beginner" | "intermediate" | "advanced"
  age: number
  questions: PlacementQuestions
  tokens_used?: number
}

export type PlacementAnswers = {
  sectionA: Record<string, string>
  sectionB: Record<string, { selected?: "A" | "B" | null; written?: string }>
  sectionC: Record<string, string>
  sectionD: Record<string, string>
  sectionE: Record<string, string>
  sectionF: Record<string, boolean>
  sectionG: Record<string, string>
}

export interface PlacementAnswerReviewItem {
  questionId: number | string
  section: PlacementSection
  topicSlug?: string
  userAnswer: unknown
  correctAnswer: unknown
  isCorrect: boolean
  score: number
}

export interface SubmitPlacementResponse {
  session_id: string
  score: number
  section_scores: Record<PlacementSection, { correct: number; total: number }>
  topic_scores?: Record<string, { correct: number; total: number }>
  unlock_progress?: {
    selected_topics: string[]
    mastered_topics: string[]
    passed_topics?: string[]
    perfect_topics?: string[]
    unlocked_units: number[]
    lessons_completed: number
    units_completed: number
    stars_awarded_per_lesson: number
    crowns_awarded_per_unit: number
    stars_awarded_by_unit?: Record<string, number>
    crowns_awarded_by_unit?: Record<string, number>
  }
  answer_review?: Record<PlacementSection, PlacementAnswerReviewItem[]>
  passed: boolean
  cefr_level: string
  total_correct: number
  total_possible: number
  message?: string
}

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/$/, "")
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`

export class MissingPlacementTokenError extends Error {
  constructor() {
    super("Missing token")
    this.name = "MissingPlacementTokenError"
  }
}

export class PlacementApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "PlacementApiError"
    this.status = status
  }
}

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.success === false) {
    throw new PlacementApiError(
      payload?.message || "Placement API request failed",
      response.status
    )
  }

  return payload.data as T
}

async function placementFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) {
    throw new MissingPlacementTokenError()
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  return parseApiResponse<T>(response)
}

export async function getPlacementTopics(age?: number) {
  const query = age ? `?age=${age}` : ""
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/placement/topics${query}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  return parseApiResponse<PlacementTopic[]>(response)
}

export function generatePlacementTest(payload: {
  topicSlugs: string[]
  level?: "beginner" | "intermediate" | "advanced"
  age?: number
}) {
  return placementFetch<GeneratePlacementResponse>("/placement/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function submitPlacementTest(sessionId: string, answers: PlacementAnswers) {
  return placementFetch<SubmitPlacementResponse>(`/placement/${sessionId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  })
}
