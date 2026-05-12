"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mic, Volume2, SkipForward, Star, AlertTriangle, Loader2, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { GeometricSpaceBackground } from "@/components/geometric-space-background"
import GameResults from "@/components/game-results"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

// ─── Types ───────────────────────────────────────────────────────────────────
type GamePhase =
  | "idle"
  | "listening"
  | "processing"
  | "pass"
  | "success"
  | "error"
  | "complete"
  | "permission-denied"

interface Question {
  index: number
  vocab_id: number
  question: string
  question_vi?: string
  type: string
  words?: string[]
  target_text?: string
  correct_answer: string
  translation?: string
  phonetic?: string
  hint?: string
}

interface WordResult {
  word: string
  correct: boolean
}

interface CompleteGameResponse {
  session_id: string
  status: "completed"
  score: number
  correct_answers: number
  total_questions: number
  accuracy: number
  passed: boolean
  passing_score: number
  xp_earned: number
  time_spent: number
  message: string
}

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
  const sessionId = searchParams.get("sessionId")
  const gameConfigId = searchParams.get("gameConfigId")

  // Loading / error state
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Game state
  const [phase, setPhase] = useState<GamePhase>("idle")
  const [questions, setQuestions] = useState<Question[]>([])
  const [commandIndex, setCommandIndex] = useState(0)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(360)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [transcript, setTranscript] = useState("")
  const [lastTranscript, setLastTranscript] = useState("")
  const [wordResults, setWordResults] = useState<WordResult[]>([])
  const [silenceError, setSilenceError] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<{
    questionId: string; prompt: string; yourAnswer: string; correctAnswer: string
  }[]>([])
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())

  // Refs
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef("")

  const currentQuestion = questions[commandIndex]
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? ((commandIndex + 1) / totalQuestions) * 100 : 0

  // ── Load game from API ──
  useEffect(() => {
    if (!sessionId && !gameConfigId) {
      setError("Không có thông tin game")
      setIsLoading(false)
      return
    }
    loadGame()
  }, [sessionId, gameConfigId])

  const loadGame = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/sign-in")
      return
    }

    setIsLoading(true)

    try {
      let qs: Question[] = []

      if (sessionId) {
        const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/results`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.success && json.data?.questions) {
          qs = json.data.questions
        }
      } else if (gameConfigId) {
        const res = await fetch(`${API_BASE_URL}/api/games/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ game_config_id: parseInt(gameConfigId) }),
        })
        const json = await res.json()
        if (json.success && json.data?.questions) {
          qs = json.data.questions
          const sid = json.data.session_id
          if (sid) {
            history.replaceState(null, "", `?sessionId=${sid}&unitId=${unitId}&lessonId=${lessonId}&gameConfigId=${gameConfigId}`)
          }
        }
      }

      if (qs.length === 0) {
        throw new Error("Không có câu hỏi nào")
      }

      setQuestions(qs)
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải game")
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswerToBE = async (questionIndex: number, answer: string) => {
    if (!sessionId) return null

    const token = localStorage.getItem("token")
    if (!token) return null

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question_index: questionIndex, answer }),
      })
      const json = await res.json()
      return json.success ? json.data : null
    } catch {
      return null
    }
  }

  const completeGameBE = async () => {
    if (!sessionId) return null

    const token = localStorage.getItem("token")
    if (!token) return null

    const timeSpent = Math.round((Date.now() - startTime) / 1000)

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ time_spent: timeSpent }),
      })
      const json = await res.json()
      return json.success ? json.data : null
    } catch {
      return null
    }
  }

  const handleFinishGame = async () => {
    setIsCompleting(true)
    const result = await completeGameBE()
    setIsCompleting(false)

    if (result) {
      setCompletionResult(result)
    }
    setPhase("complete")
  }

  // ── Timer ──
  useEffect(() => {
    if (phase === "complete") return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setCommandIndex(ci => {
            const remaining = totalQuestions - ci
            setWrongAnswers(wa => {
              const extra = questions.slice(ci).map((cmd, idx) => ({
                questionId: `q-${ci + idx}`,
                prompt: cmd.question_vi || cmd.question || "",
                yourAnswer: "(time expired)",
                correctAnswer: cmd.correct_answer,
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
  }, [phase, totalQuestions, questions])

  // ── Speech Synthesis ──
  const playSample = useCallback(() => {
    if (!window.speechSynthesis || !currentQuestion?.target_text) return
    const utt = new SpeechSynthesisUtterance(currentQuestion.target_text.toLowerCase())
    utt.lang = "en-US"
    utt.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utt)
  }, [currentQuestion?.target_text])

  // ── Evaluate after stop ──
  const evaluateAnswer = useCallback((spoken: string) => {
    if (!currentQuestion) return

    setPhase("processing")

    if (!spoken.trim()) {
      setSilenceError(true)
      setPhase("idle")
      return
    }

    const pct = similarity(currentQuestion.correct_answer, spoken)
    const results = compareWords(currentQuestion.correct_answer, spoken)
    setWordResults(results)
    setLastScore(Math.round(pct))
    setLastTranscript(spoken)

    let beAnswer: string
    if (pct >= 80) {
      beAnswer = "pass"
      setPhase("success")
      setScore(s => s + Math.round(pct))
      setCorrectCount(c => c + 1)
      setTimeout(() => advanceCommand(), 3000)
    } else if (pct >= 50) {
      beAnswer = "pass"
      setPhase("pass")
    } else {
      beAnswer = "fail"
      setPhase("error")
      setWrongAnswers(wa => [...wa, {
        questionId: `q-${commandIndex}`,
        prompt: currentQuestion.question_vi || currentQuestion.question || "",
        yourAnswer: spoken,
        correctAnswer: currentQuestion.correct_answer,
      }])
    }

    // Submit to BE with pass/fail indicator
    submitAnswerToBE(commandIndex, beAnswer).catch(() => {})
  }, [currentQuestion, commandIndex])

  const advanceCommand = useCallback(() => {
    const next = commandIndex + 1
    if (next >= totalQuestions) {
      handleFinishGame()
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
  }, [commandIndex, totalQuestions])

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

    if (currentQuestion) {
      setWrongAnswers(wa => [...wa, {
        questionId: `q-${commandIndex}`,
        prompt: currentQuestion.question_vi || currentQuestion.question || "",
        yourAnswer: "(skipped)",
        correctAnswer: currentQuestion.correct_answer,
      }])
    }

    setLives(l => {
      const next = Math.max(0, l - 1)
      if (next <= 0) {
        setTimeout(() => setPhase("complete"), 400)
      }
      return next
    })

    if (lives > 1) advanceCommand()
  }, [currentQuestion, commandIndex, advanceCommand, lives])

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
      clearTimeout(silenceTimerRef.current!)
      recognitionRef.current?.stop()
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

    // Auto-stop after 3s of silence
    silenceTimerRef.current = setTimeout(() => {
      recognition.stop()
      setSilenceError(true)
      setPhase("idle")
    }, 3000)

    recognition.onresult = (e: any) => {
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

  // ── Navigation handlers ──
  const handleComplete = () => {
    if (unitId && lessonId) {
      router.push(`/client/units/${unitId}/lessons`)
    } else {
      router.push("/client/units")
    }
  }

  const handlePlayAgain = () => {
    if (gameConfigId) {
      router.push(`/client/games/voice-command?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`)
    } else {
      window.location.reload()
    }
  }

  // ── Render: loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
          <p className="text-xl font-medium">Đang tải câu hỏi...</p>
        </div>
      </div>
    )
  }

  // ── Render: error ──
  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-xl">{error || "Không có câu hỏi"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-cyan-400 text-purple-900 font-bold rounded-xl"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  // ── Render: results screen ──
  if (phase === "complete") {
    return (
      <GameResults
        totalQuestions={totalQuestions}
        correctAnswers={completionResult?.correct_answers ?? correctCount}
        wrongAnswers={wrongAnswers}
        onComplete={handleComplete}
        onPlayAgain={handlePlayAgain}
        xpEarned={completionResult?.xp_earned ?? 0}
        passed={completionResult?.passed ?? false}
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
        <span className="text-white font-medium">Quay lại</span>
      </Link>

      {/* ── Permission Denied Modal ── */}
      {phase === "permission-denied" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900/95 border-2 border-red-500 rounded-2xl p-8 max-w-sm mx-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-red-400 font-bold text-xl mb-2">KHÔNG CÓ QUYỀN TRUY CẬP MICRO</h2>
            <p className="text-slate-300 text-sm mb-6">Vui lòng cho phép truy cập microphone để tiếp tục.</p>
            <button
              onClick={() => setPhase("idle")}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* ═══ HUD BAR ═══ */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-slate-950/70 backdrop-blur-sm border-b border-slate-700/40">
        {/* Lives */}
        <div className="pl-4">
          <div className="flex items-center gap-1">
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
          <span className="text-white text-sm font-medium">
            Câu {commandIndex + 1}/{totalQuestions}
          </span>
          <span className="text-white text-sm font-medium">Điểm <span className="text-cyan-300 text-sm font-bold">{score}</span></span>
        </div>

        {/* Timer */}
        <div className="pr-4">
          <div className={`text-sm font-bold tabular-nums ${timerColor}`}>
            {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-4 py-1">
        <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ═══ COMMAND PANEL ═══ */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-xl min-h-[240px] justify-center bg-slate-900/80 backdrop-blur-xxs border border-cyan-400/40 rounded-2xl flex flex-col p-5 gap-3">

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
                : <span className="text-2xl sm:text-3xl font-bold tracking-widest text-white">{currentQuestion.target_text}</span>
              }
            </div>
            <div className="text-slate-400 text-xs mb-1">{currentQuestion.phonetic || ""}</div>
            <div className="text-purple-300 text-sm">{currentQuestion.question_vi || currentQuestion.question}</div>
          </div>

          {/* Accuracy */}
          {lastScore !== null && (
            <div className="text-center mb-0.5">
              <span className={`text-4xl font-bold ${accuracyColor}`}>{lastScore}%</span>
              <span className="text-sm font-normal ml-2 text-slate-400">độ chính xác</span>
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
                ? "Đang phân tích giọng nói..."
                : phase === "success"
                  ? lastTranscript
                  : silenceError
                    ? "Không phát hiện giọng nói - Nhấn mic để thử lại."
                    : transcript || (phase === "listening" ? "Đang nghe..." : "Nhấn mic để nói")}
            </span>
          </div>

          {/* Pass / retry buttons */}
          {lastScore !== null && (
            <div className="text-center">
              {phase === "pass" && (
                <p className="text-yellow-300 text-xs pt-0 pb-2">Chấp nhận được — Bạn có thể bỏ qua hoặc thử lại</p>
              )}
              {phase === "error" && (
                <p className="text-red-400 text-xs mt-1">Dưới 50% — Hãy thử lại</p>
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
                  <CheckCircle className="w-4 h-4" /> Bỏ qua
                </button>
              )}
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-700/60 border border-slate-500 text-slate-200 hover:bg-slate-600/60 font-semibold text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Thử lại
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
          aria-label="Phát mẫu phát âm"
        >
          <Volume2 className="w-6 h-6" />
        </button>

        {/* Mic toggle button */}
        <button
          onClick={handleMicClick}
          disabled={micDisabled}
          className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-2xl ${micColor} disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={micActive ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
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
          aria-label="Bỏ qua câu này (mất 1 mạng)"
          title="Bỏ qua — mất 1 mạng"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom hint */}
      <div className="pb-2 text-center">
        <span className="text-slate-500 text-xs">
          {phase === "listening" ? "Nhấn mic lần nữa để dừng ghi" : "Nhấn mic để nói · Bỏ qua mất 1 mạng"}
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
