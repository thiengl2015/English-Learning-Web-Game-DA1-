"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  Volume2,
} from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import { TestAnswerReview } from "@/components/test-answer-review"
import {
  getChallenge,
  MissingChallengeTokenError,
  startChallengeSession,
  submitChallenge,
  type ChallengeAnswers,
  type ChallengeDetail,
  type ChallengeQuestion,
  type ChallengeSection,
  type StartChallengeResponse,
  type SubmitChallengeResponse,
} from "@/lib/api/challenge"

type ContentRecord = Record<string, unknown>
type ChoiceLetter = "A" | "B" | "C"

interface ChoiceOption {
  letter: string
  text: string
  image: string
}

interface BlankOption {
  id: string
  line: "A" | "B"
  options: string[]
}

const EMPTY_QUESTIONS: Record<ChallengeSection, ChallengeQuestion[]> = {
  A: [],
  B: [],
  C: [],
  D: [],
}

const SECTION_ORDER: ChallengeSection[] = ["A", "B", "C", "D"]
const SECTION_REVIEW_META = SECTION_ORDER.map((section) => ({
  key: section,
  label: section,
  name: {
    A: "Read and match",
    B: "Listen, circle and write",
    C: "Choose and write",
    D: "Listen and repeat",
  }[section],
}))

function isRecord(value: unknown): value is ContentRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseContent(content: unknown): ContentRecord {
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content)
      return isRecord(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  return isRecord(content) ? content : {}
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function sortQuestions(questions: ChallengeQuestion[]) {
  return [...questions].sort((a, b) => Number(a.display_order) - Number(b.display_order))
}

function getOptions(content: ContentRecord): ChoiceOption[] {
  const rawOptions = Array.isArray(content.options) ? content.options : []

  return rawOptions.map((item, index) => {
    if (isRecord(item)) {
      const letter = asString(item.letter, String.fromCharCode(65 + index)).toUpperCase()
      const image = asString(item.image)
      const text = asString(item.text, asString(item.label, image || letter))
      return { letter, text, image }
    }

    const text = String(item)
    return { letter: String.fromCharCode(65 + index), text, image: text }
  })
}

function getBlankOptions(content: ContentRecord): BlankOption[] {
  if (Array.isArray(content.blanks)) {
    return content.blanks
      .filter(isRecord)
      .map((blank, index) => ({
        id: asString(blank.id, `blank-${index + 1}`),
        line: asString(blank.line, "A").toUpperCase() === "B" ? "B" : "A",
        options: asStringArray(blank.options),
      }))
  }

  return [
    {
      id: "answer",
      line: content.blankInA === false ? "B" : "A",
      options: asStringArray(content.options),
    },
  ]
}

function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-US"
  utterance.rate = 0.85
  utterance.onend = () => onEnd?.()
  window.speechSynthesis.speak(utterance)
}

function startRecognition(onResult: (text: string) => void, onEnd: () => void) {
  if (typeof window === "undefined") return false

  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
  if (!Recognition) return false

  const recognition = new Recognition()
  recognition.lang = "en-US"
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.onresult = (event) => onResult(event.results[0][0].transcript)
  recognition.onerror = onEnd
  recognition.onend = onEnd
  recognition.start()
  return true
}

function VisualTile({ label, selected }: { label: string; selected?: boolean }) {
  const cleanLabel = label || "image"
  const initials = cleanLabel
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center rounded-md border text-center transition-colors ${
        selected
          ? "border-cyan-300 bg-cyan-400/15"
          : "border-white/15 bg-white/5 hover:border-white/35"
      }`}
    >
      <span
        className={`absolute left-2 top-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
          selected ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/30"
        }`}
      >
        {selected ? <Check className="h-3 w-3" /> : null}
      </span>
      <span className="text-lg font-black text-white/80">{initials || "IMG"}</span>
      <span className="mt-1 max-w-full truncate px-2 text-[11px] font-semibold capitalize text-white/55">
        {cleanLabel}
      </span>
    </div>
  )
}

export default function ChallengePage() {
  const params = useParams()
  const router = useRouter()
  const rawUnitId = params.unitId
  const unitId = Array.isArray(rawUnitId) ? rawUnitId[0] : rawUnitId

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [session, setSession] = useState<StartChallengeResponse | null>(null)
  const [result, setResult] = useState<SubmitChallengeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [listeningId, setListeningId] = useState<string | null>(null)

  const [sectionAAnswers, setSectionAAnswers] = useState<Record<string, string>>({})
  const [sectionBSelected, setSectionBSelected] = useState<Record<string, ChoiceLetter | "">>({})
  const [sectionBWritten, setSectionBWritten] = useState<Record<string, string>>({})
  const [sectionCAnswers, setSectionCAnswers] = useState<Record<string, Record<string, string>>>({})
  const [sectionDTranscripts, setSectionDTranscripts] = useState<Record<string, string>>({})

  const startTimeRef = useRef<number>(Date.now())

  const questions = useMemo(() => {
    if (!challenge) return EMPTY_QUESTIONS

    return {
      A: sortQuestions(challenge.questions.A ?? []),
      B: sortQuestions(challenge.questions.B ?? []),
      C: sortQuestions(challenge.questions.C ?? []),
      D: sortQuestions(challenge.questions.D ?? []),
    }
  }, [challenge])

  useEffect(() => {
    let isCancelled = false

    async function loadChallenge() {
      if (!unitId) return

      setIsLoading(true)
      setError(null)
      setNeedsSignIn(false)
      resetAnswers()

      try {
        const challengeData = await getChallenge(unitId)
        if (isCancelled) return

        const sessionData = await startChallengeSession(unitId)
        if (isCancelled) return

        setChallenge(challengeData)
        setSession(sessionData)
        startTimeRef.current = Date.now()
      } catch (err) {
        if (isCancelled) return

        if (err instanceof MissingChallengeTokenError) {
          setNeedsSignIn(true)
          setError("Sign in to start this challenge.")
        } else {
          setError(err instanceof Error ? err.message : "Cannot load challenge.")
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadChallenge()

    return () => {
      isCancelled = true
    }
  }, [unitId])

  function resetAnswers() {
    setSectionAAnswers({})
    setSectionBSelected({})
    setSectionBWritten({})
    setSectionCAnswers({})
    setSectionDTranscripts({})
    setResult(null)
    setSpeechError(null)
  }

  async function restartChallenge() {
    if (!unitId) return

    setIsLoading(true)
    setError(null)
    resetAnswers()

    try {
      const sessionData = await startChallengeSession(unitId)
      setSession(sessionData)
      startTimeRef.current = Date.now()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot restart challenge.")
    } finally {
      setIsLoading(false)
    }
  }

  function handleSpeech(questionId: string) {
    const key = `section-d-${questionId}`
    setSpeechError(null)
    setListeningId(key)

    const started = startRecognition(
      (text) => {
        setSectionDTranscripts((previous) => ({
          ...previous,
          [questionId]: text,
        }))
        setListeningId(null)
      },
      () => setListeningId(null)
    )

    if (!started) {
      setListeningId(null)
      setSpeechError("Speech recognition is not available in this browser.")
    }
  }

  function buildAnswers(): ChallengeAnswers {
    const answers: ChallengeAnswers = { A: {}, B: {}, C: {}, D: {} }

    questions.A.forEach((question) => {
      const questionId = String(question.id)
      answers.A[questionId] = { selected: sectionAAnswers[questionId] || "" }
    })

    questions.B.forEach((question) => {
      const questionId = String(question.id)
      answers.B[questionId] = {
        selected: sectionBSelected[questionId] || "",
        written: sectionBWritten[questionId] || "",
      }
    })

    questions.C.forEach((question) => {
      const questionId = String(question.id)
      const content = parseContent(question.content)
      const currentAnswers = sectionCAnswers[questionId] || {}

      answers.C[questionId] = Array.isArray(content.blanks)
        ? { answers: currentAnswers }
        : { answer: currentAnswers.answer || "" }
    })

    questions.D.forEach((question) => {
      const questionId = String(question.id)
      answers.D[questionId] = { transcript: sectionDTranscripts[questionId] || "" }
    })

    return answers
  }

  async function handleSubmit() {
    if (!unitId || !session) return

    setIsSubmitting(true)
    setError(null)

    try {
      const timeSpentSeconds = Math.max(
        0,
        Math.round((Date.now() - startTimeRef.current) / 1000)
      )
      const submitResult = await submitChallenge(unitId, {
        sessionId: session.session_id,
        answers: buildAnswers(),
        timeSpentSeconds,
      })

      setResult(submitResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot submit challenge.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const pageStyle = (side: "left" | "right"): CSSProperties => ({
    background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
    border: "1.5px solid rgba(255,255,255,0.18)",
    borderRight: side === "left" ? "none" : undefined,
    borderLeft: side === "right" ? "none" : undefined,
    boxShadow:
      side === "left"
        ? "-8px 0 32px rgba(0,0,0,0.3)"
        : "8px 0 32px rgba(0,0,0,0.3)",
    backdropFilter: "blur(18px)",
  })

  const sectionHeader = (letter: string, label: string) => (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
        {letter}
      </span>
      <span className="text-sm font-semibold text-white/80">{label}</span>
    </div>
  )

  function renderDialogueLine(
    questionId: string,
    speaker: "A" | "B",
    text: string,
    blanks: BlankOption[]
  ) {
    const lineBlanks = blanks.filter((blank) => blank.line === speaker)
    const parts = text.split("___")
    const currentAnswers = sectionCAnswers[questionId] || {}

    return (
      <p className="flex flex-wrap items-center gap-1 text-sm leading-snug text-white/75">
        <span className="mr-1 font-bold text-white/45">{speaker}:</span>
        {parts.map((part, index) => {
          const blank = lineBlanks[index]

          return (
            <span key={`${speaker}-${index}`} className="inline-flex items-center gap-1">
              <span>{part}</span>
              {blank ? (
                <select
                  value={currentAnswers[blank.id] || ""}
                  disabled={Boolean(result)}
                  onChange={(event) =>
                    setSectionCAnswers((previous) => ({
                      ...previous,
                      [questionId]: {
                        ...(previous[questionId] || {}),
                        [blank.id]: event.target.value,
                      },
                    }))
                  }
                  className="rounded-md border-2 border-cyan-400/70 bg-[#17104a] px-2 py-1 text-xs font-semibold text-cyan-100 outline-none transition-colors focus:border-cyan-200 disabled:opacity-70"
                >
                  <option value="">...</option>
                  {blank.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}
            </span>
          )
        })}
      </p>
    )
  }

  const renderSectionA = () => (
    <div>
      {sectionHeader("A", "Read and match.")}
      <div className="space-y-2">
        {questions.A.map((question, index) => {
          const questionId = String(question.id)
          const content = parseContent(question.content)
          const options = getOptions(content)

          return (
            <div key={questionId} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-start gap-2">
                <span className="text-sm font-semibold text-white/35">{index + 1}.</span>
                <p className="min-w-0 flex-1 text-sm leading-snug text-white/80">
                  {asString(content.question, `Question ${index + 1}`)}
                </p>
                <input
                  type="text"
                  maxLength={1}
                  value={sectionAAnswers[questionId] || ""}
                  disabled={Boolean(result)}
                  onChange={(event) =>
                    setSectionAAnswers((previous) => ({
                      ...previous,
                      [questionId]: event.target.value.toUpperCase().slice(0, 1),
                    }))
                  }
                  className="h-9 w-10 rounded-md border-2 border-white/25 bg-white/5 text-center text-sm font-black uppercase text-cyan-200 outline-none transition-colors focus:border-cyan-300 disabled:opacity-70"
                />
              </div>
              <div className="space-y-1 pl-6">
                {options.map((option) => (
                  <div key={option.letter} className="flex gap-2 text-xs text-white/65">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/70">
                      {option.letter}
                    </span>
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderSectionB = () => (
    <div>
      {sectionHeader("B", "Listen, circle and write.")}
      <div className="space-y-3">
        {questions.B.map((question, index) => {
          const questionId = String(question.id)
          const content = parseContent(question.content)
          const options = getOptions(content).slice(0, 3)
          const selected = sectionBSelected[questionId] || ""

          return (
            <div key={questionId} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="w-5 shrink-0 text-sm font-semibold text-white/35">
                  {index + 1}.
                </span>
                <button
                  type="button"
                  aria-label="Play audio"
                  onClick={() => speak(asString(content.audioText))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500 transition-colors hover:bg-cyan-400"
                >
                  <Volume2 className="h-4 w-4 text-white" />
                </button>
                <input
                  type="text"
                  value={sectionBWritten[questionId] || ""}
                  disabled={Boolean(result)}
                  onChange={(event) =>
                    setSectionBWritten((previous) => ({
                      ...previous,
                      [questionId]: event.target.value,
                    }))
                  }
                  placeholder="Write"
                  className="min-w-0 flex-1 rounded-md border-2 border-white/20 bg-transparent px-3 py-2 text-sm font-semibold text-cyan-200 outline-none transition-colors placeholder:text-white/30 focus:border-cyan-300 disabled:opacity-70"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pl-7">
                {options.map((option) => {
                  const letter = option.letter.toUpperCase() as ChoiceLetter

                  return (
                    <button
                      key={option.letter}
                      type="button"
                      disabled={Boolean(result)}
                      onClick={() =>
                        setSectionBSelected((previous) => ({
                          ...previous,
                          [questionId]: letter,
                        }))
                      }
                      className="min-w-0 text-left disabled:opacity-70"
                    >
                      <div className="mb-1 text-xs font-bold text-white/55">{letter}</div>
                      <VisualTile label={option.image || option.text} selected={selected === letter} />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderSectionC = () => (
    <div>
      {sectionHeader("C", "Choose and write.")}
      <div className="space-y-3">
        {questions.C.map((question, index) => {
          const questionId = String(question.id)
          const content = parseContent(question.content)
          const blanks = getBlankOptions(content)

          return (
            <div key={questionId} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="flex gap-2">
                <span className="w-5 shrink-0 text-sm font-semibold text-white/35">
                  {index + 1}.
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  {renderDialogueLine(questionId, "A", asString(content.lineA), blanks)}
                  {renderDialogueLine(questionId, "B", asString(content.lineB), blanks)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderSectionD = () => (
    <div>
      {sectionHeader("D", "Listen and repeat.")}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {questions.D.map((question, index) => {
          const questionId = String(question.id)
          const content = parseContent(question.content)
          const key = `section-d-${questionId}`
          const transcript = sectionDTranscripts[questionId] || ""
          const audioText = asString(content.audioText)
          const image = asString(content.image, `Item ${index + 1}`)

          return (
            <div key={questionId} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="mb-3 flex aspect-square items-center justify-center rounded-md border border-white/15 bg-white/5">
                <span className="max-w-full truncate px-3 text-center text-xl font-black capitalize text-white/65">
                  {image}
                </span>
              </div>
              <div className="mb-2 flex justify-center gap-2">
                <button
                  type="button"
                  aria-label="Play audio"
                  onClick={() => {
                    setPlayingId(questionId)
                    speak(audioText, () => setPlayingId(null))
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    playingId === questionId ? "bg-cyan-300" : "bg-cyan-500 hover:bg-cyan-400"
                  }`}
                >
                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                </button>
                <button
                  type="button"
                  aria-label="Start speaking"
                  disabled={Boolean(result)}
                  onClick={() => handleSpeech(questionId)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-60 ${
                    listeningId === key ? "bg-red-500" : "bg-violet-500 hover:bg-violet-400"
                  }`}
                >
                  {listeningId === key ? (
                    <MicOff className="h-4 w-4 text-white" />
                  ) : (
                    <Mic className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <input
                type="text"
                value={transcript}
                disabled={Boolean(result)}
                onChange={(event) =>
                  setSectionDTranscripts((previous) => ({
                    ...previous,
                    [questionId]: event.target.value,
                  }))
                }
                placeholder="Repeat"
                className="w-full rounded-md border-2 border-white/20 bg-transparent px-2 py-1.5 text-center text-xs font-semibold text-cyan-200 outline-none transition-colors placeholder:text-white/30 focus:border-cyan-300 disabled:opacity-70"
              />
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderResultBar = () => {
    if (!result) {
      return (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !session || needsSignIn}
          className="flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit
        </button>
      )
    }

    return (
      <div className="flex items-center gap-4 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-md">
        <div className={`text-center ${result.passed ? "text-green-300" : "text-red-300"}`}>
          <p className="text-2xl font-black">
            {result.score}
            <span className="text-sm text-white/45">/{result.total_possible}</span>
          </p>
          <p className="text-xs font-bold">{result.passed ? "Passed" : "Try Again"}</p>
        </div>
        {result.passed ? (
          <div className="hidden text-xs font-semibold text-green-100/75 sm:block">
            Full stars unlocked: {result.unlock_progress?.stars_awarded ?? 15}
          </div>
        ) : (
          <div className="hidden text-xs font-semibold text-white/50 sm:block">
            Challenge requires 10/10.
          </div>
        )}
        <button
          type="button"
          onClick={restartChallenge}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
        {result.passed ? (
          <button
            type="button"
            onClick={() => router.push(`/client/units/${unitId}/lessons`)}
            className="flex items-center gap-1.5 rounded-full border border-green-300 bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-colors hover:bg-green-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            Continue
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      <Link
        href={`/client/units/${unitId}/lessons`}
        className="fixed left-6 top-6 z-30 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4 text-white" />
        <span className="text-sm font-medium text-white">Back</span>
      </Link>

      <div
        className="fixed left-1/2 top-6 z-30 max-w-[calc(100vw-160px)] -translate-x-1/2 truncate rounded-full border border-cyan-400/50 px-6 py-2.5 backdrop-blur-md"
        style={{ background: "rgba(6,182,212,0.25)" }}
      >
        <span className="text-sm font-bold text-white sm:text-base">
          {challenge?.title || "Unit Challenge"}
        </span>
      </div>

      <div className="relative z-10 flex w-full max-w-5xl items-stretch justify-center px-4 py-20">
        {isLoading ? (
          <div
            className="flex h-[60vh] w-full max-w-md flex-col items-center justify-center gap-3 rounded-lg p-8"
            style={pageStyle("left")}
          >
            <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
            <p className="text-sm font-semibold text-white/65">Loading challenge...</p>
          </div>
        ) : error && (!challenge || needsSignIn) ? (
          <div
            className="flex h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 rounded-lg p-8 text-center"
            style={pageStyle("left")}
          >
            <p className="text-sm font-semibold text-red-200">{error}</p>
            {needsSignIn ? (
              <Link
                href="/sign-in"
                className="rounded-md border border-cyan-300 bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-400"
              >
                Sign In
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <div
              className="flex max-h-[74vh] flex-1 flex-col gap-4 overflow-y-auto rounded-l-lg p-5"
              style={pageStyle("left")}
            >
              {renderSectionA()}
              <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
              {renderSectionB()}
            </div>

            <div
              className="hidden w-3 shrink-0 lg:block"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))",
              }}
            />

            <div
              className="flex max-h-[74vh] flex-1 flex-col gap-4 overflow-y-auto rounded-r-lg p-5"
              style={pageStyle("right")}
            >
              {renderSectionC()}
              <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
              {renderSectionD()}
              {result ? (
                <>
                  <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
                  <TestAnswerReview
                    sections={SECTION_REVIEW_META}
                    reviews={result.details_by_section || result.section_details || null}
                    compact
                  />
                </>
              ) : null}
            </div>
          </>
        )}
      </div>

      {(error && challenge) || speechError ? (
        <div className="fixed bottom-24 left-1/2 z-30 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-md border border-red-300/35 bg-red-500/15 px-4 py-2 text-center text-xs font-semibold text-red-100 backdrop-blur-md">
          {error || speechError}
        </div>
      ) : null}

      {!isLoading && challenge ? (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
          {renderResultBar()}
        </div>
      ) : null}
    </div>
  )
}
