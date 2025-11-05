"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Send, Settings } from "lucide-react"
import { useState } from "react"
import { RobotMascot } from "@/components/robot-mascot"
import Image from "next/image"

export default function MenuPage() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

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
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-2xl font-bold">
                Avt
              </AvatarFallback>
            </Avatar>
            {hoveredButton === "avatar" && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
                View Profile
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-cyan-300 text-xl font-bold">Odixee</h2>
            <div className="scale-110 flex items-center gap-2 text-cyan-400">
              <Image
                src="/crystal-currency.png"
                alt="Crystal Currency"
                width={20}
                height={20}
                className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
              />
              <span className="font-semibold">1000</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute right-6 top-24 z-20 flex flex-col gap-4 scale-75 sm:scale-75 md:scale-90 lg:scale-100 origin-top-right transition-all duration-300">
        {/* Rank Button */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredButton("rank")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/rank">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-200/20 to-blue-300/20 hover:from-cyan-300/20 hover:to-blue-400/20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg">
              <Image
                src="/rank-icon.png"
                alt="Rank"
                width={48}
                height={48}
                className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]"
              />
            </div>
          </Link>
          {hoveredButton === "rank" && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Rank
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
          onMouseEnter={() => setHoveredButton("task")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/assignment">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-200/20 to-purple-300/20 hover:from-cyan-300/20 hover:to-purple-400/20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg">
              <Image
                src="/task-icon.png"
                alt="Task"
                width={48}
                height={48}
                className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]"
              />
            </div>
          </Link>
          {hoveredButton === "task" && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Task
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
          <Button
            size="icon"
            className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-xl shadow-lg transition-all duration-300 hover:scale-110"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
          {hoveredButton === "feedback" && (
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Feedback
            </div>
          )}
        </div>

        {/* Settings Button - now below Feedback */}
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
            <div className="scale-140 relative w-32 h-32 transition-all duration-300 hover:scale-150 cursor-pointer">
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
            <div className="scale-60 sm:scale-75 md:scale-90 lg:scale-100 cursor-pointer sm:hover:scale-80 md:hover:scale-100 lg:hover:scale-110 transition-all duration-300">
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

      <div className="absolute bottom-1/5 left-1/2 -translate-x-1/2 z-20 scale-75 sm:scale-75 md:scale-90 lg:scale-100 transition-all duration-300">
        <Link href="/client/game">
          <Button className="bg-cyan-300 text-purple-1000 hover:bg-cyan-400 px-16 py-8 rounded-3xl text-2xl font-bold shadow-lg shadow-cyan-300/50 transition-all duration-300 transform hover:scale-105">
            <span className="text-purple-700 text-4xl uppercase tracking-wider">Start</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
