"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Rocket, Trophy, CheckCircle2, Gift, Lock, Target } from "lucide-react"
import Link from "next/link"
import { CosmicBackground } from "@/components/cosmic-background"
import Image from "next/image"

type TaskStatus = "locked" | "in-progress" | "completed" | "claimed"

interface DailyTask {
  id: string
  title: string
  description: string
  progress: number
  target: number
  reward: number
  status: TaskStatus
  icon: string
}

interface Achievement {
  id: string
  title: string
  description: string
  progress: number
  target: number
  reward: number
  status: TaskStatus
  icon: string
  badge: string
  chain?: string // ID of previous achievement that must be completed first
  medal: string // Medal emoji for completed achievements
}

export default function AssignmentPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "achievements">("daily")
  const [streak, setStreak] = useState(5)
  const [studyTimeToday, setStudyTimeToday] = useState(0) // in seconds
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(15)

  const userStats = {
    unitsCompleted: 3,
    wordsLearned: 45,
    streakDays: 5,
    totalStudyMinutes: 35,
    communityRank: 5,
  }

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    {
      id: "login",
      title: "Check-in",
      description: "Đăng nhập vào ứng dụng hàng ngày",
      progress: 1,
      target: 1,
      reward: 10,
      status: "completed",
      icon: "🌟",
    },
    {
      id: "flashcard",
      title: "Ôn tập",
      description: "Hoàn thành 1 bộ flashcard",
      progress: 0,
      target: 1,
      reward: 20,
      status: "in-progress",
      icon: "🎴",
    },
    {
      id: "new-level",
      title: "Chinh phục",
      description: "Chinh phục 1 level mới",
      progress: 0,
      target: 1,
      reward: 10,
      status: "in-progress",
      icon: "🎯",
    },
    {
      id: "new-lesson",
      title: "Chinh phục",
      description: "Hoàn thành 1 bài học mới",
      progress: 0,
      target: 1,
      reward: 25,
      status: "in-progress",
      icon: "📚",
    },
    {
      id: "daily-goal",
      title: "Mục tiêu hàng ngày",
      description: `Học ${dailyGoalMinutes} phút mỗi ngày`,
      progress: Math.floor(studyTimeToday / 60),
      target: dailyGoalMinutes,
      reward: 50,
      status: "in-progress",
      icon: "⏰",
    },
  ])

  const [achievements, setAchievements] = useState<Achievement[]>([
    // Unit Completion Chain
    {
      id: "unit-5",
      title: "Người mở đường",
      description: "Hoàn thành 5 Units",
      progress: userStats.unitsCompleted,
      target: 5,
      reward: 100,
      status: userStats.unitsCompleted >= 5 ? "completed" : "in-progress",
      icon: "🚀",
      badge: "/badges/pioneer.png",
      medal: "🥉",
    },
    {
      id: "unit-10",
      title: "Nhà thám hiểm",
      description: "Hoàn thành 10 Units",
      progress: userStats.unitsCompleted,
      target: 10,
      reward: 250,
      status: userStats.unitsCompleted >= 5 ? (userStats.unitsCompleted >= 10 ? "completed" : "in-progress") : "locked",
      icon: "🌍",
      badge: "/badges/explorer.png",
      chain: "unit-5",
      medal: "🥈",
    },
    {
      id: "unit-20",
      title: "Bậc thầy vũ trụ",
      description: "Hoàn thành 20 Units",
      progress: userStats.unitsCompleted,
      target: 20,
      reward: 500,
      status:
        userStats.unitsCompleted >= 10 ? (userStats.unitsCompleted >= 20 ? "completed" : "in-progress") : "locked",
      icon: "👑",
      badge: "/badges/master.png",
      chain: "unit-10",
      medal: "🥇",
    },

    // Vocabulary Learning Chain
    {
      id: "words-50",
      title: "Người học chữ",
      description: "Học xong 50 từ vựng",
      progress: userStats.wordsLearned,
      target: 50,
      reward: 80,
      status: userStats.wordsLearned >= 50 ? "completed" : "in-progress",
      icon: "📝",
      badge: "/badges/beginner.png",
      medal: "🥉",
    },
    {
      id: "words-100",
      title: "Thạo ngôn ngữ",
      description: "Học xong 100 từ vựng",
      progress: userStats.wordsLearned,
      target: 100,
      reward: 150,
      status: userStats.wordsLearned >= 50 ? (userStats.wordsLearned >= 100 ? "completed" : "in-progress") : "locked",
      icon: "📖",
      badge: "/badges/linguist.png",
      chain: "words-50",
      medal: "🥈",
    },
    {
      id: "words-500",
      title: "Bách khoa toàn thư",
      description: "Học xong 500 từ vựng",
      progress: userStats.wordsLearned,
      target: 500,
      reward: 800,
      status: userStats.wordsLearned >= 100 ? (userStats.wordsLearned >= 500 ? "completed" : "in-progress") : "locked",
      icon: "📚",
      badge: "/badges/encyclopedia.png",
      chain: "words-100",
      medal: "🥇",
    },

    // Streak Chain
    {
      id: "streak-10",
      title: "Kiên trì",
      description: "Đạt chuỗi 10 ngày liên tiếp",
      progress: userStats.streakDays,
      target: 10,
      reward: 200,
      status: userStats.streakDays >= 10 ? "completed" : "in-progress",
      icon: "🔥",
      badge: "/badges/persistent.png",
      medal: "🥉",
    },
    {
      id: "streak-30",
      title: "Nghị lực sắt đá",
      description: "Đạt chuỗi 30 ngày liên tiếp",
      progress: userStats.streakDays,
      target: 30,
      reward: 400,
      status: userStats.streakDays >= 10 ? (userStats.streakDays >= 30 ? "completed" : "in-progress") : "locked",
      icon: "💪",
      badge: "/badges/iron-will.png",
      chain: "streak-10",
      medal: "🥈",
    },
    {
      id: "streak-50",
      title: "Huyền thoại",
      description: "Đạt chuỗi 50 ngày liên tiếp",
      progress: userStats.streakDays,
      target: 50,
      reward: 700,
      status: userStats.streakDays >= 30 ? (userStats.streakDays >= 50 ? "completed" : "in-progress") : "locked",
      icon: "⚡",
      badge: "/badges/legend.png",
      chain: "streak-30",
      medal: "🥇",
    },
    {
      id: "streak-100",
      title: "Bất tử",
      description: "Đạt chuỗi 100 ngày liên tiếp",
      progress: userStats.streakDays,
      target: 100,
      reward: 1500,
      status: userStats.streakDays >= 50 ? (userStats.streakDays >= 100 ? "completed" : "in-progress") : "locked",
      icon: "💎",
      badge: "/badges/immortal.png",
      chain: "streak-50",
      medal: "👑",
    },

    // Study Time Chain
    {
      id: "study-60",
      title: "Học giả",
      description: "Tổng thời gian học 60 phút",
      progress: userStats.totalStudyMinutes,
      target: 60,
      reward: 80,
      status: userStats.totalStudyMinutes >= 60 ? "completed" : "in-progress",
      icon: "⏱️",
      badge: "/badges/scholar.png",
      medal: "🥉",
    },
    {
      id: "study-120",
      title: "Chuyên gia",
      description: "Tổng thời gian học 120 phút",
      progress: userStats.totalStudyMinutes,
      target: 120,
      reward: 150,
      status:
        userStats.totalStudyMinutes >= 60
          ? userStats.totalStudyMinutes >= 120
            ? "completed"
            : "in-progress"
          : "locked",
      icon: "🎓",
      badge: "/badges/expert.png",
      chain: "study-60",
      medal: "🥈",
    },
    {
      id: "study-360",
      title: "Tiến sĩ",
      description: "Tổng thời gian học 360 phút (6 giờ)",
      progress: userStats.totalStudyMinutes,
      target: 360,
      reward: 400,
      status:
        userStats.totalStudyMinutes >= 120
          ? userStats.totalStudyMinutes >= 360
            ? "completed"
            : "in-progress"
          : "locked",
      icon: "🧠",
      badge: "/badges/doctor.png",
      chain: "study-120",
      medal: "🥇",
    },
    {
      id: "study-600",
      title: "Giáo sư vĩ đại",
      description: "Tổng thời gian học 600 phút (10 giờ)",
      progress: userStats.totalStudyMinutes,
      target: 600,
      reward: 1000,
      status:
        userStats.totalStudyMinutes >= 360
          ? userStats.totalStudyMinutes >= 600
            ? "completed"
            : "in-progress"
          : "locked",
      icon: "🏆",
      badge: "/badges/professor.png",
      chain: "study-360",
      medal: "👑",
    },

    // Special Achievement
    {
      id: "rank-1",
      title: "Vua của thiên hà",
      description: "Xếp hạng #1 trong cộng đồng",
      progress: userStats.communityRank === 1 ? 1 : 0,
      target: 1,
      reward: 2000,
      status: userStats.communityRank === 1 ? "completed" : "in-progress",
      icon: "🌟",
      badge: "/badges/king.png",
      medal: "👑",
    },
  ])

  const handleClaim = (taskId: string, isDaily: boolean) => {
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
  }

  const completedDailyTasks = dailyTasks.filter((t) => t.status === "completed" || t.status === "claimed").length
  const dailyProgress = (completedDailyTasks / dailyTasks.length) * 100

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
              {dailyTasks
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
                        {task.id === "daily-goal" && (
                          <div className="mt-2">
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-300 to-cyan-400 transition-all duration-300"
                                style={{ width: `${(task.progress / task.target) * 100}%` }}
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
                            className="bg-cyan-300 hover:bg-cyan-400 text-purple-700 font-bold shadow-lg shadow-cyan-500/50 animate-pulse"
                          >
                            <Gift className="w-4 h-4 mr-1" />
                            Claim
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
              {achievements
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
                            <div className="absolute -top-2 -right-2 text-3xl animate-bounce">{achievement.medal}</div>
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
                            style={{ width: `${isLocked ? 0 : (achievement.progress / achievement.target) * 100}%` }}
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
                            className="bg-cyan-300 hover:bg-cyan-400 text-gray-900 font-bold shadow-lg shadow-cyan-500/50 animate-pulse"
                          >
                            <Trophy className="w-4 h-4 mr-1" />
                            Unlock
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
