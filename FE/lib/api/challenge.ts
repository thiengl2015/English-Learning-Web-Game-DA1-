export type ChallengeSection = "A" | "B" | "C" | "D"

export interface ChallengeQuestion {
  id: number | string
  unit_id: number
  section: ChallengeSection
  question_type: string
  content: unknown
  score: number
  display_order: number
}

export interface ChallengeDetail {
  id: string
  unit_id: number
  title: string
  description?: string | null
  pass_threshold: number
  total_score: number
  unit: {
    id: number
    title: string
    subtitle?: string | null
    icon?: string | null
  }
  sections: Record<ChallengeSection, { name: string; count: number }>
  questions: Record<ChallengeSection, ChallengeQuestion[]>
}

export interface StartChallengeResponse {
  session_id: number
  test_id: string
  unit_id: number
  status: "in_progress" | "completed"
  created_at: string
  is_resumed: boolean
}

export type ChallengeAnswers = Record<ChallengeSection, Record<string, unknown>>

export interface SubmitChallengePayload {
  sessionId: number
  answers: ChallengeAnswers
  timeSpentSeconds: number
}

export interface SubmitChallengeResponse {
  session_id: number
  test_id: string
  unit_id: number
  score: number
  total_possible: number
  score_percentage: number
  pass_threshold: number
  passing_score: number
  passed: boolean
  section_scores: Record<ChallengeSection, { correct: number; total: number }>
  unlock_progress?: {
    unit_id: number
    lessons_completed: number
    lessons_upgraded: number
    stars_awarded: number
    unit_completed: boolean
  } | null
  time_spent_seconds: number
  completed_at: string
}

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/$/, "")
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`

export class MissingChallengeTokenError extends Error {
  constructor() {
    super("Missing token")
    this.name = "MissingChallengeTokenError"
  }
}

export class ChallengeApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ChallengeApiError"
    this.status = status
  }
}

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function challengeFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) {
    throw new MissingChallengeTokenError()
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
    throw new ChallengeApiError(
      payload?.message || "Challenge API request failed",
      response.status
    )
  }

  return payload.data as T
}

export function getChallenge(unitId: string | number) {
  return challengeFetch<ChallengeDetail>(`/challenges/unit/${unitId}`)
}

export function startChallengeSession(unitId: string | number) {
  return challengeFetch<StartChallengeResponse>(`/challenges/unit/${unitId}/start`, {
    method: "POST",
    body: JSON.stringify({ unitId: Number(unitId) }),
  })
}

export function submitChallenge(unitId: string | number, payload: SubmitChallengePayload) {
  return challengeFetch<SubmitChallengeResponse>(`/challenges/unit/${unitId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
