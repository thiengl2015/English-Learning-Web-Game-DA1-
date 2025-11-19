"use client"

import { useState, useEffect } from "react"

interface Star {
  top: string
  left: string
  size: number
  animationDelay: string
  opacity: number
}

export function GalaxyBackground() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const generatedStars = [...Array(50)].map(
      (): Star => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() > 0.7 ? 3 : Math.random() > 0.4 ? 2 : 1,
        animationDelay: `${Math.random() * 3}s`,
        opacity: Math.random() * 0.5 + 0.5,
      }),
    )

    setStars(generatedStars)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-violet-950 via-purple-950 to-indigo-950">
      <div className="absolute w-[600px] h-[600px] left-[10%] top-[10%] bg-yellow-400/20 rounded-full blur-[150px]" />
      <div className="absolute w-[500px] h-[500px] right-[15%] top-[5%] bg-pink-500/20 rounded-full blur-[120px]" />
      <div className="absolute w-[400px] h-[400px] left-[5%] bottom-[20%] bg-cyan-400/20 rounded-full blur-[100px]" />
      <div className="absolute w-[450px] h-[450px] right-[20%] top-[40%] bg-purple-500/20 rounded-full blur-[110px]" />

      <div className="absolute inset-0">
        {/* Yellow sun - top left */}
        <div className="absolute left-[12%] top-[8%] w-24 h-24 md:w-32 md:h-32 animate-float-slow">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_60px_rgba(250,204,21,0.8)]" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-80" />
          </div>
        </div>

        {/* Pink ringed planet - top right */}
        <div className="absolute right-[12%] top-[10%] w-32 h-32 md:w-40 md:h-40 animate-float-delayed">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_40px_rgba(236,72,153,0.6)]" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 opacity-70" />
            {/* Ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16 md:w-56 md:h-20 border-8 md:border-[10px] border-purple-400/60 rounded-full"
              style={{ transform: "translate(-50%, -50%) rotateX(75deg)" }}
            />
          </div>
        </div>

        {/* Small pink planet - left side */}
        <div className="absolute left-[6%] top-[35%] w-16 h-16 md:w-20 md:h-20 animate-float">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 shadow-[0_0_30px_rgba(244,114,182,0.6)]" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-200 to-pink-400 opacity-60" />
        </div>

        {/* Cyan Earth-like planet - left bottom */}
        <div className="absolute left-[14%] bottom-[20%] w-28 h-28 md:w-36 md:h-36 animate-float-slow">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_50px_rgba(34,211,238,0.7)]" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-cyan-200 to-blue-400 opacity-80">
              {/* Cloud patterns */}
              <div className="absolute top-[20%] left-[30%] w-8 h-8 rounded-full bg-cyan-100/40" />
              <div className="absolute top-[50%] right-[25%] w-10 h-10 rounded-full bg-cyan-100/40" />
              <div className="absolute bottom-[30%] left-[40%] w-6 h-6 rounded-full bg-cyan-100/40" />
            </div>
          </div>
        </div>

        {/* Purple planet - right side */}
        <div className="absolute right-[23%] top-[45%] w-24 h-24 md:w-32 md:h-32 animate-float-delayed">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-[0_0_40px_rgba(168,85,247,0.6)]" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 opacity-70">
            {/* Surface texture */}
            <div className="absolute top-[25%] left-[20%] w-6 h-6 rounded-full bg-purple-600/30" />
            <div className="absolute bottom-[30%] right-[25%] w-8 h-8 rounded-full bg-purple-600/30" />
          </div>
        </div>

        {/* Small pink planet - bottom right */}
        <div className="absolute right-[20%] bottom-[18%] w-14 h-14 md:w-16 md:h-16 animate-float">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_25px_rgba(236,72,153,0.5)]" />
        </div>

        {/* Yellow partial planet - bottom right corner */}
        <div className="absolute -right-16 -bottom-16 w-48 h-48 md:w-56 md:h-56 animate-float-slow">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_60px_rgba(250,204,21,0.6)]" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-70" />
        </div>

        {/* Rocket */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-74 h-89 md:w-78 md:h-94 animate-float z-10">
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]">
            {/* Rocket body */}
            <ellipse cx="50" cy="70" rx="18" ry="35" fill="#E0F2FE" />
            <ellipse cx="50" cy="70" rx="14" ry="30" fill="#F0F9FF" />
            {/* Rocket nose */}
            <path d="M 50 20 L 35 50 L 65 50 Z" fill="#E0F2FE" />
            <path d="M 50 25 L 38 50 L 62 50 Z" fill="#BAE6FD" />
            {/* Window */}
            <circle cx="50" cy="60" r="8" fill="#38BDF8" opacity="0.7" />
            <circle cx="50" cy="60" r="6" fill="#0EA5E9" opacity="0.5" />
            {/* Left fin */}
            <path d="M 32 70 L 20 95 L 32 90 Z" fill="#EC4899" />
            <path d="M 32 75 L 24 92 L 32 88 Z" fill="#F472B6" />
            {/* Right fin */}
            <path d="M 68 70 L 80 95 L 68 90 Z" fill="#EC4899" />
            <path d="M 68 75 L 76 92 L 68 88 Z" fill="#F472B6" />
            {/* Bottom fins */}
            <path d="M 35 95 L 30 110 L 38 105 Z" fill="#D946EF" />
            <path d="M 65 95 L 70 110 L 62 105 Z" fill="#D946EF" />
            {/* Flame effect */}
            <ellipse cx="50" cy="108" rx="8" ry="10" fill="#FCD34D" opacity="0.8" />
            <ellipse cx="50" cy="110" rx="6" ry="8" fill="#FCA5A5" opacity="0.6" />
          </svg>
        </div>

        {/* Small cyan/teal planets scattered */}
        <div className="absolute right-[8%] top-[36%] w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse" />
        <div className="absolute left-[19%] top-[22%] w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute left-[11%] top-[16%] w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.animationDelay,
              opacity: star.opacity,
              boxShadow: star.size > 2 ? '0 0 4px rgba(255,255,255,0.8)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}
