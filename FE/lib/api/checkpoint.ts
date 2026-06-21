export type CheckpointSection = "A" | "B" | "C" | "D" | "E"

export interface CheckpointQuestion {
  id: number | string
  section: CheckpointSection
  question_type: string
  content: unknown
  score: number
  display_order: number
}

export interface CheckpointDetail {
  id: string
  title: string
  description?: string | null
  units_covered: number[]
  pass_threshold: number
  total_score: number
  sections: Record<CheckpointSection, { name: string; count: number }>
  questions: Record<CheckpointSection, CheckpointQuestion[]>
}

export interface StartCheckpointResponse {
  session_id: number
  checkpoint_id: string
  status: "in_progress" | "completed"
  created_at: string
  is_resumed: boolean
}

export type CheckpointAnswers = Record<CheckpointSection, Record<string, unknown>>

export interface SubmitCheckpointPayload {
  sessionId: number
  answers: CheckpointAnswers
  timeSpentSeconds: number
}

export interface CheckpointAnswerDetail {
  questionId: number | string
  section: CheckpointSection
  questionType: string
  userAnswer: unknown
  correctAnswer: unknown
  isCorrect: boolean
  score: number
}

export interface SubmitCheckpointResponse {
  session_id: number
  score: number
  total_possible: number
  score_percentage: number
  pass_threshold: number
  passing_score?: number
  passed: boolean
  section_scores: Record<CheckpointSection, { correct: number; total: number }>
  section_details?: CheckpointAnswerDetail[]
  details_by_section?: Record<CheckpointSection, CheckpointAnswerDetail[]>
  skip_progress?: {
    units_covered: number[]
    units_completed: number
    lessons_completed: number
  } | null
  time_spent_seconds: number
  completed_at: string
}

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/$/, "")
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`

export class MissingCheckpointTokenError extends Error {
  constructor() {
    super("Missing token")
    this.name = "MissingCheckpointTokenError"
  }
}

export class CheckpointApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "CheckpointApiError"
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
    throw new CheckpointApiError(
      payload?.message || "Checkpoint API request failed",
      response.status
    )
  }

  return payload.data as T
}

async function publicCheckpointFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  })

  return parseApiResponse<T>(response)
}

async function checkpointFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) {
    throw new MissingCheckpointTokenError()
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

export function getCheckpoint(checkpointId: string) {
  return publicCheckpointFetch<CheckpointDetail>(`/checkpoints/${checkpointId}`)
}

export function startCheckpointSession(checkpointId: string) {
  return checkpointFetch<StartCheckpointResponse>(`/checkpoints/${checkpointId}/start`, {
    method: "POST",
    body: JSON.stringify({ checkpointId }),
  })
}

export function submitCheckpoint(checkpointId: string, payload: SubmitCheckpointPayload) {
  return checkpointFetch<SubmitCheckpointResponse>(`/checkpoints/${checkpointId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
