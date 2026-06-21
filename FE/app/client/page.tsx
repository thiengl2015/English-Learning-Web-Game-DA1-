"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { LogOut, Send, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react" // Import useEffect
import { io, type Socket } from "socket.io-client"
import { RobotMascot } from "@/components/robot-mascot"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/$/, "")
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`
const SERVER_ROOT = API_BASE_URL.replace(/\/api$/, "")

type MissionAlertItem = {
  progress?: number | string
  target?: number | string
  status?: string
}

const hasClaimableMission = (missions: MissionAlertItem[]) => {
  return missions.some((mission) => {
    const progress = Number(mission.progress || 0)
    const target = Number(mission.target || 1)
    const status = mission.status === "in_progress" ? "in-progress" : mission.status

    return status !== "claimed" && status !== "locked" && (status === "completed" || progress >= target)
  })
}

export default function MenuPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  
  // State để lưu thông tin user
  const [userData, setUserData] = useState({
    displayName: "Student", // Giá trị mặc định khi chưa load
    xp: 0,
    avatarUrl: null
  });
  const [hasMessagesAlert, setHasMessagesAlert] = useState(false)
  const [hasMissionAlert, setHasMissionAlert] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // 1. Gọi API lấy thông tin cá nhân (Display Name & Avatar)
        const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userJson = await userRes.json();

        // 2. Gọi API lấy tiến độ (XP / Gems)
        const progressRes = await fetch(`${API_BASE_URL}/users/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const progressJson = await progressRes.json();

        if (userJson.success) {
          setUserData(prev => ({
            ...prev,
            displayName: userJson.data.display_name || userJson.data.username || "Student",
            // Nếu backend trả về avatar url đầy đủ thì dùng luôn, nếu không thì dùng placeholder
            avatarUrl: userJson.data.avatar || null 
          }));
        }

        if (progressJson.success) {
          setUserData(prev => ({
            ...prev,
            // Giả sử field trả về là total_xp, bạn kiểm tra lại console log thực tế nhé
            xp: progressJson.data.total_xp || progressJson.data.xp || 0 
          }));
        }

      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    let socket: Socket | null = null

    const fetchUnreadSignals = async () => {
      const headers = { Authorization: `Bearer ${token}` }

      const [notificationResult, friendsResult, dailyMissionResult, achievementResult] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/notifications`, { headers }),
        fetch(`${API_BASE_URL}/friends`, { headers }),
        fetch(`${API_BASE_URL}/missions?type=daily`, { headers }),
        fetch(`${API_BASE_URL}/missions?type=achievement`, { headers }),
      ])

      let hasUnreadNotifications = false
      let hasUnreadMessages = false
      let hasClaimableMissions = false

      if (notificationResult.status === "fulfilled" && notificationResult.value.ok) {
        const json = await notificationResult.value.json()
        const data = json?.data || {}
        hasUnreadNotifications =
          Number(data.unread_count || 0) > 0 ||
          (Array.isArray(data.notifications) &&
            data.notifications.some((item: { is_read?: boolean }) => !item.is_read))
      }

      if (friendsResult.status === "fulfilled" && friendsResult.value.ok) {
        const json = await friendsResult.value.json()
        const friends = Array.isArray(json?.data) ? json.data : []
        hasUnreadMessages = friends.some((friend: { unreadCount?: number }) => Number(friend.unreadCount || 0) > 0)
      }

      if (dailyMissionResult.status === "fulfilled" && dailyMissionResult.value.ok) {
        const json = await dailyMissionResult.value.json()
        const missions = Array.isArray(json?.data) ? json.data : []
        hasClaimableMissions = hasClaimableMissions || hasClaimableMission(missions)
      }

      if (achievementResult.status === "fulfilled" && achievementResult.value.ok) {
        const json = await achievementResult.value.json()
        const achievements = Array.isArray(json?.data) ? json.data : []
        hasClaimableMissions = hasClaimableMissions || hasClaimableMission(achievements)
      }

      setHasMessagesAlert(hasUnreadNotifications || hasUnreadMessages)
      setHasMissionAlert(hasClaimableMissions)
    }

    fetchUnreadSignals().catch(() => {})

    socket = io(SERVER_ROOT, {
      auth: { token },
      transports: ["websocket", "polling"],
    })
    socket.on("notification:new", () => setHasMessagesAlert(true))
    socket.on("direct:message", () => setHasMessagesAlert(true))

    return () => {
      socket?.disconnect()
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/sign-in")
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Link href="/client/profile">
        <div
          className="absolute top-6 left-6 z-20 flex items-center gap-4 group cursor-pointer scale-75 sm:scale-75 md:scale-90 lg:scale-100 origin-top-left transition-all duration-300"
          onMouseEnter={() => setHoveredButton("avatar")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-white/30 shadow-xl">
              {/* Hiển thị Avatar từ API nếu có */}
              <AvatarImage src={userData.avatarUrl || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-2xl font-bold">
                {userData.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {hoveredButton === "avatar" && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
                View Profile
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {/* Hiển thị Display Name từ API */}
            <h2 className="text-cyan-300 text-xl font-bold">{userData.displayName}</h2>
            <div className="scale-110 flex items-center gap-2 text-cyan-400">
              <Image
                src="/crystal-currency.png"
                alt="Crystal Currency"
                width={20}
                height={20}
                className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
              />
              {/* Hiển thị XP từ API */}
              <span className="font-semibold">{userData.xp}</span> 
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute right-6 top-24 z-20 flex flex-col gap-4 scale-75 sm:scale-75 md:scale-90 lg:scale-100 origin-top-right transition-all duration-300">
        {/* Leaderboard Button */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("leaderboard")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/leaderboard">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-200/20 to-blue-300/20 hover:from-cyan-300/20 hover:to-blue-400/20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg">
              <Image
                src="/rank-icon.png"
                alt="Leaderboard"
                width={48}
                height={48}
                className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]"
              />
            </div>
          </Link>
          {hoveredButton === "leaderboard" && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Leaderboard
            </div>
          )}
        </div>

        {/* Store Button */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("messages")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/messages">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-200/20 to-purple-300/20 hover:from-purple-300/20 hover:to-purple-400/20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg">
              <Image
                src="/store-icon.png"
                alt="Messages"
                width={48}
                height={48}
                className="scale-90 w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
              />
              {hasMessagesAlert && (
                <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white/80 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
              )}
            </div>
          </Link>
          {hoveredButton === "messages" && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Messages
            </div>
          )}
        </div>

        {/* Task Button */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("mission")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/mission">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-200/20 to-purple-300/20 hover:from-cyan-300/20 hover:to-purple-400/20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg">
              <Image
                src="/task-icon.png"
                alt="mission"
                width={48}
                height={48}
                className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]"
              />
              {hasMissionAlert && (
                <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white/80 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
              )}
            </div>
          </Link>
          {hoveredButton === "mission" && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Mission
            </div>
          )}
        </div>

        {/* Event Button */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("event")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/event">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-200/20 to-red-300/20 hover:from-orange-300/20 hover:to-red-400/20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg">
              <Image
                src="/event-icon.png"
                alt="Event"
                width={48}
                height={48}
                className="scale-90 w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]"
              />
            </div>
          </Link>
          {hoveredButton === "event" && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Event
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-4 scale-75 sm:scale-75 md:scale-90 lg:scale-100 origin-bottom-left transition-all duration-300">
        {/* Feedback Button */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("feedback")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/feedback">
            <Button
            size="icon"
            className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-xl shadow-lg transition-all duration-300 hover:scale-110"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
          </Link>
          {hoveredButton === "feedback" && (
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Feedback
            </div>
          )}
        </div>

        {/* Settings Button */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("settings")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/settings">
            <Button
              size="icon"
              className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 rounded-xl shadow-lg transition-all duration-300 hover:scale-110"
            >
              <Settings className="w-5 h-5 text-white" />
            </Button>
          </Link>
          {hoveredButton === "settings" && (
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Settings
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-30 scale-75 sm:scale-75 md:scale-90 lg:scale-100 origin-bottom-right transition-all duration-300">
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("logout")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Button
            type="button"
            size="icon"
            aria-label="Log out"
            onClick={handleLogout}
            className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 rounded-xl shadow-lg transition-all duration-300 hover:scale-110"
          >
            <LogOut className="w-5 h-5 text-white" />
          </Button>
          {hoveredButton === "logout" && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Log out
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-1/4 left-1/12 z-20 flex items-center gap-4 scale-75 sm:scale-75 md:scale-90 lg:scale-100 origin-bottom-left transition-all duration-300">
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("review")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/practice">
            <div className="scale-150 relative w-32 h-32 transition-all duration-300 hover:scale-170 cursor-pointer">
              <Image
                src="/review-button.png"
                alt="Practice"
                width={208}
                height={208}
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]"
              />
            </div>
          </Link>
          {hoveredButton === "practice" && (
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Practice
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-10 right-1/12 z-20"
        onMouseEnter={() => setHoveredButton("assistant")}
        onMouseLeave={() => setHoveredButton(null)}
      >
        <div className="relative">
          <Link href="/client/assistant">
            <div className="scale-70 sm:scale-75 md:scale-90 lg:scale-100 cursor-pointer sm:hover:scale-90 md:hover:scale-100 lg:hover:scale-110 transition-all duration-300">
              <RobotMascot />
            </div>
          </Link>
          {hoveredButton === "assistant" && (
            <div className="absolute right-1/2 translate-x-1/2 -top-8 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Assistant
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-1/6 left-1/2 -translate-x-1/2 z-20 scale-80 sm:scale-75 md:scale-90 lg:scale-100 transition-all duration-300">
        <Link href="/client/units">
          <Button className="bg-cyan-300 text-purple-1000 hover:bg-cyan-400 px-16 py-8 rounded-3xl text-2xl font-bold shadow-lg shadow-cyan-300/50 transition-all duration-300 transform hover:scale-105">
            <span className="text-purple-700 text-4xl uppercase tracking-wider">Start</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
