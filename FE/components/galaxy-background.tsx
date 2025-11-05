"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface Star {
  top: string
  left: string
  animationDelay: string
  opacity: number
}

export function GalaxyBackground() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const generatedStars = [...Array(30)].map(
      (): Star => ({
        top: `${Math.random() * 60}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        opacity: Math.random() * 0.7 + 0.3,
      }),
    )

    setStars(generatedStars)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-violet-950">
      <div className="absolute w-[860px] h-[860px] left-[1400px] -top-[171px] bg-purple-500 rounded-full blur-[200px]" />
      <div className="absolute w-[585px] h-[585px] left-[1213px] top-[241px] bg-blue-500 rounded-full blur-[125px]" />
      <div className="absolute w-[714px] h-[713px] left-[246px] top-[332px] bg-blue-500 rounded-full blur-[150px]" />
      <div className="absolute w-[818px] h-[818px] left-[649px] top-[417px] bg-sky-400 rounded-full blur-[150px]" />
      <div className="absolute w-96 h-96 left-[763px] top-[651px] bg-green-200 rounded-full blur-3xl" />

      <div className="absolute bottom-0 left-0 right-0 h-64">
        <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,100 Q150,50 300,100 T600,100 T900,100 T1200,100 L1200,200 L0,200 Z"
            fill="rgba(147, 51, 234, 0.3)"
          />
          <path d="M0,120 Q200,80 400,120 T800,120 T1200,120 L1200,200 L0,200 Z" fill="rgba(139, 92, 246, 0.4)" />
          <path d="M0,140 Q250,100 500,140 T1000,140 T1200,140 L1200,200 L0,200 Z" fill="rgba(124, 58, 237, 0.5)" />
          <path d="M0,160 Q300,130 600,160 T1200,160 L1200,200 L0,200 Z" fill="rgba(109, 40, 217, 0.6)" />
          <path d="M0,175 Q350,150 700,175 T1200,175 L1200,200 L0,200 Z" fill="rgba(6, 182, 212, 0.4)" />
        </svg>
      </div>

      {/* Planets */}
      <div className="absolute inset-0">
        {/* Orbital rings - Made responsive with viewport-based sizing */}
        <svg className="absolute left-1/2 top-2/5 -translate-x-1/2 -translate-y-1/2 w-[60vw] min-w-[450px] max-w-[900px] h-[30vw] min-h-[225px] max-h-[450px] opacity-30">
          <ellipse
            cx="50%"
            cy="50%"
            rx="46%"
            ry="40%"
            fill="none"
            stroke="cyan"
            strokeWidth="2"
            className="animate-pulse"
          />
          <ellipse
            cx="50%"
            cy="50%"
            rx="40%"
            ry="33%"
            fill="none"
            stroke="cyan"
            strokeWidth="1.5"
            className="animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
          <ellipse
            cx="50%"
            cy="50%"
            rx="33%"
            ry="27%"
            fill="none"
            stroke="cyan"
            strokeWidth="1"
            className="animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </svg>

        {/* Hot pink planet - left */}
        <div className="absolute left-[23%] top-[27%] w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 animate-float-slow">
          <Image
            src="/hot-pink-planet.png"
            alt="Hot pink planet"
            width={96}
            height={96}
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(236,72,153,0.6)]"
          />
        </div>

        {/* Pink/purple planet - top center */}
        <div className="absolute left-[48%] top-[10%] w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 animate-float-delayed">
          <Image
            src="/pinkpurple-planet.png"
            alt="Pink purple planet"
            width={128}
            height={128}
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          />
        </div>

        {/* Small cyan planet */}
        <div className="absolute left-[67%] top-[18%] w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 animate-float">
          <Image
            src="/small-cyan-planet.png"
            alt="Small cyan planet"
            width={80}
            height={80}
            className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]"
          />
        </div>

        {/* Large transparent blue planet - center */}
        <div className="absolute left-[37%] top-[38%] w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 animate-float">
          <Image
            src="/large-transparent-blue-planet.png"
            alt="Large transparent blue planet"
            width={208}
            height={208}
            className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]"
          />
        </div>

        {/* Dark blue planet - right */}
        <div className="absolute right-[25%] top-[35%] w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 animate-float-delayed">
          <Image
            src="/dark-blue-planet.png"
            alt="Dark blue planet"
            width={144}
            height={144}
            className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]"
          />
        </div>
      </div>

      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-pulse"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: star.animationDelay,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
    </div>
  )
}
