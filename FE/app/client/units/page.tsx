"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Crown, Lock, Trophy, Loader2 } from "lucide-react"
import { CosmicBackground } from "@/components/cosmic-background"

// --- CONFIG API ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
        const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            setTotalXP(profileData.data.xp || 0); // Giả sử API trả về field xp
        }

        // 2. Lấy danh sách Unit và Tiến độ (API Này Cần Backend Viết Thêm)
        const unitsRes = await fetch(`${API_BASE_URL}/api/units`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });

        if (unitsRes.ok) {
            const result = await unitsRes.json();
            const fetchedUnits = result.data; // Giả sử trả về mảng units
            setUnits(fetchedUnits);
            
            // Tính tổng vương miện từ các unit đã học
            const crowns = fetchedUnits.reduce((acc: number, unit: Unit) => acc + (unit.crown || 0), 0);
            setTotalCrowns(crowns);
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

                      <div className="mt-3 text-center">
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