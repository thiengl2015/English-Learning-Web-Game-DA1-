"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Send, Settings } from "lucide-react"
import { useState, useEffect } from "react" // Import useEffect
import { RobotMascot } from "@/components/robot-mascot"
import Image from "next/image"

// Cấu hình URL API
const API_BASE_URL = "http://localhost:5000/api";

export default function MenuPage() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  
  // State để lưu thông tin user
  const [userData, setUserData] = useState({
    displayName: "Student", // Giá trị mặc định khi chưa load
    xp: 0,
    avatarUrl: null
  });

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
          onMouseEnter={() => setHoveredButton("store")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/store">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-200/20 to-purple-300/20 hover:from-purple-300/20 hover:to-purple-400/20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg">
              <Image
                src="/store-icon.png"
                alt="Store"
                width={48}
                height={48}
                className="scale-90 w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
              />
            </div>
          </Link>
          {hoveredButton === "store" && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Store
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

      <div className="absolute bottom-1/4 left-1/12 z-20 flex items-center gap-4 scale-75 sm:scale-75 md:scale-90 lg:scale-100 origin-bottom-left transition-all duration-300">
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("review")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/review">
            <div className="scale-150 relative w-32 h-32 transition-all duration-300 hover:scale-170 cursor-pointer">
              <Image
                src="/review-button.png"
                alt="Review"
                width={208}
                height={208}
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]"
              />
            </div>
          </Link>
          {hoveredButton === "review" && (
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Review
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

      <div className="absolute bottom-1/5 left-1/2 -translate-x-1/2 z-20 scale-80 sm:scale-75 md:scale-90 lg:scale-100 transition-all duration-300">
        <Link href="/client/units">
          <Button className="bg-cyan-300 text-purple-1000 hover:bg-cyan-400 px-16 py-8 rounded-3xl text-2xl font-bold shadow-lg shadow-cyan-300/50 transition-all duration-300 transform hover:scale-105">
            <span className="text-purple-700 text-4xl uppercase tracking-wider">Start</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}