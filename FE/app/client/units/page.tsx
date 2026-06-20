"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Crown, Lock, Trophy, Loader2, Zap, X, ChevronRight } from "lucide-react"
import { CosmicBackground } from "@/components/cosmic-background"
import { getPlacementTopics, type PlacementTopic } from "@/lib/api/placement"

// --- CONFIG API ---
const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const API_ROOT = `${RAW_API.replace(/\/$/, "").replace(/\/api$/, "")}/api`

// --- PLACEMENT TEST TOPICS ARE LOADED FROM BACKEND ---
// --- TYPES ---
interface Unit {
  id: number | string;
  title: string;
  subtitle: string;
  icon: string;
  progress: number;
  total: number;
  unlocked: boolean;
  crown: number;
}

/** Backend GET /api/units dùng snake_case + is_unlocked; UI cần unlocked/progress/total/crown */
function mapUnitFromApi(raw: Record<string, unknown>): Unit {
  const total = Number(raw.total_lessons ?? raw.total ?? 5) || 5
  const progress = Number(raw.completed_lessons ?? raw.progress ?? 0) || 0
  const maxStars = Number(raw.max_stars ?? total * 3) || total * 3
  const starsEarned = Number(raw.stars_earned ?? 0) || 0
  let crown = 0
  if (maxStars > 0) {
    crown = Math.min(3, Math.round((starsEarned / maxStars) * 3))
  }
  const unlocked =
    raw.unlocked === true ||
    raw.is_unlocked === true ||
    raw.is_unlocked === 1

  return {
    id: raw.id as number | string,
    title: String(raw.title ?? `Unit ${raw.order_index ?? raw.id ?? ""}`),
    subtitle: String(raw.subtitle ?? ""),
    icon: String(raw.icon ?? "📘"),
    progress,
    total,
    unlocked,
    crown,
  }
}

interface Checkpoint {
  id: string;
  title: string;
  subtitle: string;
  afterUnit: number | string;
  unlocked: boolean;
  skipsUnits: number[];
}

export default function UnitsPage() {
  const router = useRouter()
  // Placement test popup state
  const [showPlacementPopup, setShowPlacementPopup] = useState(false)
  const [placementStep, setPlacementStep] = useState<"choice" | "topics">("choice")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [placementTopics, setPlacementTopics] = useState<PlacementTopic[]>([])
  const [placementTopicsLoading, setPlacementTopicsLoading] = useState(false)
  const [placementTopicsError, setPlacementTopicsError] = useState("")
  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const loadPlacementTopics = async () => {
    setPlacementTopicsLoading(true)
    setPlacementTopicsError("")
    try {
      const topics = await getPlacementTopics()
      setPlacementTopics(topics)
    } catch (error) {
      console.error("Failed to load placement topics:", error)
      setPlacementTopicsError("Could not load placement topics.")
    } finally {
      setPlacementTopicsLoading(false)
    }
  }

  const openPlacementPopup = () => {
    setShowPlacementPopup(true)
    setPlacementStep("choice")
    setSelectedTopics([])
    if (!placementTopics.length) {
      void loadPlacementTopics()
    }
  }

  const handleStartPlacementTest = () => {
    if (selectedTopics.length === 0) return
    const query = selectedTopics.length > 0 ? `?topics=${selectedTopics.join(",")}` : ""
    router.push(`/client/placement-test${query}`)
  }

  // State dữ liệu
  const [units, setUnits] = useState<Unit[]>([]);
  const [totalCrowns, setTotalCrowns] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredUnit, setHoveredUnit] = useState<number | string | null>(null)

  // Dữ liệu Checkpoint (Hiện tại giữ tĩnh vì logic này phức tạp, cần BE hỗ trợ riêng)
  const [checkpoints] = useState<Checkpoint[]>([
    {
      id: "checkpoint-1",
      title: "Checkpoint 1",
      subtitle: "Pass to skip Units 1-5",
      afterUnit: 5,
      unlocked: true, // Logic này sau này sẽ check dựa trên unit progress
      skipsUnits: [1, 2, 3, 4, 5],
    },
    {
      id: "checkpoint-2",
      title: "Checkpoint 2",
      subtitle: "Pass to skip Units 6-10",
      afterUnit: 10,
      unlocked: false,
      skipsUnits: [6, 7, 8, 9, 10],
    },
  ])

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
          router.push('/sign-in');
          return;
      }

      try {
        // 1. Lấy thông tin User (XP)
        const profileRes = await fetch(`${API_ROOT}/users/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            const d = profileData.data
            const xp =
              (typeof d?.xp === "number" ? d.xp : undefined) ??
              d?.progress?.total_xp ??
              0
            setTotalXP(Number(xp) || 0)
        }

        const unitsRes = await fetch(`${API_ROOT}/units`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });

        if (unitsRes.ok) {
            const result = await unitsRes.json();
            const rawList = Array.isArray(result.data) ? result.data : []
            const fetchedUnits = rawList.map((u: Record<string, unknown>) =>
              mapUnitFromApi(u)
            )
            setUnits(fetchedUnits)

            const crowns = fetchedUnits.reduce(
              (acc: number, unit: Unit) => acc + (unit.crown || 0),
              0
            )
            setTotalCrowns(crowns)
        } else {
            // FALLBACK: Nếu chưa có API, dùng dữ liệu mẫu để UI không bị trắng
            console.warn("API /api/units not found. Using mock data.");
            setUnits(MOCK_UNITS); 
            setTotalCrowns(4);
        }

      } catch (error) {
        console.error("Error fetching learning path:", error);
        setUnits(MOCK_UNITS); // Fallback khi lỗi mạng
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleUnitClick = (unit: any, isCheckpoint = false) => {
    if (unit.unlocked) {
      if (isCheckpoint) {
        router.push(`/client/checkpoint/${unit.id}`)
      } else {
        router.push(`/client/units/${unit.id}/lessons`)
      }
    }
  }

  if (isLoading) {
      return (
        <div className="min-h-screen relative flex items-center justify-center bg-black">
             <CosmicBackground />
             <div className="z-10 text-white flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
                <p className="text-xl font-medium">Loading your journey...</p>
             </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      <Link
        href="/client"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Space Adventure</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full">
                <Crown className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-bold">{totalCrowns}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <span className="text-cyan-400 font-bold">{totalXP} XP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="overflow-x-auto min-h-[500px] pt-18 pb-18 scrollbar-hide w-full">
            <div className="flex items-start px-8 gap-8 min-w-max">
              {units.map((unit, index) => {
                const checkpoint = checkpoints.find((cp) => cp.afterUnit === unit.id)
                const isCheckpointPosition = checkpoint !== undefined

                return (
                  <div key={unit.id} className="relative flex flex-col items-center">
                    <button
                      onClick={() => handleUnitClick(unit)}
                      disabled={!unit.unlocked}
                      onMouseEnter={() => setHoveredUnit(unit.id)}
                      onMouseLeave={() => setHoveredUnit(null)}
                      className={`relative group ${unit.unlocked ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      <div
                        className={`w-32 h-32 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
                          unit.unlocked
                            ? "bg-gradient-to-br from-cyan-400 to-blue-500 hover:scale-110 shadow-lg shadow-cyan-500/50"
                            : "bg-gray-600/50 backdrop-blur-sm"
                        } border-4 ${unit.unlocked ? "border-white/30" : "border-gray-700/50"}`}
                      >
                        {unit.unlocked ? (
                          <div className="text-5xl">{unit.icon}</div>
                        ) : (
                          <Lock className="h-12 w-12 text-gray-400" />
                        )}
                      </div>

                      <div className="mt-3 text-center max-w-[8.5rem] mx-auto">
                        <p className="text-white/90 text-xs font-semibold line-clamp-2 px-0.5">
                          {unit.title}
                        </p>
                        {unit.subtitle ? (
                          <p className="text-white/50 text-[10px] mt-0.5 line-clamp-2">
                            {unit.subtitle}
                          </p>
                        ) : null}
                        {hoveredUnit === unit.id && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-50">
                            <p className="font-bold">{unit.title}</p>
                            <p className="text-cyan-300 text-sm">{unit.subtitle}</p>
                          </div>
                        )}

                        {unit.unlocked && (
                          <div className="mt-2">
                            <div className="flex justify-center gap-1 mb-1">
                              {[...Array(3)].map((_, i) => (
                                <Crown
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < unit.crown ? "text-yellow-400 fill-yellow-400" : "text-gray-400"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="w-32 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500"
                                style={{
                                  width: `${(unit.progress / unit.total) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-white/70 text-xs mt-1">
                              {unit.progress}/{unit.total}
                            </p>
                          </div>
                        )}
                        {!unit.unlocked && (
                          <div className="mt-2 flex justify-center">
                            <Crown className="h-4 w-4 text-yellow-400/50" />
                          </div>
                        )}
                      </div>
                    </button>

                    {isCheckpointPosition && checkpoint && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-1 h-16 bg-gradient-to-b from-cyan-400/50 to-yellow-400/50" />

                        <button
                          onClick={() => handleUnitClick(checkpoint, true)}
                          disabled={!checkpoint.unlocked}
                          onMouseEnter={() => setHoveredUnit(checkpoint.id)}
                          onMouseLeave={() => setHoveredUnit(null)}
                          className={`relative group ${checkpoint.unlocked ? "cursor-pointer" : "cursor-not-allowed"}`}
                        >
                          <div
                            className={`w-32 h-32 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
                              checkpoint.unlocked
                                ? "bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-110 shadow-lg shadow-yellow-500/50"
                                : "bg-gray-600/50 backdrop-blur-sm"
                            } border-4 ${checkpoint.unlocked ? "border-white/30" : "border-gray-700/50"}`}
                          >
                            <Trophy className={`h-12 w-12 ${checkpoint.unlocked ? "text-white" : "text-gray-400"}`} />
                          </div>

                          {hoveredUnit === checkpoint.id && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gray-900/90 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-50">
                              <p className="font-bold">{checkpoint.title}</p>
                              <p className="text-yellow-300 text-sm">{checkpoint.subtitle}</p>
                            </div>
                          )}
                        </button>
                      </div>
                    )}

                    {index < units.length - 1 && (
                      <div className="absolute top-16 left-full w-8 h-1 bg-gradient-to-r from-cyan-400/50 to-transparent" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

            {/* Placement Test FAB */}
      <div className="fixed bottom-16 right-16 z-40">
        <button
          onClick={openPlacementPopup}
          className="group relative w-32 h-32 transition-transform duration-200 hover:scale-110"
          aria-label="Placement Test"
        >
          <img
            src="/mascot-frame-1.png"
            alt="Placement Test"
            className="w-full h-full object-contain group-hover:opacity-0 transition-opacity duration-150"
          />
          <img
            src="/mascot-frame-2.png"
            alt="Placement Test"
            className="w-full h-full object-contain absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          />

          {/* Tooltip */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-sky-100 text-cyan-800 text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-lg border border-purple-200">
            Ask for planning
          </div>
        </button>
      </div>

      {/* Placement Popup */}
      {showPlacementPopup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowPlacementPopup(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4">
            <div className="bg-sky-200/95 border border-sky-300 rounded-2xl shadow-2xl overflow-hidden">

              {/* Close */}
              <button
                onClick={() => setShowPlacementPopup(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-sky-300/50 hover:bg-sky-300 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-sky-800" />
              </button>

              {placementStep === "choice" && (
                <div className="p-6">
                  <h2 className="text-sky-950 font-bold text-lg mb-1">Choose a direction</h2>
                  <p className="text-sky-700 text-xs mb-5">Select the path that best fits your English level.</p>

                  {/* Option 1 */}
                  <button
                    onClick={() => { setShowPlacementPopup(false); router.push("/client/units") }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 border border-sky-300 hover:border-sky-400 transition-all mb-3 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                      <span className="text-2xl">🌱</span>
                    </div>
                    <div>
                      <p className="text-sky-950 font-semibold text-sm leading-snug">Are you a Beginner?</p>
                      <p className="text-sky-700 text-xs mt-0.5">Start here at the Basics</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sky-500 ml-auto shrink-0" />
                  </button>

                  {/* Option 2 */}
                  <button
                    onClick={() => setPlacementStep("topics")}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 border border-sky-300 hover:border-blue-400 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-2xl">🎓</span>
                    </div>
                    <div>
                      <p className="text-sky-950 font-semibold text-sm leading-snug">Not a Beginner?</p>
                      <p className="text-sky-700 text-xs mt-0.5">Try this Placement Test</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sky-500 ml-auto shrink-0" />
                  </button>
                </div>
              )}

              {placementStep === "topics" && (
                <div className="p-6">
                  <button
                    onClick={() => setPlacementStep("choice")}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-800 text-xs mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                  <h2 className="text-sky-950 font-bold text-lg mb-1">Choose Topics you know</h2>
                  <p className="text-sky-700 text-xs mb-4">Select all topics you are already familiar with.</p>

                  <div className="grid grid-cols-2 gap-2 mb-5 max-h-64 overflow-y-auto pr-1">
                    {placementTopicsLoading && (
                      <div className="col-span-2 flex items-center justify-center py-8 text-sky-800">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-xs font-semibold">Loading topics...</span>
                      </div>
                    )}

                    {!placementTopicsLoading && placementTopicsError && (
                      <button
                        onClick={loadPlacementTopics}
                        className="col-span-2 px-3 py-3 rounded-xl text-xs font-semibold border-2 border-red-200 bg-red-50 text-red-700"
                      >
                        {placementTopicsError} Try again
                      </button>
                    )}

                    {!placementTopicsLoading && !placementTopicsError && placementTopics.map((topic) => {
                      const active = selectedTopics.includes(topic.slug)
                      return (
                        <button
                          key={topic.slug}
                          onClick={() => toggleTopic(topic.slug)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all text-left
                            ${active
                              ? "border-blue-500 bg-blue-100 text-blue-900"
                              : "border-sky-300 bg-white/70 text-sky-800 hover:border-blue-400 hover:bg-white/90"
                            }`}
                        >
                          <span className="block font-semibold">{topic.name}</span>
                          {topic.unit_order ? (
                            <span className="block text-[10px] opacity-70 mt-0.5">Unit {topic.unit_order}</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={handleStartPlacementTest}
                    disabled={selectedTopics.length === 0 || placementTopicsLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Placement Test
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// --- MOCK DATA (Dùng làm Fallback khi chưa có API) ---
const MOCK_UNITS = [
  { id: 1, title: "Unit 1", subtitle: "Greetings & Basics", icon: "🌍", progress: 15, total: 15, unlocked: true, crown: 3 },
  { id: 2, title: "Unit 2", subtitle: "Family & Friends", icon: "👨‍👩‍👧‍👦", progress: 6, total: 15, unlocked: true, crown: 1 },
  { id: 3, title: "Unit 3", subtitle: "Food & Drinks", icon: "🍕", progress: 0, total: 15, unlocked: false, crown: 0 },
  { id: 4, title: "Unit 4", subtitle: "Travel & Places", icon: "✈️", progress: 0, total: 15, unlocked: false, crown: 0 },
  { id: 5, title: "Unit 5", subtitle: "Shopping", icon: "🛍️", progress: 0, total: 15, unlocked: false, crown: 0 },
];
