"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mic, Volume2, SkipForward, Star, AlertTriangle, Loader2, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { GeometricSpaceBackground } from "@/components/geometric-space-background"
import GameResults from "@/components/game-results"

// ─── Types ───────────────────────────────────────────────────────────────────
type GamePhase =
  | "idle"
  | "listening"
  | "processing"
  | "pass"        // >=50% — let user retry or pass
  | "success"     // >=80% auto-advance
  | "error"       // <50%
  | "complete"
  | "permission-denied"

interface Command {
  id: string
  text: string
  ipa: string
  translation: string
}

interface WordResult {
  word: string
  correct: boolean
}

// ─── Commands dataset ─────────────────────────────────────────────────────────
const COMMANDS: Command[] = [
  { id: "c1", text: "ENGAGE HYPERDRIVE", ipa: "/ɪnˈɡeɪdʒ ˈhaɪpərˌdraɪv/", translation: "Kích hoạt bước nhảy không gian" },
  { id: "c2", text: "FIRE LASER CANNONS", ipa: "/faɪər ˈleɪzər ˈkænənz/", translation: "Khai hỏa súng laser" },
  { id: "c3", text: "RAISE SHIELD BARRIERS", ipa: "/reɪz ʃiːld ˈbæriərz/", translation: "Nâng hàng rào khiên" },
  { id: "c4", text: "SCAN SECTOR SEVEN", ipa: "/skæn ˈsektər ˈsɛvən/", translation: "Quét khu vực số bảy" },
  { id: "c5", text: "LAUNCH ESCAPE POD", ipa: "/lɔːntʃ ɪˈskeɪp pɒd/", translation: "Phóng khoang thoát hiểm" },
  { id: "c6", text: "ACTIVATE WARP DRIVE", ipa: "/ˈæktɪveɪt wɔːrp draɪv/", translation: "Khởi động động cơ warp" },
  { id: "c7", text: "DEPLOY DEFENSE DRONES", ipa: "/dɪˈplɔɪ dɪˈfɛns drəʊnz/", translation: "Triển khai drone phòng thủ" },
  { id: "c8", text: "LOCK TARGET COORDINATES", ipa: "/lɒk ˈtɑːɡɪt kəʊˈɔːdɪnəts/", translation: "Khóa tọa độ mục tiêu" },
]

// ─── Utility ──────────────────────────────────────────────────────────────────
function similarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").trim()
  const wordsA = normalize(a).split(/\s+/)
  const wordsB = normalize(b).split(/\s+/)
  const matches = wordsA.filter(w => wordsB.includes(w)).length
  return (matches / Math.max(wordsA.length, wordsB.length)) * 100
}

function compareWords(target: string, spoken: string): WordResult[] {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").trim()
  const targetWords = target.split(/\s+/)
  const spokenNorm = normalize(spoken).split(/\s+/)
  return targetWords.map(word => ({
    word,
    correct: spokenNorm.includes(normalize(word)),
  }))
}

// ─── Main Game Component ───
export default function VoiceCommandGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")

  // Game state
  const [phase, setPhase] = useState<GamePhase>("idle")
  const [commandIndex, setCommandIndex] = useState(0)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(360)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [transcript, setTranscript] = useState("")
  const [lastTranscript, setLastTranscript] = useState("")
  const [wordResults, setWordResults] = useState<WordResult[]>([])
  const [silenceError, setSilenceError] = useState(false)
  const [totalQuestions] = useState(COMMANDS.length)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<{
    questionId: string; prompt: string; yourAnswer: string; correctAnswer: string
  }[]>([])

  // Refs
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef("")   // always mirrors latest transcript for use in callbacks

  const command = COMMANDS[commandIndex]

  // ── Timer ──
  useEffect(() => {
    if (phase === "complete") return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          // Count remaining commands (including current) as skips → deduct stars
          setCommandIndex(ci => {
            const remaining = COMMANDS.length - ci
            setWrongAnswers(wa => {
              const extra = COMMANDS.slice(ci).map(cmd => ({
                questionId: cmd.id,
                prompt: cmd.translation,
                yourAnswer: "(time expired)",
                correctAnswer: cmd.text,
              }))
              return [...wa, ...extra]
            })
            setLives(l => Math.max(0, l - remaining))
            return ci
          })
          setPhase("complete")
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase === "complete"])

  // ── Speech Synthesis ──
  const playSample = useCallback(() => {
    if (!window.speechSynthesis) return
    const utt = new SpeechSynthesisUtterance(command.text.toLowerCase())
    utt.lang = "en-US"
    utt.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utt)
  }, [command.text])

  // ── Evaluate after stop ──
  const evaluateAnswer = useCallback((spoken: string) => {
    setPhase("processing")
    setTimeout(() => {
      if (!spoken.trim()) {
        setSilenceError(true)
        setPhase("idle")
        return
      }
      const pct = similarity(command.text, spoken)
      const results = compareWords(command.text, spoken)
      setWordResults(results)
      setLastScore(Math.round(pct))
      setLastTranscript(spoken)

      if (pct >= 80) {
        // Great 
        setPhase("success")
        setScore(s => s + Math.round(pct))
        setCorrectCount(c => c + 1)
        setTimeout(() => advanceCommand(), 3000)
      } else if (pct >= 50) {
        // Acceptable 
        setPhase("pass")
      } else {
        // Too low 
        setPhase("error")
      }
    }, 600)
  }, [command])

  const advanceCommand = useCallback(() => {
    const next = commandIndex + 1
    if (next >= COMMANDS.length) {
      setPhase("complete")
    } else {
      setCommandIndex(next)
      setLastScore(null)
      setTranscript("")
      setLastTranscript("")
      transcriptRef.current = ""
      setWordResults([])
      setSilenceError(false)
      setPhase("idle")
    }
  }, [commandIndex])

  // Pass without losing a star (when 50–79%)
  const handlePass = useCallback(() => {
    setCorrectCount(c => c + 1)
    setScore(s => s + (lastScore ?? 50))
    advanceCommand()
  }, [advanceCommand, lastScore])

  // Skip (always costs a star)
  const skipCommand = useCallback(() => {
    recognitionRef.current?.abort()
    clearTimeout(silenceTimerRef.current!)
    setWrongAnswers(wa => [...wa, {
      questionId: command.id,
      prompt: command.translation,
      yourAnswer: "(skipped)",
      correctAnswer: command.text,
    }])
    setLives(l => {
      const next = Math.max(0, l - 1)
      if (next <= 0) {
        // Show results, don't auto-navigate
        setTimeout(() => setPhase("complete"), 400)
      }
      return next
    })
    if (lives > 1) advanceCommand()
  }, [command, advanceCommand, lives])

  // Retry from pass/error phase
  const handleRetry = useCallback(() => {
    setLastScore(null)
    setTranscript("")
    transcriptRef.current = ""
    setWordResults([])
    setSilenceError(false)
    setPhase("idle")
  }, [])

  // ── Toggle mic (click to start, click again to stop+confirm) ──
  const handleMicClick = useCallback(() => {
    if (phase === "listening") {
      // Second click → stop and evaluate
      clearTimeout(silenceTimerRef.current!)
      recognitionRef.current?.stop()
      // onend will call evaluateAnswer
      return
    }

    if (phase !== "idle" && phase !== "error" && phase !== "pass") return

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    transcriptRef.current = ""
    setTranscript("")
    setSilenceError(false)
    setPhase("listening")

    // Auto-stop after 3s of total silence (no speech at all)
    silenceTimerRef.current = setTimeout(() => {
      recognition.stop()
      setSilenceError(true)
      setPhase("idle")
    }, 3000)

    recognition.onresult = (e: any) => {
      // Clear silence timer as soon as any speech detected
      clearTimeout(silenceTimerRef.current!)

      const spoken = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ")

      transcriptRef.current = spoken
      setTranscript(spoken)
    }

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current!)
      evaluateAnswer(transcriptRef.current)
    }

    recognition.onerror = (e: any) => {
      clearTimeout(silenceTimerRef.current!)
      if (e.error === "not-allowed") {
        setPhase("permission-denied")
      } else if (e.error !== "aborted") {
        setPhase("idle")
      }
    }

    recognition.start()
  }, [phase, evaluateAnswer])

  // ── Render: results screen ──
  if (phase === "complete") {
    return (
      <GameResults
        totalQuestions={totalQuestions}
        correctAnswers={correctCount}
        wrongAnswers={wrongAnswers}
        onPlayAgain={() => {
          setCommandIndex(0)
          setLives(3)
          setScore(0)
          setTimeLeft(360)
          setLastScore(null)
          setTranscript("")
          setLastTranscript("")
          transcriptRef.current = ""
          setWordResults([])
          setWrongAnswers([])
          setCorrectCount(0)
          setSilenceError(false)
          setPhase("idle")
        }}
        onComplete={() => router.push("/client")}
      />
    )
  }

  // ── Derived UI ──
  const micActive = phase === "listening"
  const micDisabled = phase === "processing" || phase === "success"

  const micColor = micActive
    ? "bg-green-500 border-green-300 shadow-green-400/60"
    : phase === "processing"
      ? "bg-indigo-600 border-indigo-300 shadow-indigo-400/60"
      : phase === "success"
        ? "bg-cyan-500 border-cyan-300 shadow-cyan-400/60"
        : "bg-slate-800/70 border-cyan-400 shadow-cyan-400/30"

  const timerColor = timeLeft <= 30
    ? "text-red-400 animate-pulse"
    : timeLeft <= 60
      ? "text-orange-400"
      : "text-cyan-300"

  const accuracyColor = lastScore === null
    ? ""
    : lastScore >= 80
      ? "text-green-400"
      : lastScore >= 50
        ? "text-yellow-400"
        : "text-red-400"

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-mono">
      <GeometricSpaceBackground />

      {/* ── Back Button ── */}
      <Link
        href={unitId && lessonId ? `/client/units/${unitId}/lessons` : "/client/units"}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      {/* ── Permission Denied Modal ── */}
      {phase === "permission-denied" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900/95 border-2 border-red-500 rounded-2xl p-8 max-w-sm mx-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-red-400 font-bold text-xl mb-2">AUDIO INPUT DISCONNECTED</h2>
            <p className="text-slate-300 text-sm mb-6">Please allow microphone access to continue.</p>
            <button
              onClick={() => setPhase("idle")}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* ═══ HUD BAR ═══ */}
      <div className="relative z-10 flex  items-center justify-between px-4 py-2 bg-slate-950/70 backdrop-blur-sm border-b border-slate-700/40">
        {/* Lives */}
        <div className="pl-110">
          <div className="flex items-center gap-1 ">
            {[1, 2, 3].map(i => (
              <Star
                key={i}
                className={`w-5 h-5 transition-all duration-500 ${i <= lives ? "text-yellow-400 fill-yellow-400" : "text-slate-600 fill-slate-700"}`}
              />
            ))}
          </div>
        </div>

        {/* Progress + Score */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-white text-sm font-medium"> Question <span className="text-cyan-300 text-sm font-bold">{commandIndex + 1}/{COMMANDS.length}</span></span>
          <span className="text-white text-sm font-medium">SCORE <span className="text-cyan-300 text-sm font-bold">{score}</span></span>
        </div>
        {/* Timer */}
        <div className="pr-110">
          <div className={`text-sm font-bold tabular-nums ${timerColor}`}>
            {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* ═══ COMMAND PANEL ═══ */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-xl  min-h-[240px] min-w-[600]  justify-center bg-slate-900/80 backdrop-blur-xxs border border-cyan-400/40 rounded-2xl flex flex-col p-5 gap-3">

          {/* Target command + word highlighting */}
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mb-2">
              {wordResults.length > 0
                ? wordResults.map((wr, i) => (
                  <span
                    key={i}
                    className={`text-2xl sm:text-3xl font-bold tracking-widest transition-colors duration-300 ${wr.correct ? "text-cyan-300" : "text-red-400 underline decoration-red-500"
                      }`}
                  >
                    {wr.word}
                  </span>
                ))
                : <span className="text-2xl sm:text-3xl font-bold tracking-widest text-white">{command.text}</span>
              }
            </div>
            <div className="text-slate-400 text-xs mb-1">{command.ipa}</div>
            <div className="text-purple-300 text-sm">{command.translation}</div>
          </div>

          {/* Accuracy */}
          {lastScore !== null && (
            <div className="text-center mb-0.5">
              <span className={`text-4xl font-bold ${accuracyColor}`}>{lastScore}%</span>
              <span className="text-sm font-normal ml-2 text-slate-400">accuracy</span>
            </div>
          )}

          {/* Live transcription box */}
          <div className={`bg-slate-950/60 border rounded-lg mx-4 mt-4 px-4 py-4 min-h-[42px] flex items-center gap-2 transition-colors duration-300 ${phase === "listening" ? "border-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.35)]" : "border-slate-700/60"}`}>
            {phase === "listening" && (
              <div className="flex items-center gap-0.5 shrink-0">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-green-400 rounded-full"
                    style={{
                      animation: `waveBar ${0.4 + i * 0.08}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </div>
            )}
            {phase === "processing" && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />}
            {phase === "success" && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
            <span className={`text-sm flex-1 ${transcript || lastTranscript ? "text-white" : "text-slate-500"}`}>
              {phase === "processing"
                ? "Analyzing voice signature..."
                : phase === "success"
                  ? lastTranscript
                  : silenceError
                    ? "No vocal input detected — Tap mic to try again."
                    : transcript || (phase === "listening" ? "Listening..." : "Tap the mic to speak")}
            </span>
          </div>


          {/* Pass / retry buttons — below transcript box */}
          {lastScore !== null && (
            <div className="text-center">
              {phase === "pass" && (
                <p className="text-yellow-300 text-xs pt-0 pb-2">Acceptable — You can pass or try again </p>
              )}
              {phase === "error" && (
                <p className="text-red-400 text-xs mt-1">Below 50% — Let's try again</p>
              )}
            </div>
          )}
          {(phase === "pass" || phase === "error") && (
            <div className="flex justify-center gap-3">
              {phase === "pass" && (
                <button
                  onClick={handlePass}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400 text-yellow-300 hover:bg-yellow-500/30 font-semibold text-sm transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Pass
                </button>
              )}
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-700/60 border border-slate-500 text-slate-200 hover:bg-slate-600/60 font-semibold text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ACTION DECK ═══ */}

      <div className="relative z-10 flex items-center justify-center gap-6 px-4 py-3">

        {/* Play sample */}
        <button
          onClick={playSample}
          disabled={phase === "listening" || phase === "processing"}
          className="w-14 h-14 rounded-full bg-slate-800/80 border-2 border-slate-500 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-cyan-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Play sample pronunciation"
        >
          <Volume2 className="w-6 h-6" />
        </button>

        {/* Mic toggle button */}
        <button
          onClick={handleMicClick}
          disabled={micDisabled}
          className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-2xl ${micColor} disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={micActive ? "Stop recording" : "Start recording"}
        >
          {!micActive && phase === "idle" && (
            <span className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping opacity-30" />
          )}
          {phase === "processing"
            ? <Loader2 className="w-10 h-10 text-white animate-spin" />
            : <Mic className={`w-10 h-10 text-white ${micActive ? "animate-pulse" : ""}`} />
          }
        </button>

        {/* Skip (costs a star) */}
        <button
          onClick={skipCommand}
          disabled={phase === "processing" || phase === "success"}
          className="w-14 h-14 rounded-full bg-slate-800/80 border-2 border-slate-500 hover:border-orange-400 flex items-center justify-center text-slate-300 hover:text-orange-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Skip this command (costs a star)"
          title="Skip — costs 1 star"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom hint */}
      <div className="pb-2 text-center">
        <span className="text-slate-500 text-xs">
          {phase === "listening" ? "Tap mic again to stop recording" : "Tap mic to speak · Skip costs a star"}
        </span>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes waveBar {
          from { height: 4px; }
          to   { height: 20px; }
        }
      `}</style>
    </div>
  )
}
