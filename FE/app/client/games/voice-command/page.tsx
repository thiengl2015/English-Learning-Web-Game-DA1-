"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mic, Volume2, SkipForward, Star, AlertTriangle, Loader2, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { GeometricSpaceBackground } from "@/components/geometric-space-background"
import GameResults from "@/components/game-results"

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE_URL = RAW_API.replace(/\/$/, "").replace(/\/api$/, "")

type GamePhase =
  | "idle"
  | "listening"
  | "processing"
  | "pass"
  | "success"
  | "error"
  | "complete"
  | "permission-denied"

interface ApiQuestion {
  index: number
  type: string
  target_text?: string
  phonetic?: string
  translation?: string
  question?: string
}

interface WordResult {
  word: string
  correct: boolean
}

interface CompleteGameResponse {
  correct_answers: number
  xp_earned: number
  passed: boolean
}

function similarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").trim()
  const wordsA = normalize(a).split(/\s+/).filter(Boolean)
  const wordsB = normalize(b).split(/\s+/).filter(Boolean)
  if (wordsA.length === 0) return 0
  const matches = wordsA.filter((w) => wordsB.includes(w)).length
  return (matches / Math.max(wordsA.length, wordsB.length)) * 100
}

function compareWords(target: string, spoken: string): WordResult[] {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").trim()
  const targetWords = target.split(/\s+/)
  const spokenNorm = normalize(spoken).split(/\s+/)
  return targetWords.map((word) => ({ word, correct: spokenNorm.includes(normalize(word)) }))
}

export default function VoiceCommandGame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unitId = searchParams.get("unitId")
  const lessonId = searchParams.get("lessonId")
  const gameConfigId = searchParams.get("gameConfigId")

  const [sessionId, setSessionId] = useState<string | null>(searchParams.get("sessionId"))
  const [questions, setQuestions] = useState<ApiQuestion[]>([])
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
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<
    { questionId: string; prompt: string; yourAnswer: string; correctAnswer: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completionResult, setCompletionResult] = useState<CompleteGameResponse | null>(null)
  const [startTime] = useState(Date.now())

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef("")
  const recognitionHandledRef = useRef(false)
  const finishingRef = useRef(false)
  const submittedRef = useRef<Set<number>>(new Set())
  const commandIndexRef = useRef(0)

  const command = questions[commandIndex]
  const totalQuestions = questions.length

  const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"))

  useEffect(() => {
    commandIndexRef.current = commandIndex
  }, [commandIndex])

  useEffect(() => {
    if (!gameConfigId && !sessionId) {
      setError("Không có thông tin game")
      setIsLoading(false)
      return
    }
    loadGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadGame = async () => {
    const token = getToken()
    if (!token) {
      router.push("/sign-in")
      return
    }
    setIsLoading(true)
    try {
      let qs: ApiQuestion[] = []
      let limit = 360
      if (sessionId) {
        const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/results`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.success && json.data?.questions) qs = json.data.questions
      } else if (gameConfigId) {
        const res = await fetch(`${API_BASE_URL}/api/games/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ game_config_id: parseInt(gameConfigId) }),
        })
        const json = await res.json()
        if (!json.success || !json.data?.questions) throw new Error(json.message || "Không thể bắt đầu game")
        qs = json.data.questions
        if (typeof json.data.time_limit === "number" && json.data.time_limit > 0) limit = json.data.time_limit
        const sid = json.data.session_id
        if (sid) {
          setSessionId(sid)
          history.replaceState(null, "", `?sessionId=${sid}&unitId=${unitId}&lessonId=${lessonId}&gameConfigId=${gameConfigId}`)
        }
      }
      if (qs.length === 0) throw new Error("Không có nội dung game")
      setQuestions(qs)
      setTimeLeft(limit)
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải game")
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswerToBE = async (questionIndex: number, answer: string) => {
    const token = getToken()
    if (!sessionId || !token) return null
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question_index: questionIndex, answer }),
      })
      const json = await res.json()
      return json.success ? json.data : null
    } catch {
      return null
    }
  }

  const finishGame = useCallback(async () => {
    if (finishingRef.current) return
    finishingRef.current = true
    setIsFinishing(true)
    const token = getToken()
    if (sessionId && token) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      try {
        const res = await fetch(`${API_BASE_URL}/api/games/${sessionId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ time_spent: timeSpent }),
        })
        const json = await res.json()
        if (json.success) setCompletionResult(json.data)
      } catch {
        /* ignore */
      }
    }
    setIsFinishing(false)
    setPhase("complete")
  }, [sessionId, startTime])

  // Timer
  useEffect(() => {
    if (isLoading || error || phase === "complete") return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, phase === "complete"])

  const handleTimeout = useCallback(() => {
    const idx = commandIndexRef.current
    const remaining = questions.slice(idx)
    setWrongAnswers((wa) => [
      ...wa,
      ...remaining.map((q, i) => ({
        questionId: `q-${idx + i}`,
        prompt: q.translation || "",
        yourAnswer: "(time expired)",
        correctAnswer: q.target_text || "",
      })),
    ])
    setLives((l) => Math.max(0, l - remaining.length))
    finishGame()
  }, [questions, finishGame])

  const playSample = useCallback(() => {
    if (!window.speechSynthesis || !command?.target_text) return
    const utt = new SpeechSynthesisUtterance(command.target_text.toLowerCase())
    utt.lang = "en-US"
    utt.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utt)
  }, [command])

  const resetPerCommand = () => {
    setLastScore(null)
    setTranscript("")
    setLastTranscript("")
    transcriptRef.current = ""
    setWordResults([])
    setSilenceError(false)
    setPhase("idle")
  }

  const advance = useCallback(() => {
    const next = commandIndex + 1
    if (next >= questions.length) {
      finishGame()
    } else {
      setCommandIndex(next)
      resetPerCommand()
    }
  }, [commandIndex, questions.length, finishGame])

  const submitPass = useCallback(async () => {
    const idx = commandIndex
    if (!submittedRef.current.has(idx)) {
      submittedRef.current.add(idx)
      await submitAnswerToBE(idx, "pass")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandIndex, sessionId])

  const evaluateAnswer = useCallback(
    (spoken: string) => {
      setPhase("processing")
      setTimeout(() => {
        if (!spoken.trim()) {
          setSilenceError(true)
          setPhase("idle")
          return
        }
        const pct = similarity(command?.target_text || "", spoken)
        const results = compareWords(command?.target_text || "", spoken)
        setWordResults(results)
        setLastScore(Math.round(pct))
        setLastTranscript(spoken)

        if (pct >= 80) {
          setPhase("success")
          setScore((s) => s + Math.round(pct))
          setCorrectCount((c) => c + 1)
          submitPass()
          setTimeout(() => advance(), 3000)
        } else if (pct >= 50) {
          setPhase("pass")
        } else {
          setPhase("error")
        }
      }, 600)
    },
    [command, advance, submitPass]
  )

  const handlePass = useCallback(() => {
    setCorrectCount((c) => c + 1)
    setScore((s) => s + (lastScore ?? 50))
    submitPass()
    advance()
  }, [advance, lastScore, submitPass])

  const skipCommand = useCallback(() => {
    recognitionHandledRef.current = true
    recognitionRef.current?.abort()
    clearTimeout(silenceTimerRef.current!)
    clearTimeout(stopFallbackTimerRef.current!)
    setWrongAnswers((wa) => [
      ...wa,
      {
        questionId: `q-${commandIndex}`,
        prompt: command?.translation || "",
        yourAnswer: "(skipped)",
        correctAnswer: command?.target_text || "",
      },
    ])
    const newLives = Math.max(0, lives - 1)
    setLives(newLives)
    if (newLives <= 0) {
      finishGame()
    } else {
      advance()
    }
  }, [command, advance, lives, commandIndex, finishGame])

  const handleRetry = useCallback(() => {
    setLastScore(null)
    setTranscript("")
    transcriptRef.current = ""
    setWordResults([])
    setSilenceError(false)
    setPhase("idle")
  }, [])

  const handleMicClick = useCallback(() => {
    if (phase === "listening") {
      clearTimeout(silenceTimerRef.current!)
      setPhase("processing")
      recognitionRef.current?.stop()
      clearTimeout(stopFallbackTimerRef.current!)
      stopFallbackTimerRef.current = setTimeout(() => {
        if (recognitionHandledRef.current) return
        recognitionHandledRef.current = true
        evaluateAnswer(transcriptRef.current)
      }, 700)
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
    recognitionHandledRef.current = false
    clearTimeout(stopFallbackTimerRef.current!)

    transcriptRef.current = ""
    setTranscript("")
    setSilenceError(false)
    setPhase("listening")

    silenceTimerRef.current = setTimeout(() => {
      recognitionHandledRef.current = true
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
      clearTimeout(stopFallbackTimerRef.current!)
      if (recognitionHandledRef.current) return
      recognitionHandledRef.current = true
      evaluateAnswer(transcriptRef.current)
    }

    recognition.onerror = (e: any) => {
      clearTimeout(silenceTimerRef.current!)
      clearTimeout(stopFallbackTimerRef.current!)
      if (e.error === "not-allowed") setPhase("permission-denied")
      else if (e.error !== "aborted" && !recognitionHandledRef.current) setPhase("idle")
    }

    recognition.start()
  }, [phase, evaluateAnswer])

  const handlePlayAgain = () => {
    if (gameConfigId) {
      window.location.href = `/client/games/voice-command?gameConfigId=${gameConfigId}&unitId=${unitId}&lessonId=${lessonId}`
    } else {
      window.location.reload()
    }
  }

  const handleComplete = () => {
    if (unitId && lessonId) router.push(`/client/units/${unitId}/lessons`)
    else router.push("/client/units")
  }

  if (isLoading || isFinishing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-white flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
          <p className="text-xl font-medium">{isFinishing ? "Saving results..." : "Loading game..."}</p>
        </div>
      </div>
    )
  }

  if (error || !command) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-xl">{error || "Không có nội dung game"}</p>
          <button onClick={() => router.back()} className="px-6 py-3 bg-cyan-400 text-purple-900 font-bold rounded-xl">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (phase === "complete") {
    return (
      <GameResults
        totalQuestions={totalQuestions}
        correctAnswers={completionResult?.correct_answers ?? correctCount}
        wrongAnswers={wrongAnswers}
        onPlayAgain={handlePlayAgain}
        onComplete={handleComplete}
        xpEarned={completionResult?.xp_earned ?? 0}
        passed={completionResult?.passed ?? false}
      />
    )
  }

  const micActive = phase === "listening"
  const micDisabled = phase === "processing" || phase === "success"

  const micColor = micActive
    ? "bg-green-500 border-green-300 shadow-green-400/60"
    : phase === "processing"
      ? "bg-indigo-600 border-indigo-300 shadow-indigo-400/60"
      : phase === "success"
        ? "bg-cyan-500 border-cyan-300 shadow-cyan-400/60"
        : "bg-slate-800/70 border-cyan-400 shadow-cyan-400/30"

  const timerColor = timeLeft <= 30 ? "text-red-400 animate-pulse" : timeLeft <= 60 ? "text-orange-400" : "text-cyan-300"

  const accuracyColor =
    lastScore === null ? "" : lastScore >= 80 ? "text-green-400" : lastScore >= 50 ? "text-yellow-400" : "text-red-400"

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-mono">
      <GeometricSpaceBackground />

      <Link
        href={unitId && lessonId ? `/client/units/${unitId}/lessons` : "/client/units"}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

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

      <div className="relative z-10 flex  items-center justify-between px-4 py-2 bg-slate-950/70 backdrop-blur-sm border-b border-slate-700/40">
        <div className="pl-110">
          <div className="flex items-center gap-1 ">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className={`w-5 h-5 transition-all duration-500 ${i <= lives ? "text-yellow-400 fill-yellow-400" : "text-slate-600 fill-slate-700"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-white text-sm font-medium">
            {" "}
            Question <span className="text-cyan-300 text-sm font-bold">{commandIndex + 1}/{totalQuestions}</span>
          </span>
          <span className="text-white text-sm font-medium">
            SCORE <span className="text-cyan-300 text-sm font-bold">{score}</span>
          </span>
        </div>
        <div className="pr-110">
          <div className={`text-sm font-bold tabular-nums ${timerColor}`}>
            {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-xl  min-h-[240px] min-w-[600]  justify-center bg-slate-900/80 backdrop-blur-xxs border border-cyan-400/40 rounded-2xl flex flex-col p-5 gap-3">
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mb-2">
              {wordResults.length > 0 ? (
                wordResults.map((wr, i) => (
                  <span
                    key={i}
                    className={`text-2xl sm:text-3xl font-bold tracking-widest transition-colors duration-300 ${wr.correct ? "text-cyan-300" : "text-red-400 underline decoration-red-500"}`}
                  >
                    {wr.word}
                  </span>
                ))
              ) : (
                <span className="text-2xl sm:text-3xl font-bold tracking-widest text-white">{command.target_text}</span>
              )}
            </div>
            <div className="text-slate-400 text-xs mb-1">{command.phonetic}</div>
            <div className="text-purple-300 text-sm">{command.translation}</div>
          </div>

          {lastScore !== null && (
            <div className="text-center mb-0.5">
              <span className={`text-4xl font-bold ${accuracyColor}`}>{lastScore}%</span>
              <span className="text-sm font-normal ml-2 text-slate-400">accuracy</span>
            </div>
          )}

          <div
            className={`bg-slate-950/60 border rounded-lg mx-4 mt-4 px-4 py-4 min-h-[42px] flex items-center gap-2 transition-colors duration-300 ${phase === "listening" ? "border-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.35)]" : "border-slate-700/60"}`}
          >
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

          {lastScore !== null && (
            <div className="text-center">
              {phase === "pass" && <p className="text-yellow-300 text-xs pt-0 pb-2">Acceptable — You can pass or try again </p>}
              {phase === "error" && <p className="text-red-400 text-xs mt-1">Below 50% — Let's try again</p>}
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

      <div className="relative z-10 flex items-center justify-center gap-6 px-4 py-3">
        <button
          onClick={playSample}
          disabled={phase === "listening" || phase === "processing"}
          className="w-14 h-14 rounded-full bg-slate-800/80 border-2 border-slate-500 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-cyan-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Play sample pronunciation"
        >
          <Volume2 className="w-6 h-6" />
        </button>

        <button
          onClick={handleMicClick}
          disabled={micDisabled}
          className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-2xl ${micColor} disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={micActive ? "Stop recording" : "Start recording"}
        >
          {!micActive && phase === "idle" && (
            <span className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping opacity-30" />
          )}
          {phase === "processing" ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : (
            <Mic className={`w-10 h-10 text-white ${micActive ? "animate-pulse" : ""}`} />
          )}
        </button>

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

      <div className="pb-2 text-center">
        <span className="text-slate-500 text-xs">
          {phase === "listening" ? "Tap mic again to stop recording" : "Tap mic to speak · Skip costs a star"}
        </span>
      </div>

      <style>{`
        @keyframes waveBar {
          from { height: 4px; }
          to   { height: 20px; }
        }
      `}</style>
    </div>
  )
}
