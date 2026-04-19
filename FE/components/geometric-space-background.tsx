"use client"

import { useEffect, useRef } from "react"

interface Pill {
  x: number
  y: number
  length: number
  width: number
  speed: number
  color: string
  alpha: number
}

interface Diamond {
  x: number
  y: number
  size: number
  rotation: number
  rotSpeed: number
  color: string
}

interface StarShape {
  x: number
  y: number
  outerR: number
  innerR: number
  rotation: number
  rotSpeed: number
  color: string
}

interface Planet {
  x: number
  y: number
  r: number
  ringAngle: number
}

interface ConstellationDot {
  x: number
  y: number
  vx: number
  vy: number
}

interface Sparkle {
  x: number
  y: number
  alpha: number
  phase: number
  speed: number
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(size * 0.55, 0)
  ctx.lineTo(0, size)
  ctx.lineTo(-size * 0.55, 0)
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = color.replace(")", ", 0.15)").replace("rgb(", "rgba(").replace("hsl(", "hsla(")
  ctx.fill()
  // inner facet lines
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(size * 0.55, 0)
  ctx.moveTo(0, -size)
  ctx.lineTo(-size * 0.55, 0)
  ctx.strokeStyle = color.replace(")", ", 0.5)").replace("rgb(", "rgba(").replace("hsl(", "hsla(")
  ctx.lineWidth = 0.8
  ctx.stroke()
  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, outerR: number, innerR: number, rotation: number, color: string) {
  const points = 4
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points
    const r = i % 2 === 0 ? outerR : innerR
    i === 0 ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
            : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
  }
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = color.replace(")", ", 0.1)").replace("rgb(", "rgba(").replace("hsl(", "hsla(")
  ctx.fill()
  ctx.restore()
}

function drawPlanet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  // Dark circle with concentric rings
  ctx.save()
  ctx.translate(x, y)
  // outer glow
  const grad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.4)
  grad.addColorStop(0, "rgba(100,80,160,0.18)")
  grad.addColorStop(1, "rgba(100,80,160,0)")
  ctx.beginPath()
  ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  // body
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(30,20,60,0.85)"
  ctx.fill()
  ctx.strokeStyle = "rgba(160,140,220,0.5)"
  ctx.lineWidth = 1
  ctx.stroke()
  // inner circle
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2)
  ctx.strokeStyle = "rgba(160,140,220,0.3)"
  ctx.lineWidth = 1
  ctx.stroke()
  // animated ring ellipses
  const ringTilt = 0.35
  for (let i = 0; i < 3; i++) {
    const rr = r * (1.35 + i * 0.22)
    ctx.save()
    ctx.scale(1, ringTilt)
    ctx.beginPath()
    ctx.arc(0, 0, rr, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(160,140,220,${0.25 - i * 0.07})`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
  }
  // small dot on ring
  const dotAngle = t * 0.4 + Math.PI * 0.3
  const dotR = r * 1.55
  ctx.beginPath()
  ctx.arc(Math.cos(dotAngle) * dotR, Math.sin(dotAngle) * dotR * ringTilt, 3, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(200,180,255,0.8)"
  ctx.fill()
  ctx.restore()
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) {
  const s = 4
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = "white"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x - s, y); ctx.lineTo(x + s, y)
  ctx.moveTo(x, y - s); ctx.lineTo(x, y + s)
  ctx.moveTo(x - s * 0.5, y - s * 0.5); ctx.lineTo(x + s * 0.5, y + s * 0.5)
  ctx.moveTo(x + s * 0.5, y - s * 0.5); ctx.lineTo(x - s * 0.5, y + s * 0.5)
  ctx.stroke()
  ctx.restore()
}

export function GeometricSpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let t = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Pills (diagonal streaks) — angle ~-35deg
    const pills: Pill[] = Array.from({ length: 14 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: 120 + Math.random() * 160,
      width: 10 + Math.random() * 12,
      speed: 0.15 + Math.random() * 0.25,
      color: Math.random() > 0.4 ? "#8b5cf6" : "#a855f7",
      alpha: 0.55 + Math.random() * 0.35,
    }))

    // Diamonds
    const diamonds: Diamond[] = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 14 + Math.random() * 20,
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.005,
      color: Math.random() > 0.5 ? "rgb(180,200,230)" : "rgb(150,180,220)",
    }))

    // Stars (4-pointed)
    const stars: StarShape[] = Array.from({ length: 6 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      outerR: 18 + Math.random() * 16,
      innerR: 7 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.004,
      color: Math.random() > 0.5 ? "rgb(180,210,240)" : "rgb(160,190,230)",
    }))

    // Planets
    const planets: Planet[] = Array.from({ length: 4 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 28 + Math.random() * 28,
      ringAngle: 0,
    }))

    // Constellation dots
    const cDots: ConstellationDot[] = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
    }))

    // Sparkles (static small white stars)
    const sparkles: Sparkle[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      alpha: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.02,
    }))

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      t += 0.016

      // Background
      ctx.fillStyle = "#13103a"
      ctx.fillRect(0, 0, w, h)

      // Dot grid overlay
      ctx.save()
      ctx.globalAlpha = 0.07
      ctx.fillStyle = "#9b8ec4"
      const gridSpacing = 28
      for (let gx = 0; gx < w; gx += gridSpacing) {
        for (let gy = 0; gy < h; gy += gridSpacing) {
          ctx.beginPath()
          ctx.arc(gx, gy, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()

      // Large dark blob circles in bg
      const blobPositions = [
        { x: w * 0.12, y: h * 0.3, r: h * 0.22 },
        { x: w * 0.55, y: h * 0.15, r: h * 0.18 },
        { x: w * 0.82, y: h * 0.55, r: h * 0.2 },
        { x: w * 0.35, y: h * 0.75, r: h * 0.16 },
      ]
      blobPositions.forEach(b => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0, "rgba(40,25,80,0.55)")
        g.addColorStop(1, "rgba(40,25,80,0)")
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      })

      // Pills
      const pillAngle = -Math.PI / 5
      pills.forEach(p => {
        p.x += Math.cos(pillAngle) * p.speed
        p.y += Math.sin(pillAngle) * p.speed
        if (p.x > w + 200) { p.x = -200; p.y = Math.random() * h }
        if (p.y < -200) { p.y = h + 200; p.x = Math.random() * w }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(pillAngle)
        const halfL = p.length / 2
        const grd = ctx.createLinearGradient(-halfL, 0, halfL, 0)
        grd.addColorStop(0, "transparent")
        grd.addColorStop(0.15, p.color)
        grd.addColorStop(0.85, p.color)
        grd.addColorStop(1, "transparent")
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.roundRect(-halfL, -p.width / 2, p.length, p.width, p.width / 2)
        ctx.fillStyle = grd
        ctx.fill()
        ctx.restore()
      })

      // Planets
      planets.forEach(pl => {
        drawPlanet(ctx, pl.x, pl.y, pl.r, t)
      })

      // Diamonds
      diamonds.forEach(d => {
        d.rotation += d.rotSpeed
        drawDiamond(ctx, d.x, d.y, d.size, d.rotation, d.color)
      })

      // Stars
      stars.forEach(s => {
        s.rotation += s.rotSpeed
        drawStar(ctx, s.x, s.y, s.outerR, s.innerR, s.rotation, s.color)
      })

      // Constellation connections
      ctx.save()
      cDots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > w) d.vx *= -1
        if (d.y < 0 || d.y > h) d.vy *= -1
      })
      // Draw connections
      for (let i = 0; i < cDots.length; i++) {
        for (let j = i + 1; j < cDots.length; j++) {
          const dx = cDots[i].x - cDots[j].x
          const dy = cDots[i].y - cDots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.35
            ctx.beginPath()
            ctx.moveTo(cDots[i].x, cDots[i].y)
            ctx.lineTo(cDots[j].x, cDots[j].y)
            ctx.strokeStyle = `rgba(200,150,255,${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
      // Draw dots
      cDots.forEach(d => {
        ctx.beginPath()
        ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(220,180,255,0.7)"
        ctx.fill()
      })
      ctx.restore()

      // Sparkles
      sparkles.forEach(sp => {
        sp.phase += sp.speed
        sp.alpha = (Math.sin(sp.phase) * 0.5 + 0.5) * 0.85
        drawSparkle(ctx, sp.x, sp.y, sp.alpha * 0.6)
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full"
      aria-hidden="true"
    />
  )
}
