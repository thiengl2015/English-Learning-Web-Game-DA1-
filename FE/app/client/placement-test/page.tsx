"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, Mic, MicOff, RotateCcw } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

// ─── Types ───────────────────────────────────────────────────────────────────
type SectionAQuestion = { id: number; question: string; matchAnswer: string }
type SectionBQuestion = { id: number; audioText: string; optionAImg: string; optionBImg: string; correctOption: "A" | "B"; writeAnswer: string }
type BlankDef = { blankId: string; options: string[]; answer: string }
type SectionCQuestion = { id: number; lineA: string; lineB: string; blank: BlankDef; blankInA: boolean }
type SectionDQuestion = { id: number; scrambled: string[]; answer: string; image: string }
type SectionERow = { day: string; activity: string }
type SectionEQuestion = { id: number; question: string; answer: string }
type SectionFCard = { id: number; word: string; audioText: string; image: string }
type SectionGQuestion = { id: number; question: string; hint: string; sampleAnswer: string }

// ─── Test data ────────────────────────────────────────────────────────────────
const TD = {
  title: "Placement Test",
  sectionA: [
    { id: 1, question: "How was the weather yesterday?", matchAnswer: "C" },
    { id: 2, question: "Where does she live?", matchAnswer: "E" },
    { id: 3, question: "Where were they yesterday?", matchAnswer: "A" },
    { id: 4, question: "What does she have?", matchAnswer: "D" },
    { id: 5, question: "Do you want some cookies?", matchAnswer: "B" },
  ] as SectionAQuestion[],
  sectionAOptions: [
    { letter: "A", text: "They were in the art room." },
    { letter: "B", text: "Yes, please." },
    { letter: "C", text: "It was cold and snowy." },
    { letter: "D", text: "She has some tape." },
    { letter: "E", text: "She lives near the park." },
  ],

  sectionB: [
    { id: 1, audioText: "basketball", optionAImg: "⚽", optionBImg: "🏀", correctOption: "B" as const, writeAnswer: "basketball" },
    { id: 2, audioText: "rubber bands", optionAImg: "🔗", optionBImg: "✏️", correctOption: "A" as const, writeAnswer: "rubber bands" },
    { id: 3, audioText: "a scooter", optionAImg: "🚲", optionBImg: "🛴", correctOption: "B" as const, writeAnswer: "a scooter" },
    { id: 4, audioText: "tape", optionAImg: "📦", optionBImg: "🧴", correctOption: "A" as const, writeAnswer: "tape" },
    { id: 5, audioText: "across from", optionAImg: "➡️", optionBImg: "↔️", correctOption: "B" as const, writeAnswer: "across from" },
  ] as SectionBQuestion[],

  sectionC: [
    { id: 1, lineA: "Hi, I'm Scott. What's ___?", lineB: "I'm Kate. Nice to meet you!", blank: { blankId: "c1", options: ["your name", "you name", "name your"], answer: "your name" }, blankInA: true },
    { id: 2, lineA: "Hello! ___ are you?", lineB: "I'm fine, thanks!", blank: { blankId: "c2", options: ["How", "What", "Where"], answer: "How" }, blankInA: true },
    { id: 3, lineA: "Hi, Anna! This is my friend Sarah.", lineB: "___, Anna!", blank: { blankId: "c3", options: ["Nice to meet you", "How are you", "Goodbye"], answer: "Nice to meet you" }, blankInA: false },
    { id: 4, lineA: "Where were you yesterday?", lineB: "I was ___ the library.", blank: { blankId: "c4", options: ["at", "in", "on"], answer: "at" }, blankInA: false },
    { id: 5, lineA: "Do you have a ruler?", lineB: "Yes, I ___ one.", blank: { blankId: "c5", options: ["have", "has", "had"], answer: "have" }, blankInA: false },
  ] as SectionCQuestion[],

  sectionD: [
    { id: 1, scrambled: ["cold", "was", "it"], answer: "it was cold", image: "🌨️" },
    { id: 2, scrambled: ["ruler", "a", "have", "I"], answer: "I have a ruler", image: "📏" },
    { id: 3, scrambled: ["she", "does", "live", "where"], answer: "where does she live", image: "🏠" },
  ] as SectionDQuestion[],

  sectionETable: [
    { day: "Monday", activity: "Do homework" },
    { day: "Tuesday", activity: "Free" },
    { day: "Wednesday", activity: "Play soccer" },
    { day: "Thursday", activity: "Do housework" },
    { day: "Friday", activity: "Free" },
    { day: "Saturday", activity: "Free" },
    { day: "Sunday", activity: "Swim" },
  ] as SectionERow[],
  sectionE: [
    { id: 1, question: "What do you do on Saturday?", answer: "I am free on Saturday." },
    { id: 2, question: "Can you come over on Wednesday?", answer: "No, I play soccer on Wednesday." },
    { id: 3, question: "What will you do on Sunday?", answer: "I will swim on Sunday." },
    { id: 4, question: "Do you swim on Monday?", answer: "No, I do homework on Monday." },
    { id: 5, question: "Can you come over on Tuesday?", answer: "Yes, I am free on Tuesday." },
  ] as SectionEQuestion[],

  sectionF: [
    { id: 1, word: "riding a bike", audioText: "riding a bike", image: "🚴" },
    { id: 2, word: "swimming", audioText: "swimming", image: "🏊" },
    { id: 3, word: "playing soccer", audioText: "playing soccer", image: "⚽" },
  ] as SectionFCard[],

  sectionG: [
    { id: 1, question: "Where was he this morning?", hint: "school", sampleAnswer: "he was at school" },
    { id: 2, question: "What does she have?", hint: "tape", sampleAnswer: "she has some tape" },
    { id: 3, question: "How was the weather yesterday?", hint: "cold", sampleAnswer: "it was cold and snowy" },
    { id: 4, question: "Where do they live?", hint: "park", sampleAnswer: "they live near the park" },
  ] as SectionGQuestion[],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const speakText = (text: string) => {
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
export default function PlacementTestPage() {
  const router = useRouter()

  // 8 pages: A B C D E F G Result
  const TOTAL_PAGES = 8
  const [currentPage, setCurrentPage] = useState(0)

  // Answers
  const [sectionAAnswers, setSectionAAnswers] = useState<Record<number, string>>({})
  const [sectionBSelected, setSectionBSelected] = useState<Record<number, "A" | "B" | null>>({})
  const [sectionBWrite, setSectionBWrite] = useState<Record<number, string>>({})
  const [sectionCAnswers, setSectionCAnswers] = useState<Record<string, string>>({})
  const [sectionDAnswers, setSectionDAnswers] = useState<Record<number, string>>({})
  const [sectionEAnswers, setSectionEAnswers] = useState<Record<number, string>>({})
  const [sectionFCorrect, setSectionFCorrect] = useState<Record<number, boolean>>({})
  const [sectionGAnswers, setSectionGAnswers] = useState<Record<number, string>>({})

  // Mic
  const [listeningId, setListeningId] = useState<string | null>(null)
  const [fListeningId, setFListeningId] = useState<number | null>(null)
  const fRecognitionRef = useRef<any>(null)

  // Scoring
  const [isChecked, setIsChecked] = useState(false)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [scoreC, setScoreC] = useState(0)
  const [scoreD, setScoreD] = useState(0)
  const [scoreE, setScoreE] = useState(0)
  const [scoreF, setScoreF] = useState(0)
  const [scoreG, setScoreG] = useState(0)
  const totalScore = scoreA + scoreB + scoreC + scoreD + scoreE + scoreF + scoreG
  const totalMax = 5 + 5 + 5 + 3 + 5 + 3 + 4
  const passed = totalScore >= Math.ceil(totalMax * 0.6)

  const handleSubmit = () => {
    let sA = 0, sB = 0, sC = 0, sD = 0, sE = 0, sF = 0, sG = 0
    TD.sectionA.forEach((q) => { if ((sectionAAnswers[q.id] ?? "").toUpperCase() === q.matchAnswer) sA++ })
    TD.sectionB.forEach((q) => {
      const selOk = sectionBSelected[q.id] === q.correctOption
      const writeOk = (sectionBWrite[q.id] ?? "").toLowerCase().trim() === q.writeAnswer.toLowerCase()
      if (selOk && writeOk) sB++
    })
    TD.sectionC.forEach((q) => { if ((sectionCAnswers[q.blank.blankId] ?? "") === q.blank.answer) sC++ })
    TD.sectionD.forEach((q) => { if ((sectionDAnswers[q.id] ?? "").toLowerCase().trim() === q.answer.toLowerCase()) sD++ })
    TD.sectionE.forEach((q) => { if ((sectionEAnswers[q.id] ?? "").trim().length > 0) sE++ })
    TD.sectionF.forEach((c) => { if (sectionFCorrect[c.id]) sF++ })
    TD.sectionG.forEach((q) => { if ((sectionGAnswers[q.id] ?? "").toLowerCase().trim() === q.sampleAnswer.toLowerCase()) sG++ })
    setScoreA(sA); setScoreB(sB); setScoreC(sC); setScoreD(sD)
    setScoreE(sE); setScoreF(sF); setScoreG(sG)
    setIsChecked(true)
    setCurrentPage(7)
  }

  const handleReset = () => {
    setSectionAAnswers({}); setSectionBSelected({}); setSectionBWrite({})
    setSectionCAnswers({}); setSectionDAnswers({}); setSectionEAnswers({})
    setSectionFCorrect({}); setSectionGAnswers({})
    setIsChecked(false)
    setScoreA(0); setScoreB(0); setScoreC(0); setScoreD(0)
    setScoreE(0); setScoreF(0); setScoreG(0)
    setCurrentPage(0)
  }

  // Section F mic
  const handleFMic = (card: SectionFCard) => {
    if (sectionFCorrect[card.id] || isChecked) return
    if (fListeningId === card.id) { fRecognitionRef.current?.abort(); setFListeningId(null); return }
    fRecognitionRef.current?.abort()
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert("Speech recognition not supported"); return }
    const r = new SR()
    r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 3
    r.onstart = () => setFListeningId(card.id)
    r.onresult = (e: any) => {
      const results = e.results[0]
      for (let i = 0; i < results.length; i++) {
        if (results[i].transcript.toLowerCase().trim() === card.word.toLowerCase()) {
          setSectionFCorrect((p) => ({ ...p, [card.id]: true })); break
        }
      }
      setFListeningId(null)
    }
    r.onerror = () => setFListeningId(null)
    r.onend = () => setFListeningId(null)
    fRecognitionRef.current = r
    r.start()
  }

  // ── Shared style ──────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
    border: "1.5px solid rgba(255,255,255,0.18)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
    backdropFilter: "blur(18px)",
  }

  const sectionHeader = (letter: string, label: string) => (
    <div className="flex items-center gap-2 mb-5">
      <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{letter}</span>
      <span className="text-white/80 text-sm font-semibold">{label}</span>
    </div>
  )

  // Section C dropdown dialogue
  const renderDialogue = (q: SectionCQuestion) => {
    const val = sectionCAnswers[q.blank.blankId] ?? ""
    const correct = val === q.blank.answer
    const dropdown = (
      <select
        value={val}
        onChange={(e) => !isChecked && setSectionCAnswers({ ...sectionCAnswers, [q.blank.blankId]: e.target.value })}
        disabled={isChecked}
        className={`mx-1 px-2 py-0.5 rounded-md text-sm font-semibold border-2 bg-transparent outline-none transition-colors
          ${isChecked ? correct ? "border-green-400 text-green-300" : "border-red-400 text-red-300"
            : "border-cyan-400 text-cyan-300 focus:border-cyan-300"}`}
      >
        <option value="" className="bg-[#1a1060]">___</option>
        {q.blank.options.map((o) => <option key={o} value={o} className="bg-[#1a1060]">{o}</option>)}
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
      <div key={q.id} className="flex gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
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
        href="/client/units"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-medium">Back</span>
      </Link>

      {/* Title */}
      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-30 px-8 py-2.5 rounded-full border border-cyan-400/50 backdrop-blur-md"
        style={{ background: "rgba(6,182,212,0.25)" }}
      >
        <span className="text-white font-bold text-base">{TD.title}</span>
      </div>

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl px-4 py-20">
        <div className="rounded-2xl p-6 overflow-y-auto max-h-[74vh]" style={panelStyle}>

          {/* ─── Page 0: Section A ─── */}
          {currentPage === 0 && (
            <div>
              {sectionHeader("A", "Read and match.")}
              <table className="w-full border-separate border-spacing-y-2 mb-4">
                <tbody>
                  {TD.sectionA.map((q, i) => {
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
                            type="text" maxLength={1} value={val} disabled={isChecked}
                            onChange={(e) => setSectionAAnswers({ ...sectionAAnswers, [q.id]: e.target.value.toUpperCase() })}
                            className={`w-9 h-9 ml-auto rounded-lg border-2 text-center font-bold uppercase text-sm bg-white/5 outline-none transition-colors
                              ${isChecked ? correct ? "border-green-400 text-green-300 bg-green-400/10" : "border-red-400 text-red-300 bg-red-400/10"
                                : "border-white/25 text-cyan-300 focus:border-cyan-400"}`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="space-y-2 pt-3 border-t border-white/10">
                {TD.sectionAOptions.map((opt) => (
                  <div key={opt.letter} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{opt.letter}</span>
                    <span className="text-white/65 text-sm leading-snug">{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Page 1: Section B ─── */}
          {currentPage === 1 && (
            <div>
              {sectionHeader("B", "Listen, circle and write.")}
              <div className="space-y-3">
                {TD.sectionB.map((q, i) => {
                  const selVal = sectionBSelected[q.id] ?? null
                  const writeVal = sectionBWrite[q.id] ?? ""
                  const selOk = selVal === q.correctOption
                  const writeOk = writeVal.toLowerCase().trim() === q.writeAnswer.toLowerCase()
                  return (
                    <div key={q.id} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-white/40 text-sm w-4 shrink-0">{i + 1}.</span>
                      <button onClick={() => speakText(q.audioText)}
                        className="w-7 h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center shrink-0 transition-all">
                        <Volume2 className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button onClick={() => !isChecked && setSectionBSelected({ ...sectionBSelected, [q.id]: "A" })} disabled={isChecked}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs transition-all
                          ${selVal === "A" ? isChecked ? selOk ? "border-green-400 bg-green-400/15" : "border-red-400 bg-red-400/15" : "border-cyan-400 bg-cyan-400/15" : "border-white/15 hover:border-white/30"}`}>
                        <span>{q.optionAImg}</span><span className="text-white/60 font-semibold">A</span>
                      </button>
                      <button onClick={() => !isChecked && setSectionBSelected({ ...sectionBSelected, [q.id]: "B" })} disabled={isChecked}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs transition-all
                          ${selVal === "B" ? isChecked ? q.correctOption === "B" && selOk ? "border-green-400 bg-green-400/15" : "border-red-400 bg-red-400/15" : "border-cyan-400 bg-cyan-400/15" : "border-white/15 hover:border-white/30"}`}>
                        <span>{q.optionBImg}</span><span className="text-white/60 font-semibold">B</span>
                      </button>
                      <input type="text" placeholder="Write..." value={writeVal} disabled={isChecked}
                        onChange={(e) => setSectionBWrite({ ...sectionBWrite, [q.id]: e.target.value })}
                        onKeyDown={(e) => e.preventDefault()}
                        className={`flex-1 min-w-0 px-2 py-1 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors
                          ${isChecked ? writeOk ? "border-green-400 text-green-300" : "border-red-400 text-red-300" : "border-white/20 text-cyan-300 focus:border-cyan-400"}`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Page 2: Section C ─── */}
          {currentPage === 2 && (
            <div>
              {sectionHeader("C", "Choose and write.")}
              <div className="space-y-3">
                {TD.sectionC.map((q) => renderDialogue(q))}
              </div>
            </div>
          )}

          {/* ─── Page 3: Section D ─── */}
          {currentPage === 3 && (
            <div>
              {sectionHeader("D", "Unscramble and speak.")}
              <div className="space-y-4">
                {TD.sectionD.map((q, i) => {
                  const val = sectionDAnswers[q.id] ?? ""
                  const correct = val.toLowerCase().trim() === q.answer.toLowerCase()
                  const key = `d-${q.id}`
                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-white/40 text-sm w-4 shrink-0">{i + 1}.</span>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {q.scrambled.map((w, wi) => (
                            <span key={wi} className="px-2.5 py-1 rounded-lg bg-yellow-400/20 text-yellow-200 text-xs font-semibold border border-yellow-400/30">{w}</span>
                          ))}
                        </div>
                        <span className="text-3xl shrink-0">{q.image}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-5">
                        <button
                          onClick={() => {
                            setListeningId(key)
                            startRecognition(
                              (t) => { setSectionDAnswers((p) => ({ ...p, [q.id]: t })); setListeningId(null) },
                              () => setListeningId(null)
                            )
                          }}
                          disabled={isChecked}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                            ${listeningId === key ? "bg-red-500 animate-pulse" : "bg-violet-500 hover:bg-violet-400"}`}
                        >
                          {listeningId === key ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                        </button>
                        <input type="text" placeholder="Answer..." value={val} readOnly
                          className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors
                            ${isChecked ? correct ? "border-green-400 text-green-300" : "border-red-400 text-red-300" : "border-white/20 text-cyan-300"}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Page 4: Section E ─── */}
          {currentPage === 4 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">E</span>
                <span className="text-white/80 text-sm font-semibold">Read, write answer.</span>
              </div>

              {/* 2-row × 7-col table */}
              <div className="overflow-x-auto rounded-xl border border-white/15 mb-5">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {TD.sectionETable.map((row) => (
                        <th key={row.day} className="border border-white/15 px-3 py-2.5 text-white/80 font-semibold text-center bg-white/10 whitespace-nowrap">{row.day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {TD.sectionETable.map((row) => (
                        <td key={row.day} className="border border-white/15 px-3 py-2.5 text-white/65 text-center leading-tight bg-white/5">{row.activity}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                {TD.sectionE.map((q, i) => {
                  const val = sectionEAnswers[q.id] ?? ""
                  const hasAnswer = val.trim().length > 0
                  return (
                    <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-white/40 text-sm shrink-0 w-4">{i + 1}.</span>
                        <p className="text-white/80 text-sm font-semibold leading-snug">{q.question}</p>
                      </div>
                      <input
                        type="text" placeholder="Write your answer..." value={val} disabled={isChecked}
                        onChange={(e) => setSectionEAnswers({ ...sectionEAnswers, [q.id]: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors
                          ${isChecked ? hasAnswer ? "border-green-400 text-green-300" : "border-red-400 text-red-300" : "border-white/20 text-cyan-300 focus:border-cyan-400"}`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Page 5: Section F ─── */}
          {currentPage === 5 && (
            <div>
              {sectionHeader("F", "Listen and repeat.")}
              <div className="grid grid-cols-3 gap-4">
                {TD.sectionF.map((card) => {
                  const isCorrect = sectionFCorrect[card.id]
                  const isListening = fListeningId === card.id
                  return (
                    <div key={card.id}
                      className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-3 transition-all
                        ${isCorrect ? "border-green-400/60 bg-green-400/10" : "border-white/15 bg-white/5"}`}
                    >
                      <div className={`w-full h-28 rounded-xl flex items-center justify-center relative overflow-hidden
                        ${isCorrect ? "bg-white/10" : "bg-white/5"}`}
                      >
                        <span className={`text-5xl transition-all duration-500 ${isCorrect ? "blur-0" : "blur-sm opacity-60"}`}>{card.image}</span>
                        {isCorrect && (
                          <span className="absolute bottom-1 text-[10px] text-white/60 font-medium">{card.word}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => speakText(card.audioText)}
                          className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center transition-all shrink-0">
                          <Volume2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleFMic(card)} disabled={isCorrect || isChecked}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0
                            ${isListening ? "bg-red-500 animate-pulse" : isCorrect ? "bg-green-500" : "bg-violet-500 hover:bg-violet-400"}`}
                        >
                          {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                      {isCorrect && <span className="text-green-400 text-xs font-semibold">Correct!</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Page 6: Section G + Submit ─── */}
          {currentPage === 6 && (
            <div className="flex flex-col gap-4">
              {sectionHeader("G", "Read and speak.")}
              <div className="space-y-3">
                {TD.sectionG.map((q, i) => {
                  const val = sectionGAnswers[q.id] ?? ""
                  const correct = val.toLowerCase().trim() === q.sampleAnswer.toLowerCase()
                  const key = `g-${q.id}`
                  return (
                    <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="text-white/40 text-sm w-4 shrink-0">{i + 1}.</span>
                          <p className="text-white/80 text-sm font-semibold leading-snug">{q.question}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-400/20 text-blue-200 text-[10px] font-semibold border border-blue-400/30 shrink-0">{q.hint}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-5">
                        <button
                          onClick={() => {
                            setListeningId(key)
                            startRecognition(
                              (t) => { setSectionGAnswers((p) => ({ ...p, [q.id]: t })); setListeningId(null) },
                              () => setListeningId(null)
                            )
                          }}
                          disabled={isChecked}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                            ${listeningId === key ? "bg-red-500 animate-pulse" : "bg-violet-500 hover:bg-violet-400"}`}
                        >
                          {listeningId === key ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                        </button>
                        <input type="text" placeholder="Your answer..." value={val} readOnly
                          className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors
                            ${isChecked ? correct ? "border-green-400 text-green-300" : "border-red-400 text-red-300" : "border-white/20 text-cyan-300"}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── Page 7: Result ─── */}
          {currentPage === 7 && (
            <div className="flex flex-col gap-5">
              {/* Total score */}
              <div className={`rounded-2xl p-6 text-center border-2 ${passed ? "bg-green-500/10 border-green-400/50" : "bg-red-500/10 border-red-400/50"}`}>
                <p className={`text-4xl font-black ${passed ? "text-green-400" : "text-red-400"}`}>
                  {totalScore}<span className="text-lg text-white/40">/{totalMax}</span>
                </p>
                <p className={`text-base font-bold mt-1 ${passed ? "text-green-300" : "text-red-300"}`}>
                  {passed ? "Excellent! You can skip ahead!" : "Keep Practicing!"}
                </p>
                {passed && <p className="text-green-300/60 text-xs mt-1">Your level is above beginner!</p>}
              </div>

              {/* Per-section breakdown */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "A", name: "Read and match", got: scoreA, total: 5 },
                  { label: "B", name: "Listen, circle & write", got: scoreB, total: 5 },
                  { label: "C", name: "Choose and write", got: scoreC, total: 5 },
                  { label: "D", name: "Unscramble and speak", got: scoreD, total: 4 },
                  { label: "E", name: "Read, write answer", got: scoreE, total: 5 },
                  { label: "F", name: "Listen and repeat", got: scoreF, total: 3 },
                  { label: "G", name: "Read and speak", got: scoreG, total: 4 },
                ].map((s) => {
                  const pct = Math.round((s.got / s.total) * 100)
                  const good = s.got === s.total
                  return (
                    <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-violet-500/30 text-violet-200 text-[10px] font-bold flex items-center justify-center shrink-0">{s.label}</span>
                          <span className="text-white/70 text-xs">{s.name}</span>
                        </div>
                        <span className={`text-sm font-bold ${good ? "text-green-400" : "text-amber-400"}`}>{s.got}/{s.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${good ? "bg-green-400" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-md font-semibold hover:bg-white/20 transition-all">
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <Link href="/client/units"
                  className="flex-1 flex items-center justify-center py-3 rounded-xl bg-purple-500 border border-purple-600 text-white text-md font-semibold hover:bg-purple-600 shadow-lg shadow-purple-600/20 transition-all">
                  Start with new plan
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex gap-2">
          {Array.from({ length: isChecked ? TOTAL_PAGES : TOTAL_PAGES - 1 }).map((_, i) => (
            <button
              key={i} onClick={() => setCurrentPage(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${currentPage === i ? "bg-cyan-400 w-8" : "bg-white/30 hover:bg-white/50 w-2.5"}`}
            />
          ))}
        </div>
        {currentPage === 6 && !isChecked ? (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-full bg-green-500 hover:bg-green-400 text-white font-bold text-sm shadow-lg shadow-green-500/30 transition-all"
          >
            Submit
          </button>
        ) : currentPage === 6 && isChecked ? (
          <button
            onClick={() => setCurrentPage(7)}
            className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentPage(Math.min(TOTAL_PAGES - 1, currentPage + 1))}
            disabled={currentPage === TOTAL_PAGES - 1}
            className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  )
}
