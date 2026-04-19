"use client"

import { useEffect, useRef } from "react"

/* ─── Seeded PRNG (mulberry32) for stable star positions ─── */
function makePRNG(seed: number) {
  let s = seed | 0
  return function () {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff
  }
}
const rng = makePRNG(0xcafe1234)

/* ─── Star data ─── */
const STARS = Array.from({ length: 48 }, () => ({
  left: rng() * 100,
  top: rng() * 68,
  color: rng() > 0.5 ? "#ff9de2" : "#7ef0ff",
  size: 2 + rng() * 2.5,
  delay: rng() * 4,
  dur: 1.8 + rng() * 2.2,
}))

/* ─── Planet definitions ─── */
const PLANETS = [
  { x: 4, y: 16, size: 140, body: ["#4fd1f5", "#1a9ecf"], ring: "#d946ef", glow: "#4fd1f5", dur: 6, delay: 0, hasRing: true },
  { x: 10, y: 50, size: 110, body: ["#a78bfa", "#6d28d9"], ring: "#a78bfa", glow: "#a78bfa", dur: 7.5, delay: 0.8, hasRing: true },
  { x: 16, y: 38, size: 56, body: ["#bef264", "#65a30d"], ring: null, glow: "#bef264", dur: 5.5, delay: 1.2, hasRing: false },
  { x: 32, y: 4, size: 48, body: ["#c084fc", "#7c3aed"], ring: null, glow: "#c084fc", dur: 8, delay: 2, hasRing: false },
  { x: 80, y: 16, size: 56, body: ["#a78bfa", "#6d28d9"], ring: null, glow: "#a78bfa", dur: 6.5, delay: 0.5, hasRing: false },
  { x: 82, y: 44, size: 134, body: ["#6ee7b7", "#0d9488"], ring: "#f43f5e", glow: "#6ee7b7", dur: 7, delay: 1, hasRing: true },
  { x: 90, y: 26, size: 100, body: ["#d9f99d", "#65a30d"], ring: "#a3e635", glow: "#d9f99d", dur: 5, delay: 1.5, hasRing: true },
]

function Planet({ x, y, size, body, ring, glow, dur, delay, hasRing }: typeof PLANETS[0]) {
  const s = size
  const ringW = s * 1.65
  const ringH = s * 0.28
  const ringTop = s * 0.36
  const glowSize = s * 3.2

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: s,
        height: s,
        animation: `cosmicFloat ${dur}s ease-in-out ${delay}s infinite`,
      }}
    >
      {/* Backlight glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: glowSize,
          height: glowSize,
          left: -(glowSize - s) / 2,
          top: -(glowSize - s) / 2,
          background: `radial-gradient(circle, ${glow}55 0%, ${glow}22 35%, transparent 70%)`,
          zIndex: 0,
        }}
      />

      {/* Back half of ring */}
      {hasRing && ring && (
        <div
          className="absolute rounded-full"
          style={{
            width: ringW,
            height: ringH,
            left: -(ringW - s) / 2,
            top: ringTop,
            border: `${s * 0.072}px solid ${ring}`,
            opacity: 0.85,
            zIndex: 0,
            clipPath: "ellipse(50% 50% at 50% 0%)",
          }}
        />
      )}

      {/* Planet sphere */}
      <div
        className="absolute rounded-full shadow-2xl"
        style={{
          inset: 0,
          background: `radial-gradient(circle at 35% 30%, ${body[0]}, ${body[1]})`,
          zIndex: 1,
        }}
      >
        {/* Gloss highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: "42%",
            height: "28%",
            top: "12%",
            left: "18%",
            background: "radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>

      {/* Front half of ring (overlaps planet) */}
      {hasRing && ring && (
        <div
          className="absolute rounded-full"
          style={{
            width: ringW,
            height: ringH,
            left: -(ringW - s) / 2,
            top: ringTop,
            border: `${s * 0.072}px solid ${ring}`,
            opacity: 0.85,
            zIndex: 2,
            clipPath: "ellipse(50% 50% at 50% 100%)",
          }}
        />
      )}
    </div>
  )
}

/* ─── Cartoon cloud layer ─── */
function Clouds() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: "42%" }}>
      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cloudGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="cloudGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="cloudGrad3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="cloudGradBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0" />
            <stop offset="40%" stopColor="#7dd3fc" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Deep back cloud layer — purple */}
        <ellipse cx="200" cy="260" rx="190" ry="75" fill="url(#cloudGrad2)" opacity="0.7" />
        <ellipse cx="320" cy="240" rx="140" ry="60" fill="url(#cloudGrad2)" opacity="0.75" />
        <ellipse cx="130" cy="275" rx="160" ry="65" fill="url(#cloudGrad2)" opacity="0.8" />
        <ellipse cx="1220" cy="260" rx="195" ry="78" fill="url(#cloudGrad2)" opacity="0.7" />
        <ellipse cx="1100" cy="242" rx="145" ry="62" fill="url(#cloudGrad2)" opacity="0.75" />
        <ellipse cx="1320" cy="278" rx="165" ry="68" fill="url(#cloudGrad2)" opacity="0.8" />

        {/* Mid cloud layer — blue */}
        <ellipse cx="160" cy="285" rx="175" ry="70" fill="url(#cloudGrad1)" opacity="0.85" />
        <ellipse cx="350" cy="270" rx="200" ry="80" fill="url(#cloudGrad1)" opacity="0.9" />
        <ellipse cx="220" cy="295" rx="220" ry="85" fill="url(#cloudGrad1)" opacity="0.9" />
        <ellipse cx="70" cy="295" rx="120" ry="55" fill="url(#cloudGrad1)" opacity="0.85" />
        <ellipse cx="1280" cy="285" rx="175" ry="70" fill="url(#cloudGrad1)" opacity="0.85" />
        <ellipse cx="1090" cy="272" rx="205" ry="82" fill="url(#cloudGrad1)" opacity="0.9" />
        <ellipse cx="1370" cy="290" rx="130" ry="58" fill="url(#cloudGrad1)" opacity="0.85" />

        {/* Centre bottom clouds — teal/mint */}
        <ellipse cx="720" cy="295" rx="260" ry="90" fill="url(#cloudGrad3)" opacity="0.9" />
        <ellipse cx="600" cy="300" rx="190" ry="75" fill="url(#cloudGrad3)" opacity="0.85" />
        <ellipse cx="840" cy="300" rx="195" ry="78" fill="url(#cloudGrad3)" opacity="0.85" />
        <ellipse cx="500" cy="300" rx="160" ry="65" fill="url(#cloudGrad3)" opacity="0.8" />
        <ellipse cx="940" cy="300" rx="160" ry="65" fill="url(#cloudGrad3)" opacity="0.8" />

        {/* Front fill strip — fades up from solid to transparent */}
        <rect x="0" y="210" width="1440" height="90" fill="url(#cloudGradBottom)" />

        {/* Cloud outline highlights */}
        <ellipse cx="720" cy="292" rx="258" ry="88" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <ellipse cx="220" cy="292" rx="218" ry="83" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        <ellipse cx="1220" cy="282" rx="173" ry="68" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/* ─── Main component ─── */
export function CosmicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "linear-gradient(175deg, #0f0c2e 0%, #1a1050 30%, #2d1b6e 60%, #3730a3 80%, #4f46e5 100%)" }}>

      {/* Subtle nebula glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] -left-24 top-[5%]  rounded-full bg-purple-600  blur-[140px] opacity-30" />
        <div className="absolute w-[400px] h-[400px] right-0   top-[8%]  rounded-full bg-indigo-500 blur-[120px] opacity-25" />
        <div className="absolute w-[600px] h-[600px] left-1/3  top-[15%] rounded-full bg-violet-700 blur-[160px] opacity-20" />
      </div>

      {/* Stars */}
      {STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            background: star.color,
            boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
            animation: `cosmicTwinkle ${star.dur}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      {/* Planets */}
      {PLANETS.map((p, i) => (
        <Planet key={i} {...p} />
      ))}

      {/* Clouds */}
      <Clouds />

      {/* Animation keyframes */}
      <style>{`
        @keyframes cosmicFloat {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-14px); }
        }
        @keyframes cosmicTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
