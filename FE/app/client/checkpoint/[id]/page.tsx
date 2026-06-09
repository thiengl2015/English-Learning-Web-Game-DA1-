"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Volume2,
} from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import {
  getCheckpoint,
  MissingCheckpointTokenError,
  startCheckpointSession,
  submitCheckpoint as submitCheckpointAnswers,
  type CheckpointAnswers,
  type CheckpointDetail,
  type CheckpointQuestion,
  type CheckpointSection,
  type StartCheckpointResponse,
  type SubmitCheckpointResponse,
} from "@/lib/api/checkpoint"

type ContentRecord = Record<string, unknown>
type SectionBChoice = "A" | "B"

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

const SECTION_ORDER: CheckpointSection[] = ["A", "B", "C", "D", "E"]
const EMPTY_QUESTIONS: Record<CheckpointSection, CheckpointQuestion[]> = {
  A: [],
  B: [],
  C: [],
  D: [],
  E: [],
}

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

  const blankInA = content.blankInA !== false
  return [
    {
      id: "answer",
      line: blankInA ? "A" : "B",
      options: asStringArray(content.options),
    },
  ]
}

function sortQuestions(questions: CheckpointQuestion[]) {
  return [...questions].sort((a, b) => Number(a.display_order) - Number(b.display_order))
}

function isImageSource(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:image/")
  )
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
      className={`relative flex h-20 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-md border text-center transition-colors ${
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
      {isImageSource(cleanLabel) ? (
        <img src={cleanLabel} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          <span className="text-lg font-black text-white/80">{initials || "IMG"}</span>
          <span className="mt-1 max-w-full truncate px-2 text-[11px] font-semibold capitalize text-white/55">
            {cleanLabel}
          </span>
        </>
      )}
    </div>
  )
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-US"
  utterance.rate = 0.85
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
  recognition.onresult = (event) => {
    onResult(event.results[0][0].transcript)
  }
  recognition.onerror = onEnd
  recognition.onend = onEnd
  recognition.start()
  return true
}

export default function CheckpointPage() {
  const params = useParams()
  const rawId = params.id
  const checkpointId = Array.isArray(rawId) ? rawId[0] : rawId

  const [checkpoint, setCheckpoint] = useState<CheckpointDetail | null>(null)
  const [session, setSession] = useState<StartCheckpointResponse | null>(null)
  const [result, setResult] = useState<SubmitCheckpointResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [listeningId, setListeningId] = useState<string | null>(null)

  const [sectionAAnswers, setSectionAAnswers] = useState<Record<string, string>>({})
  const [sectionBSelected, setSectionBSelected] = useState<Record<string, SectionBChoice | "">>({})
  const [sectionBWritten, setSectionBWritten] = useState<Record<string, string>>({})
  const [sectionCAnswers, setSectionCAnswers] = useState<Record<string, Record<string, string>>>({})
  const [sectionDAnswers, setSectionDAnswers] = useState<Record<string, string>>({})
  const [sectionEAnswers, setSectionEAnswers] = useState<Record<string, string>>({})

  const startTimeRef = useRef<number>(Date.now())

  const questions = useMemo(() => {
    if (!checkpoint) return EMPTY_QUESTIONS

    return {
      A: sortQuestions(checkpoint.questions.A ?? []),
      B: sortQuestions(checkpoint.questions.B ?? []),
      C: sortQuestions(checkpoint.questions.C ?? []),
      D: sortQuestions(checkpoint.questions.D ?? []),
      E: sortQuestions(checkpoint.questions.E ?? []),
    }
  }, [checkpoint])

  const totalPages = 3

  useEffect(() => {
    let isCancelled = false

    async function loadCheckpoint() {
      if (!checkpointId) return

      setIsLoading(true)
      setError(null)
      setNeedsSignIn(false)
      setResult(null)
      resetAnswers()

      try {
        const checkpointData = await getCheckpoint(checkpointId)
        if (isCancelled) return

        setCheckpoint(checkpointData)

        const sessionData = await startCheckpointSession(checkpointId)
        if (isCancelled) return

        setSession(sessionData)
        startTimeRef.current = Date.now()
      } catch (err) {
        if (isCancelled) return

        if (err instanceof MissingCheckpointTokenError) {
          setNeedsSignIn(true)
          setError("Sign in to start this checkpoint.")
        } else {
          setError(err instanceof Error ? err.message : "Cannot load checkpoint.")
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadCheckpoint()

    return () => {
      isCancelled = true
    }
  }, [checkpointId])

  function resetAnswers() {
    setSectionAAnswers({})
    setSectionBSelected({})
    setSectionBWritten({})
    setSectionCAnswers({})
    setSectionDAnswers({})
    setSectionEAnswers({})
    setSpeechError(null)
    setCurrentPage(0)
  }

  async function restartCheckpoint() {
    if (!checkpointId) return

    setIsLoading(true)
    setError(null)
    setResult(null)
    resetAnswers()

    try {
      const sessionData = await startCheckpointSession(checkpointId)
      setSession(sessionData)
      startTimeRef.current = Date.now()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot restart checkpoint.")
    } finally {
      setIsLoading(false)
    }
  }

  function handleSpeech(key: string, onResult: (text: string) => void) {
    setSpeechError(null)
    setListeningId(key)

    const started = startRecognition(
      (text) => {
        onResult(text)
        setListeningId(null)
      },
      () => setListeningId(null)
    )

    if (!started) {
      setListeningId(null)
      setSpeechError("Speech recognition is not available in this browser.")
    }
  }

  function buildAnswers(): CheckpointAnswers {
    const answers: CheckpointAnswers = { A: {}, B: {}, C: {}, D: {}, E: {} }

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
      answers.D[questionId] = { answer: sectionDAnswers[questionId] || "" }
    })

    questions.E.forEach((question) => {
      const questionId = String(question.id)
      const transcript = sectionEAnswers[questionId] || ""
      answers.E[questionId] = {
        confirmed: transcript.trim().length > 0,
        transcript,
      }
    })

    return answers
  }

  async function handleSubmit() {
    if (!checkpointId || !session) return

    setIsSubmitting(true)
    setError(null)

    try {
      const timeSpentSeconds = Math.max(
        0,
        Math.round((Date.now() - startTimeRef.current) / 1000)
      )

      const submitResult = await submitCheckpointAnswers(checkpointId, {
        sessionId: session.session_id,
        answers: buildAnswers(),
        timeSpentSeconds,
      })

      setResult(submitResult)
      setCurrentPage(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot submit checkpoint.")
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

  const renderSectionA = () => (
    <div
      className="flex max-h-[74vh] flex-1 flex-col gap-3 overflow-y-auto rounded-l-lg p-6"
      style={pageStyle("left")}
    >
      {sectionHeader("A", "Read and match.")}
      <div className="space-y-3">
        {questions.A.map((question, index) => {
          const questionId = String(question.id)
          const content = parseContent(question.content)
          const options = getOptions(content)
          const value = sectionAAnswers[questionId] || ""

          return (
            <div key={questionId} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_48px_1.1fr] md:items-start">
                <div className="flex gap-2">
                  <span className="shrink-0 text-sm font-semibold text-white/35">
                    {index + 1}.
                  </span>
                  <p className="text-sm leading-snug text-white/80">
                    {asString(content.question, `Question ${index + 1}`)}
                  </p>
                </div>
                <input
                  type="text"
                  maxLength={1}
                  value={value}
                  disabled={Boolean(result)}
                  onChange={(event) => {
                    const next = event.target.value.toUpperCase().slice(0, 1)
                    setSectionAAnswers((previous) => ({
                      ...previous,
                      [questionId]: next,
                    }))
                  }}
                  className="h-10 w-12 rounded-md border-2 border-white/25 bg-white/5 text-center text-sm font-black uppercase text-cyan-200 outline-none transition-colors focus:border-cyan-300 disabled:opacity-70"
                />
                <div className="space-y-1.5">
                  {options.map((option) => (
                    <div key={option.letter} className="flex gap-2 text-xs text-white/65">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/70">
                        {option.letter}
                      </span>
                      <span className="leading-snug">{option.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderSectionB = () => (
    <div
      className="flex max-h-[74vh] flex-1 flex-col gap-3 overflow-y-auto rounded-r-lg p-6"
      style={pageStyle("right")}
    >
      {sectionHeader("B", "Listen, circle and write.")}
      <div className="space-y-3">
        {questions.B.map((question, index) => {
          const questionId = String(question.id)
          const content = parseContent(question.content)
          const options = getOptions(content).slice(0, 2)
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
              <div className="grid grid-cols-2 gap-2 pl-7">
                {options.map((option) => {
                  const letter = option.letter.toUpperCase() as SectionBChoice

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

  const renderSectionC = () => (
    <div
      className="flex max-h-[74vh] flex-1 flex-col gap-3 overflow-y-auto rounded-l-lg p-6"
      style={pageStyle("left")}
    >
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
    <div
      className="flex max-h-[74vh] flex-1 flex-col gap-3 overflow-y-auto rounded-r-lg p-6"
      style={pageStyle("right")}
    >
      {sectionHeader("D", "Unscramble and speak.")}
      <div className="space-y-3">
        {questions.D.map((question, index) => {
          const questionId = String(question.id)
          const content = parseContent(question.content)
          const words = asStringArray(content.scrambled)
          const image = asString(content.image, "illustration")
          const key = `section-d-${questionId}`

          return (
            <div key={questionId} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_86px]">
                <div className="flex gap-2">
                  <span className="w-5 shrink-0 text-sm font-semibold text-white/35">
                    {index + 1}.
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {words.map((word, wordIndex) => (
                      <span
                        key={`${word}-${wordIndex}`}
                        className="rounded-md border border-amber-300/30 bg-amber-300/15 px-2 py-1 text-xs font-bold text-amber-100"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
                <VisualTile label={image} />
              </div>
              <div className="flex items-center gap-2 pl-7">
                <button
                  type="button"
                  aria-label="Start speaking"
                  disabled={Boolean(result)}
                  onClick={() =>
                    handleSpeech(key, (text) =>
                      setSectionDAnswers((previous) => ({
                        ...previous,
                        [questionId]: text,
                      }))
                    )
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-60 ${
                    listeningId === key
                      ? "bg-red-500"
                      : "bg-violet-500 hover:bg-violet-400"
                  }`}
                >
                  {listeningId === key ? (
                    <MicOff className="h-4 w-4 text-white" />
                  ) : (
                    <Mic className="h-4 w-4 text-white" />
                  )}
                </button>
                <input
                  type="text"
                  value={sectionDAnswers[questionId] || ""}
                  disabled={Boolean(result)}
                  onChange={(event) =>
                    setSectionDAnswers((previous) => ({
                      ...previous,
                      [questionId]: event.target.value,
                    }))
                  }
                  placeholder="Spoken answer"
                  className="min-w-0 flex-1 rounded-md border-2 border-white/20 bg-transparent px-3 py-2 text-sm font-semibold text-cyan-200 outline-none transition-colors placeholder:text-white/30 focus:border-cyan-300 disabled:opacity-70"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderSectionE = () => (
    <div
      className="flex max-h-[74vh] flex-1 flex-col gap-4 overflow-y-auto rounded-l-lg p-6"
      style={pageStyle("left")}
    >
      {sectionHeader("E", "Read and speak.")}
      <div className="space-y-3">
        {questions.E.map((question, index) => {
          const questionId = String(question.id)
          const content = parseContent(question.content)
          const questionText =
            asString(content.question) ||
            asString(content.sentence) ||
            asString(content.instruction, `Question ${index + 1}`)
          const hint = asString(content.hint)
          const image = asString(content.image, hint || "hint")
          const key = `section-e-${questionId}`

          return (
            <div key={questionId} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_96px]">
                <div className="flex gap-2">
                  <span className="w-5 shrink-0 text-sm font-semibold text-white/35">
                    {index + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-white/85">
                      {questionText}
                    </p>
                    {hint ? (
                      <span className="mt-2 inline-flex rounded-md border border-blue-300/30 bg-blue-300/15 px-2 py-1 text-xs font-bold text-blue-100">
                        {hint}
                      </span>
                    ) : null}
                  </div>
                </div>
                <VisualTile label={image} />
              </div>
              <div className="flex items-center gap-2 pl-7">
                <button
                  type="button"
                  aria-label="Start speaking"
                  disabled={Boolean(result)}
                  onClick={() =>
                    handleSpeech(key, (text) =>
                      setSectionEAnswers((previous) => ({
                        ...previous,
                        [questionId]: text,
                      }))
                    )
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-60 ${
                    listeningId === key
                      ? "bg-red-500"
                      : "bg-violet-500 hover:bg-violet-400"
                  }`}
                >
                  {listeningId === key ? (
                    <MicOff className="h-4 w-4 text-white" />
                  ) : (
                    <Mic className="h-4 w-4 text-white" />
                  )}
                </button>
                <input
                  type="text"
                  value={sectionEAnswers[questionId] || ""}
                  disabled={Boolean(result)}
                  onChange={(event) =>
                    setSectionEAnswers((previous) => ({
                      ...previous,
                      [questionId]: event.target.value,
                    }))
                  }
                  placeholder="Spoken answer"
                  className="min-w-0 flex-1 rounded-md border-2 border-white/20 bg-transparent px-3 py-2 text-sm font-semibold text-cyan-200 outline-none transition-colors placeholder:text-white/30 focus:border-cyan-300 disabled:opacity-70"
                />
              </div>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={Boolean(result) || isSubmitting || !session || needsSignIn}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-md border border-green-300 bg-green-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit Test
      </button>
    </div>
  )

  const renderResults = () => {
    if (!result) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Send className="h-7 w-7 text-white/35" />
          </div>
          <p className="text-sm leading-relaxed text-white/45">
            Submit the checkpoint to see your score.
          </p>
        </div>
      )
    }

    const total = result.total_possible || checkpoint?.total_score || 20
    const passingScore = result.passing_score || Math.ceil((result.pass_threshold / 100) * total)

    return (
      <div className="flex flex-col gap-4">
        <div
          className={`rounded-md border-2 p-5 text-center ${
            result.passed
              ? "border-green-400/60 bg-green-500/10"
              : "border-red-400/60 bg-red-500/10"
          }`}
        >
          <p className={`text-3xl font-black ${result.passed ? "text-green-300" : "text-red-300"}`}>
            {result.score}
            <span className="text-lg text-white/45">/{total}</span>
          </p>
          <p className={`mt-1 text-sm font-bold ${result.passed ? "text-green-200" : "text-red-200"}`}>
            {result.passed ? "Passed" : "Not passed"}
          </p>
          <p className="mt-1 text-xs text-white/50">
            Passing score: {passingScore}/{total} ({result.pass_threshold}%)
          </p>
          {result.passed && result.skip_progress ? (
            <p className="mt-2 text-xs text-green-200/75">
              Covered units completed: {result.skip_progress.units_covered.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          {SECTION_ORDER.map((section) => {
            const sectionScore = result.section_scores[section] || { correct: 0, total: 0 }
            const percent =
              sectionScore.total > 0
                ? Math.round((sectionScore.correct / sectionScore.total) * 100)
                : 0

            return (
              <div key={section} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/30 text-xs font-bold text-violet-100">
                      {section}
                    </span>
                    <span className="truncate text-xs text-white/70">
                      {checkpoint?.sections[section]?.name || section}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-200">
                    {sectionScore.correct}/{sectionScore.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-amber-300 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={restartCheckpoint}
            className="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/client/units"
            className="flex items-center justify-center rounded-md border border-cyan-300 bg-cyan-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-400"
          >
            Back to Units
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      <Link
        href="/client/units"
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
          {checkpoint?.title || "Checkpoint"}
        </span>
      </div>

      <div className="relative z-10 flex w-full max-w-5xl items-stretch justify-center px-4 py-20">
        {isLoading ? (
          <div
            className="flex h-[60vh] w-full max-w-md flex-col items-center justify-center gap-3 rounded-lg p-8"
            style={pageStyle("left")}
          >
            <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
            <p className="text-sm font-semibold text-white/65">Loading checkpoint...</p>
          </div>
        ) : error && (!checkpoint || needsSignIn) ? (
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
            {currentPage === 0 ? (
              <>
                {renderSectionA()}
                <div className="hidden w-4 shrink-0 lg:block" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))" }} />
                {renderSectionB()}
              </>
            ) : null}

            {currentPage === 1 ? (
              <>
                {renderSectionC()}
                <div className="hidden w-4 shrink-0 lg:block" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))" }} />
                {renderSectionD()}
              </>
            ) : null}

            {currentPage === 2 ? (
              <>
                {renderSectionE()}
                <div className="hidden w-4 shrink-0 lg:block" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))" }} />
                <div
                  className="flex max-h-[74vh] flex-1 flex-col overflow-y-auto rounded-r-lg p-6"
                  style={pageStyle("right")}
                >
                  {renderResults()}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      {(error && checkpoint) || speechError ? (
        <div className="fixed bottom-20 left-1/2 z-30 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-md border border-red-300/35 bg-red-500/15 px-4 py-2 text-center text-xs font-semibold text-red-100 backdrop-blur-md">
          {error || speechError}
        </div>
      ) : null}

      {!isLoading && checkpoint ? (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
            disabled={currentPage === 0}
            className="rounded-full border border-white/20 bg-white/10 p-2 backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <div className="flex gap-2">
            {[0, 1, 2].map((page) => (
              <button
                key={page}
                type="button"
                aria-label={`Go to page ${page + 1}`}
                onClick={() => setCurrentPage(page)}
                className={`h-2.5 rounded-full transition-all ${
                  currentPage === page ? "w-8 bg-cyan-300" : "w-2.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next page"
            onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
            disabled={currentPage === totalPages - 1}
            className="rounded-full border border-white/20 bg-white/10 p-2 backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
