"use client"

import { useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Mic, MicOff, Volume2, RotateCcw } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

// ─── Types ───────────────────────────────────────────────────────────────────
type SectionAQuestion = { id: number; question: string; matchAnswer: string }
type SectionBQuestion = {
  id: number; audioText: string
  optionA: string; optionAImg: string
  optionB: string; optionBImg: string
  correctOption: "A" | "B"; writeAnswer: string
}
type BlankDef = { blankId: string; options: string[]; answer: string }
type SectionCQuestion = {
  id: number
  lineA: string
  lineB: string
  blank: BlankDef
  blankInA: boolean   // true = blank is in A's line, false = in B's line
}
type SectionDUnscramble = { id: number; scrambled: string[]; answer: string; image: string }
type SectionDReadSpeak = { id: number; question: string; image: string; hint: string; sampleAnswer: string }

// ─── Checkpoint data ──────────────────────────────────────────────────────────
const CHECKPOINT_DATA: Record<string, {
  title: string
  sectionA: SectionAQuestion[]
  sectionAOptions: { letter: string; text: string }[]
  sectionB: SectionBQuestion[]
  sectionC: SectionCQuestion[]
  sectionDUnscramble: SectionDUnscramble[]
  sectionDReadSpeak: SectionDReadSpeak[]
}> = {
  "checkpoint-1": {
    title: "Test Units 1–5",
    sectionA: [
      { id: 1, question: "How was the weather yesterday?", matchAnswer: "C" },
      { id: 2, question: "Where does she live?", matchAnswer: "E" },
      { id: 3, question: "Where were they yesterday?", matchAnswer: "A" },
      { id: 4, question: "What does she have?", matchAnswer: "D" },
      { id: 5, question: "Do you want some cookies?", matchAnswer: "B" },
    ],
    sectionAOptions: [
      { letter: "A", text: "They were in the art room." },
      { letter: "B", text: "Yes, please." },
      { letter: "C", text: "It was cold and snowy." },
      { letter: "D", text: "She has some tape." },
      { letter: "E", text: "She lives near the park." },
    ],
    sectionB: [
      { id: 1, audioText: "basketball", optionA: "Football", optionAImg: "⚽", optionB: "Basketball", optionBImg: "🏀", correctOption: "B", writeAnswer: "basketball" },
      { id: 2, audioText: "rubber bands", optionA: "Rubber bands", optionAImg: "🔗", optionB: "Pencils", optionBImg: "✏️", correctOption: "A", writeAnswer: "rubber bands" },
      { id: 3, audioText: "a scooter", optionA: "A bicycle", optionAImg: "🚲", optionB: "A scooter", optionBImg: "🛴", correctOption: "B", writeAnswer: "a scooter" },
      { id: 4, audioText: "tape", optionA: "Tape", optionAImg: "📦", optionB: "Glue", optionBImg: "🧴", correctOption: "A", writeAnswer: "tape" },
      { id: 5, audioText: "across from", optionA: "Next to", optionAImg: "➡️", optionB: "Across from", optionBImg: "↔️", correctOption: "B", writeAnswer: "across from" },
    ],
    sectionC: [
      {
        id: 1, lineA: "Hi, I'm Scott. What's ___?", lineB: "I'm Kate. Nice to meet you!",
        blank: { blankId: "c1-1", options: ["your name", "you name", "name your"], answer: "your name" },
        blankInA: true,
      },
      {
        id: 2, lineA: "Hello! ___ are you?", lineB: "I'm fine, thanks!",
        blank: { blankId: "c1-2", options: ["How", "What", "Where"], answer: "How" },
        blankInA: true,
      },
      {
        id: 3, lineA: "Hi, Anna! This is my friend Sarah.", lineB: "___, Anna!",
        blank: { blankId: "c1-3", options: ["Nice to meet you", "How are you", "Goodbye"], answer: "Nice to meet you" },
        blankInA: false,
      },
      {
        id: 4, lineA: "Where were you yesterday?", lineB: "I was ___ the library.",
        blank: { blankId: "c1-4", options: ["at", "in", "on"], answer: "at" },
        blankInA: false,
      },
      {
        id: 5, lineA: "Do you have a ruler?", lineB: "Yes, I ___ one.",
        blank: { blankId: "c1-5", options: ["have", "has", "had"], answer: "have" },
        blankInA: false,
      },
    ],
    sectionDUnscramble: [
      { id: 1, scrambled: ["cold", "was", "it"], answer: "it was cold", image: "🌨️" },
      { id: 2, scrambled: ["ruler", "a", "have", "I"], answer: "I have a ruler", image: "📏" },
      { id: 3, scrambled: ["she", "does", "live", "where"], answer: "where does she live", image: "🏠" },
    ],
    sectionDReadSpeak: [
      { id: 1, question: "Where was he this morning?", image: "🏫", hint: "school", sampleAnswer: "he was at school" },
      { id: 2, question: "What does she have?", image: "📦", hint: "tape", sampleAnswer: "she has some tape" },
    ],
  },
  "checkpoint-2": {
    title: "Test Units 6–10",
    sectionA: [
      { id: 1, question: "What time do you wake up?", matchAnswer: "D" },
      { id: 2, question: "Where is the library?", matchAnswer: "A" },
      { id: 3, question: "How do you go to school?", matchAnswer: "C" },
      { id: 4, question: "What is your favorite subject?", matchAnswer: "E" },
      { id: 5, question: "When is your birthday?", matchAnswer: "B" },
    ],
    sectionAOptions: [
      { letter: "A", text: "It's next to the park." },
      { letter: "B", text: "It's in March." },
      { letter: "C", text: "I go by bike." },
      { letter: "D", text: "I wake up at 6 o'clock." },
      { letter: "E", text: "My favorite subject is math." },
    ],
    sectionB: [
      { id: 1, audioText: "computer", optionA: "Television", optionAImg: "📺", optionB: "Computer", optionBImg: "💻", correctOption: "B", writeAnswer: "computer" },
      { id: 2, audioText: "hospital", optionA: "Hospital", optionAImg: "🏥", optionB: "School", optionBImg: "🏫", correctOption: "A", writeAnswer: "hospital" },
      { id: 3, audioText: "rainy", optionA: "Sunny", optionAImg: "☀️", optionB: "Rainy", optionBImg: "🌧️", correctOption: "B", writeAnswer: "rainy" },
      { id: 4, audioText: "swimming", optionA: "Swimming", optionAImg: "🏊", optionB: "Running", optionBImg: "🏃", correctOption: "A", writeAnswer: "swimming" },
      { id: 5, audioText: "behind", optionA: "In front of", optionAImg: "⬆️", optionB: "Behind", optionBImg: "⬇️", correctOption: "B", writeAnswer: "behind" },
    ],
    sectionC: [
      {
        id: 1, lineA: "What ___ is it?", lineB: "It's 3 o'clock.",
        blank: { blankId: "c2-1", options: ["time", "day", "color"], answer: "time" },
        blankInA: true,
      },
      {
        id: 2, lineA: "Can you ___ me?", lineB: "Sure, of course!",
        blank: { blankId: "c2-2", options: ["help", "see", "call"], answer: "help" },
        blankInA: true,
      },
      {
        id: 3, lineA: "Where is the park?", lineB: "It's ___ the school.",
        blank: { blankId: "c2-3", options: ["near", "on", "at"], answer: "near" },
        blankInA: false,
      },
      {
        id: 4, lineA: "Do you like playing soccer?", lineB: "___, I do!",
        blank: { blankId: "c2-4", options: ["Yes", "No", "Maybe"], answer: "Yes" },
        blankInA: false,
      },
      {
        id: 5, lineA: "What's your favorite ___?", lineB: "Blue!",
        blank: { blankId: "c2-5", options: ["color", "subject", "sport"], answer: "color" },
        blankInA: true,
      },
    ],
    sectionDUnscramble: [
      { id: 1, scrambled: ["live", "you", "do", "where"], answer: "where do you live", image: "🏠" },
      { id: 2, scrambled: ["it", "time", "what", "is"], answer: "what time is it", image: "🕐" },
      { id: 3, scrambled: ["she", "like", "does", "what"], answer: "what does she like", image: "❤️" },
    ],
    sectionDReadSpeak: [
      { id: 1, question: "What do you do every morning?", image: "🌅", hint: "brush", sampleAnswer: "i brush my teeth" },
      { id: 2, question: "Where is your school?", image: "🏫", hint: "near", sampleAnswer: "it is near my house" },
    ],
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const speak = (text: string) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = "en-US"; u.rate = 0.85
  window.speechSynthesis.speak(u)
}

const startRecognition = (onResult: (t: string) => void, onEnd: () => void) => {
  if (typeof window === "undefined") return
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) { alert("Speech recognition not supported"); return }
  const r = new SR()
  r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1
  r.onresult = (e: any) => onResult(e.results[0][0].transcript)
  r.onerror = onEnd; r.onend = onEnd
  r.start()
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function CheckpointPage() {
  const params = useParams()
  const id = params.id as string
  const cp = CHECKPOINT_DATA[id] ?? CHECKPOINT_DATA["checkpoint-1"]

  const [currentPage, setCurrentPage] = useState(0)
  const [sectionAAnswers, setSectionAAnswers] = useState<Record<number, string>>({})
  const [sectionBSelected, setSectionBSelected] = useState<Record<number, "A" | "B" | null>>({})
  const [sectionBWrite, setSectionBWrite] = useState<Record<number, string>>({})
  const [sectionCAnswers, setSectionCAnswers] = useState<Record<string, string>>({})
  const [unscramble, setUnscramble] = useState<Record<number, string>>({})
  const [readSpeak, setReadSpeak] = useState<Record<number, string>>({})
  const [listeningId, setListeningId] = useState<string | null>(null)
  const [isChecked, setIsChecked] = useState(false)
  const [score, setScore] = useState(0)

  const totalPages = 3
  const dots = [0, 1, 2]

  // Per-section scores for result panel
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [scoreC, setScoreC] = useState(0)
  const [scoreD, setScoreD] = useState(0)
  const [scoreE, setScoreE] = useState(0)

  const handleSubmit = () => {
    let sA = 0, sB = 0, sC = 0, sD = 0, sE = 0
    cp.sectionA.forEach((q) => {
      if ((sectionAAnswers[q.id] ?? "").toUpperCase() === q.matchAnswer) sA++
    })
    cp.sectionB.forEach((q) => {
      if (sectionBSelected[q.id] === q.correctOption) sB++
      if ((sectionBWrite[q.id] ?? "").toLowerCase().trim() === q.writeAnswer.toLowerCase()) sB++
    })
    cp.sectionC.forEach((q) => {
      if ((sectionCAnswers[q.blank.blankId] ?? "") === q.blank.answer) sC++
    })
    cp.sectionDUnscramble.forEach((q) => {
      if ((unscramble[q.id] ?? "").toLowerCase().trim() === q.answer.toLowerCase()) sD++
    })
    cp.sectionDReadSpeak.forEach((q) => {
      if ((readSpeak[q.id] ?? "").toLowerCase().trim() === q.sampleAnswer.toLowerCase()) sE++
    })
    setScoreA(sA); setScoreB(sB); setScoreC(sC); setScoreD(sD); setScoreE(sE)
    setScore(sA + sB + sC + sD + sE)
    setIsChecked(true)
  }

  const handleReset = () => {
    setSectionAAnswers({}); setSectionBSelected({}); setSectionBWrite({})
    setSectionCAnswers({}); setUnscramble({}); setReadSpeak({})
    setIsChecked(false); setScore(0); setCurrentPage(0)
    setScoreA(0); setScoreB(0); setScoreC(0); setScoreD(0); setScoreE(0)
  }

  // ── Render inline dialogue with dropdown ──────────────────────────────────
  const renderDialogue = (q: SectionCQuestion) => {
    const checked = isChecked
    const val = sectionCAnswers[q.blank.blankId] ?? ""
    const correct = val === q.blank.answer

    const dropdown = (
      <select
        value={val}
        onChange={(e) => !checked && setSectionCAnswers({ ...sectionCAnswers, [q.blank.blankId]: e.target.value })}
        disabled={checked}
        className={`mx-1 px-2 py-0.5 rounded-md text-sm font-semibold border-2 bg-transparent outline-none transition-colors
          ${checked
            ? correct
              ? "border-green-400 text-green-300"
              : "border-red-400 text-red-300"
            : "border-cyan-400 text-cyan-300 focus:border-cyan-300"
          }`}
      >
        <option value="" className="bg-[#1a1060]">___</option>
        {q.blank.options.map((o) => (
          <option key={o} value={o} className="bg-[#1a1060]">{o}</option>
        ))}
      </select>
    )

    const renderLine = (text: string, hasBlank: boolean, speaker: string) => {
      if (!hasBlank) return (
        <p className="text-white/75 text-sm leading-snug">
          <span className="font-bold text-white/50 mr-1">{speaker}:</span>{text}
        </p>
      )
      const parts = text.split("___")
      return (
        <p className="text-white/75 text-sm leading-snug inline-flex items-center flex-wrap gap-0.5">
          <span className="font-bold text-white/50 mr-1">{speaker}:</span>
          <span>{parts[0]}</span>{dropdown}<span>{parts[1]}</span>
        </p>
      )
    }

    return (
      <div key={q.id} className="flex gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
        {/* Left column: Number */}
        <p className="text-white/30 text-sm font-semibold shrink-0 w-5 pt-0.5">{q.id}.</p>
        {/* Right column: Dialogue lines */}
        <div className="flex-1 space-y-0.5">
          {renderLine(q.lineA, q.blankInA, "A")}
          {renderLine(q.lineB, !q.blankInA, "B")}
        </div>
      </div>
    )
  }

  // ── Book page style ────────────────────────────────────────────────────────
  const pageStyle = (side: "left" | "right"): React.CSSProperties => ({
    background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
    border: "1.5px solid rgba(255,255,255,0.18)",
    borderRight: side === "left" ? "none" : undefined,
    borderLeft: side === "right" ? "none" : undefined,
    boxShadow: side === "left" ? "-8px 0 32px rgba(0,0,0,0.3)" : "8px 0 32px rgba(0,0,0,0.3)",
    backdropFilter: "blur(18px)",
  })

  const sectionHeader = (letter: string, label: string) => (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
        {letter}
      </span>
      <span className="text-white/80 text-sm font-semibold">{label}</span>
    </div>
  )

  const inputClass = (checked: boolean, correct: boolean) =>
    `border-b-2 bg-transparent outline-none text-center text-sm font-semibold transition-colors duration-200 ${checked
      ? correct ? "border-green-400 text-green-300" : "border-red-400 text-red-300"
      : "border-white/30 text-cyan-300 focus:border-cyan-400"
    }`

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      {/* Back */}
      <Link
        href="/client/units"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-medium">Back</span>
      </Link>

      {/* Title */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 px-8 py-2.5 rounded-full border border-cyan-400/50 backdrop-blur-md"
        style={{ background: "rgba(6,182,212,0.25)" }}>
        <span className="text-white font-bold text-base">{cp.title}</span>
      </div>

      {/* Book */}
      <div className="relative z-10 flex items-stretch justify-center w-full max-w-5xl px-4 py-20">
        {/* ─── Page A–B ─── */}
        {currentPage === 0 && (
          <>
            {/* Left: Section A */}
            <div className="flex-1 max-w-[460px] rounded-l-2xl p-6 flex flex-col gap-3 overflow-y-auto max-h-[74vh]" style={pageStyle("left")}>
              {sectionHeader("A", "Read and match.")}

              {/* Top: 5-row × 2-column table */}
              <table className="w-full border-separate border-spacing-y-2 mb-4">
                <tbody>
                  {cp.sectionA.map((q, i) => {
                    const val = sectionAAnswers[q.id] ?? ""
                    const checked = isChecked
                    const correct = val.toUpperCase() === q.matchAnswer
                    return (
                      <tr key={q.id}>
                        {/* Col 1: Question */}
                        <td className="align-middle pr-3 w-3/4">
                          <div className="flex items-start gap-1.5">
                            <span className="text-white/40 text-sm shrink-0">{i + 1}.</span>
                            <span className="text-white/80 text-sm leading-snug">{q.question}</span>
                          </div>
                        </td>

                        {/* Col 2: Input box (right-aligned) */}
                        <td className="align-middle text-right w-1/4">
                          <input
                            type="text"
                            maxLength={1}
                            value={val}
                            disabled={checked}
                            onChange={(e) => setSectionAAnswers({ ...sectionAAnswers, [q.id]: e.target.value.toUpperCase() })}
                            className={`w-9 h-9 ml-auto rounded-lg border-2 text-center font-bold uppercase text-sm bg-white/5 outline-none transition-colors
                              ${checked
                                ? correct ? "border-green-400 text-green-300 bg-green-400/10" : "border-red-400 text-red-300 bg-red-400/10"
                                : "border-white/25 text-cyan-300 focus:border-cyan-400"
                              }`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Bottom: Answer options list */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                {cp.sectionAOptions.map((opt) => (
                  <div key={opt.letter} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {opt.letter}
                    </span>
                    <span className="text-white/65 text-sm leading-snug">{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spine */}
            <div className="w-4 shrink-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))" }} />

            {/* Right: Section B */}
            <div className="flex-1 max-w-[460px] rounded-r-2xl p-6 flex flex-col gap-3 overflow-y-auto h-[74vh]" style={pageStyle("right")}>
              {sectionHeader("B", "Listen, circle and write.")}
              <div className="space-y-3">
                {cp.sectionB.map((q, i) => {
                  const selVal = sectionBSelected[q.id] ?? null
                  const writeVal = sectionBWrite[q.id] ?? ""
                  const selOk = selVal === q.correctOption
                  const writeOk = writeVal.toLowerCase().trim() === q.writeAnswer.toLowerCase()
                  return (
                    <div key={q.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-white/40 text-sm w-4 shrink-0">{i + 1}.</span>

                      {/* Play */}
                      <button
                        onClick={() => speak(q.audioText)}
                        className="w-7 h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center shrink-0 transition-all"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-white" />
                      </button>

                      {/* Option A */}
                      <button
                        onClick={() => !isChecked && setSectionBSelected({ ...sectionBSelected, [q.id]: "A" })}
                        disabled={isChecked}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs transition-all
                          ${selVal === "A"
                            ? isChecked
                              ? selOk ? "border-green-400 bg-green-400/15" : "border-red-400 bg-red-400/15"
                              : "border-cyan-400 bg-cyan-400/15"
                            : "border-white/15 hover:border-white/30"
                          }`}
                      >
                        <span>{q.optionAImg}</span>
                        <span className="text-white/60 font-semibold">A</span>
                      </button>

                      {/* Option B */}
                      <button
                        onClick={() => !isChecked && setSectionBSelected({ ...sectionBSelected, [q.id]: "B" })}
                        disabled={isChecked}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs transition-all
                          ${selVal === "B"
                            ? isChecked
                              ? q.correctOption === "B" && selOk ? "border-green-400 bg-green-400/15" : "border-red-400 bg-red-400/15"
                              : "border-cyan-400 bg-cyan-400/15"
                            : "border-white/15 hover:border-white/30"
                          }`}
                      >
                        <span>{q.optionBImg}</span>
                        <span className="text-white/60 font-semibold">B</span>
                      </button>

                      {/* Write answer */}
                      <input
                        type="text"
                        placeholder="Write..."
                        value={writeVal}
                        disabled={isChecked}
                        onChange={(e) => setSectionBWrite({ ...sectionBWrite, [q.id]: e.target.value })}
                        onKeyDown={(e) => e.preventDefault()}
                        className={`flex-1 min-w-0 px-2 py-1 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors
                            ${isChecked
                            ? writeOk ? "border-green-400 text-green-300" : "border-red-400 text-red-300"
                            : "border-white/20 text-cyan-300 focus:border-cyan-400"
                          }`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── Page C–D ─── */}
        {currentPage === 1 && (
          <>
            {/* Left: Section C */}
            <div className="flex-1 max-w-[460px] rounded-l-2xl p-6 flex flex-col gap-3 overflow-y-auto h-[74vh]" style={pageStyle("left")}>
              {sectionHeader("C", "Choose and write.")}
              <div className="space-y-2.5">
                {cp.sectionC.map((q) => renderDialogue(q))}
              </div>
            </div>

            {/* Spine */}
            <div className="w-4 shrink-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))" }} />

            {/* Right: Section D & E */}
            <div className="flex-1 max-w-[460px] rounded-r-2xl p-6 flex flex-col gap-3 overflow-y-auto" style={pageStyle("right")}>

              {/* D: Unscramble and speak */}
              <div>
                {sectionHeader("D", "Unscramble and speak.")}
                <div className="space-y-3">
                  {cp.sectionDUnscramble.map((q, i) => {
                    const val = unscramble[q.id] ?? ""
                    const correct = val.toLowerCase().trim() === q.answer.toLowerCase()
                    const key = `unscramble-${q.id}`
                    return (
                      <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        {/* Top: scrambled words + illustration */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-white/40 text-sm w-4 shrink-0">{i + 1}.</span>
                          <div className="flex flex-wrap gap-1 flex-1">
                            {q.scrambled.map((w, wi) => (
                              <span key={wi} className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-200 text-[11px] font-semibold border border-yellow-400/30">{w}</span>
                            ))}
                          </div>
                          <span className="text-3xl shrink-0">{q.image}</span>
                        </div>
                        {/* Bottom: mic + answer input */}
                        <div className="flex items-center gap-2 pl-5">
                          <button
                            onClick={() => {
                              setListeningId(key)
                              startRecognition(
                                (t) => { setUnscramble((p) => ({ ...p, [q.id]: t })); setListeningId(null) },
                                () => setListeningId(null)
                              )
                            }}
                            disabled={isChecked}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                              ${listeningId === key ? "bg-red-500 animate-pulse" : "bg-violet-500 hover:bg-violet-400"}`}
                          >
                            {listeningId === key ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                          </button>
                          <input
                            type="text"
                            placeholder="Answer..."
                            value={val}
                            readOnly
                            className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors
                              ${isChecked
                                ? correct ? "border-green-400 text-green-300" : "border-red-400 text-red-300"
                                : "border-white/20 text-cyan-300"
                              }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </>
        )}

        {/* ─── Page E + Results ─── */}
        {currentPage === 2 && (
          <>
            {/* Left: Section E + Submit */}
            <div className="flex-1 max-w-[460px] rounded-l-2xl p-6 flex flex-col gap-4 overflow-y-auto h-[74vh]" style={pageStyle("left")}>
              {sectionHeader("E", "Read and speak.")}
              <div className="space-y-3 flex-1">
                {cp.sectionDReadSpeak.map((q, i) => {
                  const val = readSpeak[q.id] ?? ""
                  const correct = val.toLowerCase().trim() === q.sampleAnswer.toLowerCase()
                  const key = `readspeak-${q.id}`
                  return (
                    <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      {/* Top: question + hint same line */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="text-white/40 text-sm w-4 shrink-0">{i + 1}.</span>
                          <p className="text-white/80 text-sm font-semibold leading-snug">{q.question}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-400/20 text-blue-200 text-[10px] font-semibold border border-blue-400/30 shrink-0">
                          {q.hint}
                        </span>
                      </div>
                      {/* Bottom: mic + answer input */}
                      <div className="flex items-center gap-2 pl-5">
                        <button
                          onClick={() => {
                            setListeningId(key)
                            startRecognition(
                              (t) => { setReadSpeak((p) => ({ ...p, [q.id]: t })); setListeningId(null) },
                              () => setListeningId(null)
                            )
                          }}
                          disabled={isChecked}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                            ${listeningId === key ? "bg-red-500 animate-pulse" : "bg-violet-500 hover:bg-violet-400"}`}
                        >
                          {listeningId === key ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                        </button>
                        <input
                          type="text"
                          placeholder="Your answer..."
                          value={val}
                          readOnly
                          className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors
                            ${isChecked
                              ? correct ? "border-green-400 text-green-300" : "border-red-400 text-red-300"
                              : "border-white/20 text-cyan-300"
                            }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={isChecked}
                className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200
                  ${isChecked
                    ? "bg-white/10 border border-white/15 text-white/40 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/30 border border-green-400"
                  }`}
              >
                Submit Test
              </button>
            </div>

            {/* Spine */}
            <div className="w-4 shrink-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))" }} />

            {/* Right: Results panel */}
            <div className="flex-1 max-w-[460px] rounded-r-2xl p-6 flex flex-col gap-4 overflow-y-auto h-[74vh]" style={pageStyle("right")}>
              {!isChecked ? (
                /* Placeholder before submit */
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-3xl">📋</span>
                  </div>
                  <p className="text-white/40 text-sm">Complete the test and press<br /><span className="text-white/60 font-semibold">Submit Test</span> to see your results.</p>
                </div>
              ) : (
                /* Results */
                <div className="flex flex-col gap-4">
                  {/* Total score */}
                  <div className={`rounded-2xl p-5 text-center border-2 ${score >= 16 ? "bg-green-500/10 border-green-400/50" : "bg-red-500/10 border-red-400/50"}`}>
                    <p className={`text-3xl font-black ${score >= 16 ? "text-green-400" : "text-red-400"}`}>{score}<span className="text-lg text-white/40">/20</span></p>
                    <p className={`text-base font-bold mt-1 ${score >= 16 ? "text-green-300" : "text-red-300"}`}>
                      {score >= 16 ? "Congratulations!" : "Keep Practicing!"}
                    </p>
                    {score >= 16 && (
                      <p className="text-green-300/60 text-xs mt-1">You can skip the previous units!</p>
                    )}
                  </div>

                  {/* Per-section breakdown */}
                  <div className="space-y-2">
                    {[
                      { label: "A", name: "Read and match", got: scoreA, total: 5 },
                      { label: "B", name: "Listen, circle & write", got: scoreB, total: 10 },
                      { label: "C", name: "Choose and write", got: scoreC, total: 5 },
                      { label: "D", name: "Unscramble and speak", got: scoreD, total: 3 },
                      { label: "E", name: "Read and speak", got: scoreE, total: 2 },
                    ].map((s) => {
                      const pct = Math.round((s.got / s.total) * 100)
                      const good = s.got === s.total
                      return (
                        <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-violet-500/30 text-violet-200 text-xs font-bold flex items-center justify-center shrink-0">{s.label}</span>
                              <span className="text-white/70 text-xs">{s.name}</span>
                            </div>
                            <span className={`text-sm font-bold ${good ? "text-green-400" : "text-amber-400"}`}>{s.got}/{s.total}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${good ? "bg-green-400" : "bg-amber-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={handleReset}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Try Again
                    </button>
                    <Link
                      href="/client/units"
                      className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-cyan-500 border border-cyan-400 text-white text-sm font-semibold hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      Back to Units
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-3 pl-2 pr-4 py-2 ">
          {/* Prev */}
          {currentPage > 0 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
          )}
          {currentPage === 0 && <div className="w-12" />}

          {/* Dots */}
          <div className="flex gap-1.5">
            {dots.map((i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentPage ? "bg-cyan-400" : "bg-white/25"}`}
              />
            ))}
          </div>

          {/* Next */}
          {currentPage < totalPages - 1 && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex items-center gap-1.5 pl-4 pr-2  py-1 rounded-full text-sm font-semibold bg-cyan-500 border border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {currentPage === totalPages - 1 && <div className="w-12" />}
        </div>
      </div>

    </div>
  )
}
