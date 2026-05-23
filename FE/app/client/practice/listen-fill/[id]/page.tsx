"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Volume2, Play, Pause, RotateCcw, ChevronRight } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

// ── Data ──────────────────────────────────────────────────────────────────────

interface BlankSegment { type: "blank"; id: string; answer: string }
interface TextSegment { type: "text"; content: string }
type Segment = TextSegment | BlankSegment

interface Part {
  id: string
  passage: Segment[]   // inline blanks within the text
  audioSrc?: string
}

interface Topic {
  id: string
  title: string
  image: string
  parts: Part[]
}

const TOPIC_DATA: Record<string, Topic> = {
  "daily-activities": {
    id: "daily-activities",
    title: "Daily Activities",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=daily",
    parts: [
      {
        id: "p1",
        passage: [
          { type: "text", content: "Every morning I " },
          { type: "blank", id: "b1", answer: "wake" },
          { type: "text", content: " up at seven o'clock. I " },
          { type: "blank", id: "b2", answer: "brush" },
          { type: "text", content: " my teeth and " },
          { type: "blank", id: "b3", answer: "wash" },
          { type: "text", content: " my face." },
        ],
      },
      {
        id: "p2",
        passage: [
          { type: "text", content: "After breakfast I " },
          { type: "blank", id: "b1", answer: "go" },
          { type: "text", content: " to school by " },
          { type: "blank", id: "b2", answer: "bus" },
          { type: "text", content: ". Classes " },
          { type: "blank", id: "b3", answer: "start" },
          { type: "text", content: " at eight thirty." },
        ],
      },
      {
        id: "p3",
        passage: [
          { type: "text", content: "In the afternoon I " },
          { type: "blank", id: "b1", answer: "do" },
          { type: "text", content: " my homework. Then I " },
          { type: "blank", id: "b2", answer: "play" },
          { type: "text", content: " outside with my " },
          { type: "blank", id: "b3", answer: "friends" },
          { type: "text", content: "." },
        ],
      },
      {
        id: "p4",
        passage: [
          { type: "text", content: "At night I " },
          { type: "blank", id: "b1", answer: "eat" },
          { type: "text", content: " dinner with my family and " },
          { type: "blank", id: "b2", answer: "watch" },
          { type: "text", content: " TV. I " },
          { type: "blank", id: "b3", answer: "sleep" },
          { type: "text", content: " at ten o'clock." },
        ],
      },
    ],
  },
  "seasons": {
    id: "seasons",
    title: "The Seasons",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=seasons",
    parts: [
      {
        id: "p1",
        passage: [
          { type: "text", content: "There are four " },
          { type: "blank", id: "b1", answer: "seasons" },
          { type: "text", content: " in a year. They are spring, " },
          { type: "blank", id: "b2", answer: "summer" },
          { type: "text", content: ", autumn and " },
          { type: "blank", id: "b3", answer: "winter" },
          { type: "text", content: "." },
        ],
      },
      {
        id: "p2",
        passage: [
          { type: "text", content: "In spring the " },
          { type: "blank", id: "b1", answer: "flowers" },
          { type: "text", content: " bloom and birds " },
          { type: "blank", id: "b2", answer: "sing" },
          { type: "text", content: ". The weather is " },
          { type: "blank", id: "b3", answer: "warm" },
          { type: "text", content: " and pleasant." },
        ],
      },
      {
        id: "p3",
        passage: [
          { type: "text", content: "Summer is " },
          { type: "blank", id: "b1", answer: "hot" },
          { type: "text", content: " and sunny. Children love to " },
          { type: "blank", id: "b2", answer: "swim" },
          { type: "text", content: " in the " },
          { type: "blank", id: "b3", answer: "sea" },
          { type: "text", content: "." },
        ],
      },
      {
        id: "p4",
        passage: [
          { type: "text", content: "Winter is very " },
          { type: "blank", id: "b1", answer: "cold" },
          { type: "text", content: ". Sometimes it " },
          { type: "blank", id: "b2", answer: "snows" },
          { type: "text", content: ". People wear " },
          { type: "blank", id: "b3", answer: "coats" },
          { type: "text", content: " to keep warm." },
        ],
      },
    ],
  },
  "animals": {
    id: "animals",
    title: "Wild Animals",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=animals",
    parts: [
      {
        id: "p1",
        passage: [
          { type: "text", content: "Lions are called the " },
          { type: "blank", id: "b1", answer: "king" },
          { type: "text", content: " of the jungle. They " },
          { type: "blank", id: "b2", answer: "hunt" },
          { type: "text", content: " in groups called " },
          { type: "blank", id: "b3", answer: "prides" },
          { type: "text", content: "." },
        ],
      },
      {
        id: "p2",
        passage: [
          { type: "text", content: "Elephants are the largest " },
          { type: "blank", id: "b1", answer: "land" },
          { type: "text", content: " animals. They use their " },
          { type: "blank", id: "b2", answer: "trunks" },
          { type: "text", content: " to " },
          { type: "blank", id: "b3", answer: "drink" },
          { type: "text", content: " water." },
        ],
      },
      {
        id: "p3",
        passage: [
          { type: "text", content: "Dolphins are very " },
          { type: "blank", id: "b1", answer: "smart" },
          { type: "text", content: " animals. They " },
          { type: "blank", id: "b2", answer: "live" },
          { type: "text", content: " in the " },
          { type: "blank", id: "b3", answer: "ocean" },
          { type: "text", content: " and can jump high." },
        ],
      },
      {
        id: "p4",
        passage: [
          { type: "text", content: "Penguins cannot " },
          { type: "blank", id: "b1", answer: "fly" },
          { type: "text", content: " but they are excellent " },
          { type: "blank", id: "b2", answer: "swimmers" },
          { type: "text", content: ". They " },
          { type: "blank", id: "b3", answer: "live" },
          { type: "text", content: " in Antarctica." },
        ],
      },
    ],
  },
  "food": {
    id: "food",
    title: "Healthy Food",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=food",
    parts: [
      {
        id: "p1",
        passage: [
          { type: "text", content: "Eating " },
          { type: "blank", id: "b1", answer: "fruits" },
          { type: "text", content: " and vegetables is good for our " },
          { type: "blank", id: "b2", answer: "health" },
          { type: "text", content: ". We should eat them every " },
          { type: "blank", id: "b3", answer: "day" },
          { type: "text", content: "." },
        ],
      },
      {
        id: "p2",
        passage: [
          { type: "text", content: "Milk gives us strong " },
          { type: "blank", id: "b1", answer: "bones" },
          { type: "text", content: ". Meat and eggs give us " },
          { type: "blank", id: "b2", answer: "protein" },
          { type: "text", content: " to " },
          { type: "blank", id: "b3", answer: "grow" },
          { type: "text", content: "." },
        ],
      },
      {
        id: "p3",
        passage: [
          { type: "text", content: "Too much " },
          { type: "blank", id: "b1", answer: "sugar" },
          { type: "text", content: " is bad for our teeth. We should " },
          { type: "blank", id: "b2", answer: "drink" },
          { type: "text", content: " plenty of " },
          { type: "blank", id: "b3", answer: "water" },
          { type: "text", content: " instead." },
        ],
      },
      {
        id: "p4",
        passage: [
          { type: "text", content: "A " },
          { type: "blank", id: "b1", answer: "balanced" },
          { type: "text", content: " diet keeps us " },
          { type: "blank", id: "b2", answer: "healthy" },
          { type: "text", content: " and gives us " },
          { type: "blank", id: "b3", answer: "energy" },
          { type: "text", content: " to do things we love." },
        ],
      },
    ],
  },
}

const TOPIC_KEYS = Object.keys(TOPIC_DATA)

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.trim().toLowerCase()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ListenFillDetailPage() {
  const params = useParams()
  const id = params.id as string
  const topic = TOPIC_DATA[id] ?? TOPIC_DATA["daily-activities"]
  const parts = topic.parts
  const total = parts.length

  // next topic cycling
  const currentIdx = TOPIC_KEYS.indexOf(id)
  const nextTopic = TOPIC_KEYS[(currentIdx + 1) % TOPIC_KEYS.length]

  // part state
  const [currentPart, setCurrentPart] = useState(0)
  const part = parts[currentPart]
  const blanks = part.passage.filter((s): s is BlankSegment => s.type === "blank")

  // per-blank input values
  const [inputs, setInputs] = useState<Record<string, string>>({})

  // checked / result state
  const [checkedParts, setCheckedParts] = useState<Set<number>>(new Set())
  const [completedParts, setCompletedParts] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)

  // audio
  const [isPlaying, setIsPlaying] = useState(false)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  // input refs for Enter key navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // reset inputs when part changes
  useEffect(() => { setInputs({}) }, [currentPart])

  const isChecked = checkedParts.has(currentPart)
  const allFilled = blanks.every((b) => (inputs[b.id] ?? "").trim().length > 0)

  const getBlankState = (blankId: string): "idle" | "correct" | "wrong" => {
    if (!isChecked) return "idle"
    const blank = blanks.find((b) => b.id === blankId)!
    return normalize(inputs[blankId] ?? "") === normalize(blank.answer) ? "correct" : "wrong"
  }

  const handleCheck = () => {
    const newChecked = new Set(checkedParts).add(currentPart)
    setCheckedParts(newChecked)
    const partCorrect = blanks.every(
      (b) => normalize(inputs[b.id] ?? "") === normalize(b.answer)
    )
    let newCompleted = completedParts
    if (partCorrect) {
      newCompleted = new Set(completedParts).add(currentPart)
      setCompletedParts(newCompleted)
    }
    if (newChecked.size === total) {
      setTimeout(() => setShowModal(true), 400)
    }
  }

  const handleNext = () => {
    if (currentPart < total - 1) setCurrentPart(currentPart + 1)
  }

  const handleReset = () => {
    setCurrentPart(0)
    setInputs({})
    setCheckedParts(new Set())
    setCompletedParts(new Set())
    setShowModal(false)
  }

  const handleSpeak = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }
    // Build passage text (fill in answers)
    const text = part.passage
      .map((seg) => (seg.type === "text" ? seg.content : (seg as BlankSegment).answer))
      .join("")
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "en-US"
    utter.rate = 0.9
    utter.onend = () => setIsPlaying(false)
    synthRef.current = utter
    setIsPlaying(true)
    window.speechSynthesis.speak(utter)
  }

  // dot color for part indicators
  const dotColor = (i: number) => {
    if (completedParts.has(i)) return "bg-green-400"
    if (i === currentPart) return "bg-cyan-400"
    if (checkedParts.has(i)) return "bg-red-400/70"
    return "bg-white/25"
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      {/* Header */}
      <Link
        href="/client/practice/listen-repeat"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      {/* Open-book container */}
      <div className="relative z-10 flex items-stretch justify-center gap-0 w-full max-w-5xl px-6 pb-8">
        {/* ─── LEFT PAGE ─── */}
        <div
          className="flex-1 max-w-[420px] rounded-l-2xl flex flex-col items-center justify-between p-8 gap-6"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderRight: "none",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          {/* Title */}
          <h1 className="text-white font-bold text-xl text-center text-balance">{topic.title}</h1>

          {/* Illustration */}
          <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
            <img
              src={topic.image}
              alt={topic.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Audio waveform + play */}
          <div className="w-full flex flex-col items-center gap-3">
            {/* Fake waveform */}
            <div className="flex items-center gap-[3px] h-10">
              {Array.from({ length: 36 }).map((_, i) => {
                const h = [14, 20, 28, 36, 28, 22, 18, 32, 38, 26, 16, 24, 36, 30, 20, 14, 22, 34, 28, 18, 26, 38, 22, 16, 30, 24, 18, 32, 20, 26, 14, 28, 36, 22, 18, 24][i % 36]
                return (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${isPlaying ? "bg-cyan-400" : "bg-white/40"}`}
                    style={{ width: 3, height: h * 0.9 }}
                  />
                )
              })}
            </div>

            {/* Play / Pause button */}
            <button
              onClick={handleSpeak}
              className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all"
            >
              {isPlaying
                ? <Pause className="w-5 h-5 text-white" />
                : <Play className="w-5 h-5 text-white ml-0.5" />}
            </button>
          </div>

          {/* Part label */}
          <p className="text-white/30 text-xs text-center">Part {currentPart + 1} of {total}</p>
        </div>

        {/* ─── SPINE ─── */}
        <div
          className="w-4 flex-shrink-0"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))",
          }}
        />

        {/* ─── RIGHT PAGE ─── */}
        <div
          className="flex-1 max-w-[420px] rounded-r-2xl flex flex-col p-8 gap-4"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderLeft: "none",
            boxShadow: "8px 0 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          {/* Title echo */}
          <h2 className="text-white/80 font-semibold text-lg text-center">{topic.title}</h2>

          {/* Passage with inline blanks */}
          <div className="leading-relaxed text-white/90 text-base flex-1 flex flex-col justify-center">
            <p className="inline">
              {part.passage.map((seg, idx) => {
                if (seg.type === "text") {
                  return <span key={idx}>{seg.content}</span>
                }
                const blank = seg as BlankSegment
                const state = getBlankState(blank.id)
                const val = inputs[blank.id] ?? ""
                const width = Math.max(blank.answer.length * 11, 60)

                const borderColor =
                  state === "correct" ? "border-green-400" :
                    state === "wrong" ? "border-red-400" : "border-white/30 focus-within:border-cyan-400"

                const textColor =
                  state === "correct" ? "text-green-400" :
                    state === "wrong" ? "text-red-400" : "text-cyan-400"

                return (
                  <span key={idx} className="inline-block align-baseline mx-1">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current[blank.id] = el
                      }}
                      type="text"
                      value={val}
                      disabled={isChecked}
                      onChange={(e) => setInputs({ ...inputs, [blank.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isChecked) {
                          e.preventDefault()
                          // Find next blank index
                          const currentIdx = blanks.findIndex((b) => b.id === blank.id)
                          if (currentIdx < blanks.length - 1) {
                            const nextBlank = blanks[currentIdx + 1]
                            inputRefs.current[nextBlank.id]?.focus()
                          }
                        }
                      }}
                      placeholder="..."
                      className={`
                        inline-block border-b-2 bg-transparent outline-none text-center text-sm font-semibold
                        placeholder:text-white/30 transition-colors duration-200
                        ${borderColor} ${textColor}
                        ${!isChecked ? "focus:border-cyan-400" : ""}
                      `}
                      style={{ width }}
                    />
                  </span>
                )
              })}
            </p>

            {/* Answer key - shown after checking */}
            {isChecked && (
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-white/60 text-xs font-semibold mb-3">Correct Answers:</p>
                <p className="leading-relaxed text-white/70 text-sm">
                  {part.passage.map((seg, idx) => {
                    if (seg.type === "text") {
                      return <span key={idx}>{seg.content}</span>
                    }
                    const blank = seg as BlankSegment
                    return (
                      <span key={idx} className="inline-block mx-1">
                        <span className="bg-green-400/20 text-green-300 px-2 py-1 rounded font-semibold">
                          {blank.answer}
                        </span>
                      </span>
                    )
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="w-full flex items-center justify-between">
            {/* Part counter */}
            <span className="text-white/50 text-sm px-3 py-1.5 rounded-full bg-white/8 border border-white/15">
              ({currentPart + 1}/{total})
            </span>

            {/* Dots */}
            <div className="flex gap-1.5">
              {parts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPart(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${dotColor(i)}`}
                />
              ))}
            </div>

            {/* Check / Next */}
            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={!allFilled}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${allFilled
                  ? "bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30"
                  : "bg-white/8 border-white/15 text-white/40 cursor-not-allowed"
                  }`}
              >
                Check
              </button>
            ) : currentPart < total - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-semibold bg-cyan-500 border border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all"
              >
                Next
              </button>
            ) : (
              <div className="w-16" />
            )}
          </div>
        </div>
      </div>

      {/* ─── Completion Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="px-10 py-6 rounded-2xl bg-[#1a2a3a]/90 border-2 border-green-400/50 backdrop-blur-md shadow-[0_0_40px_rgba(74,222,128,0.25)]">
              <p className="text-green-400 text-2xl font-bold text-center">
                Great listening!
              </p>
              <p className="text-white/60 text-sm text-center mt-2 mb-4">
                You completed {completedParts.size}/{total} parts correctly
              </p>
              <div className="flex gap-6">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a2a3a]/90 hover:bg-[#2a3a4a] font-medium border border-white/20 text-gray-300 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Again
                </button>
                <Link
                  href={`/client/practice/listen-fill/${nextTopic}`}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/30"
                >
                  Next Topic
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
