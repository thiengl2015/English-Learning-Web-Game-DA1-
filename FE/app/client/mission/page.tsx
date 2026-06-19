"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Rocket, Trophy, CheckCircle2, Gift, Lock, Target, Loader2 } from "lucide-react"
import Link from "next/link"
import { CosmicBackground } from "@/components/cosmic-background"
import Image from "next/image"

type TaskStatus = "locked" | "in-progress" | "completed" | "claimed"

interface Mission {
  id: string
  code: string
  type: "daily" | "achievement"
  title: string
  description: string
  progress: number
  target: number
  reward: number
  status: TaskStatus
  icon: string
  badge?: string
  chainCode?: string
  medal?: string
}

interface UserProgress {
  streak_days?: number
  words_learned?: number
  units_completed?: number
  lessons_completed?: number
  total_study_minutes?: number
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "")

const AUTH_ERROR_MESSAGE = "Phien dang nhap da het han. Vui long dang nhap lai de xem nhiem vu."
const LOAD_ERROR_MESSAGE = "Khong the tai du lieu nhiem vu."
const CLAIM_ERROR_MESSAGE = "Khong the nhan thuong"

const readApiMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.clone().json()
    return data?.message || fallback
  } catch {
    return fallback
  }
}

const normalizeStatus = (status?: string): TaskStatus => {
  if (status === "in_progress") return "in-progress"
  if (status === "locked" || status === "completed" || status === "claimed" || status === "in-progress") {
    return status
  }
  return "in-progress"
}

const normalizeMission = (mission: Mission): Mission => ({
  ...mission,
  status: normalizeStatus(mission.status),
  progress: Number(mission.progress || 0),
  target: Number(mission.target || 1),
  reward: Number(mission.reward || 0),
})

export default function AssignmentPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "achievements">("daily")
  const [dailyTasks, setDailyTasks] = useState<Mission[]>([])
  const [achievements, setAchievements] = useState<Mission[]>([])
  const [streak, setStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const getAuthHeaders = (token = localStorage.getItem("token") || "") => {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  const fetchMissionData = async (silent = false) => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Vui lòng đăng nhập để xem nhiệm vụ")
      setIsLoading(false)
      return
    }

    if (!silent) {
      setIsLoading(true)
    }
    setError(null)

    try {
      const headers = getAuthHeaders(token)
      const [dailyRes, achievementRes, progressRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/missions?type=daily`, { headers }),
        fetch(`${API_BASE_URL}/api/missions?type=achievement`, { headers }),
        fetch(`${API_BASE_URL}/api/users/progress`, { headers }),
      ])

      if ([dailyRes, achievementRes, progressRes].some((response) => response.status === 401)) {
        localStorage.removeItem("token")
        throw new Error(AUTH_ERROR_MESSAGE)
      }

      if (!dailyRes.ok || !achievementRes.ok) {
        throw new Error(
          !dailyRes.ok
            ? await readApiMessage(dailyRes, LOAD_ERROR_MESSAGE)
            : await readApiMessage(achievementRes, LOAD_ERROR_MESSAGE),
        )
      }

      const [dailyJson, achievementJson, progressJson] = await Promise.all([
        dailyRes.json(),
        achievementRes.json(),
        progressRes.ok ? progressRes.json() : Promise.resolve({ data: null }),
      ])

      if (dailyJson.success === false || achievementJson.success === false) {
        throw new Error(dailyJson.message || achievementJson.message || LOAD_ERROR_MESSAGE)
      }

      const dailyMissions = Array.isArray(dailyJson.data) ? dailyJson.data : []
      const achievementMissions = Array.isArray(achievementJson.data) ? achievementJson.data : []

      setDailyTasks(dailyMissions.map(normalizeMission))
      setAchievements(achievementMissions.map(normalizeMission))

      const progress: UserProgress | null = progressJson.data
      setStreak(progress?.streak_days || 0)
    } catch (err) {
      console.error("Failed to fetch missions:", err)
      setError(err instanceof Error ? err.message : LOAD_ERROR_MESSAGE)
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void fetchMissionData()
  }, [])

  const handleClaim = async (taskId: string, isDaily: boolean) => {
    setClaimingId(taskId)

    try {
      const res = await fetch(`${API_BASE_URL}/api/missions/${taskId}/claim`, {
        method: "POST",
        headers: getAuthHeaders(),
      })

      if (res.status === 401) {
        localStorage.removeItem("token")
        setError(AUTH_ERROR_MESSAGE)
        return
      }

      const data = await res.json().catch(() => null)
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || CLAIM_ERROR_MESSAGE)
      }

      if (isDaily) {
        setDailyTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, status: "claimed" as TaskStatus } : task)),
        )
      } else {
        setAchievements((prev) =>
          prev.map((achievement) =>
            achievement.id === taskId ? { ...achievement, status: "claimed" as TaskStatus } : achievement,
          ),
        )
      }

      await fetchMissionData(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Đã xảy ra lỗi khi nhận thưởng")
    } finally {
      setClaimingId(null)
    }
  }

  const completedDailyTasks = dailyTasks.filter((t) => t.status === "completed" || t.status === "claimed").length
  const dailyProgress = dailyTasks.length > 0 ? (completedDailyTasks / dailyTasks.length) * 100 : 0

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <CosmicBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-300 animate-spin" />
          <p className="text-white font-semibold">Đang tải nhiệm vụ...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <CosmicBackground />
        <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
          <p className="text-red-300 font-semibold">{error}</p>
          <Link href="/sign-in">
            <Button className="bg-cyan-300 hover:bg-cyan-400 text-purple-900 font-bold">Đăng nhập</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      {/* Back Button */}
      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* Header with Tabs and Streak */}
        <div className="flex items-center justify-between mb-8">
          {/* Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("daily")}
              className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === "daily"
                  ? "bg-cyan-400 text-purple-900 shadow-lg shadow-cyan-400/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span>Daily Missions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === "achievements"
                  ? "bg-yellow-400 text-purple-900 shadow-lg shadow-yellow-400/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span>Achievements</span>
              </div>
            </button>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-orange-400/20 to-red-500/20 backdrop-blur-md border border-orange-400/30 rounded-2xl px-6 py-3 shadow-lg">
            <Rocket className="w-8 h-8 text-orange-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-orange-200 text-xs font-semibold">STREAK</span>
              <span className="text-white text-2xl font-bold">{streak} 🔥</span>
            </div>
          </div>
        </div>

        {/* Daily Missions Tab */}
        {activeTab === "daily" && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-lg">Daily Progress</h3>
                <span className="text-cyan-300 font-bold">
                  {completedDailyTasks}/{dailyTasks.length} Completed
                </span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-300 to-cyan-400 transition-all duration-300"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {[...dailyTasks]
                .sort((a, b) => {
                  // Sort: completed/claimed at bottom, in-progress at top
                  if (a.status === "claimed" && b.status !== "claimed") return 1
                  if (a.status !== "claimed" && b.status === "claimed") return -1
                  return 0
                })
                .map((task) => {
                  const isCompleted = task.progress >= task.target
                  const canClaim = isCompleted && task.status === "completed"
                  const isClaimed = task.status === "claimed"

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-md border rounded-xl p-4 transition-all duration-300 ${
                        canClaim ? "shadow-lg shadow-cyan-400/50 border-cyan-400/80 animate-pulse" : "border-white/30"
                      } ${isClaimed ? "opacity-60" : ""}`}
                    >
                      {/* Icon */}
                      <div className="text-4xl">{task.icon}</div>

                      {/* Content */}
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg mb-1">{task.title}</h4>
                        <p className="text-white/70 text-sm mb-2">{task.description}</p>
                        {task.code === "daily-goal" && (
                          <div className="mt-2">
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-300 to-cyan-400 transition-all duration-300"
                                style={{ width: `${Math.min((task.progress / task.target) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-cyan-300 text-xs mt-1 block">
                              {task.progress}/{task.target} phút
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Reward and Button */}
                      <div className="flex flex-col items-center gap-2 min-w-[100px]">
                        <div className="flex items-center gap-1 text-yellow-400 font-bold">
                          <Image src="/crystal-currency.png" alt="Reward" width={20} height={20} className="w-5 h-5" />
                          <span>+{task.reward}</span>
                        </div>
                        {isClaimed ? (
                          <div className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            Claimed
                          </div>
                        ) : canClaim ? (
                          <Button
                            onClick={() => handleClaim(task.id, true)}
                            disabled={claimingId === task.id}
                            className="bg-cyan-300 hover:bg-cyan-400 text-purple-700 font-bold shadow-lg shadow-cyan-500/50 animate-pulse"
                          >
                            {claimingId === task.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Gift className="w-4 h-4 mr-1" />
                                Claim
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="text-white/50 text-sm font-semibold px-4 py-2">
                            {task.progress}/{task.target}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...achievements]
                .sort((a, b) => {
                  // Priority 1: In-progress (unlocked but not completed)
                  const aInProgress = a.status === "in-progress"
                  const bInProgress = b.status === "in-progress"
                  if (aInProgress && !bInProgress) return -1
                  if (!aInProgress && bInProgress) return 1

                  // Priority 2: Locked
                  const aLocked = a.status === "locked"
                  const bLocked = b.status === "locked"
                  if (aLocked && !bLocked) return -1
                  if (!aLocked && bLocked) return 1

                  // Priority 3: Completed/Claimed at bottom
                  const aCompleted = a.status === "completed" || a.status === "claimed"
                  const bCompleted = b.status === "completed" || b.status === "claimed"
                  if (aCompleted && !bCompleted) return 1
                  if (!aCompleted && bCompleted) return -1

                  return 0
                })
                .map((achievement) => {
                  const isCompleted = achievement.progress >= achievement.target
                  const canClaim = isCompleted && achievement.status === "completed"
                  const isClaimed = achievement.status === "claimed"
                  const isLocked = achievement.status === "locked"

                  return (
                    <div
                      key={achievement.id}
                      className={`flex flex-col bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-md border rounded-xl p-6 transition-all duration-300 ${
                        isLocked
                          ? "border-gray-500/40 opacity-50"
                          : canClaim
                            ? "border-cyan-400/80 shadow-lg shadow-cyan-400/50 animate-pulse"
                            : "border-cyan-400/40"
                      } ${isClaimed ? "opacity-70" : ""}`}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-5xl relative">
                          {achievement.icon}
                          {isClaimed && (
                            <div className="absolute -top-2 -right-2 text-3xl animate-bounce">
                              {achievement.medal || "🏆"}
                            </div>
                          )}
                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                              <Lock className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-xl mb-1">{achievement.title}</h4>
                          <p className="text-white/70 text-sm">{achievement.description}</p>
                        </div>
                        {isClaimed && <Trophy className="w-8 h-8 text-yellow-400" />}
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-300 to-cyan-400 transition-all duration-300"
                            style={{ width: `${isLocked ? 0 : Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-cyan-300 text-sm mt-2 block">
                          {isLocked ? "Locked" : `${achievement.progress}/${achievement.target}`}
                        </span>
                      </div>

                      {/* Reward and Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                          <Image src="/crystal-currency.png" alt="Reward" width={24} height={24} className="w-6 h-6" />
                          <span>+{achievement.reward}</span>
                        </div>
                        {isClaimed ? (
                          <div className="flex items-center gap-2 text-green-400 font-semibold">
                            <CheckCircle2 className="w-5 h-5" />
                            Unlocked
                          </div>
                        ) : isLocked ? (
                          <div className="flex items-center gap-2 text-gray-400 font-semibold">
                            <Lock className="w-4 h-4" />
                            Locked
                          </div>
                        ) : canClaim ? (
                          <Button
                            onClick={() => handleClaim(achievement.id, false)}
                            disabled={claimingId === achievement.id}
                            className="bg-cyan-300 hover:bg-cyan-400 text-gray-900 font-bold shadow-lg shadow-cyan-500/50 animate-pulse"
                          >
                            {claimingId === achievement.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Trophy className="w-4 h-4 mr-1" />
                                Unlock
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="text-white/50 font-semibold">In Progress</div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
