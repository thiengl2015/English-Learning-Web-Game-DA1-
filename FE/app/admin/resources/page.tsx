"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Upload,
  Search,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Check,
  BookOpen,
  Gamepad2,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  Volume2,
  Mic,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentType = "vocabulary" | "grammar"

type VocabEntry = {
  word: string
  phonetic: string
  translation: string
  imageUrl: string
  audioUrl: string
}

type GrammarEntry = {
  pattern: string
  explanation: string
  example: string
  translation: string
}

// Game-specific content types
type SignalCheckQuestion = {
  id: string
  type: "vocabulary" | "grammar"
  prompt: string
  imageUrl: string
  audioUrl: string
  options: { id: string; text: string }[]
  correctAnswerId: string
}

type GalaxyMatchItem = {
  id: string
  word: string
  translation: string
  imageUrl: string
}

type PlanetaryOrderSentence = {
  id: string
  words: string
  correctOrder: string
  translation: string
}

type RescueMissionQuestion = {
  id: string
  displayBefore: string
  missingWord: string
  displayAfter: string
  audioText: string
}

type VoiceCommand = {
  id: string
  text: string
  ipa: string
  translation: string
}

type GameContent =
  | { type: "signal-check"; questions: SignalCheckQuestion[] }
  | { type: "galaxy-match"; items: GalaxyMatchItem[] }
  | { type: "planetary-order"; sentences: PlanetaryOrderSentence[] }
  | { type: "rescue-mission"; questions: RescueMissionQuestion[] }
  | { type: "voice-command"; commands: VoiceCommand[] }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockUnits = [
  { id: "1", title: "Unit 1", subtitle: "Greetings & Basics", icon: "🌍" },
  { id: "2", title: "Unit 2", subtitle: "Family & Friends", icon: "👨‍👩‍👧‍👦" },
  { id: "3", title: "Unit 3", subtitle: "Food & Drinks", icon: "🍕" },
]

const mockLessons = [
  { id: "1", unitId: "1", title: "Lesson 1 - Hello & Goodbye", contentType: "vocabulary" as ContentType },
  { id: "2", unitId: "1", title: "Lesson 2 - Simple Sentences", contentType: "grammar" as ContentType },
  { id: "3", unitId: "2", title: "Lesson 1 - Family Members", contentType: "vocabulary" as ContentType },
]

const mockVocabulary: Record<string, VocabEntry[]> = {
  "1-1": [
    { word: "Hello", phonetic: "/həˈloʊ/", translation: "Xin chào", imageUrl: "/words/hello-greeting.jpg", audioUrl: "/audio/hello.mp3" },
    { word: "Goodbye", phonetic: "/ɡʊdˈbaɪ/", translation: "Tạm biệt", imageUrl: "/words/single-word-goodbye.jpg", audioUrl: "/audio/goodbye.mp3" },
    { word: "Thank you", phonetic: "/θæŋk juː/", translation: "Cảm ơn", imageUrl: "/words/thank-you-card.jpg", audioUrl: "/audio/thankyou.mp3" },
  ],
}

const GAME_TYPES = [
  {
    id: "signal-check",
    name: "Signal Check",
    description: "Multiple choice questions with image & audio",
    icon: "🎯",
    color: "bg-purple-500/20 border-purple-500/40 text-purple-300",
  },
  {
    id: "galaxy-match",
    name: "Galaxy Match",
    description: "Memory card matching game (word ↔ meaning/image)",
    icon: "🌌",
    color: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  },
  {
    id: "planetary-order",
    name: "Planetary Order",
    description: "Drag words to build correct sentences",
    icon: "🪐",
    color: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
  },
  {
    id: "rescue-mission",
    name: "Rescue Mission",
    description: "Listen and fill the blank word",
    icon: "🚀",
    color: "bg-orange-500/20 border-orange-500/40 text-orange-300",
  },
  {
    id: "voice-command",
    name: "Voice Command",
    description: "Speak sentences for pronunciation practice",
    icon: "🎙️",
    color: "bg-green-500/20 border-green-500/40 text-green-300",
  },
] as const

type GameTypeId = typeof GAME_TYPES[number]["id"]

// ─── Upload Wizard Steps ───────────────────────────────────────────────────────

type UploadStep = 1 | 2 | 3 | 4

// ─── Helper: empty game content ───────────────────────────────────────────────

function emptySignalCheckQuestion(): SignalCheckQuestion {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: "vocabulary",
    prompt: "",
    imageUrl: "",
    audioUrl: "",
    options: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
    ],
    correctAnswerId: "A",
  }
}

function emptyGalaxyMatchItem(): GalaxyMatchItem {
  return { id: `gm_${Date.now()}`, word: "", translation: "", imageUrl: "" }
}

function emptyPlanetaryOrderSentence(): PlanetaryOrderSentence {
  return { id: `po_${Date.now()}`, words: "", correctOrder: "", translation: "" }
}

function emptyRescueMissionQuestion(): RescueMissionQuestion {
  return { id: `rm_${Date.now()}`, displayBefore: "", missingWord: "", displayAfter: "", audioText: "" }
}

function emptyVoiceCommand(): VoiceCommand {
  return { id: `vc_${Date.now()}`, text: "", ipa: "", translation: "" }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ResourceManagementPage() {
  const [activeTab, setActiveTab] = useState("upload")

  // ── Upload Wizard State ──
  const [step, setStep] = useState<UploadStep>(1)

  // Step 1: Unit
  const [selectedUnitId, setSelectedUnitId] = useState("")
  const [isNewUnit, setIsNewUnit] = useState(false)
  const [newUnitTitle, setNewUnitTitle] = useState("")
  const [newUnitSubtitle, setNewUnitSubtitle] = useState("")
  const [newUnitIcon, setNewUnitIcon] = useState("")

  // Step 2: Lesson + content type
  const [selectedLessonId, setSelectedLessonId] = useState("")
  const [isNewLesson, setIsNewLesson] = useState(false)
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [contentType, setContentType] = useState<ContentType>("vocabulary")

  // Step 3: Vocabulary / Grammar entries
  const [vocabEntries, setVocabEntries] = useState<VocabEntry[]>([
    { word: "", phonetic: "", translation: "", imageUrl: "", audioUrl: "" },
  ])
  const [grammarEntries, setGrammarEntries] = useState<GrammarEntry[]>([
    { pattern: "", explanation: "", example: "", translation: "" },
  ])

  // Step 4: Game type + game content
  const [selectedGameType, setSelectedGameType] = useState<GameTypeId | "">("")
  const [signalCheckQs, setSignalCheckQs] = useState<SignalCheckQuestion[]>([emptySignalCheckQuestion()])
  const [galaxyMatchItems, setGalaxyMatchItems] = useState<GalaxyMatchItem[]>([emptyGalaxyMatchItem()])
  const [planetaryOrderSentences, setPlanetaryOrderSentences] = useState<PlanetaryOrderSentence[]>([emptyPlanetaryOrderSentence()])
  const [rescueMissionQs, setRescueMissionQs] = useState<RescueMissionQuestion[]>([emptyRescueMissionQuestion()])
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([emptyVoiceCommand()])

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // ── Manager State ──
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [editingVocab, setEditingVocab] = useState<(VocabEntry & { key: string }) | null>(null)
  const [isEditVocabOpen, setIsEditVocabOpen] = useState(false)

  // ── Derived ──
  const filteredUnits = mockUnits.filter(
    (u) =>
      !searchTerm ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.subtitle.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const lessonsForUnit = (unitId: string) => mockLessons.filter((l) => l.unitId === unitId)
  const vocabForLesson = (unitId: string, lessonId: string) => mockVocabulary[`${unitId}-${lessonId}`] || []

  // ── Step validation ──
  const canProceedStep1 = isNewUnit ? (newUnitTitle.trim().length > 0) : selectedUnitId !== ""
  const canProceedStep2 = isNewLesson ? (newLessonTitle.trim().length > 0) : selectedLessonId !== ""
  const canProceedStep3 = contentType === "vocabulary"
    ? vocabEntries.some((e) => e.word.trim() && e.translation.trim())
    : grammarEntries.some((e) => e.pattern.trim() && e.explanation.trim())
  const canProceedStep4 = selectedGameType !== ""

  // ── Wizard navigation ──
  const goNext = () => setStep((s) => Math.min(s + 1, 4) as UploadStep)
  const goBack = () => setStep((s) => Math.max(s - 1, 1) as UploadStep)

  const resetWizard = () => {
    setStep(1)
    setSelectedUnitId("")
    setIsNewUnit(false)
    setNewUnitTitle("")
    setNewUnitSubtitle("")
    setNewUnitIcon("")
    setSelectedLessonId("")
    setIsNewLesson(false)
    setNewLessonTitle("")
    setContentType("vocabulary")
    setVocabEntries([{ word: "", phonetic: "", translation: "", imageUrl: "", audioUrl: "" }])
    setGrammarEntries([{ pattern: "", explanation: "", example: "", translation: "" }])
    setSelectedGameType("")
    setSignalCheckQs([emptySignalCheckQuestion()])
    setGalaxyMatchItems([emptyGalaxyMatchItem()])
    setPlanetaryOrderSentences([emptyPlanetaryOrderSentence()])
    setRescueMissionQs([emptyRescueMissionQuestion()])
    setVoiceCommands([emptyVoiceCommand()])
  }

  const handleSubmit = () => {
    const payload = {
      unit: isNewUnit ? { title: newUnitTitle, subtitle: newUnitSubtitle, icon: newUnitIcon } : { id: selectedUnitId },
      lesson: isNewLesson ? { title: newLessonTitle, contentType } : { id: selectedLessonId },
      content: contentType === "vocabulary" ? vocabEntries : grammarEntries,
      game: { type: selectedGameType, data: getGameData() },
    }
    console.log("[v0] Submitting resource:", payload)
    setShowConfirmDialog(false)
    resetWizard()
  }

  const getGameData = () => {
    switch (selectedGameType) {
      case "signal-check": return signalCheckQs
      case "galaxy-match": return galaxyMatchItems
      case "planetary-order": return planetaryOrderSentences
      case "rescue-mission": return rescueMissionQs
      case "voice-command": return voiceCommands
      default: return []
    }
  }

  // ── Vocab entries helpers ──
  const updateVocab = (i: number, field: keyof VocabEntry, val: string) => {
    const next = [...vocabEntries]
    next[i] = { ...next[i], [field]: val }
    setVocabEntries(next)
  }

  const updateGrammar = (i: number, field: keyof GrammarEntry, val: string) => {
    const next = [...grammarEntries]
    next[i] = { ...next[i], [field]: val }
    setGrammarEntries(next)
  }

  // ── Game content helpers ──
  const updateSignalCheckQ = (i: number, field: keyof SignalCheckQuestion, val: any) => {
    const next = [...signalCheckQs]
    next[i] = { ...next[i], [field]: val }
    setSignalCheckQs(next)
  }

  const updateSignalCheckOption = (qi: number, optId: string, val: string) => {
    const next = [...signalCheckQs]
    next[qi] = {
      ...next[qi],
      options: next[qi].options.map((o) => (o.id === optId ? { ...o, text: val } : o)),
    }
    setSignalCheckQs(next)
  }

  const updateGalaxyItem = (i: number, field: keyof GalaxyMatchItem, val: string) => {
    const next = [...galaxyMatchItems]
    next[i] = { ...next[i], [field]: val }
    setGalaxyMatchItems(next)
  }

  const updatePlanetarySentence = (i: number, field: keyof PlanetaryOrderSentence, val: string) => {
    const next = [...planetaryOrderSentences]
    next[i] = { ...next[i], [field]: val }
    setPlanetaryOrderSentences(next)
  }

  const updateRescueQ = (i: number, field: keyof RescueMissionQuestion, val: string) => {
    const next = [...rescueMissionQs]
    next[i] = { ...next[i], [field]: val }
    setRescueMissionQs(next)
  }

  const updateVoiceCommand = (i: number, field: keyof VoiceCommand, val: string) => {
    const next = [...voiceCommands]
    next[i] = { ...next[i], [field]: val }
    setVoiceCommands(next)
  }

  // ── Manager helpers ──
  const toggleUnit = (id: string) => {
    const n = new Set(expandedUnits)
    n.has(id) ? n.delete(id) : n.add(id)
    setExpandedUnits(n)
  }

  const toggleLesson = (key: string) => {
    const n = new Set(expandedLessons)
    n.has(key) ? n.delete(key) : n.add(key)
    setExpandedLessons(n)
  }

  // ── Step indicator ──
  const STEPS = [
    { num: 1, label: "Unit" },
    { num: 2, label: "Lesson" },
    { num: 3, label: "Content" },
    { num: 4, label: "Game" },
  ]

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resource Management</h1>
        <p className="text-muted-foreground mt-2">Upload vocabulary and configure game content for lessons</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Resource
              </TabsTrigger>
              <TabsTrigger
                value="manager"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-300"
              >
                <Search className="w-4 h-4 mr-2" />
                Manager
              </TabsTrigger>
            </TabsList>

            {/* ═══════════════════ UPLOAD TAB ═══════════════════ */}
            <TabsContent value="upload" className="mt-6 space-y-6">

              {/* Step indicator */}
              <div className="flex items-center gap-0">
                {STEPS.map((s, idx) => (
                  <div key={s.num} className="flex items-center flex-1">
                    <button
                      onClick={() => step > s.num && setStep(s.num as UploadStep)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        step === s.num
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                          : step > s.num
                          ? "text-cyan-600 cursor-pointer hover:text-cyan-400"
                          : "text-slate-600 cursor-default"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step === s.num
                            ? "bg-cyan-500 text-slate-900"
                            : step > s.num
                            ? "bg-cyan-800 text-cyan-300"
                            : "bg-slate-700 text-slate-500"
                        }`}
                      >
                        {step > s.num ? <Check className="w-3 h-3" /> : s.num}
                      </span>
                      {s.label}
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-1 ${step > s.num ? "bg-cyan-700" : "bg-slate-700"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* ─── Step 1: Unit ─── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-foreground">Select or Create a Unit</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsNewUnit(false)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        !isNewUnit ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-slate-500"
                      }`}
                    >
                      <p className="font-medium text-sm text-foreground">Existing Unit</p>
                      <p className="text-xs text-muted-foreground mt-1">Add to an already created unit</p>
                    </button>
                    <button
                      onClick={() => setIsNewUnit(true)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isNewUnit ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-slate-500"
                      }`}
                    >
                      <p className="font-medium text-sm text-foreground">New Unit</p>
                      <p className="text-xs text-muted-foreground mt-1">Create a brand-new unit</p>
                    </button>
                  </div>

                  {!isNewUnit ? (
                    <div className="space-y-2">
                      <Label>Choose Unit</Label>
                      <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Select a unit..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {mockUnits.map((u) => (
                            <SelectItem key={u.id} value={u.id} className="text-slate-200 focus:bg-slate-700">
                              {u.icon} {u.title} — {u.subtitle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1 col-span-2">
                        <Label>Unit Title</Label>
                        <Input
                          placeholder="e.g. Unit 4"
                          value={newUnitTitle}
                          onChange={(e) => setNewUnitTitle(e.target.value)}
                          className="bg-input border-border"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Icon (emoji)</Label>
                        <Input
                          placeholder="🌍"
                          value={newUnitIcon}
                          onChange={(e) => setNewUnitIcon(e.target.value)}
                          className="bg-input border-border"
                        />
                      </div>
                      <div className="space-y-1 col-span-3">
                        <Label>Subtitle</Label>
                        <Input
                          placeholder="e.g. Travel & Places"
                          value={newUnitSubtitle}
                          onChange={(e) => setNewUnitSubtitle(e.target.value)}
                          className="bg-input border-border"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={goNext}
                      disabled={!canProceedStep1}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold"
                    >
                      Next: Lesson <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Step 2: Lesson ─── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-foreground">Select or Create a Lesson</h2>
                    <Badge variant="outline" className="ml-auto text-cyan-400 border-cyan-500/40 text-xs">
                      {isNewUnit ? newUnitTitle : mockUnits.find((u) => u.id === selectedUnitId)?.title}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsNewLesson(false)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        !isNewLesson ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-slate-500"
                      }`}
                    >
                      <p className="font-medium text-sm text-foreground">Existing Lesson</p>
                      <p className="text-xs text-muted-foreground mt-1">Add content to a lesson</p>
                    </button>
                    <button
                      onClick={() => setIsNewLesson(true)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isNewLesson ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-slate-500"
                      }`}
                    >
                      <p className="font-medium text-sm text-foreground">New Lesson</p>
                      <p className="text-xs text-muted-foreground mt-1">Create a brand-new lesson</p>
                    </button>
                  </div>

                  {!isNewLesson ? (
                    <div className="space-y-2">
                      <Label>Choose Lesson</Label>
                      <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Select a lesson..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {lessonsForUnit(selectedUnitId).map((l) => (
                            <SelectItem key={l.id} value={l.id} className="text-slate-200 focus:bg-slate-700">
                              {l.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Lesson Title</Label>
                        <Input
                          placeholder="e.g. Lesson 1 - Greetings"
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          className="bg-input border-border"
                        />
                      </div>
                    </div>
                  )}

                  {/* Content type */}
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setContentType("vocabulary")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          contentType === "vocabulary" ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-slate-500"
                        }`}
                      >
                        <p className="font-medium text-sm text-foreground">Vocabulary</p>
                        <p className="text-xs text-muted-foreground mt-1">Words with phonetics, translation, image & audio</p>
                      </button>
                      <button
                        onClick={() => setContentType("grammar")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          contentType === "grammar" ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-slate-500"
                        }`}
                      >
                        <p className="font-medium text-sm text-foreground">Grammar</p>
                        <p className="text-xs text-muted-foreground mt-1">Patterns, explanations and example sentences</p>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={goBack} className="border-border">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      onClick={goNext}
                      disabled={!canProceedStep2}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold"
                    >
                      Next: Content <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Step 3: Content ─── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Add {contentType === "vocabulary" ? "Vocabulary" : "Grammar"}
                    </h2>
                    <div className="ml-auto flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer hover:text-cyan-400 px-3 py-1.5 rounded-lg border border-border hover:border-cyan-500/40 transition-all">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Import Excel
                        <input type="file" accept=".xlsx,.xls" className="hidden" />
                      </label>
                    </div>
                  </div>

                  {contentType === "vocabulary" ? (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {vocabEntries.map((entry, i) => (
                        <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Word #{i + 1}</span>
                              {vocabEntries.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setVocabEntries(vocabEntries.filter((_, idx) => idx !== i))}
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Word *</Label>
                                <Input placeholder="Hello" value={entry.word} onChange={(e) => updateVocab(i, "word", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Phonetic</Label>
                                <Input placeholder="/həˈloʊ/" value={entry.phonetic} onChange={(e) => updateVocab(i, "phonetic", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Translation (VI) *</Label>
                                <Input placeholder="Xin chào" value={entry.translation} onChange={(e) => updateVocab(i, "translation", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Image URL</Label>
                                <Input placeholder="/words/hello.jpg" value={entry.imageUrl} onChange={(e) => updateVocab(i, "imageUrl", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1 col-span-2">
                                <Label className="text-xs text-slate-400">Audio URL</Label>
                                <Input placeholder="/audio/hello.mp3" value={entry.audioUrl} onChange={(e) => updateVocab(i, "audioUrl", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVocabEntries([...vocabEntries, { word: "", phonetic: "", translation: "", imageUrl: "", audioUrl: "" }])}
                        className="w-full border-dashed border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Word
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {grammarEntries.map((entry, i) => (
                        <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Pattern #{i + 1}</span>
                              {grammarEntries.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setGrammarEntries(grammarEntries.filter((_, idx) => idx !== i))}
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Grammar Pattern *</Label>
                                <Input placeholder="S + V + O" value={entry.pattern} onChange={(e) => updateGrammar(i, "pattern", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Explanation *</Label>
                                <Input placeholder="Subject + Verb + Object" value={entry.explanation} onChange={(e) => updateGrammar(i, "explanation", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Example</Label>
                                <Input placeholder="She eats an apple." value={entry.example} onChange={(e) => updateGrammar(i, "example", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Translation (VI)</Label>
                                <Input placeholder="Cô ấy ăn một quả táo." value={entry.translation} onChange={(e) => updateGrammar(i, "translation", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGrammarEntries([...grammarEntries, { pattern: "", explanation: "", example: "", translation: "" }])}
                        className="w-full border-dashed border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Pattern
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={goBack} className="border-border">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      onClick={goNext}
                      disabled={!canProceedStep3}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold"
                    >
                      Next: Game <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Step 4: Game ─── */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Gamepad2 className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-foreground">Choose Game Type & Add Content</h2>
                  </div>

                  {/* Game type picker */}
                  <div className="grid grid-cols-5 gap-2">
                    {GAME_TYPES.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGameType(g.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedGameType === g.id
                            ? `${g.color} border-current`
                            : "border-border hover:border-slate-500 text-slate-400"
                        }`}
                      >
                        <div className="text-2xl mb-1">{g.icon}</div>
                        <p className="text-xs font-semibold leading-tight">{g.name}</p>
                      </button>
                    ))}
                  </div>

                  {selectedGameType && (
                    <p className="text-xs text-muted-foreground -mt-2 px-1">
                      {GAME_TYPES.find((g) => g.id === selectedGameType)?.description}
                    </p>
                  )}

                  {/* ── Game Content Forms ── */}

                  {/* Signal Check */}
                  {selectedGameType === "signal-check" && (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {signalCheckQs.map((q, i) => (
                        <Card key={q.id} className="bg-slate-800/50 border-slate-700/50">
                          <CardContent className="pt-4 pb-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Question #{i + 1}</span>
                              {signalCheckQs.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setSignalCheckQs(signalCheckQs.filter((_, idx) => idx !== i))} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1 col-span-2">
                                <Label className="text-xs text-slate-400">Question Prompt *</Label>
                                <Input placeholder='e.g. What does "Hello" mean?' value={q.prompt} onChange={(e) => updateSignalCheckQ(i, "prompt", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Image URL</Label>
                                <Input placeholder="/words/hello.jpg" value={q.imageUrl} onChange={(e) => updateSignalCheckQ(i, "imageUrl", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Audio URL</Label>
                                <Input placeholder="/audio/hello.mp3" value={q.audioUrl} onChange={(e) => updateSignalCheckQ(i, "audioUrl", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400">Answer Options</Label>
                              {q.options.map((opt) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateSignalCheckQ(i, "correctAnswerId", opt.id)}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all ${
                                      q.correctAnswerId === opt.id ? "bg-green-500 border-green-400 text-white" : "border-slate-600 text-slate-400 hover:border-green-500/50"
                                    }`}
                                  >
                                    {opt.id}
                                  </button>
                                  <Input
                                    placeholder={`Option ${opt.id}`}
                                    value={opt.text}
                                    onChange={(e) => updateSignalCheckOption(i, opt.id, e.target.value)}
                                    className="bg-input border-border h-8 text-sm"
                                  />
                                  {q.correctAnswerId === opt.id && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                                </div>
                              ))}
                              <p className="text-xs text-slate-500">Click the letter button to set the correct answer</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setSignalCheckQs([...signalCheckQs, emptySignalCheckQuestion()])} className="w-full border-dashed border-slate-600 text-slate-400 hover:text-purple-400 hover:border-purple-500/50">
                        <Plus className="w-4 h-4 mr-2" /> Add Question
                      </Button>
                    </div>
                  )}

                  {/* Galaxy Match */}
                  {selectedGameType === "galaxy-match" && (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      <p className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                        Each item will generate a word card and a matching translation/image card. Pairs are shuffled automatically.
                      </p>
                      {galaxyMatchItems.map((item, i) => (
                        <Card key={item.id} className="bg-slate-800/50 border-slate-700/50">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Pair #{i + 1}</span>
                              {galaxyMatchItems.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setGalaxyMatchItems(galaxyMatchItems.filter((_, idx) => idx !== i))} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Word *</Label>
                                <Input placeholder="Hello" value={item.word} onChange={(e) => updateGalaxyItem(i, "word", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Translation *</Label>
                                <Input placeholder="Xin chào" value={item.translation} onChange={(e) => updateGalaxyItem(i, "translation", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Image URL</Label>
                                <Input placeholder="/words/hello.jpg" value={item.imageUrl} onChange={(e) => updateGalaxyItem(i, "imageUrl", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setGalaxyMatchItems([...galaxyMatchItems, emptyGalaxyMatchItem()])} className="w-full border-dashed border-slate-600 text-slate-400 hover:text-blue-400 hover:border-blue-500/50">
                        <Plus className="w-4 h-4 mr-2" /> Add Pair
                      </Button>
                    </div>
                  )}

                  {/* Planetary Order */}
                  {selectedGameType === "planetary-order" && (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      <p className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
                        Enter the words (space-separated) and the correct order. Words in "Scrambled" will be shuffled automatically.
                      </p>
                      {planetaryOrderSentences.map((s, i) => (
                        <Card key={s.id} className="bg-slate-800/50 border-slate-700/50">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Sentence #{i + 1}</span>
                              {planetaryOrderSentences.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setPlanetaryOrderSentences(planetaryOrderSentences.filter((_, idx) => idx !== i))} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Translation hint (VI) *</Label>
                                <Input placeholder="Tôi muốn làm phi hành gia" value={s.translation} onChange={(e) => updatePlanetarySentence(i, "translation", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Correct Order (space-separated) *</Label>
                                <Input placeholder="I want to be an astronaut" value={s.correctOrder} onChange={(e) => updatePlanetarySentence(i, "correctOrder", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Scrambled Words (space-separated, can repeat/add distractors)</Label>
                                <Input placeholder="want I to be an astronaut" value={s.words} onChange={(e) => updatePlanetarySentence(i, "words", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setPlanetaryOrderSentences([...planetaryOrderSentences, emptyPlanetaryOrderSentence()])} className="w-full border-dashed border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50">
                        <Plus className="w-4 h-4 mr-2" /> Add Sentence
                      </Button>
                    </div>
                  )}

                  {/* Rescue Mission */}
                  {selectedGameType === "rescue-mission" && (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      <p className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                        Student hears the audio and types the missing word. Use <code className="bg-slate-700 px-1 rounded">___</code> as placeholder.
                      </p>
                      {rescueMissionQs.map((q, i) => (
                        <Card key={q.id} className="bg-slate-800/50 border-slate-700/50">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Question #{i + 1}</span>
                              {rescueMissionQs.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setRescueMissionQs(rescueMissionQs.filter((_, idx) => idx !== i))} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Text Before Blank</Label>
                                <Input placeholder="She wants a" value={q.displayBefore} onChange={(e) => updateRescueQ(i, "displayBefore", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Missing Word *</Label>
                                <Input placeholder="red" value={q.missingWord} onChange={(e) => updateRescueQ(i, "missingWord", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">Text After Blank</Label>
                                <Input placeholder="hat" value={q.displayAfter} onChange={(e) => updateRescueQ(i, "displayAfter", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1 col-span-3">
                                <Label className="text-xs text-slate-400 flex items-center gap-1"><Volume2 className="w-3 h-3" /> Audio Text (full sentence, spoken aloud) *</Label>
                                <Input placeholder="She wants a red hat" value={q.audioText} onChange={(e) => updateRescueQ(i, "audioText", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                            </div>
                            <div className="mt-3 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm text-slate-400">
                              Preview: <span className="text-slate-200">{q.displayBefore || "..."}</span>{" "}
                              <span className="px-2 py-0.5 border-b-2 border-orange-400 text-orange-300 font-mono">{q.missingWord || "___"}</span>{" "}
                              <span className="text-slate-200">{q.displayAfter || ""}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setRescueMissionQs([...rescueMissionQs, emptyRescueMissionQuestion()])} className="w-full border-dashed border-slate-600 text-slate-400 hover:text-orange-400 hover:border-orange-500/50">
                        <Plus className="w-4 h-4 mr-2" /> Add Question
                      </Button>
                    </div>
                  )}

                  {/* Voice Command */}
                  {selectedGameType === "voice-command" && (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                        Student reads and speaks the command. Accuracy is scored by word overlap. Use UPPERCASE for commands.
                      </p>
                      {voiceCommands.map((cmd, i) => (
                        <Card key={cmd.id} className="bg-slate-800/50 border-slate-700/50">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-1"><Mic className="w-3 h-3" /> Command #{i + 1}</span>
                              {voiceCommands.length > 1 && (
                                <Button variant="ghost" size="sm" onClick={() => setVoiceCommands(voiceCommands.filter((_, idx) => idx !== i))} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1 col-span-2">
                                <Label className="text-xs text-slate-400">Command Text (EN, UPPERCASE) *</Label>
                                <Input placeholder="ENGAGE HYPERDRIVE" value={cmd.text} onChange={(e) => updateVoiceCommand(i, "text", e.target.value.toUpperCase())} className="bg-input border-border h-8 text-sm font-mono tracking-widest" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-400">IPA Phonetic</Label>
                                <Input placeholder="/ɪnˈɡeɪdʒ ˈhaɪpərˌdraɪv/" value={cmd.ipa} onChange={(e) => updateVoiceCommand(i, "ipa", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                              <div className="space-y-1 col-span-3">
                                <Label className="text-xs text-slate-400">Translation (VI)</Label>
                                <Input placeholder="Kích hoạt bước nhảy không gian" value={cmd.translation} onChange={(e) => updateVoiceCommand(i, "translation", e.target.value)} className="bg-input border-border h-8 text-sm" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setVoiceCommands([...voiceCommands, emptyVoiceCommand()])} className="w-full border-dashed border-slate-600 text-slate-400 hover:text-green-400 hover:border-green-500/50">
                        <Plus className="w-4 h-4 mr-2" /> Add Command
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={goBack} className="border-border">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={!canProceedStep4}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold"
                    >
                      <Upload className="w-4 h-4 mr-2" /> Upload Resource
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ═══════════════════ MANAGER TAB ═══════════════════ */}
            <TabsContent value="manager" className="space-y-4 mt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search units, lessons or vocabulary..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                {filteredUnits.map((unit) => {
                  const unitLessons = lessonsForUnit(unit.id)
                  const isExpanded = expandedUnits.has(unit.id)

                  return (
                    <div key={unit.id} className="border border-border rounded-lg overflow-hidden">
                      {/* Unit row */}
                      <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                        <button onClick={() => toggleUnit(unit.id)} className="flex-1 flex items-center gap-3 text-left">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-xl">{unit.icon}</span>
                          <div>
                            <p className="font-semibold text-foreground">{unit.title}</p>
                            <p className="text-xs text-muted-foreground">{unit.subtitle}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border">{unitLessons.length} lessons</Badge>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 h-8 w-8 p-0"><Edit2 className="w-4 h-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete {unit.title}?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">This will permanently delete the unit and all its lessons and vocabulary. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Expanded: lessons */}
                      {isExpanded && (
                        <div className="border-t border-border bg-secondary/10">
                          {unitLessons.length === 0 && (
                            <p className="text-xs text-muted-foreground px-12 py-4">No lessons yet.</p>
                          )}
                          {unitLessons.map((lesson) => {
                            const lessonKey = `${unit.id}-${lesson.id}`
                            const isLessonExpanded = expandedLessons.has(lessonKey)
                            const vocab = vocabForLesson(unit.id, lesson.id)

                            return (
                              <div key={lesson.id} className="border-t border-border/50 first:border-t-0">
                                {/* Lesson row */}
                                <div className="flex items-center justify-between p-3 pl-12 hover:bg-secondary/50 transition-colors">
                                  <button onClick={() => toggleLesson(lessonKey)} className="flex-1 flex items-center gap-3 text-left">
                                    {isLessonExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className={`text-xs px-1.5 py-0 ${lesson.contentType === "vocabulary" ? "text-cyan-400 border-cyan-500/30" : "text-purple-400 border-purple-500/30"}`}>
                                          {lesson.contentType}
                                        </Badge>
                                      </div>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{vocab.length} words</span>
                                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 h-7 w-7 p-0"><Edit2 className="w-3.5 h-3.5" /></Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-white">Delete Lesson?</AlertDialogTitle>
                                          <AlertDialogDescription className="text-gray-400">This will permanently delete "{lesson.title}" and all its content.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30">Cancel</AlertDialogCancel>
                                          <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>

                                {/* Expanded: vocabulary table */}
                                {isLessonExpanded && (
                                  <div className="p-4 pl-16 bg-secondary/20">
                                    {vocab.length > 0 ? (
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-xs">Word</TableHead>
                                            <TableHead className="text-xs">Phonetic</TableHead>
                                            <TableHead className="text-xs">Translation</TableHead>
                                            <TableHead className="text-xs">Media</TableHead>
                                            <TableHead className="text-right text-xs">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {vocab.map((v, vi) => (
                                            <TableRow key={vi} className="border-border">
                                              <TableCell className="font-medium text-sm">{v.word}</TableCell>
                                              <TableCell className="text-muted-foreground text-xs font-mono">{v.phonetic}</TableCell>
                                              <TableCell className="text-sm">{v.translation}</TableCell>
                                              <TableCell>
                                                <div className="flex gap-1">
                                                  {v.imageUrl && <Badge variant="outline" className="text-xs px-1.5 py-0 text-blue-400 border-blue-500/30">IMG</Badge>}
                                                  {v.audioUrl && <Badge variant="outline" className="text-xs px-1.5 py-0 text-green-400 border-green-500/30">AUD</Badge>}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:bg-primary/10 h-7 w-7 p-0"
                                                    onClick={() => {
                                                      setEditingVocab({ ...v, key: `${unit.id}-${lesson.id}-${vi}` })
                                                      setIsEditVocabOpen(true)
                                                    }}
                                                  >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </Button>
                                                  <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
                                                      <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-white">Delete "{v.word}"?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-gray-400">This action cannot be undone.</AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction>
                                                      </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                  </AlertDialog>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    ) : (
                                      <p className="text-xs text-muted-foreground py-2">No vocabulary added yet.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Confirm Upload Dialog ── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-slate-800 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Upload</DialogTitle>
            <DialogDescription className="text-gray-400">Review the details before saving.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <span className="text-slate-400">Unit</span>
              <span className="text-white font-medium">
                {isNewUnit ? newUnitTitle : mockUnits.find((u) => u.id === selectedUnitId)?.title}
                {isNewUnit && <Badge variant="outline" className="ml-2 text-xs text-cyan-400 border-cyan-500/30">New</Badge>}
              </span>
              <span className="text-slate-400">Lesson</span>
              <span className="text-white font-medium">
                {isNewLesson ? newLessonTitle : mockLessons.find((l) => l.id === selectedLessonId)?.title}
                {isNewLesson && <Badge variant="outline" className="ml-2 text-xs text-cyan-400 border-cyan-500/30">New</Badge>}
              </span>
              <span className="text-slate-400">Content</span>
              <span className="text-white font-medium capitalize">{contentType} ({contentType === "vocabulary" ? vocabEntries.length : grammarEntries.length} items)</span>
              <span className="text-slate-400">Game</span>
              <span className="text-white font-medium">{GAME_TYPES.find((g) => g.id === selectedGameType)?.name}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">
              <Upload className="w-4 h-4 mr-2" /> Confirm Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Vocab Dialog ── */}
      <Dialog open={isEditVocabOpen} onOpenChange={setIsEditVocabOpen}>
        <DialogContent className="bg-slate-800 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Vocabulary</DialogTitle>
          </DialogHeader>
          {editingVocab && (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Word</Label>
                <Input value={editingVocab.word} onChange={(e) => setEditingVocab({ ...editingVocab, word: e.target.value })} className="bg-input border-slate-600" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Phonetic</Label>
                <Input value={editingVocab.phonetic} onChange={(e) => setEditingVocab({ ...editingVocab, phonetic: e.target.value })} className="bg-input border-slate-600" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Translation</Label>
                <Input value={editingVocab.translation} onChange={(e) => setEditingVocab({ ...editingVocab, translation: e.target.value })} className="bg-input border-slate-600" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Image URL</Label>
                <Input value={editingVocab.imageUrl} onChange={(e) => setEditingVocab({ ...editingVocab, imageUrl: e.target.value })} className="bg-input border-slate-600" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-slate-400 text-xs">Audio URL</Label>
                <Input value={editingVocab.audioUrl} onChange={(e) => setEditingVocab({ ...editingVocab, audioUrl: e.target.value })} className="bg-input border-slate-600" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditVocabOpen(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={() => setIsEditVocabOpen(false)} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
