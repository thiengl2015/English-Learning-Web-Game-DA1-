"use client"

import { useEffect, useRef } from "react"

interface GlowStar {
  x: number
  y: number
  r: number
  color: string
  alpha: number
  phase: number
  speed: number
  twinkleAmp: number
}

interface NebulaCloud {
  x: number
  y: number
  rx: number
  ry: number
  color: string
  alpha: number
}

function drawNebulaCloud(ctx: CanvasRenderingContext2D, cloud: NebulaCloud) {
  ctx.save()
  ctx.globalAlpha = cloud.alpha
  const g = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, Math.max(cloud.rx, cloud.ry))
  g.addColorStop(0, cloud.color)
  g.addColorStop(1, "transparent")
  ctx.scale(1, cloud.ry / cloud.rx)
  ctx.beginPath()
  ctx.arc(cloud.x, cloud.y * (cloud.rx / cloud.ry), cloud.rx, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  ctx.restore()
}

function drawGlowDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  // outer glow
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5)
  g.addColorStop(0, color)
  g.addColorStop(0.3, color.replace(")", ",0.4)").replace("rgb(", "rgba("))
  g.addColorStop(1, "transparent")
  ctx.beginPath()
  ctx.arc(x, y, r * 5, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  // core
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = "white"
  ctx.fill()
  ctx.restore()
}

export function GalaxySpiralBackground() {
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

    // Scattered glow stars
    const starColors = [
      "rgb(120,200,255)",  // blue
      "rgb(180,230,255)",  // light blue
      "rgb(255,255,255)",  // white
      "rgb(255,150,200)",  // pink
      "rgb(200,150,255)",  // purple
    ]
    const glowStars: GlowStar[] = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 2.2,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      alpha: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.015,
      twinkleAmp: 0.15 + Math.random() * 0.35,
    }))

    // A few large bright stars
    const brightStars: GlowStar[] = Array.from({ length: 6 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 2.5 + Math.random() * 3,
      color: Math.random() > 0.5 ? "rgb(80,180,255)" : "rgb(255,140,200)",
      alpha: 0.8 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.008,
      twinkleAmp: 0.2 + Math.random() * 0.3,
    }))

    // Nebula clouds (static glow blobs)
    const nebulae: NebulaCloud[] = [
      { x: 0.25, y: 0.25, rx: 0.22, ry: 0.14, color: "rgba(60,30,80,0.9)", alpha: 0.45 },
      { x: 0.75, y: 0.65, rx: 0.18, ry: 0.12, color: "rgba(50,20,60,0.9)", alpha: 0.35 },
      { x: 0.1,  y: 0.7,  rx: 0.14, ry: 0.1,  color: "rgba(80,30,100,0.9)", alpha: 0.3 },
    ]

    // Spiral arms: particles placed along logarithmic spirals
    interface SpiralParticle {
      angle: number
      radius: number
      arm: number
      size: number
      brightness: number
    }
    const spiralParticles: SpiralParticle[] = []
    const numArms = 3
    const particlesPerArm = 350
    for (let arm = 0; arm < numArms; arm++) {
      for (let i = 0; i < particlesPerArm; i++) {
        const t0 = (i / particlesPerArm)
        const angle = t0 * Math.PI * 4 + (arm * Math.PI * 2) / numArms
        const radius = t0 * 0.42 + Math.random() * 0.04 - 0.02
        // Add spread perpendicular to arm
        const spread = (Math.random() - 0.5) * 0.025 * (1 + t0 * 1.5)
        spiralParticles.push({
          angle: angle + spread,
          radius: Math.max(0.01, radius + (Math.random() - 0.5) * 0.015),
          arm,
          size: 0.5 + Math.random() * 1.5 * (1 - t0 * 0.5),
          brightness: 0.3 + Math.random() * 0.7,
        })
      }
    }

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      t += 0.004

      // Background — near-black deep space
      ctx.fillStyle = "#04040e"
      ctx.fillRect(0, 0, w, h)

      // Nebula clouds
      nebulae.forEach(n => {
        const nc: NebulaCloud = {
          ...n,
          x: n.x * w,
          y: n.y * h,
          rx: n.rx * w,
          ry: n.ry * h,
        }
        drawNebulaCloud(ctx, nc)
      })

      // Scattered background stars (tiny, no glow)
      ctx.save()
      for (let i = 0; i < glowStars.length; i++) {
        const s = glowStars[i]
        s.phase += s.speed
        const alpha = s.alpha - s.twinkleAmp * 0.5 + s.twinkleAmp * Math.sin(s.phase)
        ctx.globalAlpha = Math.max(0.1, alpha)
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // Galaxy center position
      const cx = w * 0.52
      const cy = h * 0.5
      const maxR = Math.min(w, h) * 0.76

      // Outer glow halo — soft fade, no hard edge
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.6)
      halo.addColorStop(0,    "rgba(60,120,220,0.22)")
      halo.addColorStop(0.35, "rgba(30,80,160,0.12)")
      halo.addColorStop(0.65, "rgba(20,60,140,0.05)")
      halo.addColorStop(1,    "rgba(0,0,0,0)")
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, w, h)

      // Spiral particles
      ctx.save()
      spiralParticles.forEach(p => {
        const angle = p.angle + t * (0.15 + (1 - p.radius) * 0.25)
        const r = p.radius * maxR
        const px = cx + Math.cos(angle) * r
        const py = cy + Math.sin(angle) * r * 0.38 // flatten to ellipse

        // Color: core = white/cyan, outer = blue/purple
        const coreBlend = 1 - p.radius * 1.8
        let color: string
        if (coreBlend > 0.5) {
          color = `rgba(220,240,255,${p.brightness * 0.9})`
        } else if (coreBlend > 0) {
          color = `rgba(100,200,255,${p.brightness * 0.75})`
        } else {
          color = `rgba(80,100,220,${p.brightness * 0.55})`
        }

        ctx.globalAlpha = 1
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()

      // Galaxy core glow — layered soft radial gradients, no hard arc clip
      const coreGlows = [
        {
          r: maxR * 0.55,
          stops: [
            [0,    "rgba(255,255,255,0.92)"],
            [0.12, "rgba(200,240,255,0.65)"],
            [0.30, "rgba(120,200,255,0.30)"],
            [0.55, "rgba(60,140,220,0.10)"],
            [0.80, "rgba(30,80,180,0.03)"],
            [1,    "rgba(0,0,0,0)"],
          ],
        },
      ]
      coreGlows.forEach(g => {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, g.r)
        g.stops.forEach(([pos, color]) => grad.addColorStop(pos as number, color as string))
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      })

      // Rotating ring lines around core
      ctx.save()
      ctx.translate(cx, cy)
      for (let ring = 0; ring < 5; ring++) {
        const rr = maxR * (0.07 + ring * 0.055)
        const alpha = 0.35 - ring * 0.06
        ctx.save()
        ctx.scale(1, 0.38)
        ctx.beginPath()
        ctx.arc(0, 0, rr, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(160,230,255,${alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }
      ctx.restore()

      // Lens flare cross on brightest core point
      const flareAlpha = 0.25 + 0.1 * Math.sin(t * 1.5)
      ctx.save()
      ctx.globalAlpha = flareAlpha
      const flareLen = maxR * 0.25
      const flareGrad = (x1: number, y1: number, x2: number, y2: number) => {
        const g = ctx.createLinearGradient(x1, y1, x2, y2)
        g.addColorStop(0, "transparent")
        g.addColorStop(0.5, "rgba(200,240,255,0.8)")
        g.addColorStop(1, "transparent")
        return g
      }
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - flareLen, cy); ctx.lineTo(cx + flareLen, cy)
      ctx.strokeStyle = flareGrad(cx - flareLen, cy, cx + flareLen, cy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - flareLen); ctx.lineTo(cx, cy + flareLen)
      ctx.strokeStyle = flareGrad(cx, cy - flareLen, cx, cy + flareLen)
      ctx.stroke()
      ctx.restore()

      // Large bright glowing stars in foreground
      brightStars.forEach(s => {
        s.phase += s.speed
        const alpha = s.alpha - s.twinkleAmp * 0.5 + s.twinkleAmp * Math.sin(s.phase)
        drawGlowDot(ctx, s.x * w, s.y * h, s.r, s.color, Math.max(0.2, alpha))
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
