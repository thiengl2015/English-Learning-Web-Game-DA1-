export type GameType = "galaxy-match" | "planetary-order" | "rescue-mission" | "signal-check" | "voice-command"

export type LessonGameConfig = {
  unitId: string
  lessonId: number
  gameType: GameType
  difficulty: "easy" | "medium" | "hard"
  questionsCount: number
}

export const DEFAULT_LESSON_GAMES: Record<string, GameType> = {
  vocabulary: "signal-check",
  practice: "galaxy-match",
  test: "signal-check",
}

export function getGameRoute(gameType: GameType, unitId: string, lessonId: string): string {
  return `/client/games/${gameType}?unitId=${unitId}&lessonId=${lessonId}`
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export async function getLessonGameConfig(
  unitId: string,
  lessonId: number
): Promise<LessonGameConfig | null> {
  try {
    const token = getToken()
    if (!token) return null

    const res = await fetch(`${API_BASE_URL}/api/games/lesson/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()

    if (!json.success || !json.data || json.data.length === 0) {
      return null
    }

    const config = json.data[0]
    return {
      unitId,
      lessonId,
      gameType: config.game_type,
      difficulty: config.difficulty,
      questionsCount: config.questions_count,
    }
  } catch {
    return null
  }
}

export async function updateLessonGameConfig(config: LessonGameConfig): Promise<boolean> {
  try {
    const token = getToken()
    if (!token) return false

    const res = await fetch(`${API_BASE_URL}/api/admin/games/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(config),
    })
    const json = await res.json()
    return json.success
  } catch {
    return false
  }
}