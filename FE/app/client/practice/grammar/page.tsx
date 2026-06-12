"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, BookOpen, Layers, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAllGrammar, getLearnedGrammar, type GrammarItem } from "@/lib/api/grammar"

type GrammarTab = "learned" | "all"

export default function GrammarReviewPage() {
  const [activeTab, setActiveTab] = useState<GrammarTab>("learned")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [allGrammar, setAllGrammar] = useState<GrammarItem[]>([])
  const [learnedGrammar, setLearnedGrammar] = useState<GrammarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGrammar = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please sign in to review grammar.")
        return
      }
      const [all, learned] = await Promise.all([getAllGrammar(), getLearnedGrammar()])
      setAllGrammar(all)
      setLearnedGrammar(learned)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load grammar.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGrammar()
  }, [loadGrammar])

  useEffect(() => {
    setSelectedGroup("all")
    setSearchQuery("")
  }, [activeTab])

  const currentList = activeTab === "learned" ? learnedGrammar : allGrammar

  // "Tổng hợp" nhóm theo loại ngữ pháp; "Đã học" nhóm theo unit.
  const groupKey = useCallback(
    (item: GrammarItem) =>
      activeTab === "all"
        ? item.grammar_type || "Khác"
        : item.unit?.title || (item.unit?.id ? `Unit ${item.unit.id}` : "Khác"),
    [activeTab],
  )

  const groupOptions = useMemo(
    () => ["all", ...Array.from(new Set(currentList.map(groupKey)))],
    [currentList, groupKey],
  )

  const filtered = useMemo(
    () =>
      currentList.filter((item) => {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          item.name.toLowerCase().includes(q) ||
          item.formula.toLowerCase().includes(q) ||
          item.usage.toLowerCase().includes(q)
        const matchesGroup = selectedGroup === "all" || groupKey(item) === selectedGroup
        return matchesSearch && matchesGroup
      }),
    [currentList, searchQuery, selectedGroup, groupKey],
  )

  const grouped = useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        const key = groupKey(item)
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
      },
      {} as Record<string, GrammarItem[]>,
    )
  }, [filtered, groupKey])

  const sortedGroups = useMemo(() => Object.keys(grouped).sort((a, b) => a.localeCompare(b)), [grouped])

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
          <h1 className="text-5xl font-bold text-white mb-4">Grammar Review</h1>
          <p className="text-cyan-300 text-lg">Review and look up your grammar</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("learned")}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === "learned"
                ? "bg-cyan-400 text-purple-900 shadow-lg shadow-cyan-400/50"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Ngữ pháp đã học</span>
              <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">{learnedGrammar.length}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === "all"
                ? "bg-cyan-400 text-purple-900 shadow-lg shadow-cyan-400/50"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              <span>Ngữ pháp tổng hợp</span>
              <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">{allGrammar.length}</span>
            </div>
          </button>
        </div>

        <div className="max-w-6xl mx-auto mb-8 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <Input
                type="text"
                placeholder="Search grammar..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(event) => setSelectedGroup(event.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              >
                {groupOptions.map((group) => (
                  <option key={group} value={group} className="bg-purple-900">
                    {group === "all" ? (activeTab === "all" ? "All Types" : "All Units") : group}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-white">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-300" />
              <p>Loading grammar...</p>
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
            sortedGroups.map((group) => (
              <div key={group} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-cyan-300 mb-4">{group}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {grouped[group].map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/10 rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="text-lg font-bold text-white">{item.name}</h4>
                        {item.unit?.title && (
                          <span className="flex-shrink-0 text-xs px-3 py-1 rounded-full bg-purple-500/30 text-purple-100 border border-purple-400/30">
                            {item.unit.title}
                          </span>
                        )}
                      </div>

                      {item.formula && (
                        <div className="mb-3">
                          <p className="text-xs uppercase tracking-wide text-cyan-300/70 mb-1">Công thức</p>
                          <code className="block text-cyan-200 font-mono bg-black/30 rounded-lg px-3 py-2 text-sm">
                            {item.formula}
                          </code>
                        </div>
                      )}

                      {item.usage && (
                        <div className="mb-3">
                          <p className="text-xs uppercase tracking-wide text-cyan-300/70 mb-1">Cách dùng</p>
                          <p className="text-white/90 text-sm">{item.usage}</p>
                        </div>
                      )}

                      {item.example && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-cyan-300/70 mb-1">Ví dụ minh hoạ</p>
                          <p className="text-white/80 text-sm italic">{item.example}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">
                {activeTab === "learned"
                  ? "Bạn chưa học ngữ pháp nào. Hãy hoàn thành các bài học để mở khoá."
                  : "Chưa có ngữ pháp nào trong hệ thống."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
