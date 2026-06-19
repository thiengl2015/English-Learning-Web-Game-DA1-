import type { UserSettings } from "@/lib/api/settings"

export type AdminUserStatus = "Active" | "Inactive"

export interface AdminUser {
  id: string
  username: string
  email: string
  display_name?: string | null
  name: string
  avatar?: string | null
  level: number
  subscription: "Free" | "Premium"
  premium_expires_at?: string | null
  status: AdminUserStatus
  joined_date?: string | null
  last_active?: string | null
  native_language?: string | null
  current_level: "beginner" | "intermediate" | "advanced"
  learning_goal: "travel" | "work" | "ielts" | "toeic" | "daily" | "academic"
  daily_goal: number
  progress: {
    total_xp: number
    weekly_xp: number
    xp_this_week: number
    level: number
    streak_days: number
    last_active_date?: string | null
    words_learned: number
    total_study_minutes: number
    units_completed: number
    lessons_completed: number
    league: string
  }
  settings: UserSettings
  feedbacks?: Array<{
    id: string
    type: string
    rating?: number | null
    message: string
    status: string
    created_at?: string | null
  }>
  transactions?: Array<{
    id: string
    amount: number
    status: string
    package_type: string
    premium_expires_at?: string | null
    created_at?: string | null
  }>
}

export interface AdminUsersResponse {
  users: AdminUser[]
  stats: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    newThisMonth: number
  }
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AdminDashboardSummary {
  stats: {
    totalUsers: number
    activeUsers: number
    newThisMonth: number
    feedbackCount: number
    trends: {
      totalUsers: string
      activeUsers: string
      newThisMonth: string
      feedbackCount: string
    }
  }
  userGrowth: Array<{ period: string; users: number; active: number }>
  subscriptions: Array<{ name: string; value: number }>
  recentActivity: Array<{ user: string; action: string; time: string }>
}

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/$/, "")
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`

export class MissingAdminTokenError extends Error {
  constructor() {
    super("Missing token")
    this.name = "MissingAdminTokenError"
  }
}

export class AdminApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "AdminApiError"
    this.status = status
  }
}

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) throw new MissingAdminTokenError()

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
    throw new AdminApiError(payload?.message || "Admin API request failed", response.status)
  }

  return payload.data as T
}

export function getAdminUsers(params: {
  search?: string
  status?: string
  subscription?: string
  page?: number
  limit?: number
} = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set("search", params.search)
  if (params.status && params.status !== "all") query.set("status", params.status)
  if (params.subscription && params.subscription !== "all") query.set("subscription", params.subscription)
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))

  const suffix = query.toString() ? `?${query.toString()}` : ""
  return adminFetch<AdminUsersResponse>(`/admin/users${suffix}`)
}

export function getAdminUser(id: string) {
  return adminFetch<AdminUser>(`/admin/users/${id}`)
}

export function updateAdminUserStatus(id: string, status: AdminUserStatus) {
  return adminFetch<AdminUser>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function getAdminDashboardSummary() {
  return adminFetch<AdminDashboardSummary>("/admin/dashboard/summary")
}
