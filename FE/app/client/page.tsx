"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Coins, Trophy, Crown, Target, ShoppingBag, Send, Settings, BookOpen } from "lucide-react"
import { useState } from "react"
import { RobotMascot } from "@/components/robot-mascot"

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
            <div className="flex items-center gap-2 text-cyan-400">
              <Coins className="w-5 h-5" />
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
            <Button
              size="icon"
              className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110"
            >
              <Trophy className="w-8 h-8 text-white" />
            </Button>
          </Link>
          {hoveredButton === "rank" && (
            <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
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
            <Button
              size="icon"
              className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110"
            >
              <ShoppingBag className="w-8 h-8 text-white" />
            </Button>
          </Link>
          {hoveredButton === "store" && (
            <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
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
            <Button
              size="icon"
              className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110"
            >
              <Target className="w-8 h-8 text-white" />
            </Button>
          </Link>
          {hoveredButton === "task" && (
            <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
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
            <Button
              size="icon"
              className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110"
            >
              <Crown className="w-8 h-8 text-white" />
            </Button>
          </Link>
          {hoveredButton === "event" && (
            <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Event
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-8 z-20 flex items-center gap-4 scale-75 sm:scale-75 md:scale-90 lg:scale-100 origin-bottom-left transition-all duration-300">
        <div
          className="relative flex flex-col items-center gap-2"
          onMouseEnter={() => setHoveredButton("review")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Link href="/client/review">
            <div className="w-30 h-30 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-3xl shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
          </Link>
          <span className="text-white font-bold text-sm">Review</span>
        </div>

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
            <div className="absolute left-1/2 -translate-x-1/2 bottom-12 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Feedback
            </div>
          )}
        </div>

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
            <div className="absolute left-1/2 -translate-x-1/2 bottom-12 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Settings
            </div>
          )}
        </div>
      </div>

      {/* Assistant */}
      <div className="absolute bottom-2 right-1/12 z-20">
        <Link href="/client/assistant">
          <div className="scale-75 sm:scale-75 md:scale-90 lg:scale-100 cursor-pointer sm:hover:scale-80 md:hover:scale-100 lg:hover:scale-110 transition-all duration-300">
            <RobotMascot />
          </div>
        </Link>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 scale-75 sm:scale-75 md:scale-90 lg:scale-100 transition-all duration-300">
        <Link href="/client/game">
          <Button className="bg-gradient-to-br from-green-300 to-cyan-300 hover:bg-gray-100 rounded-3xl px-20 py-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <span className="text-purple-700 text-4xl uppercase tracking-wider">Start</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
