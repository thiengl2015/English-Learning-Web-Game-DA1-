"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Mic, MicOff, RotateCcw, Volume2 } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import { TestAnswerReview } from "@/components/test-answer-review"
import {
  generatePlacementTest,
  MissingPlacementTokenError,
  submitPlacementTest,
  type GeneratePlacementResponse,
  type PlacementAnswers,
  type PlacementQuestions,
  type PlacementSection,
  type SubmitPlacementResponse,
} from "@/lib/api/placement"

const TOTAL_TEST_PAGES = 7

const SECTION_META: Array<{ key: PlacementSection; label: string; name: string }> = [
  { key: "sectionA", label: "A", name: "Read and match" },
  { key: "sectionB", label: "B", name: "Listen, circle and write" },
  { key: "sectionC", label: "C", name: "Choose and write" },
  { key: "sectionD", label: "D", name: "Unscramble and speak" },
  { key: "sectionE", label: "E", name: "Read, write answer" },
  { key: "sectionF", label: "F", name: "Listen, repeat" },
  { key: "sectionG", label: "G", name: "Read and speak" },
]

function normalizeSpeech(text: string) {
  return text.toLowerCase().replace(/[.,!?;:'"`]/g, "").replace(/\s+/g, " ").trim()
}

function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-US"
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
}

function startRecognition(onResult: (text: string) => void, onEnd: () => void) {
  if (typeof window === "undefined") return null
  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
  if (!Recognition) {
    window.alert("Speech recognition is not supported in this browser.")
    return null
  }

  const recognition = new Recognition()
  recognition.lang = "en-US"
  recognition.interimResults = false
  recognition.maxAlternatives = 3
  recognition.onresult = (event) => onResult(event.results[0][0].transcript)
  recognition.onerror = onEnd
  recognition.onend = onEnd
  recognition.start()
  return recognition
}

function sectionTitle(letter: string, label: string) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
        {letter}
      </span>
      <span className="text-white/80 text-sm font-semibold">{label}.</span>
    </div>
  )
}

function getTableHeader(row: { header?: string; day?: string }) {
  return row.header || row.day || ""
}

function getTableDetail(row: { detail?: string; activity?: string }) {
  return row.detail || row.activity || ""
}

export default function PlacementTestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicQuery = searchParams.get("topics") || ""
  const topicSlugs = useMemo(
    () => topicQuery.split(",").map((topic) => topic.trim()).filter(Boolean),
    [topicQuery]
  )

  const [generated, setGenerated] = useState<GeneratePlacementResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [result, setResult] = useState<SubmitPlacementResponse | null>(null)

  const [sectionAAnswers, setSectionAAnswers] = useState<Record<string, string>>({})
  const [sectionBSelected, setSectionBSelected] = useState<Record<string, "A" | "B" | null>>({})
  const [sectionBWrite, setSectionBWrite] = useState<Record<string, string>>({})
  const [sectionCAnswers, setSectionCAnswers] = useState<Record<string, string>>({})
  const [sectionDAnswers, setSectionDAnswers] = useState<Record<string, string>>({})
  const [sectionEAnswers, setSectionEAnswers] = useState<Record<string, string>>({})
  const [sectionFAnswers, setSectionFAnswers] = useState<Record<string, boolean>>({})
  const [sectionGAnswers, setSectionGAnswers] = useState<Record<string, string>>({})
  const [listeningId, setListeningId] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const questions = generated?.questions
  const totalPages = result ? TOTAL_TEST_PAGES + 1 : TOTAL_TEST_PAGES

  const panelStyle = {
    background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
    border: "1.5px solid rgba(255,255,255,0.18)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
    backdropFilter: "blur(18px)",
  }

  const resetAnswers = () => {
    setSectionAAnswers({})
    setSectionBSelected({})
    setSectionBWrite({})
    setSectionCAnswers({})
    setSectionDAnswers({})
    setSectionEAnswers({})
    setSectionFAnswers({})
    setSectionGAnswers({})
    setResult(null)
    setCurrentPage(0)
  }

  const startTest = async () => {
    if (!topicSlugs.length) {
      setError("Please choose at least one topic from Units first.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    resetAnswers()

    try {
      const test = await generatePlacementTest({
        topicSlugs,
        level: "intermediate",
        age: 12,
      })
      setGenerated(test)
    } catch (err) {
      if (err instanceof MissingPlacementTokenError) {
        router.push("/sign-in")
        return
      }
      setError(err instanceof Error ? err.message : "Could not generate placement test.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void startTest()
    return () => recognitionRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicQuery])

  const listenForAnswer = (id: string, onResult: (text: string) => void) => {
    recognitionRef.current?.abort()
    setListeningId(id)
    recognitionRef.current = startRecognition(
      (text) => {
        onResult(text)
        setListeningId(null)
      },
      () => setListeningId(null)
    )
  }

  const handleSubmit = async () => {
    if (!generated) return
    setSubmitting(true)
    setError("")

    const answers: PlacementAnswers = {
      sectionA: sectionAAnswers,
      sectionB: Object.fromEntries(
        (questions?.sectionB || []).map((question) => {
          const id = String(question.id)
          return [id, { selected: sectionBSelected[id] ?? null, written: sectionBWrite[id] ?? "" }]
        })
      ),
      sectionC: sectionCAnswers,
      sectionD: sectionDAnswers,
      sectionE: sectionEAnswers,
      sectionF: sectionFAnswers,
      sectionG: sectionGAnswers,
    }

    try {
      const submitResult = await submitPlacementTest(generated.session_id, answers)
      setResult(submitResult)
      setCurrentPage(7)
    } catch (err) {
      if (err instanceof MissingPlacementTokenError) {
        router.push("/sign-in")
        return
      }
      setError(err instanceof Error ? err.message : "Could not submit placement test.")
    } finally {
      setSubmitting(false)
    }
  }

  const scoreFor = (section: PlacementSection) => {
    return result?.section_scores?.[section] || {
      correct: 0,
      total: questions?.[section]?.length || 0,
    }
  }

  const renderDialogue = (question: PlacementQuestions["sectionC"][number]) => {
    const id = String(question.id)
    const value = sectionCAnswers[id] ?? ""
    const dropdown = (
      <select
        value={value}
        onChange={(event) => !result && setSectionCAnswers({ ...sectionCAnswers, [id]: event.target.value })}
        disabled={!!result}
        className="mx-1 px-2 py-0.5 rounded-md text-sm font-semibold border-2 bg-transparent outline-none transition-colors border-cyan-400 text-cyan-300 focus:border-cyan-300 disabled:border-white/20 disabled:text-white/50"
      >
        <option value="" className="bg-[#1a1060]">___</option>
        {(question.options || []).map((option) => (
          <option key={option} value={option} className="bg-[#1a1060]">
            {option}
          </option>
        ))}
      </select>
    )

    const renderLine = (text: string, hasBlank: boolean, speaker: string) => {
      if (!hasBlank) {
        return (
          <p className="text-white/75 text-sm leading-snug">
            <span className="font-bold text-white/50 mr-1">{speaker}:</span>{text}
          </p>
        )
      }

      const parts = text.split("___")
      return (
        <p className="text-white/75 text-sm leading-snug inline-flex items-center flex-wrap gap-0.5">
          <span className="font-bold text-white/50 mr-1">{speaker}:</span>
          <span>{parts[0]}</span>{dropdown}<span>{parts[1]}</span>
        </p>
      )
    }

    return (
      <div key={id} className="flex gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
        <p className="text-white/30 text-sm font-semibold shrink-0 w-5 pt-0.5">{question.id}.</p>
        <div className="flex-1 space-y-0.5">
          {renderLine(question.lineA, question.blankInA, "A")}
          {renderLine(question.lineB, !question.blankInA, "B")}
        </div>
      </div>
    )
  }

  const renderSection = () => {
    if (!questions) return null

    if (currentPage === 0) {
      return (
        <div>
          {sectionTitle("A", "Read and match")}
          <table className="w-full border-separate border-spacing-y-2 mb-4">
            <tbody>
              {questions.sectionA.map((question, index) => {
                const id = String(question.id)
                return (
                  <tr key={id}>
                    <td className="align-middle pr-3 w-3/4">
                      <div className="flex items-start gap-1.5">
                        <span className="text-white/40 text-sm shrink-0">{index + 1}.</span>
                        <span className="text-white/80 text-sm leading-snug">{question.question}</span>
                      </div>
                    </td>
                    <td className="align-middle text-right w-1/4">
                      <input
                        type="text"
                        maxLength={1}
                        value={sectionAAnswers[id] ?? ""}
                        disabled={!!result}
                        onChange={(event) => setSectionAAnswers({ ...sectionAAnswers, [id]: event.target.value.toUpperCase() })}
                        className="w-9 h-9 ml-auto rounded-lg border-2 text-center font-bold uppercase text-sm bg-white/5 outline-none transition-colors border-white/25 text-cyan-300 focus:border-cyan-400 disabled:text-white/50"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="space-y-2 pt-3 border-t border-white/10">
            {(questions.sectionAOptions || []).map((option) => (
              <div key={option.letter} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {option.letter}
                </span>
                <span className="text-white/65 text-sm leading-snug">{option.text}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (currentPage === 1) {
      return (
        <div>
          {sectionTitle("B", "Listen, circle and write")}
          <div className="space-y-3">
            {questions.sectionB.map((question, index) => {
              const id = String(question.id)
              const selected = sectionBSelected[id] ?? null
              return (
                <div key={id} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 text-sm w-4 shrink-0">{index + 1}.</span>
                  <button
                    onClick={() => speakText(question.audioText)}
                    className="w-7 h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center shrink-0 transition-all"
                    aria-label="Play audio"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                  </button>
                  {(["A", "B"] as const).map((letter) => (
                    <button
                      key={letter}
                      onClick={() => !result && setSectionBSelected({ ...sectionBSelected, [id]: letter })}
                      disabled={!!result}
                      className={`min-w-0 flex flex-1 items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs transition-all ${
                        selected === letter ? "border-cyan-400 bg-cyan-400/15" : "border-white/15 hover:border-white/30"
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10 font-black text-white/70">
                        {letter}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-left font-semibold capitalize text-white/75">
                        {letter === "A" ? question.optionAImg : question.optionBImg}
                      </span>
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Write..."
                    value={sectionBWrite[id] ?? ""}
                    disabled={!!result}
                    onChange={(event) => setSectionBWrite({ ...sectionBWrite, [id]: event.target.value })}
                    className="flex-1 min-w-0 px-2 py-1 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors border-white/20 text-cyan-300 focus:border-cyan-400 disabled:text-white/50"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (currentPage === 2) {
      return (
        <div>
          {sectionTitle("C", "Choose and write")}
          <div className="space-y-3">{questions.sectionC.map((question) => renderDialogue(question))}</div>
        </div>
      )
    }

    if (currentPage === 3) {
      return (
        <div>
          {sectionTitle("D", "Unscramble and speak")}
          <div className="space-y-4">
            {questions.sectionD.map((question, index) => {
              const id = String(question.id)
              const key = `d-${id}`
              return (
                <div key={id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-white/40 text-sm w-4 shrink-0">{index + 1}.</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {(question.scrambled || []).map((word, wordIndex) => (
                        <span key={`${id}-${wordIndex}`} className="px-2.5 py-1 rounded-lg bg-yellow-400/20 text-yellow-200 text-xs font-semibold border border-yellow-400/30">
                          {word}
                        </span>
                      ))}
                    </div>
                    {question.image ? <span className="text-white/50 text-xs shrink-0">{question.image}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 pl-5">
                    <button
                      onClick={() => listenForAnswer(key, (text) => setSectionDAnswers((prev) => ({ ...prev, [id]: text })))}
                      disabled={!!result}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        listeningId === key ? "bg-red-500 animate-pulse" : "bg-violet-500 hover:bg-violet-400"
                      }`}
                      aria-label="Speak answer"
                    >
                      {listeningId === key ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                    </button>
                    <input
                      type="text"
                      placeholder="Answer..."
                      value={sectionDAnswers[id] ?? ""}
                      readOnly
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors border-white/20 text-cyan-300"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (currentPage === 4) {
      return (
        <div>
          {sectionTitle("E", "Read, write answer")}
          <div className="overflow-x-auto rounded-xl border border-white/15 mb-5">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  {(questions.sectionETable || []).map((row, index) => (
                    <th key={`${getTableHeader(row)}-${index}`} className="border border-white/15 px-3 py-2.5 text-white/80 font-semibold text-center bg-white/10 whitespace-nowrap">
                      {getTableHeader(row)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {(questions.sectionETable || []).map((row, index) => (
                    <td key={`${getTableDetail(row)}-${index}`} className="border border-white/15 px-3 py-2.5 text-white/65 text-center leading-tight bg-white/5">
                      {getTableDetail(row)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            {questions.sectionE.map((question, index) => {
              const id = String(question.id)
              return (
                <div key={id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-white/40 text-sm shrink-0 w-4">{index + 1}.</span>
                    <p className="text-white/80 text-sm font-semibold leading-snug">{question.question}</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Write your answer..."
                    value={sectionEAnswers[id] ?? ""}
                    disabled={!!result}
                    onChange={(event) => setSectionEAnswers({ ...sectionEAnswers, [id]: event.target.value })}
                    className="w-full px-3 py-2 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors border-white/20 text-cyan-300 focus:border-cyan-400 disabled:text-white/50"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (currentPage === 5) {
      return (
        <div>
          {sectionTitle("F", "Listen, repeat")}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {questions.sectionF.map((card) => {
              const id = String(card.id)
              const key = `f-${id}`
              const isCorrect = sectionFAnswers[id]
              return (
                <div key={id} className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${isCorrect ? "border-green-400/60 bg-green-400/10" : "border-white/15 bg-white/5"}`}>
                  <div className="w-full h-28 rounded-xl flex flex-col items-center justify-center bg-white/5 px-3 text-center">
                    <span className="text-white/70 text-sm font-semibold">{card.image || card.word}</span>
                    {isCorrect ? <span className="text-green-300 text-xs mt-2">{card.word}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakText(card.audioText)}
                      className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center transition-all shrink-0"
                      aria-label="Play audio"
                    >
                      <Volume2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() =>
                        listenForAnswer(key, (text) => {
                          const correct = normalizeSpeech(text) === normalizeSpeech(card.word)
                          setSectionFAnswers((prev) => ({ ...prev, [id]: correct || prev[id] || false }))
                        })
                      }
                      disabled={!!result || isCorrect}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        listeningId === key ? "bg-red-500 animate-pulse" : isCorrect ? "bg-green-500" : "bg-violet-500 hover:bg-violet-400"
                      }`}
                      aria-label="Repeat"
                    >
                      {listeningId === key ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                  {isCorrect ? <span className="text-green-400 text-xs font-semibold">Correct</span> : null}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (currentPage === 6) {
      return (
        <div className="flex flex-col gap-4">
          {sectionTitle("G", "Read and speak")}
          <div className="space-y-3">
            {questions.sectionG.map((question, index) => {
              const id = String(question.id)
              const key = `g-${id}`
              return (
                <div key={id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-white/40 text-sm w-4 shrink-0">{index + 1}.</span>
                      <p className="text-white/80 text-sm font-semibold leading-snug">{question.question}</p>
                    </div>
                    {question.hint ? (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-400/20 text-blue-200 text-[10px] font-semibold border border-blue-400/30 shrink-0">
                        {question.hint}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 pl-5">
                    <button
                      onClick={() => listenForAnswer(key, (text) => setSectionGAnswers((prev) => ({ ...prev, [id]: text })))}
                      disabled={!!result}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        listeningId === key ? "bg-red-500 animate-pulse" : "bg-violet-500 hover:bg-violet-400"
                      }`}
                      aria-label="Speak answer"
                    >
                      {listeningId === key ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                    </button>
                    <input
                      type="text"
                      placeholder="Your answer..."
                      value={sectionGAnswers[id] ?? ""}
                      readOnly
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border-2 text-sm bg-transparent outline-none transition-colors border-white/20 text-cyan-300"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const unlockedUnits = result?.unlock_progress?.unlocked_units || []

    return (
      <div className="flex flex-col gap-5">
        <div className={`rounded-2xl p-6 text-center border-2 ${unlockedUnits.length ? "bg-green-500/10 border-green-400/50" : "bg-red-500/10 border-red-400/50"}`}>
          <p className={`text-4xl font-black ${unlockedUnits.length ? "text-green-400" : "text-red-400"}`}>
            {result?.total_correct ?? 0}
            <span className="text-lg text-white/40">/{result?.total_possible ?? 30}</span>
          </p>
          <p className={`text-base font-bold mt-1 ${unlockedUnits.length ? "text-green-300" : "text-red-300"}`}>
            {unlockedUnits.length ? `Unlocked ${unlockedUnits.length} unit${unlockedUnits.length > 1 ? "s" : ""}` : "Keep Practicing"}
          </p>
          <p className="text-white/50 text-xs mt-1">Score {result?.score ?? 0}% - CEFR {result?.cefr_level ?? "A1"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SECTION_META.map((section) => {
            const score = scoreFor(section.key)
            const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
            const good = score.correct === score.total && score.total > 0
            return (
              <div key={section.key} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-violet-500/30 text-violet-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {section.label}
                    </span>
                    <span className="text-white/70 text-xs truncate">{section.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${good ? "text-green-400" : "text-amber-400"}`}>
                    {score.correct}/{score.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${good ? "bg-green-400" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {unlockedUnits.length ? (
          <div className="rounded-xl bg-green-400/10 border border-green-400/30 p-4 text-sm text-green-100">
            Your eligible units have been unlocked and their lesson stars have been applied.
          </div>
        ) : null}

        <TestAnswerReview
          sections={SECTION_META}
          reviews={result?.answer_review || null}
          compact
        />

        <div className="flex gap-3">
          <button
            onClick={() => void startTest()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-md font-semibold hover:bg-white/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/client/units"
            className="flex-1 flex items-center justify-center py-3 rounded-xl bg-purple-500 border border-purple-600 text-white text-md font-semibold hover:bg-purple-600 shadow-lg shadow-purple-600/20 transition-all"
          >
            Start with new plan
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <SpaceBackground />
        <div className="relative z-10 flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
          <p className="text-lg font-semibold">Generating placement test...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      <Link
        href="/client/units"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-medium">Back</span>
      </Link>

      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-30 px-8 py-2.5 rounded-full border border-cyan-400/50 backdrop-blur-md"
        style={{ background: "rgba(6,182,212,0.25)" }}
      >
        <span className="text-white font-bold text-base">{questions?.title || "Placement Test"}</span>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-4 py-20">
        <div className="rounded-2xl p-6 overflow-y-auto max-h-[74vh]" style={panelStyle}>
          {error ? (
            <div className="rounded-2xl p-6 text-center border border-red-400/40 bg-red-500/10">
              <p className="text-red-200 font-semibold mb-4">{error}</p>
              <Link
                href="/client/units"
                className="inline-flex items-center justify-center py-2 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all"
              >
                Back to Units
              </Link>
            </div>
          ) : (
            renderSection()
          )}
        </div>
      </div>

      {!error && questions ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${currentPage === index ? "bg-cyan-400 w-8" : "bg-white/30 hover:bg-white/50 w-2.5"}`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
          {currentPage === 6 && !result ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 rounded-full bg-green-500 hover:bg-green-400 text-white font-bold text-sm shadow-lg shadow-green-500/30 transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
