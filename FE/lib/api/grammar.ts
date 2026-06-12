/**
 * Client grammar API (practice/grammar): learned grammar + all grammar.
 */

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "")
const API_ROOT = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`

export interface GrammarItem {
  id: number
  grammar_type: string
  name: string
  formula: string
  usage: string
  example: string
  translation: string
  unit: { id: number; title?: string | null; icon?: string | null } | null
  lesson: { id: number; title?: string | null } | null
  is_learned: boolean
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_ROOT}${path}`, { headers: authHeaders() })
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Không thể tải dữ liệu ngữ pháp.")
  }
  return json.data
}

export function getAllGrammar(): Promise<GrammarItem[]> {
  return getJson<GrammarItem[]>("/grammar")
}

export function getLearnedGrammar(): Promise<GrammarItem[]> {
  return getJson<GrammarItem[]>("/grammar/learned")
}
