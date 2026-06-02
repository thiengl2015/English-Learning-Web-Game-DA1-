"use client"

import { useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Volume2, Mic, MicOff, Play, CheckCircle2, RotateCcw } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

// ─── Types ───────────────────────────────────────────────────────────────────
type SectionAQuestion = { id: number; question: string; matchAnswer: string }
type SectionBQuestion = {
  id: number; audioText: string
  optionA: string; optionAImg: string
  optionB: string; optionBImg: string
  optionC: string; optionCImg: string
  correctOption: "A" | "B" | "C"; writeAnswer: string
}
type BlankDef = { blankId: string; options: string[]; answer: string }
type SectionCQuestion = {
  id: number
  lineA: string
  lineB: string
  blank: BlankDef
  blankInA: boolean
}
type SectionDCard = { id: number; word: string; audioText: string; image: string }

// ─── Challenge data per unit ─────────────────────────────────────────────────
const CHALLENGE_DATA: Record<string, {
  title: string
  sectionA: SectionAQuestion[]
  sectionAOptions: { letter: string; text: string }[]
  sectionB: SectionBQuestion[]
  sectionC: SectionCQuestion[]
  sectionCWordBank: string[]
  sectionD: SectionDCard[]
}> = {
  "1": {
    title: "Mini Test",
    sectionA: [
      { id: 1, question: "How was the weather yesterday?", matchAnswer: "A" },
      { id: 2, question: "Where does she live?", matchAnswer: "B" },
      { id: 3, question: "Where were they yesterday?", matchAnswer: "C" },
    ],
    sectionAOptions: [
      { letter: "A", text: "She's wearing a blouse." },
      { letter: "B", text: "She has some tape." },
      { letter: "C", text: "It's in the garage." },
    ],
    sectionB: [
      { id: 1, audioText: "basketball", optionA: "Football", optionAImg: "⚽", optionB: "Tennis", optionBImg: "🎾", optionC: "Basketball", optionCImg: "🏀", correctOption: "C", writeAnswer: "Basketball" },
      { id: 2, audioText: "rubber bands", optionA: "Rubber bands", optionAImg: "🔗", optionB: "Pencils", optionBImg: "✏️", optionC: "Erasers", optionCImg: "🧽", correctOption: "A", writeAnswer: "Rubber bands" },
    ],
    sectionC: [
      {
        id: 1, lineA: "___, I'm Scott. ___ your name?", lineB: "My ___ is Kate.",
        blank: { blankId: "c1-1", options: ["Hello", "What's", "name"], answer: "Hello" },
        blankInA: true,
      },
      {
        id: 2, lineA: "Hi! ___ are you?", lineB: "I'm fine. ___ you?",
        blank: { blankId: "c1-2", options: ["How", "What", "Where"], answer: "How" },
        blankInA: true,
      },
    ],
    sectionCWordBank: ["name", "Hello", "What's"],
    sectionD: [
      { id: 1, word: "riding a bike", audioText: "riding a bike", image: "🚴" },
      { id: 2, word: "swimming", audioText: "swimming", image: "🏊" },
      { id: 3, word: "reading", audioText: "reading", image: "📖" },
    ],
  },
  "2": {
    title: "Mini Test",
    sectionA: [
      { id: 1, question: "What time do you wake up?", matchAnswer: "C" },
      { id: 2, question: "Where is the library?", matchAnswer: "A" },
      { id: 3, question: "How do you go to school?", matchAnswer: "B" },
    ],
    sectionAOptions: [
      { letter: "A", text: "It's next to the park." },
      { letter: "B", text: "I go by bike." },
      { letter: "C", text: "I wake up at 6 o'clock." },
    ],
    sectionB: [
      { id: 1, audioText: "computer", optionA: "Television", optionAImg: "📺", optionB: "Computer", optionBImg: "💻", optionC: "Phone", optionCImg: "📱", correctOption: "B", writeAnswer: "Computer" },
      { id: 2, audioText: "hospital", optionA: "Hospital", optionAImg: "🏥", optionB: "School", optionBImg: "🏫", optionC: "Library", optionCImg: "📚", correctOption: "A", writeAnswer: "Hospital" },
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
    ],
    sectionCWordBank: ["time", "help", "day"],
    sectionD: [
      { id: 1, word: "cooking", audioText: "cooking", image: "👨‍🍳" },
      { id: 2, word: "sleeping", audioText: "sleeping", image: "😴" },
      { id: 3, word: "running", audioText: "running", image: "🏃" },
    ],
  },
  "3": {
    title: "Mini Test",
    sectionA: [
      { id: 1, question: "What is your favorite subject?", matchAnswer: "A" },
      { id: 2, question: "When is your birthday?", matchAnswer: "C" },
      { id: 3, question: "Do you like playing soccer?", matchAnswer: "B" },
    ],
    sectionAOptions: [
      { letter: "A", text: "My favorite subject is math." },
      { letter: "B", text: "Yes, I love it!" },
      { letter: "C", text: "It's in March." },
    ],
    sectionB: [
      { id: 1, audioText: "rainy", optionA: "Sunny", optionAImg: "☀️", optionB: "Rainy", optionBImg: "🌧️", optionC: "Cloudy", optionCImg: "☁️", correctOption: "B", writeAnswer: "Rainy" },
      { id: 2, audioText: "swimming", optionA: "Swimming", optionAImg: "🏊", optionB: "Running", optionBImg: "🏃", optionC: "Cycling", optionCImg: "🚴", correctOption: "A", writeAnswer: "Swimming" },
    ],
    sectionC: [
      {
        id: 1, lineA: "Where is the park?", lineB: "It's ___ the school.",
        blank: { blankId: "c3-1", options: ["near", "on", "at"], answer: "near" },
        blankInA: false,
      },
      {
        id: 2, lineA: "What's your favorite ___?", lineB: "Blue!",
        blank: { blankId: "c3-2", options: ["color", "subject", "sport"], answer: "color" },
        blankInA: true,
      },
    ],
    sectionCWordBank: ["near", "color", "subject"],
    sectionD: [
      { id: 1, word: "cat", audioText: "cat", image: "🐱" },
      { id: 2, word: "dog", audioText: "dog", image: "🐶" },
      { id: 3, word: "rabbit", audioText: "rabbit", image: "🐰" },
    ],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const speak = (text: string) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = "en-US"; u.rate = 0.85
  window.speechSynthesis.speak(u)
}

// ─── Page component ──────────────────────────────────────────────────────────
export default function ChallengePage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.unitId as string
  const cp = CHALLENGE_DATA[unitId] ?? CHALLENGE_DATA["1"]

  // Section A answers
  const [sectionAAnswers, setSectionAAnswers] = useState<Record<number, string>>({})
  // Section B
  const [sectionBSelected, setSectionBSelected] = useState<Record<number, "A" | "B" | "C" | null>>({})
  const [sectionBWrite, setSectionBWrite] = useState<Record<number, string>>({})
  // Section C
  const [sectionCAnswers, setSectionCAnswers] = useState<Record<string, string>>({})
  // Section D - listen and repeat
  const [sectionDCorrect, setSectionDCorrect] = useState<Record<number, boolean>>({})
  const [listeningId, setListeningId] = useState<number | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Scoring
  const [isChecked, setIsChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [scoreC, setScoreC] = useState(0)
  const [scoreD, setScoreD] = useState(0)

  const handlePlay = (card: SectionDCard) => {
    setPlayingId(card.id)
    const utterance = new SpeechSynthesisUtterance(card.audioText)
    utterance.lang = "en-US"
    utterance.rate = 0.85
    utterance.onend = () => setPlayingId(null)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const handleMicClick = (card: SectionDCard) => {
    if (sectionDCorrect[card.id] || isChecked) return

    if (listeningId === card.id) {
      if (recognitionRef.current) recognitionRef.current.abort()
      setListeningId(null)
      return
    }

    if (recognitionRef.current) recognitionRef.current.abort()

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => setListeningId(card.id)

    recognition.onresult = (event: any) => {
      const results = event.results[0]
      for (let i = 0; i < results.length; i++) {
        const transcript = results[i].transcript.toLowerCase().trim()
        if (transcript === card.word.toLowerCase()) {
          setSectionDCorrect((prev) => ({ ...prev, [card.id]: true }))
          break
        }
      }
      setListeningId(null)
    }

    recognition.onerror = () => setListeningId(null)
    recognition.onend = () => setListeningId(null)

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleSubmit = () => {
    let sA = 0, sB = 0, sC = 0, sD = 0

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

    cp.sectionD.forEach((card) => {
      if (sectionDCorrect[card.id]) sD++
    })

    setScoreA(sA); setScoreB(sB); setScoreC(sC); setScoreD(sD)
    setScore(sA + sB + sC + sD)
    setIsChecked(true)
  }

  const handleReset = () => {
    setSectionAAnswers({})
    setSectionBSelected({})
    setSectionBWrite({})
    setSectionCAnswers({})
    setSectionDCorrect({})
    setIsChecked(false)
    setScore(0)
    setScoreA(0); setScoreB(0); setScoreC(0); setScoreD(0)
  }

  const totalQuestions = cp.sectionA.length + (cp.sectionB.length * 2) + cp.sectionC.length + cp.sectionD.length
  const passScore = Math.ceil(totalQuestions * 0.7)
  const passed = score >= passScore

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

  // Render Section C dialogue with dropdown — mirrors checkpoint exactly
  const renderDialogue = (q: SectionCQuestion) => {
    const val = sectionCAnswers[q.blank.blankId] ?? ""
    const correct = val === q.blank.answer

    const dropdown = (
      <select
        value={val}
        onChange={(e) => !isChecked && setSectionCAnswers({ ...sectionCAnswers, [q.blank.blankId]: e.target.value })}
        disabled={isChecked}
        className={`mx-1 px-2 py-0.5 rounded-md text-sm font-semibold border-2 bg-transparent outline-none transition-colors
          ${isChecked
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
        <p className="text-white/30 text-sm font-semibold shrink-0 w-5 pt-0.5">{q.id}.</p>
        <div className="flex-1 space-y-0.5">
          {renderLine(q.lineA, q.blankInA, "A")}
          {renderLine(q.lineB, !q.blankInA, "B")}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      {/* Back */}
      <Link
        href={`/client/units/${unitId}/lessons`}
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

      {/* Main Content - Book Layout */}
      <div className="relative z-10 flex items-stretch justify-center w-full max-w-5xl px-4 py-20">

        {/* ─── Left Page: Section A (top) + Section B (bottom) ─── */}
        <div className="flex-1 max-w-[460px] rounded-l-2xl p-5 flex flex-col gap-4 overflow-y-auto min-h-[74vh] max-h-[74vh]" style={pageStyle("left")}>

          {/* Section A: Read and match */}
          <div>
            {sectionHeader("A", "Read and match.")}

            {/* 2-column table: question left, input right */}
            <table className="w-full border-separate border-spacing-y-1 mb-2">
              <tbody>
                {cp.sectionA.map((q, i) => {
                  const val = sectionAAnswers[q.id] ?? ""
                  const correct = val.toUpperCase() === q.matchAnswer
                  return (
                    <tr key={q.id}>
                      <td className="align-middle pr-3 w-3/4">
                        <div className="flex items-start gap-1.5">
                          <span className="text-white/40 text-sm shrink-0">{i + 1}.</span>
                          <span className="text-white/80 text-sm leading-snug">{q.question}</span>
                        </div>
                      </td>
                      <td className="align-middle text-right w-1/4">
                        <input
                          type="text"
                          maxLength={1}
                          value={val}
                          disabled={isChecked}
                          onChange={(e) => setSectionAAnswers({ ...sectionAAnswers, [q.id]: e.target.value.toUpperCase() })}
                          className={`w-9 h-9 ml-auto rounded-lg border-2 text-center font-bold uppercase text-sm bg-white/5 outline-none transition-colors
                            ${isChecked
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

            {/* Answer options list */}
            <div className="space-y-2 pt-2">
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

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

          {/* Section B: Listen, circle and write */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">B</span>
              <span className="text-white/80 text-sm font-semibold">Listen, circle and write.</span>
            </div>
            <div className="space-y-3">
              {cp.sectionB.map((q, i) => {
                const selVal = sectionBSelected[q.id] ?? null
                const writeVal = sectionBWrite[q.id] ?? ""
                const selOk = selVal === q.correctOption
                const writeOk = writeVal.toLowerCase().trim() === q.writeAnswer.toLowerCase()
                return (
                  <div key={q.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-white/40 text-sm w-4 shrink-0">{i + 1}.</span>

                    {/* Play button */}
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

                    {/* Option C */}
                    <button
                      onClick={() => !isChecked && setSectionBSelected({ ...sectionBSelected, [q.id]: "C" })}
                      disabled={isChecked}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs transition-all
                        ${selVal === "C"
                          ? isChecked
                            ? q.correctOption === "C" && selOk ? "border-green-400 bg-green-400/15" : "border-red-400 bg-red-400/15"
                            : "border-cyan-400 bg-cyan-400/15"
                          : "border-white/15 hover:border-white/30"
                        }`}
                    >
                      <span>{q.optionCImg}</span>
                      <span className="text-white/60 font-semibold">C</span>
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
        </div>

        {/* Spine */}
        <div className="w-3 shrink-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))" }} />

        {/* ─── Right Page: Section C (top) + Section D (bottom) ─── */}
        <div className="flex-1 max-w-[460px] rounded-r-2xl p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]" style={pageStyle("right")}>

          {/* Section C: Choose and write */}
          <div>
            {sectionHeader("C", "Choose and write.")}
            <div className="space-y-2.5">
              {cp.sectionC.map((q) => renderDialogue(q))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

          {/* Section D: Listen and repeat */}
          <div>
            {sectionHeader("D", "Listen and repeat.")}
            <div className="grid grid-cols-3 gap-3">
              {cp.sectionD.map((card) => {
                const isCorrect = sectionDCorrect[card.id] === true
                const isListening = listeningId === card.id
                const isPlaying = playingId === card.id

                return (
                  <div key={card.id} className="flex flex-col items-center gap-2">
                    {/* Card */}
                    <div
                      className={`
                        relative w-full aspect-square rounded-xl
                        backdrop-blur-md
                        border-2 transition-all duration-500 overflow-hidden
                        ${isCorrect
                          ? "border-green-400/80 bg-white/15 shadow-[0_0_16px_rgba(74,222,128,0.3)]"
                          : "border-white/20 bg-white/8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                        }
                      `}
                    >
                      {/* Image - revealed when correct */}
                      <div
                        className={`
                          absolute inset-0 flex items-center justify-center transition-all duration-500
                          ${isCorrect ? "opacity-100 scale-100" : "opacity-20 blur-sm scale-90"}
                        `}
                      >
                        <span className="text-4xl select-none">{card.image}</span>
                      </div>

                      {/* Play button */}
                      <button
                        onClick={() => handlePlay(card)}
                        className={`
                          absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
                          transition-all duration-300 shadow-lg
                          ${isPlaying
                            ? "bg-cyan-400 scale-110"
                            : "bg-purple-500 hover:bg-cyan-400 hover:scale-110"
                          }
                        `}
                      >
                        <Play className="w-3 h-3 text-white fill-white" />
                      </button>

                      {/* Correct badge */}
                      {isCorrect && (
                        <div className="absolute top-1 left-1">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                    </div>

                    {/* Mic button / Word label */}
                    <button
                      onClick={() => handleMicClick(card)}
                      disabled={isCorrect || isChecked}
                      className={`
                        w-full px-2 py-1.5 rounded-lg text-xs font-medium
                        border backdrop-blur-sm
                        flex items-center justify-center gap-1.5
                        transition-all duration-300
                        ${isCorrect
                          ? "border-green-400/60 text-green-300 bg-green-400/10 cursor-default"
                          : isListening
                            ? "border-cyan-400 text-cyan-300 bg-cyan-400/20 animate-pulse"
                            : "border-white/25 text-white/60 border-dashed hover:border-cyan-400/70 hover:bg-white/8"
                        }
                      `}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{card.word}</span>
                        </>
                      ) : isListening ? (
                        <>
                          <MicOff className="w-3 h-3" />
                          <span>...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3" />
                          <span>speak</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar with Submit/Results */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        {!isChecked ? (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-md shadow-lg shadow-cyan-500/30 transition-all"
          >
            Submit
          </button>
        ) : (
          <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <div className={`text-center ${passed ? "text-green-400" : "text-red-400"}`}>
              <p className="text-2xl font-black">{score}<span className="text-sm text-white/40">/{totalQuestions}</span></p>
              <p className="text-xs font-semibold">{passed ? "Passed!" : "Try Again"}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
              {passed && (
                <button
                  onClick={() => router.push(`/client/units/${unitId}/lessons`)}
                  className="px-4 py-2 rounded-full bg-green-500 border border-green-400 text-white text-sm font-medium hover:bg-green-400 shadow-lg shadow-green-500/20 transition-all"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
