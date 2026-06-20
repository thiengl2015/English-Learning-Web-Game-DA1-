"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Crown,
  Loader2,
  MoreVertical,
  ShieldCheck,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GalaxyBackground } from "@/components/galaxy3-background"
import { UserProfileModal } from "@/components/user-profile-modal"
import { io } from "socket.io-client"

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "")
const API_ROOT = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api$/, "")
const SERVER_ROOT = API_ROOT.replace(/\/api$/, "")

const LEAGUES = {
  Bronze: { color: "from-amber-700 to-amber-900", icon: "🥉" },
  Silver: { color: "from-gray-300 to-gray-500", icon: "🥈" },
  Gold: { color: "from-yellow-400 to-yellow-600", icon: "🥇" },
  Diamond: { color: "from-cyan-300 to-blue-500", icon: "💎" },
} as const

type LeagueName = keyof typeof LEAGUES
type FriendStatus = "self" | "none" | "friends" | "pending_sent" | "pending_received"
type FriendRequestResolutionStatus = "accepted" | "rejected" | "cancelled"

interface LeaderboardUser {
  id: string
  name: string
  avatar: string | null
  weeklyXP: number
  totalXP: number
  rank: number
  league: LeagueName
  highestRank: LeagueName
  highestPosition: number
  friendStatus: FriendStatus
}

interface UserRank {
  rank: number
  totalUsers: number
  weeklyXP: number
  totalXP: number
  league: LeagueName
}

interface LeaderboardPayload {
  weeklyLeaderboard: LeaderboardUser[]
  userRank: UserRank
  topThreeLastWeek: LeaderboardUser[]
  currentUser: LeaderboardUser | null
  currentLeague: LeagueName
  promotionCount: number
  demotionCount: number
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

function normalizeAvatarUrl(avatar: string | null | undefined) {
  if (!avatar) return "/placeholder.svg"
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar
  if (avatar.startsWith("/")) return `${ASSET_BASE_URL}${avatar}`
  return avatar
}

function getLeagueInfo(league: string | undefined) {
  return LEAGUES[(league as LeagueName) || "Bronze"] || LEAGUES.Bronze
}

export default function LeaderboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [topThreeLastWeek, setTopThreeLastWeek] = useState<LeaderboardUser[]>([])
  const [userRank, setUserRank] = useState<UserRank | null>(null)
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null)
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionUserId, setActionUserId] = useState<string | null>(null)

  const currentLeague = userRank?.league || currentUser?.league || "Bronze"
  const currentLeagueInfo = getLeagueInfo(currentLeague)

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Vui lòng đăng nhập để xem bảng xếp hạng")
        return
      }

      const res = await fetch(`${API_ROOT}/leaderboard/full?limit=50`, {
        headers: authHeaders(),
      })
      const json = (await res.json()) as ApiResponse<LeaderboardPayload>

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể tải dữ liệu bảng xếp hạng")
      }

      setLeaderboard(json.data.weeklyLeaderboard || [])
      setTopThreeLastWeek(json.data.topThreeLastWeek || [])
      setUserRank(json.data.userRank || null)
      setCurrentUser(json.data.currentUser || null)
    } catch (err) {
      console.error("Failed to fetch leaderboard data:", err)
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu bảng xếp hạng")
    } finally {
      setIsLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const topThree = useMemo(() => {
    const fallbackLeague = currentLeague || "Bronze"
    const emptyUsers: LeaderboardUser[] = [1, 2, 3].map((rank) => ({
      id: `empty-${rank}`,
      name: "???",
      avatar: null,
      weeklyXP: 0,
      totalXP: 0,
      rank,
      league: fallbackLeague,
      highestRank: fallbackLeague,
      highestPosition: rank,
      friendStatus: "none",
    }))

    return topThreeLastWeek.length >= 3 ? topThreeLastWeek : emptyUsers
  }, [currentLeague, topThreeLastWeek])

  const updateFriendStatus = useCallback((userId: string, friendStatus: FriendStatus) => {
    const patchUser = (user: LeaderboardUser) =>
      user.id === userId ? { ...user, friendStatus } : user

    setLeaderboard((prev) => prev.map(patchUser))
    setTopThreeLastWeek((prev) => prev.map(patchUser))
    setCurrentUser((prev) => (prev && prev.id === userId ? { ...prev, friendStatus } : prev))
    setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, friendStatus } : prev))
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    const currentUserId = currentUser?.id
    if (!token || !currentUserId) return

    const socket = io(SERVER_ROOT, {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    socket.on(
      "friend:request_resolved",
      ({
        requesterId,
        addresseeId,
        status,
      }: {
        requesterId: string
        addresseeId: string
        status: FriendRequestResolutionStatus
      }) => {
        const otherUserId =
          currentUserId === requesterId
            ? addresseeId
            : currentUserId === addresseeId
              ? requesterId
              : null

        if (!otherUserId) return

        updateFriendStatus(otherUserId, status === "accepted" ? "friends" : "none")
      }
    )

    socket.on("friend:removed", ({ userId }: { userId: string }) => {
      updateFriendStatus(userId, "none")
    })

    return () => {
      socket.disconnect()
    }
  }, [currentUser?.id, updateFriendStatus])

  const handleAddFriend = async (user: LeaderboardUser) => {
    setActionUserId(user.id)
    setNotice(null)

    const isAcceptingRequest = user.friendStatus === "pending_received"

    try {
      const res = await fetch(
        isAcceptingRequest
          ? `${API_ROOT}/friends/${user.id}/accept`
          : `${API_ROOT}/friends/${user.id}`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      )
      const json = (await res.json()) as ApiResponse<unknown>

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Cannot update friend request")
      }

      updateFriendStatus(user.id, isAcceptingRequest ? "friends" : "pending_sent")
      setNotice(
        isAcceptingRequest
          ? `You are now friends with ${user.name}`
          : `Friend request sent to ${user.name}`
      )
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Cannot update friend request")
    } finally {
      setActionUserId(null)
    }
  }

  const handleCancelFriendRequest = async (user: LeaderboardUser) => {
    setActionUserId(user.id)
    setNotice(null)

    try {
      const res = await fetch(`${API_ROOT}/friends/requests/${user.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      const json = (await res.json()) as ApiResponse<unknown>

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Cannot cancel friend request")
      }

      updateFriendStatus(user.id, "none")
      setNotice(`Friend request to ${user.name} was cancelled`)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Cannot cancel friend request")
    } finally {
      setActionUserId(null)
    }
  }

  const handleRemoveFriend = async (user: LeaderboardUser) => {
    setActionUserId(user.id)
    setNotice(null)

    try {
      const res = await fetch(`${API_ROOT}/friends/${user.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      const json = (await res.json()) as ApiResponse<unknown>

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể xóa bạn bè")
      }

      updateFriendStatus(user.id, "none")
      setNotice(`Đã xóa ${user.name} khỏi danh sách bạn bè`)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Không thể xóa bạn bè")
    } finally {
      setActionUserId(null)
    }
  }

  const renderPodium = () => (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-end justify-center gap-4 px-4">
        <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0.2s" }}>
          <div className="relative mb-3">
            <Avatar className="w-20 h-20 border-4 border-gray-300 shadow-xl">
              <AvatarImage src={normalizeAvatarUrl(topThree[1]?.avatar)} />
              <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-500 text-white text-xl font-bold">
                2
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2 text-3xl">🥈</div>
          </div>
          <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-t-2xl w-full h-32 flex flex-col items-center justify-center shadow-2xl">
            <Crown className="w-6 h-6 text-white mb-1" />
            <p className="text-white font-bold text-sm truncate max-w-full px-2">{topThree[1]?.name}</p>
            <p className="text-gray-100 text-xs">{topThree[1]?.weeklyXP.toLocaleString()} XP</p>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0s" }}>
          <div className="relative mb-3">
            <Avatar className="w-24 h-24 border-4 border-yellow-400 shadow-2xl">
              <AvatarImage src={normalizeAvatarUrl(topThree[0]?.avatar)} />
              <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-2xl font-bold">
                1
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-3 -right-2 text-4xl animate-bounce">👑</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-2xl w-full h-40 flex flex-col items-center justify-center shadow-2xl">
            <Trophy className="w-8 h-8 text-white mb-2" />
            <p className="text-white font-bold text-base truncate max-w-full px-2">{topThree[0]?.name}</p>
            <p className="text-yellow-100 text-sm font-semibold">{topThree[0]?.weeklyXP.toLocaleString()} XP</p>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 animate-float" style={{ animationDelay: "0.4s" }}>
          <div className="relative mb-3">
            <Avatar className="w-20 h-20 border-4 border-amber-700 shadow-xl">
              <AvatarImage src={normalizeAvatarUrl(topThree[2]?.avatar)} />
              <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-900 text-white text-xl font-bold">
                3
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2 text-3xl">🥉</div>
          </div>
          <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-t-2xl w-full h-28 flex flex-col items-center justify-center shadow-2xl">
            <Crown className="w-5 h-5 text-white mb-1" />
            <p className="text-white font-bold text-sm truncate max-w-full px-2">{topThree[2]?.name}</p>
            <p className="text-amber-100 text-xs">{topThree[2]?.weeklyXP.toLocaleString()} XP</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLeaderboardRow = (user: LeaderboardUser) => {
    const isCurrentUser = user.friendStatus === "self" || currentUser?.id === user.id
    const isTopFive = user.rank <= 5
    const isBottomThree = leaderboard.length > 5 && user.rank >= leaderboard.length - 2

    return (
      <div
        key={user.id}
        className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
          isCurrentUser
            ? "bg-cyan-500/20 border-2 border-cyan-400 shadow-lg shadow-cyan-400/20 scale-[1.02]"
            : "bg-white/10 backdrop-blur-md hover:bg-white/15"
        }`}
      >
        <div className="flex items-center justify-center w-12">
          {user.rank <= 3 ? (
            <div className="flex items-center gap-1">
              {user.rank === 1 && <span className="text-2xl">👑</span>}
              {user.rank === 2 && <span className="text-2xl">🥈</span>}
              {user.rank === 3 && <span className="text-2xl">🥉</span>}
            </div>
          ) : (
            <span className="text-lg font-bold text-white">{user.rank}</span>
          )}
        </div>

        <Avatar className={`w-12 h-12 ${isCurrentUser ? "border-2 border-cyan-400" : "border border-white/30"}`}>
          <AvatarImage src={normalizeAvatarUrl(user.avatar)} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-bold">
            {user.name[0] || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-bold truncate ${isCurrentUser ? "text-cyan-300 text-lg" : "text-white"}`}>
              {user.name}
            </p>
            {isTopFive && !isCurrentUser && <ChevronUp className="w-5 h-5 text-green-400 animate-bounce" />}
            {isBottomThree && <ChevronDown className="w-5 h-5 text-red-400 animate-bounce" />}
          </div>
          <p className="text-xs text-white/50">
            {isCurrentUser ? "You" : user.friendStatus === "friends" ? "Friend" : `${user.league} League`}
          </p>
        </div>

        <div className="text-right mr-2">
          <p className={`font-bold ${isCurrentUser ? "text-cyan-300 text-lg" : "text-white"}`}>
            {user.weeklyXP.toLocaleString()}
          </p>
          <p className="text-gray-400 text-xs">XP</p>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="bg-white/5 hover:bg-white/10 text-gray-300 transition-all duration-300"
          onClick={() => {
            setSelectedUser(user)
            setNotice(null)
          }}
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    )
  }

  const renderProfileModal = () => {
    if (!selectedUser) return null

    const isCurrentUser = selectedUser.friendStatus === "self" || currentUser?.id === selectedUser.id
    const leagueInfo = getLeagueInfo(selectedUser.highestRank)
    const isActing = actionUserId === selectedUser.id

    return (
      <UserProfileModal
        user={{ ...selectedUser, avatar: normalizeAvatarUrl(selectedUser.avatar) }}
        friendStatus={selectedUser.friendStatus}
        leagueIcon={leagueInfo.icon}
        isCurrentUser={isCurrentUser}
        isLoading={isActing}
        notice={notice}
        onClose={() => setSelectedUser(null)}
        onAddFriend={() => handleAddFriend(selectedUser)}
        onCancelRequest={() => handleCancelFriendRequest(selectedUser)}
        onAcceptFriend={() => handleAddFriend(selectedUser)}
        onRemoveFriend={() => handleRemoveFriend(selectedUser)}
      />
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
          <Link href="/sign-in">
            <Button className="bg-cyan-500 hover:bg-cyan-600">Đăng nhập</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GalaxyBackground />
      {renderProfileModal()}

      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Leaderboard</h1>
          <p className="text-cyan-400">Compete and climb the ranks!</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-center text-white mb-6">Last Week's Champions</h2>
          {renderPodium()}
        </div>

        <div className="flex justify-center mb-6">
          <div className={`bg-gradient-to-r ${currentLeagueInfo.color} px-8 py-3 rounded-full shadow-2xl`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentLeagueInfo.icon}</span>
              <div>
                <p className="text-white font-bold text-lg">{currentLeague} League</p>
                <p className="text-white/80 text-sm">
                  Top 5 advance • Bottom 3 demote
                  {userRank ? ` • Rank #${userRank.rank}/${userRank.totalUsers}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {notice && (
          <div className="max-w-3xl mx-auto mb-4 flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-cyan-100">
            <ShieldCheck className="w-5 h-5" />
            <span>{notice}</span>
          </div>
        )}

        <div className="space-y-3 max-w-3xl mx-auto">
          {leaderboard.map((user) => renderLeaderboardRow(user))}

          {leaderboard.length === 0 && (
            <div className="text-center text-white/60 py-8">
              <p>Chưa có dữ liệu bảng xếp hạng cho league này</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-white/60 text-sm max-w-2xl mx-auto">
          <p>Rankings reset every Monday at 00:00. Keep learning to climb higher!</p>
        </div>
      </div>
    </div>
  )
}
