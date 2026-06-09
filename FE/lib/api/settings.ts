export interface UserSettings {
  push_notifications: boolean
  email_reminders: boolean
  sound_effects: boolean
  background_music: boolean
  music_volume: number
  audio_volume: number
  dark_mode: boolean
  updated_at?: string
}

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/$/, "")
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`

export class MissingSettingsTokenError extends Error {
  constructor() {
    super("Missing token")
    this.name = "MissingSettingsTokenError"
  }
}

export class SettingsApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "SettingsApiError"
    this.status = status
  }
}

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function settingsFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) throw new MissingSettingsTokenError()

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
    throw new SettingsApiError(payload?.message || "Settings API request failed", response.status)
  }

  return payload.data as T
}

export function getUserSettings() {
  return settingsFetch<UserSettings>("/users/settings")
}

export function updateUserSettings(settings: UserSettings) {
  return settingsFetch<UserSettings>("/users/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  })
}
