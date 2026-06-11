/**
 * Admin resource management API (units / lessons / vocabulary / grammar / game content)
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

export interface AdminUnit {
  id: number
  title: string
  subtitle: string | null
  icon: string | null
  order_index: number
}

export interface AdminLesson {
  id: number
  unitId: number
  title: string
  contentType: string
}

export interface AdminTreeVocab {
  id: number
  word: string
  phonetic: string | null
  translation: string
  image_url: string | null
  audio_url: string | null
}

export interface AdminTreeGrammar {
  id: number
  pattern: string
  explanation: string | null
  example: string | null
  translation: string | null
}

export interface AdminTreeGame {
  id: number
  game_type: string
  questions_count: number
  has_content: boolean
}

export interface AdminTreeLesson {
  id: number
  unit_id: number
  title: string
  type: string
  vocabulary: AdminTreeVocab[]
  grammar: AdminTreeGrammar[]
  games: AdminTreeGame[]
}

export interface AdminTreeUnit {
  id: number
  title: string
  subtitle: string | null
  icon: string | null
  order_index: number
  lessons: AdminTreeLesson[]
}

export interface CreateResourcePayload {
  unit: { id?: string | number; title?: string; subtitle?: string; icon?: string }
  lesson: { id?: string | number; title?: string }
  contentType: "vocabulary" | "grammar"
  content: any[]
  game: { type: string; data: any[] }
}

export function getAdminUnits(): Promise<AdminUnit[]> {
  return request<AdminUnit[]>("/admin/resources/units")
}

export function getAdminLessons(unitId: string | number): Promise<AdminLesson[]> {
  return request<AdminLesson[]>(`/admin/resources/units/${unitId}/lessons`)
}

export function getAdminResourceTree(): Promise<AdminTreeUnit[]> {
  return request<AdminTreeUnit[]>("/admin/resources/tree")
}

export function createResource(payload: CreateResourcePayload): Promise<{
  unit_id: number
  lesson_id: number
  lesson_type: string
  created_vocabulary: number
  created_grammar: number
  game_config_id: number | null
}> {
  return request("/admin/resources", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ── Manage (CRUD) ──
export function updateUnit(
  id: number,
  body: { title?: string; subtitle?: string; icon?: string }
): Promise<any> {
  return request(`/admin/resources/units/${id}`, { method: "PUT", body: JSON.stringify(body) })
}

export function deleteUnit(id: number): Promise<any> {
  return request(`/admin/resources/units/${id}`, { method: "DELETE" })
}

export function updateLesson(id: number, body: { title?: string; type?: string }): Promise<any> {
  return request(`/admin/resources/lessons/${id}`, { method: "PUT", body: JSON.stringify(body) })
}

export function deleteLesson(id: number): Promise<any> {
  return request(`/admin/resources/lessons/${id}`, { method: "DELETE" })
}

export function updateVocabulary(
  id: number,
  body: { word?: string; phonetic?: string; translation?: string; image_url?: string; audio_url?: string }
): Promise<any> {
  return request(`/admin/resources/vocabulary/${id}`, { method: "PUT", body: JSON.stringify(body) })
}

export function deleteVocabulary(id: number): Promise<any> {
  return request(`/admin/resources/vocabulary/${id}`, { method: "DELETE" })
}

export function updateGrammar(
  id: number,
  body: { pattern?: string; explanation?: string; example?: string; translation?: string }
): Promise<any> {
  return request(`/admin/resources/grammar/${id}`, { method: "PUT", body: JSON.stringify(body) })
}

export function deleteGrammar(id: number): Promise<any> {
  return request(`/admin/resources/grammar/${id}`, { method: "DELETE" })
}

export function deleteGame(id: number): Promise<any> {
  return request(`/admin/resources/games/${id}`, { method: "DELETE" })
}
