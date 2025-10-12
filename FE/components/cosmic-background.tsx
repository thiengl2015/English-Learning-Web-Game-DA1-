export function CosmicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-violet-950">
      {/* Large purple blur circles */}
      <div className="absolute w-[860px] h-[860px] left-[1400px] -top-[171px] bg-purple-500 rounded-full blur-[200px]" />

      {/* Blue blur circles */}
      <div className="absolute w-[585px] h-[585px] left-[1213px] top-[241px] bg-blue-500 rounded-full blur-[125px]" />
      <div className="absolute w-[714px] h-[713px] left-[246px] top-[332px] bg-blue-500 rounded-full blur-[150px]" />

      {/* Sky blue blur circle */}
      <div className="absolute w-[818px] h-[818px] left-[649px] top-[417px] bg-sky-400 rounded-full blur-[150px]" />

      {/* Green blur circle */}
      <div className="absolute w-96 h-96 left-[763px] top-[651px] bg-green-200 rounded-full blur-3xl" />

      {/* Animated Planets */}
      <div className="absolute top-[10%] right-[15%] w-24 h-24 rounded-full bg-gradient-to-br from-cyan-300 to-blue-400 animate-float opacity-90 shadow-2xl" />
      <div className="absolute top-[20%] left-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 animate-float-slow opacity-80 shadow-2xl" />
      <div className="absolute bottom-[25%] right-[25%] w-20 h-20 rounded-full bg-gradient-to-br from-green-300 to-cyan-300 animate-float opacity-85 shadow-2xl" />
      <div className="absolute top-[15%] right-[5%] w-40 h-40 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-blue-500 animate-float-slow opacity-75 shadow-2xl" />

      {/* Planet with Ring */}
      <div className="absolute top-[8%] left-[5%] w-28 h-28 animate-float">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-2xl" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-8 border-4 border-cyan-300 rounded-full opacity-60"
            style={{ transform: "translate(-50%, -50%) rotateX(75deg)" }}
          />
        </div>
      </div>

      {/* Clouds */}
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

      {/* Stars */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 60}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>
    </div>
  )
}
