"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, X, Check, RotateCcw, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useSearchParams } from 'next/navigation'
import { CosmicBackground } from "@/components/cosmic-background"

type FlashcardMode = "setup" | "study" | "summary"

export default function FlashcardPage() {
  const searchParams = useSearchParams()
  const urlUnit = searchParams.get('unit')
  const urlCount = searchParams.get('count')
  
  const [mode, setMode] = useState<FlashcardMode>("setup")
  const [wordCount, setWordCount] = useState(10)
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownWords, setKnownWords] = useState<number[]>([])
  const [unknownWords, setUnknownWords] = useState<number[]>([])
  const [studyWords, setStudyWords] = useState<typeof allWords>([])
  
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [touchCurrent, setTouchCurrent] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Mock data - same as review page
  const allWords = [
    {
      id: 1,
      word: "Hello",
      phonetic: "/həˈloʊ/",
      translation: "Xin chào",
      unit: "Unit 1",
      level: 1,
      image: "/words/hello-greeting.jpg",
    },
    {
      id: 2,
      word: "Goodbye",
      phonetic: "/ɡʊdˈbaɪ/",
      translation: "Tạm biệt",
      unit: "Unit 1",
      level: 1,
      image: "/words/single-word-goodbye.jpg",
    },
    {
      id: 3,
      word: "Thank you",
      phonetic: "/θæŋk juː/",
      translation: "Cảm ơn",
      unit: "Unit 1",
      level: 1,
      image: "/words/thank-you-card.jpg",
    },
    {
      id: 4,
      word: "Apple",
      phonetic: "/ˈæp.əl/",
      translation: "Quả táo",
      unit: "Unit 2",
      level: 2,
      image: "/words/ripe-red-apple.jpg",
    },
    {
      id: 5,
      word: "Book",
      phonetic: "/bʊk/",
      translation: "Quyển sách",
      unit: "Unit 2",
      level: 2,
      image: "/words/open-book-library.jpg",
    },
    {
      id: 6,
      word: "Computer",
      phonetic: "/kəmˈpjuː.tər/",
      translation: "Máy tính",
      unit: "Unit 3",
      level: 3,
      image: "/words/modern-computer-setup.jpg",
    },
    {
      id: 7,
      word: "Beautiful",
      phonetic: "/ˈbjuː.tɪ.fəl/",
      translation: "Đẹp",
      unit: "Unit 3",
      level: 3,
      image: "/words/beautiful.jpg",
    },
    {
      id: 8,
      word: "Important",
      phonetic: "/ɪmˈpɔːr.tənt/",
      translation: "Quan trọng",
      unit: "Unit 4",
      level: 4,
      image: "/words/important.jpg",
    },
    {
      id: 9,
      word: "Excellent",
      phonetic: "/ˈek.səl.ənt/",
      translation: "Xuất sắc",
      unit: "Unit 5",
      level: 5,
      image: "/words/excellent.jpg",
    },
    {
      id: 10,
      word: "Magnificent",
      phonetic: "/mæɡˈnɪf.ɪ.sənt/",
      translation: "Tuyệt vời",
      unit: "Unit 5",
      level: 5,
      image: "/words/magnificent.jpg",
    },
    {
      id: 11,
      word: "Wonderful",
      phonetic: "/ˈwʌn.dər.fəl/",
      translation: "Tuyệt diệu",
      unit: "Unit 6",
      level: 6,
      image: "/words/wonderful.jpg",
    },
  ]

  // Get unique units
  const units = ["all", ...Array.from(new Set(allWords.map((w) => w.unit)))]

  const getMaxWordsForUnit = () => {
    if (selectedUnit === "all") {
      return allWords.length
    }
    return allWords.filter((w) => w.unit === selectedUnit).length
  }

  const maxWords = getMaxWordsForUnit()

  // Update word count when unit changes to not exceed max
  useEffect(() => {
    if (wordCount > maxWords) {
      setWordCount(maxWords)
    }
  }, [selectedUnit, maxWords, wordCount])

  useEffect(() => {
    if (urlUnit === 'favorite' && urlCount) {
      // Get favorite words (last 3 words in our mock data)
      const favoriteWords = allWords.slice(-3)
      setStudyWords(favoriteWords)
      setMode("study")
      setCurrentIndex(0)
      setIsFlipped(false)
      setKnownWords([])
      setUnknownWords([])
    }
  }, [urlUnit, urlCount])

  const handleStart = () => {
    let filtered = selectedUnit === "all" ? allWords : allWords.filter((w) => w.unit === selectedUnit)
    filtered = filtered.slice(0, wordCount)
    setStudyWords(filtered)
    setMode("study")
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownWords([])
    setUnknownWords([])
  }

  const handleKnown = () => {
    const currentWord = studyWords[currentIndex]
    setKnownWords([...knownWords, currentWord.id])
    moveToNext()
  }

  const handleUnknown = () => {
    const currentWord = studyWords[currentIndex]
    setUnknownWords([...unknownWords, currentWord.id])
    moveToNext()
  }

  const moveToNext = () => {
    setIsFlipped(false)
    if (currentIndex < studyWords.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setMode("summary")
    }
  }

  const handleReviewUnknown = () => {
    const filtered = studyWords.filter((w) => unknownWords.includes(w.id))
    setStudyWords(filtered)
    setMode("study")
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownWords([])
    setUnknownWords([])
  }

  const currentWord = studyWords[currentIndex]
  const progress = studyWords.length > 0 ? ((currentIndex + 1) / studyWords.length) * 100 : 0
  const knownPercentage = studyWords.length > 0 ? (knownWords.length / studyWords.length) * 100 : 0
  
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setTouchStart({ x: clientX, y: clientY })
    setTouchCurrent({ x: clientX, y: clientY })
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setTouchCurrent({ x: clientX, y: clientY })
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    const deltaX = touchCurrent.x - touchStart.x
    const deltaY = Math.abs(touchCurrent.y - touchStart.y)
    
    // Only trigger swipe if horizontal movement > 100px and vertical < 50px
    if (Math.abs(deltaX) > 100 && deltaY < 50) {
      if (deltaX > 0) {
        // Swipe right - Known
        handleKnown()
      } else {
        // Swipe left - Unknown
        handleUnknown()
      }
    }
    
    setIsDragging(false)
    setTouchStart({ x: 0, y: 0 })
    setTouchCurrent({ x: 0, y: 0 })
  }

  const swipeOffset = isDragging ? touchCurrent.x - touchStart.x : 0
  const swipeRotation = swipeOffset * 0.1 // Subtle rotation effect
  const swipeOpacity = Math.abs(swipeOffset) / 300 // Fade out as swiped

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      {/* Back button */}
      <Link
        href="/client/review"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Review</span>
      </Link>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Setup Mode */}
        {mode === "setup" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-4">Flashcard Setup</h1>
              <p className="text-cyan-300 text-lg">Configure your study session</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 space-y-6">
              {/* Unit Selection */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">Select Unit</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit} className="bg-purple-900">
                      {unit === "all" ? "All Units" : unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Word Count */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  Number of Words (Max: {maxWords})
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxWords}
                  value={wordCount}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setWordCount(Math.min(value, maxWords))
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                />
                <p className="text-white/70 text-sm mt-2">
                  {selectedUnit === "all" 
                    ? `Choose up to ${maxWords} words from all known words` 
                    : `Choose up to ${maxWords} words from ${selectedUnit}`}
                </p>
              </div>

              {/* Start Button */}
              <Button
                onClick={handleStart}
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-purple-900 font-bold py-4 text-xl rounded-xl shadow-lg shadow-cyan-400/50 transition-all duration-300 hover:scale-105"
              >
                Start Flashcard
                <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Study Mode */}
        {mode === "study" && currentWord && (
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-white mb-2">
                <span className="font-semibold">Progress</span>
                <span className="font-semibold">
                  {currentIndex + 1} / {studyWords.length}
                </span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-300 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Flashcard */}
            <div
              className="relative w-full h-[420px] cursor-grab active:cursor-grabbing perspective-1000"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onMouseLeave={() => {
                if (isDragging) handleTouchEnd()
              }}
            >
              {isDragging && (
                <>
                  {/* Left indicator (Unknown) */}
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-200"
                    style={{ opacity: swipeOffset < -50 ? swipeOpacity : 0 }}
                  >
                    <div className="bg-red-500/80 rounded-full p-6 shadow-lg shadow-red-500/50">
                      <X className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  
                  {/* Right indicator (Known) */}
                  <div 
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-200"
                    style={{ opacity: swipeOffset > 50 ? swipeOpacity : 0 }}
                  >
                    <div className="bg-green-500/80 rounded-full p-6 shadow-lg shadow-green-500/50">
                      <Check className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </>
              )}

              <div
                className="absolute inset-0 transition-transform duration-500 transform-style-3d"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${isFlipped ? 180 : 0}deg) translateX(${swipeOffset}px) rotate(${swipeRotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.5s',
                }}
                onClick={(e) => {
                  // Only flip if not dragging
                  if (Math.abs(swipeOffset) < 10) {
                    setIsFlipped(!isFlipped)
                  }
                }}
              >
                {/* Front - English Word */}
                <div
                  className={`absolute inset-0 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center backface-hidden ${
                    isFlipped ? "hidden" : ""
                  }`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <h2 className="text-6xl font-bold text-white">{currentWord.word}</h2>
                </div>

                {/* Back - Image, Translation, Phonetic */}
                <div
                  className={`absolute inset-0 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 flex flex-col items-center justify-center backface-hidden ${
                    !isFlipped ? "hidden" : ""
                  }`}
                  style={{ 
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <Image
                    src={currentWord.image || "/placeholder.svg"}
                    alt={currentWord.word}
                    width={240}
                    height={240}
                    className="rounded-2xl object-cover mb-4"
                  />
                  <p className="text-4xl font-bold text-white mb-3">{currentWord.translation}</p>
                  <p className="text-2xl text-cyan-300">{currentWord.phonetic}</p>
                </div>
              </div>
            </div>

            <p className="text-center text-white/60 mt-2 text-lg">Click to flip • Swipe left (✗) or right (✓)</p>

            {/* Action Buttons */}
            <div className="flex justify-center gap-8 mt-6">
              <button
                onClick={handleUnknown}
                className="flex items-center justify-center w-18 h-18 bg-red-500/80 hover:bg-red-500 rounded-full shadow-lg shadow-red-500/50 transition-all duration-300 hover:scale-110"
              >
                <X className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={handleKnown}
                className="flex items-center justify-center w-18 h-18 bg-green-500/80 hover:bg-green-500 rounded-full shadow-lg shadow-green-500/50 transition-all duration-300 hover:scale-110"
              >
                <Check className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Mode */}
        {mode === "summary" && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-4">Study Summary</h1>
              <p className="text-cyan-300 text-lg">Great job! Here's your progress</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 space-y-8">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-white mb-3">
                  <span className="font-semibold text-lg">Mastery Progress</span>
                  <span className="font-bold text-xl">{knownPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-6 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${knownPercentage}%` }}
                  />
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-green-500/20 rounded-2xl p-6 border border-green-500/30">
                  <p className="text-green-300 text-sm font-semibold mb-2">Known Words</p>
                  <p className="text-4xl font-bold text-white">{knownWords.length}</p>
                </div>
                <div className="bg-red-500/20 rounded-2xl p-6 border border-red-500/30">
                  <p className="text-red-300 text-sm font-semibold mb-2">Unknown Words</p>
                  <p className="text-4xl font-bold text-white">{unknownWords.length}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-4">
                {unknownWords.length > 0 && (
                  <Button
                    onClick={handleReviewUnknown}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 text-lg rounded-xl shadow-lg shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                  >
                    <RotateCcw className="w-6 h-6 mr-2" />
                    Review Unknown Words
                  </Button>
                )}
                <Link href="/client/review" className="block w-full">
                  <Button className="w-full bg-cyan-400 hover:bg-cyan-500 text-purple-900 font-bold py-4 text-lg rounded-xl shadow-lg shadow-cyan-400/50 transition-all duration-300 hover:scale-105">
                    <Check className="w-6 h-6 mr-2" />
                    Complete
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
