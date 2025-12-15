"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, BookOpen, Star, ChevronDown, Play, Volume2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

const mockKnownWords = [
  {
    id: 1,
    word: "Hello",
    phonetic: "/həˈloʊ/",
    translation: "Xin chào",
    unit: "Unit 1",
    level: 1,
    audioUrl: "/audio/hello.mp3",
    image: "/words/hello-greeting.jpg",
  },
  {
    id: 2,
    word: "Goodbye",
    phonetic: "/ɡʊdˈbaɪ/",
    translation: "Tạm biệt",
    unit: "Unit 1",
    level: 1,
    audioUrl: "/audio/hello.mp3",
    image: "/words/single-word-goodbye.jpg",
  },
  {
    id: 3,
    word: "Thank you",
    phonetic: "/θæŋk juː/",
    translation: "Cảm ơn",
    unit: "Unit 1",
    level: 1,
    audioUrl: "/audio/hello.mp3",
    image: "/words/thank-you-card.jpg",
  },
  {
    id: 4,
    word: "Apple",
    phonetic: "/ˈæp.əl/",
    translation: "Quả táo",
    unit: "Unit 2",
    level: 2,
    audioUrl: "/audio/hello.mp3",
    image: "/words/ripe-red-apple.jpg",
  },
  {
    id: 5,
    word: "Book",
    phonetic: "/bʊk/",
    translation: "Quyển sách",
    unit: "Unit 2",
    level: 2,
    audioUrl: "/audio/hello.mp3",
    image: "/words/open-book-library.jpg",
  },
  {
    id: 6,
    word: "Computer",
    phonetic: "/kəmˈpjuː.tər/",
    translation: "Máy tính",
    unit: "Unit 3",
    level: 3,
    audioUrl: "/audio/hello.mp3",
    image: "/words/modern-computer-setup.jpg",
  },
  {
    id: 7,
    word: "Beautiful",
    phonetic: "/ˈbjuː.tɪ.fəl/",
    translation: "Đẹp",
    unit: "Unit 3",
    level: 3,
    audioUrl: "/audio/hello.mp3",
    image: "/words/beautiful.jpg",
  },
  {
    id: 8,
    word: "Important",
    phonetic: "/ɪmˈpɔːr.tənt/",
    translation: "Quan trọng",
    unit: "Unit 4",
    level: 4,
    audioUrl: "/audio/hello.mp3",
    image: "/words/important.jpg",
  },
  {
    id: 9,
    word: "Excellent",
    phonetic: "/ˈek.səl.ənt/",
    translation: "Xuất sắc",
    unit: "Unit 5",
    level: 5,
    audioUrl: "/audio/hello.mp3",
    image: "/words/excellent.jpg",
  },
  {
    id: 10,
    word: "Magnificent",
    phonetic: "/mæɡˈnɪf.ɪ.sənt/",
    translation: "Tuyệt vời",
    unit: "Unit 5",
    level: 5,
    audioUrl: "/audio/hello.mp3",
    image: "/words/magnificent.jpg",
  },
  {
    id: 11,
    word: "Wonderful",
    phonetic: "/ˈwʌn.dər.fəl/",
    translation: "Tuyệt diệu",
    unit: "Unit 6",
    level: 6,
    audioUrl: "/audio/hello.mp3",
    image: "/words/wonderful.jpg",
  },
]

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<"known" | "favorite">("known")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [wordToRemove, setWordToRemove] = useState<number | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set([9, 10, 11]))

  const favoriteWords = mockKnownWords.filter(word => favoriteIds.has(word.id))
  const currentWords = activeTab === "known" ? mockKnownWords : favoriteWords

  const units = ["all", ...Array.from(new Set(currentWords.map((w) => w.unit)))]

  const filteredWords = currentWords.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnit = selectedUnit === "all" || word.unit === selectedUnit
    return matchesSearch && matchesUnit
  })

  const groupedWords = filteredWords.reduce(
    (acc, word) => {
      if (!acc[word.unit]) {
        acc[word.unit] = []
      }
      acc[word.unit].push(word)
      return acc
    },
    {} as Record<string, typeof filteredWords>,
  )

  Object.keys(groupedWords).forEach((unit) => {
    groupedWords[unit].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.word.localeCompare(b.word)
      } else {
        return b.word.localeCompare(a.word)
      }
    })
  })

  const sortedUnits = Object.keys(groupedWords).sort((a, b) => {
    const numA = Number.parseInt(a.replace(/\D/g, "")) || 0
    const numB = Number.parseInt(b.replace(/\D/g, "")) || 0
    return numA - numB
  })

  const toggleFavorite = (id: number) => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleUnfavorite = (id: number) => {
    setWordToRemove(id)
    setShowConfirmDialog(true)
  }

  const confirmUnfavorite = () => {
    if (wordToRemove !== null) {
      setFavoriteIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(wordToRemove)
        return newSet
      })
      setShowConfirmDialog(false)
      setWordToRemove(null)
    }
  }

  const handlePronounce = (word: string) => {
    console.log("[v0] Pronouncing:", word)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
      </div>

      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Vocabulary Review</h1>
          <p className="text-cyan-300 text-lg">Manage and review your vocabulary</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("known")}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === "known"
                ? "bg-cyan-400 text-purple-900 shadow-lg shadow-cyan-400/50"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Known Words</span>
              <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">{mockKnownWords.length}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("favorite")}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === "favorite"
                ? "bg-cyan-400 text-purple-900 shadow-lg shadow-cyan-400/50"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>Favorite Words</span>
              <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">{favoriteWords.length}</span>
            </div>
          </button>
        </div>

        <div className="max-w-6xl mx-auto mb-8 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <Input
                type="text"
                placeholder="Search vocabulary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit} className="bg-purple-900">
                    {unit === "all" ? "All Units" : unit}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              >
                <option value="asc" className="bg-purple-900">
                  A → Z
                </option>
                <option value="desc" className="bg-purple-900">
                  Z → A
                </option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-8 space-y-6">
          {sortedUnits.map((unit) => (
            <div key={unit} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-cyan-300 mb-4">{unit}</h3>
              <div className="space-y-3">
                {groupedWords[unit].map((word) => (
                  <div
                    key={word.id}
                    className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <Image
                          src={word.image || "/placeholder.svg"}
                          alt={word.word}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      </div>

                      <div className="flex-shrink-0 w-32">
                        <p className="text-lg font-bold text-white">{word.word}</p>
                      </div>

                      <div className="flex-shrink-0 w-40">
                        <p className="text-sm text-cyan-300">{word.phonetic}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{word.translation}</p>
                      </div>

                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-purple-500/30 rounded-full text-white font-bold">
                          {word.level}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePronounce(word.word)}
                        className="flex-shrink-0 text-cyan-300 hover:text-cyan-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                        aria-label="Pronounce word"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>

                      <button
                        onClick={() => {
                          if (activeTab === "favorite") {
                            handleUnfavorite(word.id)
                          } else {
                            toggleFavorite(word.id)
                          }
                        }}
                        className={`flex-shrink-0 transition-colors p-2 hover:bg-white/10 rounded-lg ${
                          favoriteIds.has(word.id) ? "text-yellow-400 hover:text-yellow-300" : "text-gray-400 hover:text-gray-300"
                        }`}
                        aria-label="Favorite word"
                      >
                        <Star className={`w-6 h-6 ${favoriteIds.has(word.id) ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredWords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">No words found</p>
            </div>
          )}
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl p-8 border border-white/20 max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Remove from Favorites?</h3>
            <p className="text-white/80 mb-6">Are you sure you want to remove this word from your favorites?</p>
            <div className="flex gap-4">
              <Button
                onClick={confirmUnfavorite}
                className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-purple-900 font-semibold"
              >
                Yes, Remove
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmDialog(false)
                  setWordToRemove(null)
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredWords.length > 0 && (
        <Link 
          href={activeTab === "favorite" ? `/client/flashcard?unit=favorite&count=${filteredWords.length}` : "/client/flashcard"}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30"
        >
          <Button className="bg-cyan-400 text-purple-900 hover:bg-cyan-500 px-16 py-8 rounded-3xl text-2xl font-bold shadow-lg shadow-cyan-400/50 transition-all duration-300 hover:scale-105">
            <Play className="w-8 h-8 mr-3" />
            Start Review 
          </Button>
        </Link>
      )}
    </div>
  )
}
