"use client"

import { useState, useEffect } from "react"

interface Star {
  top: string
  left: string
  size: number
  animationDelay: string
  opacity: number
}

interface Planet {
  id: string
  top: string
  left: string
  size: number
  color: string
  gradient: string
  pattern?: string
  hasRing?: boolean
  ringColor?: string
  animationDelay: string
}

export function GalaxyBackground() {
  const [stars, setStars] = useState<Star[]>([])
  const [planets, setPlanets] = useState<Planet[]>([])

  useEffect(() => {
    // Generate random stars
    const generatedStars = [...Array(60)].map(
      (): Star => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() > 0.8 ? 3 : Math.random() > 0.5 ? 2 : 1,
        animationDelay: `${Math.random() * 3}s`,
        opacity: Math.random() * 0.8 + 0.2,
      }),
    )

    // Define planets with specific positions and styles
    const generatedPlanets: Planet[] = [
      // Large yellow moon/sun - bottom left
      {
        id: "yellow-moon",
        top: "55%",
        left: "8%",
        size: 180,
        color: "#FFA500",
        gradient: "from-yellow-400 to-orange-500",
        pattern: "craters",
        animationDelay: "0s",
      },
      // Cyan ringed planet - top left
      {
        id: "cyan-ringed",
        top: "15%",
        left: "12%",
        size: 70,
        color: "#06B6D4",
        gradient: "from-cyan-400 to-cyan-600",
        hasRing: true,
        ringColor: "cyan",
        animationDelay: "1s",
      },
      // Pink planet - top center
      {
        id: "pink-top",
        top: "12%",
        left: "35%",
        size: 90,
        color: "#EC4899",
        gradient: "from-pink-400 to-pink-600",
        pattern: "dots",
        animationDelay: "1.5s",
      },
      // Small cyan planet with ring - center
      {
        id: "small-cyan-center",
        top: "45%",
        left: "55%",
        size: 60,
        color: "#22D3EE",
        gradient: "from-cyan-300 to-blue-500",
        hasRing: true,
        ringColor: "orange",
        animationDelay: "2s",
      },
      // Orange striped planet - right
      {
        id: "orange-striped",
        top: "35%",
        left: "82%",
        size: 100,
        color: "#F59E0B",
        gradient: "from-amber-400 to-orange-600",
        pattern: "stripes",
        animationDelay: "0.5s",
      },
      // Purple planet - bottom right
      {
        id: "purple-bottom",
        top: "70%",
        left: "85%",
        size: 110,
        color: "#A855F7",
        gradient: "from-purple-400 to-purple-700",
        pattern: "swirl",
        animationDelay: "2.5s",
      },
      // Pink planet - bottom center
      {
        id: "pink-bottom",
        top: "65%",
        left: "60%",
        size: 85,
        color: "#DB2777",
        gradient: "from-pink-500 to-rose-600",
        animationDelay: "1.8s",
      },
      // Small orange moon - top left near cyan
      {
        id: "orange-moon",
        top: "22%",
        left: "18%",
        size: 35,
        color: "#FB923C",
        gradient: "from-orange-400 to-orange-600",
        animationDelay: "3s",
      },
      // Small white/cyan dot - top
      {
        id: "white-dot",
        top: "18%",
        left: "25%",
        size: 25,
        color: "#67E8F9",
        gradient: "from-cyan-200 to-cyan-400",
        animationDelay: "2.2s",
      },
    ]

    setStars(generatedStars)
    setPlanets(generatedPlanets)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-violet-950">
      {/* Orbital paths */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <ellipse
          cx="50%"
          cy="50%"
          rx="35%"
          ry="25%"
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="1"
          className="animate-pulse"
        />
        <ellipse
          cx="50%"
          cy="50%"
          rx="45%"
          ry="32%"
          fill="none"
          stroke="#6366F1"
          strokeWidth="1"
          className="animate-pulse"
          style={{ animationDelay: "0.7s" }}
        />
        <ellipse
          cx="50%"
          cy="50%"
          rx="55%"
          ry="38%"
          fill="none"
          stroke="#4F46E5"
          strokeWidth="0.5"
          className="animate-pulse"
          style={{ animationDelay: "1.4s" }}
        />
      </svg>

      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={`star-${i}`}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.animationDelay,
              opacity: star.opacity,
              boxShadow: star.size > 1 ? "0 0 4px rgba(255,255,255,0.8)" : "none",
            }}
          />
        ))}

        {/* Sparkle stars */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute text-white animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 8 + 8}px`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* Planets */}
      <div className="absolute inset-0">
        {planets.map((planet) => (
          <div
            key={planet.id}
            className="absolute animate-float"
            style={{
              top: planet.top,
              left: planet.left,
              width: `${planet.size}px`,
              height: `${planet.size}px`,
              animationDelay: planet.animationDelay,
            }}
          >
            {/* Planet body */}
            <div
              className={`relative w-full h-full rounded-full bg-gradient-to-br ${planet.gradient}`}
              style={{
                boxShadow: `0 0 ${planet.size / 3}px ${planet.color}80, inset -${planet.size / 8}px -${planet.size / 8}px ${planet.size / 4}px rgba(0,0,0,0.3)`,
              }}
            >
              {/* Planet patterns */}
              {planet.pattern === "craters" && (
                <>
                  <div className="absolute top-[20%] left-[25%] w-[30%] h-[30%] rounded-full bg-orange-600/40" />
                  <div className="absolute top-[50%] left-[50%] w-[25%] h-[25%] rounded-full bg-orange-700/30" />
                  <div className="absolute top-[35%] left-[60%] w-[20%] h-[20%] rounded-full bg-yellow-600/30" />
                  <div className="absolute top-[65%] left-[30%] w-[35%] h-[35%] rounded-full bg-orange-800/50" />
                </>
              )}

              {planet.pattern === "dots" && (
                <>
                  <div className="absolute top-[15%] left-[20%] w-[15%] h-[15%] rounded-full bg-pink-600/60" />
                  <div className="absolute top-[40%] left-[35%] w-[20%] h-[20%] rounded-full bg-pink-700/50" />
                  <div className="absolute top-[60%] left-[60%] w-[18%] h-[18%] rounded-full bg-rose-600/40" />
                  <div className="absolute top-[30%] left-[65%] w-[12%] h-[12%] rounded-full bg-pink-500/50" />
                </>
              )}

              {planet.pattern === "stripes" && (
                <>
                  <div className="absolute top-[20%] inset-x-0 h-[15%] bg-yellow-500/30 rounded-full" />
                  <div className="absolute top-[45%] inset-x-0 h-[20%] bg-orange-700/40 rounded-full" />
                  <div className="absolute top-[70%] inset-x-0 h-[12%] bg-amber-600/35 rounded-full" />
                </>
              )}

              {planet.pattern === "swirl" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-purple-500/20 to-transparent" />
              )}
            </div>

            {/* Ring for ringed planets */}
            {planet.hasRing && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: `${planet.size * 1.8}px`,
                  height: `${planet.size * 0.6}px`,
                }}
              >
                <div
                  className={`w-full h-full rounded-full border-4 ${
                    planet.ringColor === "cyan" ? "border-cyan-400/60" : "border-orange-400/60"
                  }`}
                  style={{
                    transform: "rotateX(75deg)",
                    boxShadow: `0 0 15px ${planet.ringColor === "cyan" ? "#22D3EE" : "#FB923C"}40`,
                  }}
                />
              </div>
            )}
          </div>
        ))}

        {/* Small rocket */}
        <div className="absolute top-[60%] left-[70%] text-4xl animate-float" style={{ animationDelay: "1.2s" }}>
          🚀
        </div>
      </div>
    </div>
  )
}
