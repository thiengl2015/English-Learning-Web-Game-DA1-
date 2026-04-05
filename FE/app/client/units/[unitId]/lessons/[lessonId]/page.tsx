'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Star, Clock, Zap, RotateCcw, Play, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

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
  unit?: { id: number; title: string; icon: string }
  lesson?: { id: number; title: string; type: string }
}

const GAME_METADATA: Record<string, {
  name: string
  icon: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}> = {
  "galaxy-match": {
    name: "Galaxy Match",
    icon: "🌌",
    description: "Ghép từ vựng với nghĩa tiếng Việt",
    color: "text-cyan-300",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-400/50",
  },
  "planetary-order": {
    name: "Planetary Order",
    icon: "🪐",
    description: "Sắp xếp từ để tạo câu đúng",
    color: "text-purple-300",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-400/50",
  },
  "rescue-mission": {
    name: "Rescue Mission",
    icon: "🚀",
    description: "Nghe và điền từ vào chỗ trống",
    color: "text-orange-300",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-400/50",
  },
  "signal-check": {
    name: "Signal Check",
    icon: "📡",
    description: "Nghe và chọn từ đúng",
    color: "text-green-300",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-400/50",
  },
}

const DIFFICULTY_COLORS = {
  easy: "text-green-400 bg-green-400/20 border-green-400/50",
  medium: "text-yellow-400 bg-yellow-400/20 border-yellow-400/50",
  hard: "text-red-400 bg-red-400/20 border-red-400/50",
}

export default function LessonGamePage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.unitId as string
  const lessonId = params.lessonId as string

  const [games, setGames] = useState<GameConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    const fetchGameConfigs = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/sign-in")
        return
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/games/lesson/${lessonId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const json = await response.json()

        if (json.success && json.data) {
          setGames(json.data)
        } else {
          setError(json.message || "Không thể tải danh sách game")
        }
      } catch (err) {
        setError("Lỗi kết nối server")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGameConfigs()
  }, [lessonId, router])

  const handleStartGame = async (gameConfigId: number, gameType: string) => {
    setSelectedGameId(gameConfigId)
    setIsStarting(true)

    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/sign-in")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/games/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game_config_id: gameConfigId }),
      })

      const json = await response.json()

      if (json.success && json.data) {
        const { session_id, game_type } = json.data
        const targetGameType = gameType || game_type
        router.push(
          `/client/games/${targetGameType}?sessionId=${session_id}&unitId=${unitId}&lessonId=${lessonId}&gameConfigId=${gameConfigId}`
        )
      } else {
        alert(json.message || "Không thể bắt đầu game")
        setIsStarting(false)
        setSelectedGameId(null)
      }
    } catch (err) {
      alert("Lỗi kết nối khi bắt đầu game")
      setIsStarting(false)
      setSelectedGameId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
          <p className="text-xl font-medium">Đang tải game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-xl">{error}</p>
          <Button onClick={() => router.back()} className="bg-cyan-500 hover:bg-cyan-600 text-white">
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const selectedGame = games.find((g) => g.id === selectedGameId)
  const meta = selectedGame ? GAME_METADATA[selectedGame.game_type] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Background stars */}
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
        <span className="text-white font-medium">Quay lại</span>
      </Link>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Chọn Game Chinh Phục
          </h1>
          <p className="text-gray-400 text-lg">
            {games.length} games có sẵn cho bài học này
          </p>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">Không có game nào cho bài học này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => {
              const info = GAME_METADATA[game.game_type] || {
                name: game.game_type,
                icon: "🎮",
                description: "Game",
                color: "text-white",
                bgColor: "bg-purple-500/20",
                borderColor: "border-purple-400/50",
              }

              return (
                <div
                  key={game.id}
                  className={`relative rounded-2xl p-6 border-2 transition-all duration-300 backdrop-blur-md
                    ${info.bgColor} ${info.borderColor}
                    ${selectedGameId === game.id ? "ring-4 ring-cyan-400 scale-[1.02]" : "hover:scale-[1.02] hover:ring-2 hover:ring-cyan-400/50"}
                  `}
                  onClick={() => setSelectedGameId(game.id)}
                >
                  {/* Best score badge */}
                  {game.user_best && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-400/50">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-sm">{game.user_best.score}%</span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`text-5xl ${info.color}`}>{info.icon}</div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${info.color} mb-1`}>{info.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{info.description}</p>

                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white text-sm font-medium">{game.questions_count} câu</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span className="text-white text-sm font-medium">{game.time_limit}s</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg">
                          <Zap className="w-4 h-4 text-orange-400" />
                          <span className="text-white text-sm font-medium">{game.xp_reward} XP</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${DIFFICULTY_COLORS[game.difficulty]}`}>
                          {game.difficulty === "easy" && "Dễ"}
                          {game.difficulty === "medium" && "Trung bình"}
                          {game.difficulty === "hard" && "Khó"}
                        </div>
                      </div>

                      {game.passing_score && (
                        <p className="text-gray-500 text-xs mt-3">
                          Cần đạt {game.passing_score}% để vượt qua
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedGameId === game.id && (
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartGame(game.id, game.game_type)
                        }}
                        disabled={isStarting}
                        className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-purple-900 font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {isStarting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Đang bắt đầu...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 fill-current" />
                            <span>Bắt đầu chơi</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {games.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                if (games[0]) {
                  handleStartGame(games[0].id, games[0].game_type)
                }
              }}
              disabled={isStarting}
              className="px-8 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:bg-gray-600 text-purple-900 font-bold text-xl transition-all duration-300 flex items-center gap-3 shadow-lg shadow-cyan-400/30"
            >
              <Play className="w-6 h-6 fill-current" />
              Chơi game đầu tiên
            </button>
          </div>
        )}
      </div>
    </div>
  )
}