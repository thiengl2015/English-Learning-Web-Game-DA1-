"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function RobotMascot({ className = "" }: { className?: string }) {
  const [currentFrame, setCurrentFrame] = useState(0)

  const frames = [
    "/mascot-frame-1.png", // Asset 10 - Front-facing neutral
    "/mascot-frame-2.png", // Asset 11 - Front-facing neutral variant
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [frames.length])

  return (
    <div className={`relative ${className}`}>
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-cyan-400/30 blur-3xl rounded-full animate-pulse" />

      <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
        <Image
          src={frames[currentFrame] || "/placeholder.svg"}
          alt="Animated Mascot"
          width={200}
          height={200}
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}
