"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Gamepad2, Loader2, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_ROOT = `${RAW_API.replace(/\/$/, "").replace(/\/api$/, "")}/api`

interface GameConfig {
  id: number
  game_type: string
  unit_id: number
  lesson_id: number
  difficulty: "easy" | "medium" | "hard"
  questions_count: number
  time_limit: number
  passing_score: number
  xp_reward: number
  user_best?: { score: number; xp: number } | null
}

const GAME_NAMES: Record<string, string> = {
  "galaxy-match": "Galaxy Match",
  "planetary-order": "Planetary Order",
  "rescue-mission": "Rescue Mission",
  "signal-check": "Signal Check",
  "voice-command": "Voice Command",
}

export default function LessonGamePage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.unitId as string
  const lessonId = params.lessonId as string

  const [game, setGame] = useState<GameConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"loading" | "starting" | "error">("loading")
  const hasStartedRef = useRef(false)

  const startGame = useCallback(
    async (targetGame: GameConfig) => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/sign-in")
        return
      }

      setGame(targetGame)
      setStatus("starting")
      setError(null)

      const response = await fetch(`${API_ROOT}/games/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game_config_id: targetGame.id }),
      })
      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message || "Khong the bat dau game cho lesson nay")
      }

      const sessionId = json.data.session_id
      const gameType = json.data.game_type || targetGame.game_type
      router.replace(
        `/client/games/${gameType}?sessionId=${sessionId}&unitId=${unitId}&lessonId=${lessonId}&gameConfigId=${targetGame.id}`
      )
    },
    [lessonId, router, unitId]
  )

  const loadAndStart = useCallback(
    async (force = false) => {
      if (hasStartedRef.current && !force) return
      hasStartedRef.current = true

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/sign-in")
        return
      }

      setStatus("loading")
      setError(null)

      try {
        const response = await fetch(`${API_ROOT}/games/lesson/${lessonId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await response.json().catch(() => ({}))

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Khong the tai game cua lesson")
        }

        const configs: GameConfig[] = Array.isArray(json.data) ? json.data : []
        const lessonGame = configs[0]
        if (!lessonGame) {
          throw new Error("Lesson nay chua co game de chay thu")
        }

        await startGame(lessonGame)
      } catch (err: any) {
        setError(err?.message || "Khong the mo lesson")
        setStatus("error")
      }
    },
    [lessonId, router, startGame]
  )

  useEffect(() => {
    hasStartedRef.current = false
    void loadAndStart()
  }, [loadAndStart])

  const title =
    status === "error"
      ? "Khong mo duoc lesson"
      : status === "starting"
        ? "Dang bat dau game"
        : "Dang tai lesson"
  const gameName = game ? GAME_NAMES[game.game_type] || game.game_type : "Lesson game"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      <Link
        href={`/client/units/${unitId}/lessons`}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Quay lai</span>
      </Link>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <section className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/20 border border-cyan-300/40">
            {status === "error" ? (
              <AlertCircle className="h-8 w-8 text-red-300" />
            ) : (
              <Gamepad2 className="h-8 w-8 text-cyan-200" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">{gameName}</p>

          {status !== "error" ? (
            <div className="mt-8 flex items-center justify-center gap-3 text-cyan-200">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">
                {status === "starting" ? "Dang tao phien choi..." : "Dang tim game cua lesson..."}
              </span>
            </div>
          ) : (
            <div className="mt-7 space-y-4">
              <p className="text-sm text-red-200">{error}</p>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => loadAndStart(true)}
                  className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Thu lai
                </Button>
                {game && (
                  <Button
                    variant="outline"
                    onClick={() => startGame(game).catch((err) => {
                      setError(err?.message || "Khong the bat dau game")
                      setStatus("error")
                    })}
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Chay game
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
