"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Upload,
  Save,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  X,
  Check,
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

const mockUnits = [
  { id: "1", title: "Unit 1", subtitle: "Greetings & Basics", icon: "🌍" },
  { id: "2", title: "Unit 2", subtitle: "Family & Friends", icon: "👨‍👩‍👧‍👦" },
  { id: "3", title: "Unit 3", subtitle: "Food & Drinks", icon: "🍕" },
]

const mockLessons = [
  { id: 1, unitId: "1", title: "Lesson 1", type: "vocabulary" },
  { id: 2, unitId: "1", title: "Lesson 2", type: "practice" },
  { id: 3, unitId: "1", title: "Lesson 3", type: "test" },
]

const mockVocabulary = [
  {
    id: 1,
    unitId: "1",
    lessonId: 1,
    word: "Hello",
    phonetic: "/həˈloʊ/",
    translation: "Xin chào",
    image: "/words/hello-greeting.jpg",
    audioUrl: "/audio/hello.mp3",
    level: 1,
  },
  {
    id: 2,
    unitId: "1",
    lessonId: 1,
    word: "Goodbye",
    phonetic: "/ɡʊdˈbaɪ/",
    translation: "Tạm biệt",
    image: "/words/single-word-goodbye.jpg",
    audioUrl: "/audio/goodbye.mp3",
    level: 1,
  },
]

const gameTypes = [
  { id: "signal-check", name: "Signal Check (Multiple Choice)" },
  { id: "galaxy-match", name: "Galaxy Match (Memory Game)" },
]

export default function ResourceManagementPage() {
  const [activeTab, setActiveTab] = useState("upload")

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Upload form state
  const [selectedUnit, setSelectedUnit] = useState("")
  const [selectedLesson, setSelectedLesson] = useState("")
  const [newUnitName, setNewUnitName] = useState("")
  const [newLessonName, setNewLessonName] = useState("")
  const [selectedGameType, setSelectedGameType] = useState("")
  const [isCreatingNewUnit, setIsCreatingNewUnit] = useState(false)
  const [isCreatingNewLesson, setIsCreatingNewLesson] = useState(false)
  const [vocabularyEntries, setVocabularyEntries] = useState<
    Array<{
      word: string
      phonetic: string
      translation: string
      image?: string
      audio?: string
    }>
  >([{ word: "", phonetic: "", translation: "", image: "", audio: "" }])

  // Manager state
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")

  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [editingVocab, setEditingVocab] = useState<any>(null)
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false)
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false)
  const [isEditVocabOpen, setIsEditVocabOpen] = useState(false)

  const handleDeleteUnit = (unitId: number) => {
    console.log("[v0] Deleting unit:", unitId)
    // TODO: Implement actual delete logic
    alert(`Unit ${unitId} deleted successfully!`)
  }

  const handleDeleteLesson = (lessonId: number) => {
    console.log("[v0] Deleting lesson:", lessonId)
    // TODO: Implement actual delete logic
    alert(`Lesson ${lessonId} deleted successfully!`)
  }

  const handleDeleteVocab = (vocabId: number) => {
    console.log("[v0] Deleting vocabulary:", vocabId)
    // TODO: Implement actual delete logic
    alert(`Vocabulary ${vocabId} deleted successfully!`)
  }

  const handleEditUnit = (unit: any) => {
    setEditingUnit(unit)
    setIsEditUnitOpen(true)
  }

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson)
    setIsEditLessonOpen(true)
  }

  const handleEditVocab = (vocab: any) => {
    setEditingVocab(vocab)
    setIsEditVocabOpen(true)
  }

  const handleSaveUnit = () => {
    console.log("[v0] Saving unit:", editingUnit)
    // TODO: Implement actual save logic
    alert("Unit updated successfully!")
    setIsEditUnitOpen(false)
  }

  const handleSaveLesson = () => {
    console.log("[v0] Saving lesson:", editingLesson)
    // TODO: Implement actual save logic
    alert("Lesson updated successfully!")
    setIsEditLessonOpen(false)
  }

  const handleSaveVocab = () => {
    console.log("[v0] Saving vocabulary:", editingVocab)
    // TODO: Implement actual save logic
    alert("Vocabulary updated successfully!")
    setIsEditVocabOpen(false)
  }

  const addVocabularyEntry = () => {
    setVocabularyEntries([...vocabularyEntries, { word: "", phonetic: "", translation: "", image: "", audio: "" }])
  }

  const removeVocabularyEntry = (index: number) => {
    setVocabularyEntries(vocabularyEntries.filter((_, i) => i !== index))
  }

  const updateVocabularyEntry = (index: number, field: string, value: string) => {
    const updated = [...vocabularyEntries]
    updated[index] = { ...updated[index], [field]: value }
    setVocabularyEntries(updated)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.name.endsWith(".xlsx")) {
      // TODO: Parse Excel file with format matching review vocabulary
      console.log("[v0] Uploading Excel file:", file.name)
    }
  }

  const handleSubmit = () => {
    const data = {
      unit: isCreatingNewUnit ? { name: newUnitName } : { id: selectedUnit },
      lesson: isCreatingNewLesson ? { name: newLessonName } : { id: selectedLesson },
      gameType: selectedGameType,
      vocabulary: vocabularyEntries,
    }
    console.log("[v0] Submitting resource:", data)
    setShowConfirmDialog(false)
    // TODO: Submit data to backend
  }

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits)
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId)
    } else {
      newExpanded.add(unitId)
    }
    setExpandedUnits(newExpanded)
  }

  const toggleLesson = (lessonKey: string) => {
    const newExpanded = new Set(expandedLessons)
    if (newExpanded.has(lessonKey)) {
      newExpanded.delete(lessonKey)
    } else {
      newExpanded.add(lessonKey)
    }
    setExpandedLessons(newExpanded)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resource Management</h1>
        <p className="text-muted-foreground mt-2">Upload new lessons and manage vocabulary content</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Resource
              </TabsTrigger>
              <TabsTrigger
                value="manager"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Search className="w-4 h-4 mr-2" />
                Manager
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Unit Selection */}
                <div className="space-y-2">
                  <Label>Select Unit</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedUnit}
                      onValueChange={(value) => {
                        setSelectedUnit(value)
                        setIsCreatingNewUnit(false)
                      }}
                      disabled={isCreatingNewUnit}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Choose existing unit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.icon} {unit.title} - {unit.subtitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingNewUnit(!isCreatingNewUnit)
                        setSelectedUnit("")
                      }}
                    >
                      {isCreatingNewUnit ? "Cancel" : "New Unit"}
                    </Button>
                  </div>
                  {isCreatingNewUnit && (
                    <Input
                      placeholder="Enter new unit name..."
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                    />
                  )}
                </div>

                {/* Lesson Selection */}
                <div className="space-y-2">
                  <Label>Select Lesson</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedLesson}
                      onValueChange={(value) => {
                        setSelectedLesson(value)
                        setIsCreatingNewLesson(false)
                      }}
                      disabled={isCreatingNewLesson || (!selectedUnit && !isCreatingNewUnit)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Choose existing lesson..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockLessons
                          .filter((lesson) => lesson.unitId === selectedUnit)
                          .map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id.toString()}>
                              {lesson.title} ({lesson.type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingNewLesson(!isCreatingNewLesson)
                        setSelectedLesson("")
                      }}
                      disabled={!selectedUnit && !isCreatingNewUnit}
                    >
                      {isCreatingNewLesson ? "Cancel" : "New Lesson"}
                    </Button>
                  </div>
                  {isCreatingNewLesson && (
                    <Input
                      placeholder="Enter new lesson name..."
                      value={newLessonName}
                      onChange={(e) => setNewLessonName(e.target.value)}
                    />
                  )}
                </div>

                {/* Game Type Selection */}
                <div className="space-y-2">
                  <Label>Game Type</Label>
                  <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose game type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {gameTypes.map((game) => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vocabulary Input Method */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Vocabulary</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={addVocabularyEntry}>
                      <Label
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Label>
                      </Button>
                      <Label
                        htmlFor="excel-upload"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Upload Excel
                      </Label>
                      <input
                        id="excel-upload"
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {vocabularyEntries.map((entry, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="pt-6 space-y-3">
                          {vocabularyEntries.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => removeVocabularyEntry(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Word</Label>
                              <Input
                                placeholder="English word..."
                                value={entry.word}
                                onChange={(e) => updateVocabularyEntry(index, "word", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Phonetic</Label>
                              <Input
                                placeholder="/həˈloʊ/"
                                value={entry.phonetic}
                                onChange={(e) => updateVocabularyEntry(index, "phonetic", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Translation (Vietnamese)</Label>
                              <Input
                                placeholder="Dịch nghĩa..."
                                value={entry.translation}
                                onChange={(e) => updateVocabularyEntry(index, "translation", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Image URL</Label>
                              <Input
                                placeholder="/words/image.jpg"
                                value={entry.image}
                                onChange={(e) => updateVocabularyEntry(index, "image", e.target.value)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Audio URL</Label>
                              <Input
                                placeholder="/audio/word.mp3"
                                value={entry.audio}
                                onChange={(e) => updateVocabularyEntry(index, "audio", e.target.value)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={() => setShowConfirmDialog(true)} className="bg-primary text-primary-foreground">
                    <Save className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Manager Tab */}
            <TabsContent value="manager" className="space-y-4 mt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search vocabulary..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2">
                {mockUnits.map((unit) => {
                  const unitLessons = mockLessons.filter((l) => l.unitId === unit.id)
                  const isUnitExpanded = expandedUnits.has(unit.id)

                  return (
                    <div key={unit.id} className="border border-border rounded-lg">
                      <div className="flex items-center justify-between p-4 hover:bg-secondary/50">
                        <button onClick={() => toggleUnit(unit.id)} className="flex-1 flex items-center gap-3">
                          {isUnitExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          <span className="text-2xl">{unit.icon}</span>
                          <div className="text-left">
                            <p className="font-semibold">{unit.title}</p>
                            <p className="text-sm text-muted-foreground">{unit.subtitle}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground mr-2">{unitLessons.length} lessons</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUnit(unit)}
                            className="text-primary hover:bg-primary/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Unit?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  This will permanently delete "{unit.title}" and all its lessons and vocabulary. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUnit(Number(unit.id))}
                                  className="bg-red-500 text-white hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {isUnitExpanded && (
                        <div className="border-t border-border">
                          {unitLessons.map((lesson) => {
                            const lessonKey = `${unit.id}-${lesson.id}`
                            const isLessonExpanded = expandedLessons.has(lessonKey)
                            const lessonVocab = mockVocabulary.filter(
                              (v) => v.unitId === unit.id && v.lessonId === lesson.id,
                            )

                            return (
                              <div key={lesson.id} className="border-t border-border">
                                <div className="flex items-center justify-between p-4 pl-12 hover:bg-secondary/50">
                                  <button
                                    onClick={() => toggleLesson(lessonKey)}
                                    className="flex-1 flex items-center gap-3"
                                  >
                                    {isLessonExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                    <div className="text-left">
                                      <p className="font-medium">{lesson.title}</p>
                                      <p className="text-xs text-muted-foreground capitalize">{lesson.type}</p>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground mr-2">
                                      {lessonVocab.length} words
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditLesson(lesson)}
                                      className="text-primary hover:bg-primary/10"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-white">Delete Lesson?</AlertDialogTitle>
                                          <AlertDialogDescription className="text-gray-400">
                                            This will permanently delete "{lesson.title}" and all its vocabulary (
                                            {lessonVocab.length} words). This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30">
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                            className="bg-red-500 text-white hover:bg-red-600"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>

                                {isLessonExpanded && (
                                  <div className="p-4 pl-16 bg-secondary/20">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                          <TableHead>Word</TableHead>
                                          <TableHead>Phonetic</TableHead>
                                          <TableHead>Translation</TableHead>
                                          <TableHead>Level</TableHead>
                                          <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {lessonVocab.map((vocab) => (
                                          <TableRow key={vocab.id} className="border-border">
                                            <TableCell className="font-medium">{vocab.word}</TableCell>
                                            <TableCell className="text-muted-foreground">{vocab.phonetic}</TableCell>
                                            <TableCell>{vocab.translation}</TableCell>
                                            <TableCell>
                                              <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                                                Level {vocab.level}
                                              </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex justify-end gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleEditVocab(vocab)}
                                                  className="text-primary hover:bg-primary/10"
                                                >
                                                  <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="text-destructive hover:bg-destructive/10"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle className="text-white">
                                                        Delete Vocabulary?
                                                      </AlertDialogTitle>
                                                      <AlertDialogDescription className="text-gray-400">
                                                        This will permanently delete the word "{vocab.word}". This
                                                        action cannot be undone.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30">
                                                        Cancel
                                                      </AlertDialogCancel>
                                                      <AlertDialogAction
                                                        onClick={() => handleDeleteVocab(vocab.id)}
                                                        className="bg-red-500 text-white hover:bg-red-600"
                                                      >
                                                        Delete
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
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

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-slate-800 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Upload</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to upload this resource? Please review the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Unit:</span>
              <span className="text-sm font-medium text-white">
                {isCreatingNewUnit
                  ? `New: ${newUnitName}`
                  : mockUnits.find((u) => u.id === selectedUnit)?.title || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Lesson:</span>
              <span className="text-sm font-medium text-white">
                {isCreatingNewLesson
                  ? `New: ${newLessonName}`
                  : mockLessons.find((l) => l.id.toString() === selectedLesson)?.title || "None"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Game Type:</span>
              <span className="text-sm font-medium text-white">{selectedGameType || "None"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Vocabulary Count:</span>
              <span className="text-sm font-medium text-white">
                {vocabularyEntries.filter((v) => v.word.trim()).length} entries
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-cyan-500 text-white hover:bg-cyan-600">
              <Check className="w-4 h-4 mr-2" />
              Confirm & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUnitOpen} onOpenChange={setIsEditUnitOpen}>
        <DialogContent className="bg-slate-800 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Unit</DialogTitle>
            <DialogDescription className="text-gray-400">Update the unit information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Unit Title</label>
              <Input
                value={editingUnit?.title || ""}
                onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
                className="bg-slate-700 border-cyan-500/30 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Subtitle</label>
              <Input
                value={editingUnit?.subtitle || ""}
                onChange={(e) => setEditingUnit({ ...editingUnit, subtitle: e.target.value })}
                className="bg-slate-700 border-cyan-500/30 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Icon</label>
              <Input
                value={editingUnit?.icon || ""}
                onChange={(e) => setEditingUnit({ ...editingUnit, icon: e.target.value })}
                className="bg-slate-700 border-cyan-500/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditUnitOpen(false)}
              className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUnit} className="bg-cyan-500 text-white hover:bg-cyan-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditLessonOpen} onOpenChange={setIsEditLessonOpen}>
        <DialogContent className="bg-slate-800 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Lesson</DialogTitle>
            <DialogDescription className="text-gray-400">Update the lesson information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Lesson Title</label>
              <Input
                value={editingLesson?.title || ""}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                className="bg-slate-700 border-cyan-500/30 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Type</label>
              <Select
                value={editingLesson?.type || ""}
                onValueChange={(value) => setEditingLesson({ ...editingLesson, type: value })}
              >
                <SelectTrigger className="bg-slate-700 border-cyan-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-cyan-500/30">
                  <SelectItem value="vocabulary">Vocabulary</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditLessonOpen(false)}
              className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLesson} className="bg-cyan-500 text-white hover:bg-cyan-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditVocabOpen} onOpenChange={setIsEditVocabOpen}>
        <DialogContent className="bg-slate-800 border-cyan-500/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Vocabulary</DialogTitle>
            <DialogDescription className="text-gray-400">Update the vocabulary information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Word</label>
                <Input
                  value={editingVocab?.word || ""}
                  onChange={(e) => setEditingVocab({ ...editingVocab, word: e.target.value })}
                  className="bg-slate-700 border-cyan-500/30 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Phonetic</label>
                <Input
                  value={editingVocab?.phonetic || ""}
                  onChange={(e) => setEditingVocab({ ...editingVocab, phonetic: e.target.value })}
                  className="bg-slate-700 border-cyan-500/30 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Translation</label>
              <Input
                value={editingVocab?.translation || ""}
                onChange={(e) => setEditingVocab({ ...editingVocab, translation: e.target.value })}
                className="bg-slate-700 border-cyan-500/30 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Image URL</label>
                <Input
                  value={editingVocab?.image || ""}
                  onChange={(e) => setEditingVocab({ ...editingVocab, image: e.target.value })}
                  className="bg-slate-700 border-cyan-500/30 text-white"
                  placeholder="/words/example.png"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Audio URL</label>
                <Input
                  value={editingVocab?.audioUrl || ""}
                  onChange={(e) => setEditingVocab({ ...editingVocab, audioUrl: e.target.value })}
                  className="bg-slate-700 border-cyan-500/30 text-white"
                  placeholder="/audio/example.mp3"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Level</label>
              <Select
                value={editingVocab?.level?.toString() || "1"}
                onValueChange={(value) => setEditingVocab({ ...editingVocab, level: Number.parseInt(value) })}
              >
                <SelectTrigger className="bg-slate-700 border-cyan-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-cyan-500/30">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditVocabOpen(false)}
              className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveVocab} className="bg-cyan-500 text-white hover:bg-cyan-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
