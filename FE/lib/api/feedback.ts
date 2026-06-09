export type FeedbackType = "Review" | "Suggestion" | "Bug Report"
export type FeedbackStatus = "unread" | "read" | "resolved"

export interface FeedbackUser {
  id: string
  username: string
  email: string
  display_name?: string | null
  avatar?: string | null
}

export interface FeedbackItem {
  id: string
  user_id?: string | null
  user?: FeedbackUser | null
  type: FeedbackType
  rating: number
  message: string
  status: FeedbackStatus
  created_at: string
  resolved_at?: string | null
}

export interface FeedbackStats {
  total: number
  averageRating: number
  unread: number
  bugReports: number
  ratingDistribution: Array<{
    stars: number
    count: number
    percentage: number
  }>
  byType: Record<string, number>
  byStatus: Record<string, number>
}

export interface FeedbackListResponse {
  feedback: FeedbackItem[]
  stats: FeedbackStats
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/$/, "")
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`

export class MissingFeedbackTokenError extends Error {
  constructor() {
    super("Missing token")
    this.name = "MissingFeedbackTokenError"
  }
}

export class FeedbackApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "FeedbackApiError"
    this.status = status
  }
}

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function feedbackFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) {
    throw new MissingFeedbackTokenError()
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
    throw new FeedbackApiError(payload?.message || "Feedback API request failed", response.status)
  }

  return payload.data as T
}

export function submitFeedback(payload: {
  type: FeedbackType
  rating: number
  message: string
}) {
  return feedbackFetch<FeedbackItem>("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getAdminFeedback(params: {
  search?: string
  type?: string
  status?: string
  page?: number
  limit?: number
} = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set("search", params.search)
  if (params.type && params.type !== "all") query.set("type", params.type)
  if (params.status && params.status !== "all") query.set("status", params.status)
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))

  const suffix = query.toString() ? `?${query.toString()}` : ""
  return feedbackFetch<FeedbackListResponse>(`/admin/feedback${suffix}`)
}

export function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  return feedbackFetch<FeedbackItem>(`/admin/feedback/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}
