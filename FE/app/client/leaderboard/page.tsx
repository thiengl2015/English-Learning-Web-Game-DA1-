"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Heart, Trophy, ChevronUp, ChevronDown, Crown, Loader2 } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GalaxyBackground } from "@/components/galaxy3-background"

// --- CONFIG API ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface LeaderboardUser {
  id: string
  name: string
  avatar: string
  weeklyXP: number
  rank: number
  league: string
}

interface UserRank {
  rank: number
  totalUsers: number
  weeklyXP: number
  league: string
}

const LEAGUES = {
  Bronze: { color: "from-amber-700 to-amber-900", icon: "🥉", minXP: 0 },
  Silver: { color: "from-gray-300 to-gray-500", icon: "🥈", minXP: 500 },
  Gold: { color: "from-yellow-400 to-yellow-600", icon: "🥇", minXP: 1500 },
  Diamond: { color: "from-cyan-300 to-blue-500", icon: "💎", minXP: 3000 },
}

export default function LeaderboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardUser[]>([])
  const [topThreeLastWeek, setTopThreeLastWeek] = useState<LeaderboardUser[]>([])
  const [userRank, setUserRank] = useState<UserRank | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string } | null>(null)
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Vui lòng đăng nhập để xem bảng xếp hạng")
          setIsLoading(false)
          return
        }

        // Fetch user profile
        const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: getAuthHeaders(),
        })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setCurrentUser({
            id: profileData.data.id,
            name: profileData.data.display_name || profileData.data.username || "User",
            avatar: profileData.data.avatar_url
              ? `${API_BASE_URL}${profileData.data.avatar_url}`
              : "/placeholder.svg",
          })
        }

        // Fetch full leaderboard data
        const [leaderboardRes, userRankRes, topThreeRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/leaderboard?limit=50`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${API_BASE_URL}/api/leaderboard/me`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${API_BASE_URL}/api/leaderboard/top-three`, {
            headers: getAuthHeaders(),
          }),
        ])

        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json()
          setWeeklyLeaderboard(leaderboardData.data || [])
        }

        if (userRankRes.ok) {
          const userRankData = await userRankRes.json()
          setUserRank(userRankData.data || null)
        }

        if (topThreeRes.ok) {
          const topThreeData = await topThreeRes.json()
          setTopThreeLastWeek(topThreeData.data || [])
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard data:", err)
        setError("Không thể tải dữ liệu bảng xếp hạng")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const toggleLike = (userId: string) => {
    setLikedUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const renderPodium = () => {
    const top3 = topThreeLastWeek.length >= 3 ? topThreeLastWeek : [
      { id: "empty-1", name: "???", avatar: "/placeholder.svg", weeklyXP: 0, rank: 1, league: "Gold" },
      { id: "empty-2", name: "???", avatar: "/placeholder.svg", weeklyXP: 0, rank: 2, league: "Gold" },
      { id: "empty-3", name: "???", avatar: "/placeholder.svg", weeklyXP: 0, rank: 3, league: "Gold" },
    ]

    return (
      <div className="relative w-full max-w-2xl mx-auto mb-8">
        <div className="flex items-end justify-center gap-4 px-4">
          {/* Second Place */}
          <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0.2s" }}>
            <div className="relative mb-3">
              <Avatar className="w-20 h-20 border-4 border-gray-300 shadow-xl">
                <AvatarImage src={top3[1]?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-500 text-white text-xl font-bold">
                  2
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 text-3xl">🥈</div>
            </div>
            <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-t-2xl w-full h-32 flex flex-col items-center justify-center shadow-2xl">
              <Crown className="w-6 h-6 text-white mb-1" />
              <p className="text-white font-bold text-sm truncate max-w-full px-2">{top3[1]?.name || "???"}</p>
              <p className="text-gray-100 text-xs">{top3[1]?.weeklyXP || 0} XP</p>
            </div>
          </div>

          {/* First Place */}
          <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0s" }}>
            <div className="relative mb-3">
              <Avatar className="w-24 h-24 border-4 border-yellow-400 shadow-2xl">
                <AvatarImage src={top3[0]?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-2xl font-bold">
                  1
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-3 -right-2 text-4xl animate-bounce">👑</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-2xl w-full h-40 flex flex-col items-center justify-center shadow-2xl">
              <Trophy className="w-8 h-8 text-white mb-2" />
              <p className="text-white font-bold text-base truncate max-w-full px-2">{top3[0]?.name || "???"}</p>
              <p className="text-yellow-100 text-sm font-semibold">{top3[0]?.weeklyXP || 0} XP</p>
            </div>
          </div>

          {/* Third Place */}
          <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0.4s" }}>
            <div className="relative mb-3">
              <Avatar className="w-20 h-20 border-4 border-amber-700 shadow-xl">
                <AvatarImage src={top3[2]?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-900 text-white text-xl font-bold">
                  3
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 text-3xl">🥉</div>
            </div>
            <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-t-2xl w-full h-28 flex flex-col items-center justify-center shadow-2xl">
              <Crown className="w-5 h-5 text-white mb-1" />
              <p className="text-white font-bold text-sm truncate max-w-full px-2">{top3[2]?.name || "???"}</p>
              <p className="text-amber-100 text-xs">{top3[2]?.weeklyXP || 0} XP</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderLeaderboardRow = (user: LeaderboardUser, isCurrentUser: boolean) => {
    const isLiked = likedUsers.has(user.id)
    const isTopFive = user.rank <= 5
    const isBottomThree = weeklyLeaderboard.length > 5 && user.rank >= weeklyLeaderboard.length - 2

    return (
      <div
        key={user.id}
        className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
          isCurrentUser
            ? "bg-cyan-500/20 border-2 border-cyan-400 shadow-lg shadow-cyan-400/20 scale-105"
            : "bg-white/10 backdrop-blur-md hover:bg-white/15"
        }`}
      >
        {/* Rank */}
        <div className="flex items-center justify-center w-12">
          {user.rank <= 3 && (
            <div className="flex items-center gap-1">
              {user.rank === 1 && <span className="text-2xl">👑</span>}
              {user.rank === 2 && <span className="text-2xl">🥈</span>}
              {user.rank === 3 && <span className="text-2xl">🥉</span>}
            </div>
          )}
          {user.rank > 3 && <span className="text-lg font-bold text-white">{user.rank}</span>}
        </div>

        {/* Avatar */}
        <Avatar className={`w-12 h-12 ${isCurrentUser ? "border-2 border-cyan-400" : "border border-white/30"}`}>
          <AvatarImage src={user.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-bold">
            {user.name ? user.name[0] : "?"}
          </AvatarFallback>
        </Avatar>

        {/* Name and promotion/demotion indicator */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-bold truncate ${isCurrentUser ? "text-cyan-300 text-lg" : "text-white"}`}>
              {user.name}
            </p>
            {isTopFive && !isCurrentUser && <ChevronUp className="w-5 h-5 text-green-400 animate-bounce" />}
            {isBottomThree && <ChevronDown className="w-5 h-5 text-red-400 animate-bounce" />}
          </div>
          {isCurrentUser && <p className="text-cyan-400 text-xs">You</p>}
        </div>

        {/* Weekly XP */}
        <div className="text-right mr-4">
          <p className={`font-bold ${isCurrentUser ? "text-cyan-300 text-lg" : "text-white"}`}>{user.weeklyXP}</p>
          <p className="text-gray-400 text-xs">XP</p>
        </div>

        {/* Like button */}
        <Button
          size="icon"
          variant="ghost"
          className={`transition-all duration-300 ${
            isLiked ? "bg-pink-500/30 hover:bg-pink-500/40 text-pink-400" : "bg-white/5 hover:bg-white/10 text-gray-400"
          }`}
          onClick={() => toggleLike(user.id)}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-pink-400" : ""}`} />
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <GalaxyBackground />
        <div className="flex flex-col items-center gap-4 z-10">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-white text-lg">Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <GalaxyBackground />
        <div className="flex flex-col items-center gap-4 z-10 text-center px-4">
          <p className="text-red-400 text-lg">{error}</p>
          <Link href="/login">
            <Button className="bg-cyan-500 hover:bg-cyan-600">Đăng nhập</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentLeague = userRank?.league || "Bronze"

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GalaxyBackground />

      {/* Back Button */}
      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header - Centered */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          <p className="text-cyan-300">Compete and climb the ranks!</p>
        </div>

        {/* Last Week's Top 3 Banner */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-center text-white mb-6">Last Week's Champions</h2>
          {renderPodium()}
        </div>

        {/* Current League Badge */}
        <div className="flex justify-center mb-6">
          <div
            className={`bg-gradient-to-r ${
              LEAGUES[currentLeague as keyof typeof LEAGUES]?.color || LEAGUES.Bronze.color
            } px-8 py-3 rounded-full shadow-2xl`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {LEAGUES[currentLeague as keyof typeof LEAGUES]?.icon || "🥉"}
              </span>
              <div>
                <p className="text-white text-center font-bold text-lg">{currentLeague} League</p>
                {userRank && (
                  <p className="text-white/80 text-center text-xs">
                    Hạng #{userRank.rank} / {userRank.totalUsers}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* League Rankings */}
        <div className="space-y-3 max-w-3xl mx-auto">
          {weeklyLeaderboard.map((user) => {
            const isCurrentUser = currentUser?.id === user.id
            return renderLeaderboardRow(user, isCurrentUser)
          })}

          {weeklyLeaderboard.length === 0 && (
            <div className="text-center text-white/60 py-8">
              <p>Chưa có dữ liệu bảng xếp hạng</p>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="mt-8 text-center text-white/60 text-sm max-w-2xl mx-auto">
          <p>Rankings reset every Monday at 00:00. Keep learning to climb higher!</p>
        </div>
      </div>
    </div>
  )
}
