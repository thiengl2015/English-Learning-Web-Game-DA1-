'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import Image from 'next/image'
import { ArrowLeft, Crown, Lock, Trophy } from 'lucide-react'
import { CosmicBackground } from '@/components/cosmic-background'

const regularUnits = [
  {
    id: 1,
    title: 'Unit 1',
    subtitle: 'Greetings & Basics',
    icon: '🌍',
    progress: 15,
    total: 15,
    unlocked: true,
    crown: 3,
  },
  {
    id: 2,
    title: 'Unit 2',
    subtitle: 'Family & Friends',
    icon: '👨‍👩‍👧‍👦',
    progress: 6,
    total: 15,
    unlocked: true,
    crown: 1,
  },
  {
    id: 3,
    title: 'Unit 3',
    subtitle: 'Food & Drinks',
    icon: '🍕',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 4,
    title: 'Unit 4',
    subtitle: 'Travel & Places',
    icon: '✈️',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 5,
    title: 'Unit 5',
    subtitle: 'Shopping',
    icon: '🛍️',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 6,
    title: 'Unit 6',
    subtitle: 'Work & Study',
    icon: '💼',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 7,
    title: 'Unit 7',
    subtitle: 'Health & Body',
    icon: '🏥',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 8,
    title: 'Unit 8',
    subtitle: 'Sports & Hobbies',
    icon: '⚽',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 9,
    title: 'Unit 9',
    subtitle: 'Weather & Nature',
    icon: '🌤️',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 10,
    title: 'Unit 10',
    subtitle: 'Technology',
    icon: '💻',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 11,
    title: 'Unit 11',
    subtitle: 'Arts & Culture',
    icon: '🎨',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
  {
    id: 12,
    title: 'Unit 12',
    subtitle: 'Advanced Topics',
    icon: '🚀',
    progress: 0,
    total: 15,
    unlocked: false,
    crown: 0,
  },
]

const checkpoints = [
  {
    id: 'checkpoint-1',
    title: 'Checkpoint 1',
    subtitle: 'Pass to skip Units 1-5',
    afterUnit: 5,
    unlocked: true,
    skipsUnits: [1, 2, 3, 4, 5],
  },
  {
    id: 'checkpoint-2',
    title: 'Checkpoint 2',
    subtitle: 'Pass to skip Units 6-10',
    afterUnit: 10,
    unlocked: true,
    skipsUnits: [6, 7, 8, 9, 10],
  },
]

export default function UnitsPage() {
  const router = useRouter()
  const [totalCrowns] = useState(3)
  const [totalGems] = useState(213)
  const [hoveredUnit, setHoveredUnit] = useState<number | string | null>(null)

  const handleUnitClick = (unit: any, isCheckpoint: boolean = false) => {
    if (unit.unlocked) {
      if (isCheckpoint) {
        router.push(`/client/checkpoint/${unit.id}`)
      } else {
        router.push(`/client/units/${unit.id}/lessons`)
      }
    }
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
                <div className="scale-110 flex items-center gap-2 text-cyan-400">
                  <Image
                    src="/crystal-currency.png"
                    alt="Crystal Currency"
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                  />
                </div>
                <span className="text-cyan-400 font-bold">{totalGems}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="overflow-x-auto min-h-[500px] pt-18 pb-18 scrollbar-hide w-full">
            <div className="flex items-start px-8 gap-8 min-w-max">
              {regularUnits.map((unit, index) => {
                const checkpoint = checkpoints.find(cp => cp.afterUnit === unit.id)
                const isCheckpointPosition = checkpoint !== undefined
                
                return (
                  <div key={unit.id} className="relative flex flex-col items-center">
                    <button
                      onClick={() => handleUnitClick(unit)}
                      disabled={!unit.unlocked}
                      onMouseEnter={() => setHoveredUnit(unit.id)}
                      onMouseLeave={() => setHoveredUnit(null)}
                      className={`relative group ${
                        unit.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                      }`}
                    >
                      <div
                        className={`w-32 h-32 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
                          unit.unlocked
                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 hover:scale-110 shadow-lg shadow-cyan-500/50'
                            : 'bg-gray-600/50 backdrop-blur-sm'
                        } border-4 ${
                          unit.unlocked ? 'border-white/30' : 'border-gray-700/50'
                        }`}
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
                                    i < unit.crown
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-400'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="w-32 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500"
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
                          className={`relative group ${
                            checkpoint.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                          }`}
                        >
                          <div
                            className={`w-32 h-32 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
                              checkpoint.unlocked
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-110 shadow-lg shadow-yellow-500/50'
                                : 'bg-gray-600/50 backdrop-blur-sm'
                            } border-4 ${
                              checkpoint.unlocked ? 'border-white/30' : 'border-gray-700/50'
                            }`}
                          >
                            <Trophy
                              className={`h-12 w-12 ${
                                checkpoint.unlocked ? 'text-white' : 'text-gray-400'
                              }`}
                            />
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

                    {index < regularUnits.length - 1 && (
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
