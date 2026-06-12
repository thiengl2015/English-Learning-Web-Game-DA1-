"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, BookOpen, Star, ChevronDown, Play, Volume2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "")
const API_ROOT = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api$/, "")

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface BackendVocabulary {
  id: number
  unit_id?: number
  word: string
  phonetic?: string | null
  translation: string
  image_url?: string | null
  audio_url?: string | null
  level?: number | null
  unit?: {
    id: number
    title?: string | null
    icon?: string | null
  } | null
  user_progress?: {
    is_favorite?: boolean
    mastery_level?: number
    correct_count?: number
    incorrect_count?: number
    last_reviewed?: string | null
  } | null
}

interface ReviewWord {
  id: number
  word: string
  phonetic: string
  translation: string
  unit: string
  level: number
  audioUrl: string | null
  image: string
  isFavorite: boolean
  masteryLevel: number
}

function normalizeAssetUrl(url: string | null | undefined, fallback: string) {
  if (!url) return fallback
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (url.startsWith("/")) return `${ASSET_BASE_URL}${url}`
  return url
}

function mapVocabulary(vocab: BackendVocabulary): ReviewWord {
  return {
    id: vocab.id,
    word: vocab.word,
    phonetic: vocab.phonetic || "",
    translation: vocab.translation,
    unit: vocab.unit?.title || (vocab.unit_id ? `Unit ${vocab.unit_id}` : "Other"),
    level: vocab.user_progress?.mastery_level ?? vocab.level ?? 1,
    audioUrl: vocab.audio_url ? normalizeAssetUrl(vocab.audio_url, "") : null,
    image: normalizeAssetUrl(vocab.image_url, "/placeholder.svg"),
    isFavorite: Boolean(vocab.user_progress?.is_favorite),
    masteryLevel: vocab.user_progress?.mastery_level ?? 0,
  }
}

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<"known" | "favorite">("known")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [wordToRemove, setWordToRemove] = useState<number | null>(null)
  const [knownWords, setKnownWords] = useState<ReviewWord[]>([])
  const [favoriteWords, setFavoriteWords] = useState<ReviewWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [favoriteActionId, setFavoriteActionId] = useState<number | null>(null)

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }, [])

  const loadVocabulary = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setNotice(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please sign in to review learned vocabulary.")
        return
      }

      const [learnedRes, favoritesRes] = await Promise.all([
        fetch(`${API_ROOT}/vocabulary/learned`, { headers: getAuthHeaders() }),
        fetch(`${API_ROOT}/vocabulary/favorites`, { headers: getAuthHeaders() }),
      ])

      const learnedJson = (await learnedRes.json()) as ApiResponse<BackendVocabulary[]>
      const favoritesJson = (await favoritesRes.json()) as ApiResponse<BackendVocabulary[]>

      if (!learnedRes.ok || !learnedJson.success) {
        throw new Error(learnedJson.message || "Cannot load learned vocabulary.")
      }

      if (!favoritesRes.ok || !favoritesJson.success) {
        throw new Error(favoritesJson.message || "Cannot load favorite vocabulary.")
      }

      const favorites = favoritesJson.data.map(mapVocabulary).map((word) => ({ ...word, isFavorite: true }))
      const favoriteIds = new Set(favorites.map((word) => word.id))

      setKnownWords(
        learnedJson.data.map(mapVocabulary).map((word) => ({
          ...word,
          isFavorite: word.isFavorite || favoriteIds.has(word.id),
        })),
      )
      setFavoriteWords(favorites)
    } catch (err) {
      console.error("Failed to load learned vocabulary:", err)
      setError(err instanceof Error ? err.message : "Cannot load learned vocabulary.")
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    loadVocabulary()
  }, [loadVocabulary])

  useEffect(() => {
    setSelectedUnit("all")
    setSearchQuery("")
  }, [activeTab])

  const currentWords = activeTab === "known" ? knownWords : favoriteWords

  const units = useMemo(() => ["all", ...Array.from(new Set(currentWords.map((word) => word.unit)))], [currentWords])

  const filteredWords = useMemo(
    () =>
      currentWords.filter((word) => {
        const normalizedSearch = searchQuery.toLowerCase()
        const matchesSearch =
          word.word.toLowerCase().includes(normalizedSearch) ||
          word.translation.toLowerCase().includes(normalizedSearch)
        const matchesUnit = selectedUnit === "all" || word.unit === selectedUnit
        return matchesSearch && matchesUnit
      }),
    [currentWords, searchQuery, selectedUnit],
  )

  const groupedWords = useMemo(() => {
    const groups = filteredWords.reduce(
      (acc, word) => {
        if (!acc[word.unit]) {
          acc[word.unit] = []
        }
        acc[word.unit].push(word)
        return acc
      },
      {} as Record<string, ReviewWord[]>,
    )

    Object.keys(groups).forEach((unit) => {
      groups[unit].sort((a, b) =>
        sortOrder === "asc" ? a.word.localeCompare(b.word) : b.word.localeCompare(a.word),
      )
    })

    return groups
  }, [filteredWords, sortOrder])

  const sortedUnits = useMemo(
    () =>
      Object.keys(groupedWords).sort((a, b) => {
        const numA = Number.parseInt(a.replace(/\D/g, "")) || 0
        const numB = Number.parseInt(b.replace(/\D/g, "")) || 0
        return numA - numB || a.localeCompare(b)
      }),
    [groupedWords],
  )

  const updateFavoriteState = (id: number, isFavorite: boolean) => {
    setKnownWords((prev) => prev.map((word) => (word.id === id ? { ...word, isFavorite } : word)))

    if (isFavorite) {
      const sourceWord = knownWords.find((word) => word.id === id) || favoriteWords.find((word) => word.id === id)
      if (sourceWord) {
        setFavoriteWords((prev) =>
          prev.some((word) => word.id === id) ? prev : [{ ...sourceWord, isFavorite: true }, ...prev],
        )
      }
    } else {
      setFavoriteWords((prev) => prev.filter((word) => word.id !== id))
    }
  }

  const setFavorite = async (id: number, isFavorite: boolean) => {
    setFavoriteActionId(id)
    setNotice(null)

    try {
      const res = await fetch(`${API_ROOT}/vocabulary/${id}/favorite`, {
        method: isFavorite ? "POST" : "DELETE",
        headers: getAuthHeaders(),
      })
      const json = (await res.json()) as ApiResponse<unknown>

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Cannot update favorite vocabulary.")
      }

      updateFavoriteState(id, isFavorite)
      setNotice(isFavorite ? "Added to favorite words." : "Removed from favorite words.")
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Cannot update favorite vocabulary.")
    } finally {
      setFavoriteActionId(null)
    }
  }

  const toggleFavorite = (word: ReviewWord) => {
    setFavorite(word.id, !word.isFavorite)
  }

  const handleUnfavorite = (id: number) => {
    setWordToRemove(id)
    setShowConfirmDialog(true)
  }

  const confirmUnfavorite = () => {
    if (wordToRemove !== null) {
      setFavorite(wordToRemove, false)
      setShowConfirmDialog(false)
      setWordToRemove(null)
    }
  }

  const handlePronounce = (word: ReviewWord) => {
    if (word.audioUrl) {
      new Audio(word.audioUrl).play().catch(() => undefined)
      return
    }

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
      </div>

      <Link
        href="/client/practice"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Vocabulary Review</h1>
          <p className="text-cyan-300 text-lg">Manage and review your learned vocabulary</p>
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
              <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">{knownWords.length}</span>
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

        {notice && (
          <div className="max-w-6xl mx-auto mb-4 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-3 text-center text-cyan-100">
            {notice}
          </div>
        )}

        <div className="max-w-6xl mx-auto mb-8 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <Input
                type="text"
                placeholder="Search vocabulary..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(event) => setSelectedUnit(event.target.value)}
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
                onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              >
                <option value="asc" className="bg-purple-900">
                  A to Z
                </option>
                <option value="desc" className="bg-purple-900">
                  Z to A
                </option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-8 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-white">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-300" />
              <p>Loading learned vocabulary...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="text-red-300 text-lg">{error}</p>
              <Link href="/sign-in">
                <Button className="bg-cyan-400 text-purple-900 hover:bg-cyan-500">Sign in</Button>
              </Link>
            </div>
          )}

          {!isLoading &&
            !error &&
            sortedUnits.map((unit) => (
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
                            src={word.image}
                            alt={word.word}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover w-[60px] h-[60px]"
                          />
                        </div>

                        <div className="flex-shrink-0 w-32">
                          <p className="text-lg font-bold text-white">{word.word}</p>
                        </div>

                        <div className="flex-shrink-0 w-40">
                          <p className="text-sm text-cyan-300">{word.phonetic || "-"}</p>
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
                          onClick={() => handlePronounce(word)}
                          className="flex-shrink-0 text-cyan-300 hover:text-cyan-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
                          aria-label="Pronounce word"
                        >
                          <Volume2 className="w-6 h-6" />
                        </button>

                        <button
                          disabled={favoriteActionId === word.id}
                          onClick={() => {
                            if (activeTab === "favorite") {
                              handleUnfavorite(word.id)
                            } else {
                              toggleFavorite(word)
                            }
                          }}
                          className={`flex-shrink-0 transition-colors p-2 hover:bg-white/10 rounded-lg disabled:opacity-60 ${
                            word.isFavorite ? "text-yellow-400 hover:text-yellow-300" : "text-gray-400 hover:text-gray-300"
                          }`}
                          aria-label="Favorite word"
                        >
                          {favoriteActionId === word.id ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <Star className={`w-6 h-6 ${word.isFavorite ? "fill-current" : ""}`} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {!isLoading && !error && filteredWords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">
                {activeTab === "known" ? "No learned words found" : "No favorite words found"}
              </p>
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

      {!isLoading && !error && filteredWords.length > 0 && (
        <Link
          href={activeTab === "favorite" ? "/client/flashcard?unit=favorite" : "/client/flashcard"}
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
