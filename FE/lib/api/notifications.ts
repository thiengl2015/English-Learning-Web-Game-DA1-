/**
 * Notifications API — user inbox + admin campaigns/templates/inbox.
 */

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE = `${RAW_API.replace(/\/$/, "").replace(/\/api$/, "")}/api`

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Yêu cầu thất bại")
  }
  return json.data as T
}

export interface UserNotification {
  id: string
  type: string
  title: string
  message: string
  metadata: Record<string, any> | null
  is_read: boolean
  created_at: string
}

export interface NotificationCampaign {
  id: string
  title: string
  message: string
  image_url: string | null
  audience: "all" | "free" | "premium" | "inactive"
  trigger_type: "schedule" | "level_reached" | "units_completed" | "streak" | "xp_milestone" | "resume_activity"
  trigger_config: Record<string, any> | null
  status: "draft" | "scheduled" | "active" | "sent" | "cancelled"
  sent_at: string | null
  created_at: string
}

export interface NotificationTemplate {
  id: number
  event: string
  title: string
  body: string
  variables: string[]
  enabled: boolean
}

// ── User-facing ──
export function getUserNotifications(): Promise<{ notifications: UserNotification[]; unread_count: number }> {
  return request("/notifications")
}
export function markNotificationRead(id: string): Promise<any> {
  return request(`/notifications/${id}/read`, { method: "PATCH" })
}
export function markAllNotificationsRead(): Promise<any> {
  return request("/notifications/read-all", { method: "POST" })
}
export function deleteNotification(id: string): Promise<any> {
  return request(`/notifications/${id}`, { method: "DELETE" })
}

// ── Admin inbox ──
export function getAdminInbox(): Promise<{ notifications: UserNotification[]; unread_count: number }> {
  return request("/admin/notifications/inbox")
}
export function markAdminInboxRead(id: string): Promise<any> {
  return request(`/admin/notifications/inbox/${id}/read`, { method: "PATCH" })
}
export function markAdminInboxAllRead(): Promise<any> {
  return request("/admin/notifications/inbox/read-all", { method: "POST" })
}

// ── Admin templates ──
export function getTemplates(): Promise<NotificationTemplate[]> {
  return request("/admin/notifications/templates")
}
export function updateTemplate(id: number, body: { title?: string; body?: string; variables?: string[]; enabled?: boolean }): Promise<NotificationTemplate> {
  return request(`/admin/notifications/templates/${id}`, { method: "PUT", body: JSON.stringify(body) })
}
export function createTemplate(body: { event: string; title: string; body: string; variables?: string[] }): Promise<NotificationTemplate> {
  return request("/admin/notifications/templates", { method: "POST", body: JSON.stringify(body) })
}

// ── Admin campaigns ──
export interface CreateCampaignPayload {
  title: string
  message: string
  image_url?: string
  audience: string
  trigger_type: string
  trigger_config?: Record<string, any>
  draft?: boolean
}
export function getCampaigns(): Promise<NotificationCampaign[]> {
  return request("/admin/notifications/campaigns")
}
export function createCampaign(body: CreateCampaignPayload): Promise<NotificationCampaign> {
  return request("/admin/notifications/campaigns", { method: "POST", body: JSON.stringify(body) })
}
export function updateCampaignStatus(id: string, status: string): Promise<NotificationCampaign> {
  return request(`/admin/notifications/campaigns/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })
}
export function deleteCampaign(id: string): Promise<any> {
  return request(`/admin/notifications/campaigns/${id}`, { method: "DELETE" })
}
