"use client"

import { useState } from "react"
import { ArrowLeft, Heart, Trophy, ChevronUp, ChevronDown, Crown } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GalaxyBackground } from "@/components/galaxy3-background"

// Mock data for demonstration
const CURRENT_USER = {
  id: "current-user",
  name: "Odixee",
  avatar: "/placeholder.svg",
  weeklyXP: 2450,
  rank: 11,
  league: "Gold",
}

const LEAGUES = {
  Bronze: { color: "from-amber-700 to-amber-900", icon: "🥉", minXP: 0 },
  Silver: { color: "from-gray-300 to-gray-500", icon: "🥈", minXP: 500 },
  Gold: { color: "from-yellow-400 to-yellow-600", icon: "🥇", minXP: 1500 },
  Diamond: { color: "from-cyan-300 to-blue-500", icon: "💎", minXP: 3000 },
}

const LAST_WEEK_TOP_3 = [
  {
    id: "1",
    name: "StarLearner",
    avatar: "/placeholder.svg",
    weeklyXP: 5240,
    rank: 1,
    league: "Gold",
  },
  {
    id: "2",
    name: "CosmicMind",
    avatar: "/placeholder.svg",
    weeklyXP: 4890,
    rank: 2,
    league: "Gold",
  },
  {
    id: "3",
    name: "GalaxySeeker",
    avatar: "/placeholder.svg",
    weeklyXP: 4560,
    rank: 3,
    league: "Gold",
  },
]

const CURRENT_WEEK_LEAGUE = [
  { id: "l1", name: "QuantumQuest", avatar: "/placeholder.svg", weeklyXP: 3850, rank: 1, league: "Gold" },
  { id: "l2", name: "NovaStudent", avatar: "/placeholder.svg", weeklyXP: 3620, rank: 2, league: "Gold" },
  { id: "l3", name: "AstroAce", avatar: "/placeholder.svg", weeklyXP: 3450, rank: 3, league: "Gold" },
  { id: "l4", name: "StellarMind", avatar: "/placeholder.svg", weeklyXP: 3220, rank: 4, league: "Gold" },
  { id: "l5", name: "SpaceVoyager", avatar: "/placeholder.svg", weeklyXP: 3100, rank: 5, league: "Gold" },
  { id: "l6", name: "CelestialPro", avatar: "/placeholder.svg", weeklyXP: 2980, rank: 6, league: "Gold" },
  { id: "l7", name: "OrbitMaster", avatar: "/placeholder.svg", weeklyXP: 2850, rank: 7, league: "Gold" },
  { id: "l8", name: "NebulaStudent", avatar: "/placeholder.svg", weeklyXP: 2720, rank: 8, league: "Gold" },
  { id: "l9", name: "MeteorLearner", avatar: "/placeholder.svg", weeklyXP: 2590, rank: 9, league: "Gold" },
  { id: "l10", name: "LunarExplorer", avatar: "/placeholder.svg", weeklyXP: 2510, rank: 10, league: "Gold" },
  CURRENT_USER,
  { id: "l12", name: "CometChaser", avatar: "/placeholder.svg", weeklyXP: 2380, rank: 12, league: "Gold" },
  { id: "l13", name: "PlanetWalker", avatar: "/placeholder.svg", weeklyXP: 2250, rank: 13, league: "Gold" },
  { id: "l14", name: "GravityDefier", avatar: "/placeholder.svg", weeklyXP: 2120, rank: 14, league: "Gold" },
  { id: "l15", name: "AstroNinja", avatar: "/placeholder.svg", weeklyXP: 2000, rank: 15, league: "Gold" },
]

const FRIENDS_LEADERBOARD = [
  { id: "f1", name: "BestFriend", avatar: "/placeholder.svg", weeklyXP: 2890, rank: 1, isFriend: true, league: "Gold" },
  { id: "f2", name: "StudyBuddy", avatar: "/placeholder.svg", weeklyXP: 2650, rank: 2, isFriend: true, league: "Gold" },
  CURRENT_USER,
  { id: "f4", name: "ClassMate", avatar: "/placeholder.svg", weeklyXP: 2230, rank: 4, isFriend: true, league: "Gold" },
  { id: "f5", name: "TeamPlayer", avatar: "/placeholder.svg", weeklyXP: 2080, rank: 5, isFriend: true, league: "Gold" },
]

export default function LeaderboardPage() {
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set())

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

  const renderPodium = () => (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-end justify-center gap-4 px-4">
        {/* Second Place */}
        <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0.2s" }}>
          <div className="relative mb-3">
            <Avatar className="w-20 h-20 border-4 border-gray-300 shadow-xl">
              <AvatarImage src={LAST_WEEK_TOP_3[1].avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-500 text-white text-xl font-bold">
                2
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2 text-3xl">🥈</div>
          </div>
          <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-t-2xl w-full h-32 flex flex-col items-center justify-center shadow-2xl">
            <Crown className="w-6 h-6 text-white mb-1" />
            <p className="text-white font-bold text-sm truncate max-w-full px-2">{LAST_WEEK_TOP_3[1].name}</p>
            <p className="text-gray-100 text-xs">{LAST_WEEK_TOP_3[1].weeklyXP} XP</p>
          </div>
        </div>

        {/* First Place */}
        <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0s" }}>
          <div className="relative mb-3">
            <Avatar className="w-24 h-24 border-4 border-yellow-400 shadow-2xl">
              <AvatarImage src={LAST_WEEK_TOP_3[0].avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-2xl font-bold">
                1
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-3 -right-2 text-4xl animate-bounce">👑</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-2xl w-full h-40 flex flex-col items-center justify-center shadow-2xl">
            <Trophy className="w-8 h-8 text-white mb-2" />
            <p className="text-white font-bold text-base truncate max-w-full px-2">{LAST_WEEK_TOP_3[0].name}</p>
            <p className="text-yellow-100 text-sm font-semibold">{LAST_WEEK_TOP_3[0].weeklyXP} XP</p>
          </div>
        </div>

        {/* Third Place */}
        <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0.4s" }}>
          <div className="relative mb-3">
            <Avatar className="w-20 h-20 border-4 border-amber-700 shadow-xl">
              <AvatarImage src={LAST_WEEK_TOP_3[2].avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-900 text-white text-xl font-bold">
                3
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2 text-3xl">🥉</div>
          </div>
          <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-t-2xl w-full h-28 flex flex-col items-center justify-center shadow-2xl">
            <Crown className="w-5 h-5 text-white mb-1" />
            <p className="text-white font-bold text-sm truncate max-w-full px-2">{LAST_WEEK_TOP_3[2].name}</p>
            <p className="text-amber-100 text-xs">{LAST_WEEK_TOP_3[2].weeklyXP} XP</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLeaderboardRow = (user: typeof CURRENT_USER, isCurrentUser: boolean) => {
    const isLiked = likedUsers.has(user.id)
    const isTopFive = user.rank <= 5
    const isBottomThree = user.rank >= CURRENT_WEEK_LEAGUE.length - 2

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
            {user.name[0]}
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
            className={`bg-gradient-to-r ${LEAGUES[CURRENT_USER.league as keyof typeof LEAGUES].color} px-8 py-3 rounded-full shadow-2xl`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{LEAGUES[CURRENT_USER.league as keyof typeof LEAGUES].icon}</span>
              <div>
                <p className="text-white text-center font-bold text-lg">{CURRENT_USER.league} League</p>
              </div>
            </div>
          </div>
        </div>

        {/* League Rankings */}
        <div className="space-y-3 max-w-3xl mx-auto">
          {CURRENT_WEEK_LEAGUE.map((user) => renderLeaderboardRow(user, user.id === CURRENT_USER.id))}
        </div>

        {/* Info footer */}
        <div className="mt-8 text-center text-white/60 text-sm max-w-2xl mx-auto">
          <p>Rankings reset every Monday at 00:00. Keep learning to climb higher!</p>
        </div>
      </div>
    </div>
  )
}
