"use client"

export function SpaceBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - matching the deep purple/indigo tones */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #6b5bcd 0%, #4a3fa8 15%, #2d2475 40%, #1e1850 70%, #1a1445 100%)"
        }}
      />

      {/* Radial glow in center */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(100, 80, 180, 0.4) 0%, transparent 50%)"
        }}
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translate(120px, 520px); }
          50% { transform: translate(120px, 500px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(1010px, 340px); }
          50% { transform: translate(1010px, 310px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(220px, 180px); }
          50% { transform: translate(210px, 170px); }
        }
        @keyframes float5 {
          0%, 100% { transform: translate(1190px, 580px); }
          50% { transform: translate(1180px, 540px); }
        }
        @keyframes floatUfo {
          0%, 100% { transform: translate(1080px, 200px); }
          25% { transform: translate(1000px, 200px); }
          50% { transform: translate(1080px, 240px); }
          75% { transform: translate(1070px, 260px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
        @keyframes shootingStar {
          0% { opacity: 0; transform: translateX(0) translateY(0); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateX(60px) translateY(40px); }
        }
        .planet1 { animation: float1 6s ease-in-out infinite; }
        .planet2 { animation: float2 7s ease-in-out infinite; }
        .planet3 { animation: float3 5s ease-in-out infinite; }
        .planet5 { animation: float5 6.5s ease-in-out infinite; }
        .ufo { animation: floatUfo 4s ease-in-out infinite; }
        .twinkle1 { animation: twinkle 2s ease-in-out infinite; }
        .twinkle2 { animation: twinkle 2.5s ease-in-out infinite 0.5s; }
        .twinkle3 { animation: twinkle 3s ease-in-out infinite 1s; }
      `}</style>

      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Planet gradients - matching image colors */}
          <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8c8e8" />
            <stop offset="50%" stopColor="#8a9bc8" />
            <stop offset="100%" stopColor="#6a7ba8" />
          </linearGradient>

          <linearGradient id="pinkPlanetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e896d8" />
            <stop offset="50%" stopColor="#c870b0" />
            <stop offset="100%" stopColor="#a05090" />
          </linearGradient>

          <linearGradient id="smallPlanetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9a8dc8" />
            <stop offset="100%" stopColor="#6a5d98" />
          </linearGradient>

          <linearGradient id="ufoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5a6880" />
            <stop offset="100%" stopColor="#3a4860" />
          </linearGradient>

          <linearGradient id="ufoTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#70c8c0" />
            <stop offset="100%" stopColor="#50a8a0" />
          </linearGradient>

          <linearGradient id="cloudGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a7acc" />
            <stop offset="100%" stopColor="#6a5aac" />
          </linearGradient>

          <linearGradient id="cloudGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7a6abc" />
            <stop offset="100%" stopColor="#5a4a9c" />
          </linearGradient>

          <linearGradient id="meteorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff90c0" stopOpacity="0" />
            <stop offset="100%" stopColor="#ff70a0" />
          </linearGradient>

          <linearGradient id="meteorGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c8c8e0" stopOpacity="0" />
            <stop offset="100%" stopColor="#e0e0f0" />
          </linearGradient>
        </defs>

        {/* Cloud shapes - top left */}
        <path
          d="M0 0 L0 200 Q60 230, 140 180 Q220 130, 300 160 Q380 190, 460 120 Q540 50, 600 0 Z"
          fill="url(#cloudGradient1)"
          opacity="0.95"
        />
        <path
          d="M0 0 L0 140 Q50 170, 120 120 Q190 70, 260 100 Q330 130, 400 60 Q450 0, 480 0 Z"
          fill="url(#cloudGradient2)"
          opacity="0.8"
        />

        {/* Cloud shapes - bottom right */}
        <path
          d="M1200 800 L1200 600 Q1140 550, 1060 600 Q970 660, 880 630 Q790 600, 710 680 Q640 760, 580 800 Z"
          fill="url(#cloudGradient1)"
          opacity="0.95"
        />
        <path
          d="M1200 800 L1200 680 Q1150 630, 1080 680 Q1010 730, 940 700 Q870 670, 820 740 Q780 790, 740 800 Z"
          fill="url(#cloudGradient2)"
          opacity="0.8"
        />

        {/* Large moon with craters - bottom left */}
        <g className="planet1" style={{ transform: 'translate(120px, 520px)' }}>
          <circle cx="0" cy="0" r="85" fill="url(#moonGradient)" />
          <ellipse cx="-35" cy="-25" rx="22" ry="18" fill="#a0b0d0" opacity="0.5" />
          <ellipse cx="25" cy="15" rx="15" ry="12" fill="#a0b0d0" opacity="0.4" />
          <ellipse cx="-10" cy="35" rx="10" ry="8" fill="#a0b0d0" opacity="0.35" />
          <ellipse cx="40" cy="-30" rx="8" ry="6" fill="#a0b0d0" opacity="0.4" />
          <ellipse cx="-45" cy="10" rx="6" ry="5" fill="#a0b0d0" opacity="0.3" />
        </g>

        {/* Pink planet with ring - top right */}
        <g className="planet2" style={{ transform: 'translate(950px, 280px)' }}>
          {/* Back ring */}
          <ellipse cx="0" cy="0" rx="85" ry="18" fill="none" stroke="#c0b0d8" strokeWidth="4" opacity="0.4" transform="rotate(-15)" />
          {/* Planet body */}
          <circle cx="0" cy="0" r="45" fill="url(#pinkPlanetGradient)" />
          {/* Front ring */}
          <ellipse cx="0" cy="0" rx="85" ry="18" fill="none" stroke="#d8c8e8" strokeWidth="2" opacity="0.3" transform="rotate(-15)" />
        </g>

        {/* Small moon with craters - top left area */}
        <g className="planet3" style={{ transform: 'translate(100px, 100px)' }}>
          <circle cx="0" cy="0" r="28" fill="#d8c8e8" />
          <ellipse cx="-10" cy="-8" rx="8" ry="6" fill="#c0b0d8" opacity="0.6" />
          <ellipse cx="10" cy="10" rx="5" ry="4" fill="#c0b0d8" opacity="0.5" />
          <ellipse cx="-5" cy="12" rx="4" ry="3" fill="#c0b0d8" opacity="0.4" />
        </g>


        {/* Small planet with craters - bottom right area */}
        <g className="planet5" style={{ transform: 'translate(1050px, 680px)' }}>
          <circle cx="0" cy="0" r="38" fill="url(#smallPlanetGradient)" />
          <ellipse cx="-12" cy="-10" rx="10" ry="8" fill="#b0a0c8" opacity="0.45" />
          <ellipse cx="12" cy="12" rx="7" ry="5" fill="#b0a0c8" opacity="0.35" />
          <ellipse cx="-8" cy="15" rx="5" ry="4" fill="#b0a0c8" opacity="0.3" />
        </g>

        {/* UFO */}
        <g className="ufo" style={{ transform: 'translate(866px, 166px)' }}>
          <ellipse cx="0" cy="10" rx="32" ry="10" fill="url(#ufoGradient)" />
          <ellipse cx="0" cy="2" rx="22" ry="14" fill="url(#ufoTopGradient)" />
          <ellipse cx="0" cy="-6" rx="12" ry="7" fill="#90d8d0" opacity="0.7" />
        </g>

        {/* Shooting stars / Meteors - pink */}
        <line x1="200" y1="200" x2="260" y2="240" stroke="url(#meteorGradient)" strokeWidth="2" strokeLinecap="round" />
        <line x1="420" y1="320" x2="470" y2="355" stroke="url(#meteorGradient)" strokeWidth="2" strokeLinecap="round" />
        <line x1="720" y1="480" x2="770" y2="520" stroke="url(#meteorGradient)" strokeWidth="2" strokeLinecap="round" />
        <line x1="580" y1="80" x2="615" y2="105" stroke="url(#meteorGradient)" strokeWidth="2" strokeLinecap="round" />
        <line x1="1020" y1="420" x2="1060" y2="450" stroke="url(#meteorGradient)" strokeWidth="2" strokeLinecap="round" />
        <line x1="320" y1="620" x2="360" y2="650" stroke="url(#meteorGradient)" strokeWidth="2" strokeLinecap="round" />

        {/* Shooting stars - white/light */}
        <line x1="170" y1="380" x2="210" y2="410" stroke="url(#meteorGradient2)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="650" y1="250" x2="685" y2="275" stroke="url(#meteorGradient2)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Sparkle stars - 4 pointed white */}
        <g transform="translate(750, 200)" fill="#ffffff" className="twinkle1">
          <path d="M0 -10 L1.2 -1.2 L10 0 L1.2 1.2 L0 10 L-1.2 1.2 L-10 0 L-1.2 -1.2 Z" />
        </g>
        <g transform="translate(620, 170)" fill="#ffffff" opacity="0.9" className="twinkle2">
          <path d="M0 -7 L0.9 -0.9 L7 0 L0.9 0.9 L0 7 L-0.9 0.9 L-7 0 L-0.9 -0.9 Z" />
        </g>
        <g transform="translate(880, 380)" fill="#ffffff" opacity="0.8" className="twinkle3">
          <path d="M0 -6 L0.8 -0.8 L6 0 L0.8 0.8 L0 6 L-0.8 0.8 L-6 0 L-0.8 -0.8 Z" />
        </g>

        {/* Sparkle stars - pink */}
        <g transform="translate(180, 320)" fill="#ff90c0" opacity="0.9" className="twinkle2">
          <path d="M0 -6 L0.8 -0.8 L6 0 L0.8 0.8 L0 6 L-0.8 0.8 L-6 0 L-0.8 -0.8 Z" />
        </g>
        <g transform="translate(420, 580)" fill="#ff90c0" opacity="0.8" className="twinkle1">
          <path d="M0 -5 L0.6 -0.6 L5 0 L0.6 0.6 L0 5 L-0.6 0.6 L-5 0 L-0.6 -0.6 Z" />
        </g>
        <g transform="translate(1080, 380)" fill="#ff90c0" opacity="0.7" className="twinkle3">
          <path d="M0 -5 L0.6 -0.6 L5 0 L0.6 0.6 L0 5 L-0.6 0.6 L-5 0 L-0.6 -0.6 Z" />
        </g>

        {/* Tiny stars / dots */}
        <circle cx="320" cy="140" r="1.5" fill="#ffffff" opacity="0.8" className="twinkle1" />
        <circle cx="480" cy="220" r="1" fill="#ffffff" opacity="0.6" className="twinkle2" />
        <circle cx="620" cy="320" r="1.5" fill="#ffffff" opacity="0.7" className="twinkle3" />
        <circle cx="380" cy="420" r="1" fill="#ffffff" opacity="0.5" className="twinkle1" />
        <circle cx="520" cy="500" r="1.5" fill="#ffffff" opacity="0.6" className="twinkle2" />
        <circle cx="870" cy="420" r="1" fill="#ffffff" opacity="0.7" className="twinkle3" />
        <circle cx="970" cy="520" r="1.5" fill="#ffffff" opacity="0.5" className="twinkle1" />
        <circle cx="720" cy="370" r="1" fill="#ffffff" opacity="0.6" className="twinkle2" />
        <circle cx="270" cy="520" r="1" fill="#ffffff" opacity="0.7" className="twinkle3" />
        <circle cx="1120" cy="320" r="1.5" fill="#ffffff" opacity="0.6" className="twinkle1" />
        <circle cx="200" cy="260" r="1" fill="#ffffff" opacity="0.5" className="twinkle2" />
        <circle cx="500" cy="100" r="1" fill="#ffffff" opacity="0.6" className="twinkle3" />
        <circle cx="840" cy="570" r="1.5" fill="#ffffff" opacity="0.5" className="twinkle1" />
        <circle cx="670" cy="620" r="1" fill="#ffffff" opacity="0.7" className="twinkle2" />
        <circle cx="400" cy="720" r="1.5" fill="#ffffff" opacity="0.6" className="twinkle3" />
        <circle cx="920" cy="670" r="1" fill="#ffffff" opacity="0.5" className="twinkle1" />
        <circle cx="1020" cy="170" r="1" fill="#ffffff" opacity="0.6" className="twinkle2" />
        <circle cx="170" cy="670" r="1" fill="#ffffff" opacity="0.5" className="twinkle3" />
      </svg>
    </div>
  )
}
