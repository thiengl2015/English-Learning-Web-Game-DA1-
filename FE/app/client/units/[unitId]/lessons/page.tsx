'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Crown, Star, FastForward, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button' 

// --- CẤU HÌNH API ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface Lesson {
  id: number | string;
  title: string;
  type: 'vocabulary' | 'practice' | 'test';
  completed: boolean;
  stars: number;
  position: { x: number; y: number }; // Field này FE tự tính toán
  is_unlocked?: boolean;
}

// --- VỊ TRÍ CỐ ĐỊNH TRÊN BẢN ĐỒ (FE TỰ QUY ĐỊNH) ---
const MAP_POSITIONS = [
  { x: 15, y: 70 }, // Bài 1
  { x: 30, y: 45 }, // Bài 2
  { x: 50, y: 50 }, // Bài 3
  { x: 70, y: 30 }, // Bài 4
  { x: 85, y: 35 }, // Bài 5 (Test)
  // Thêm các vị trí dự phòng nếu Unit có nhiều hơn 5 bài
  { x: 80, y: 60 },
  { x: 60, y: 75 },
];

export default function LessonsPage() {
  const params = useParams()
  const unitId = params.unitId as string
  const router = useRouter()
  
  // State quản lý dữ liệu và loading
  const [currentLessons, setCurrentLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // --- HÀM GỌI API ---
  useEffect(() => {
    const fetchLessons = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Nếu chưa đăng nhập, đá về trang login
        // router.push('/sign-in'); 
        // return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/units/${unitId}/lessons`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          const apiLessons = result.data; // Giả sử API trả về mảng lessons

          // Map dữ liệu API vào UI: Gán vị trí (x, y) dựa trên index
          const mappedLessons = apiLessons.map((lesson: any, index: number) => ({
            ...lesson,
            // Nếu hết vị trí mẫu thì dùng vị trí mặc định giữa màn hình
            position: MAP_POSITIONS[index] || { x: 50, y: 50 } 
          }));

          setCurrentLessons(mappedLessons);
        } else {
          console.error("Failed to fetch lessons");
          // Fallback data nếu API lỗi
          setCurrentLessons(MOCK_LESSONS);
        }
      } catch (error) {
        console.error("Network error:", error);
        setCurrentLessons(MOCK_LESSONS);
      } finally {
        setIsLoading(false);
      }
    };

    if (unitId) {
      fetchLessons();
    }
  }, [unitId, router]);

  // Logic kiểm tra mở khóa: Bài 1 luôn mở, các bài sau mở khi bài trước hoàn thành
  const isLessonUnlocked = (index: number) => {
    if (index === 0) return true;
    return currentLessons[index - 1]?.completed;
  }

  const handleLessonClick = (lesson: Lesson, index: number) => {
    if (isLessonUnlocked(index)) {
      router.push(`/client/units/${unitId}/lessons/${lesson.id}`)
    }
  }

  const handleChallengeTest = () => {
    router.push(`/client/units/${unitId}/challenge`)
  }

  // --- UI LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center">
         <div className="text-white flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
            <p className="text-xl font-medium">Loading map...</p>
         </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Space Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-300 to-blue-400 opacity-40 blur-3xl" />
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-60" />
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Back Button */}
      <Link
        href="/client/units"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Units</span>
      </Link>

      <button
        onClick={handleChallengeTest}
        className="fixed bottom-16 right-16 z-50 flex items-center gap-2 px-5 py-3 bg-cyan-300/90 backdrop-blur-md rounded-full border border-cyan-200/50 hover:bg-cyan-400 hover:scale-105 transition-all duration-300 shadow-lg shadow-cyan-400/30"
      >
        <FastForward className="w-5 h-5 text-purple-700" />
        <span className="text-purple-700 font-medium">Challenge Test</span>
      </button>

      {/* Lessons Path */}
      <div className="relative w-full h-screen">
        {/* Connection paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {currentLessons.slice(0, -1).map((lesson, index) => {
            const nextLesson = currentLessons[index + 1]
            return (
              <line
                key={`path-${lesson.id}`}
                x1={`${lesson.position.x}%`}
                y1={`${lesson.position.y}%`}
                x2={`${nextLesson.position.x}%`}
                y2={`${nextLesson.position.y}%`}
                stroke="url(#pathGradient)"
                strokeWidth="4"
                strokeDasharray="10,5"
                className="animate-pulse"
              />
            )
          })}
        </svg>

        {/* Lesson Nodes */}
        {currentLessons.map((lesson, index) => {
          const unlocked = isLessonUnlocked(index)
          
          return (
            <div
              key={lesson.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${lesson.position.x}%`,
                top: `${lesson.position.y}%`,
              }}
            >
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleLessonClick(lesson, index)}
                  disabled={!unlocked}
                  className={`relative group ${
                    unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  {/* Stars decoration */}
                  {lesson.completed && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
                      {[...Array(lesson.stars || 3)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-6 w-6 text-yellow-400 fill-yellow-400 drop-shadow-lg animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Lesson Circle */}
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-300 ${
                      lesson.completed
                        ? 'bg-gradient-to-br from-orange-400 to-yellow-500 shadow-lg shadow-orange-500/50 hover:scale-110'
                        : unlocked
                        ? 'bg-gradient-to-br from-orange-400 to-yellow-500 shadow-lg shadow-orange-500/50 hover:scale-110 animate-pulse'
                        : 'bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-500/30'
                    } border-4 ${
                      unlocked ? 'border-white' : 'border-purple-900'
                    }`}
                  >
                    <span className="text-white drop-shadow-lg">
                      {index + 1}
                    </span>
                  </div>

                  {/* Platform base */}
                  <div
                    className={`mt-2 w-28 h-8 rounded-full ${
                      unlocked
                        ? 'bg-gradient-to-b from-gray-700 to-gray-900'
                        : 'bg-gradient-to-b from-gray-800 to-black'
                    } border-2 ${
                      unlocked ? 'border-cyan-400' : 'border-purple-900'
                    } shadow-xl flex items-center justify-center`}
                  >
                    {lesson.completed && (
                      <div className="text-cyan-400">
                        {/* Check icon */}
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                <p className="mt-2 text-white font-semibold text-sm drop-shadow-lg">
                  {lesson.title}
                </p>

                {!lesson.completed && unlocked && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                    <Crown className="h-5 w-5 text-yellow-400 animate-bounce" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Fallback data dùng khi API lỗi hoặc chưa có Backend
const MOCK_LESSONS: Lesson[] = [
  { id: 1, title: 'Intro Vocab 1', type: 'vocabulary', completed: true, stars: 3, position: { x: 15, y: 70 } },
  { id: 2, title: 'Practice 1', type: 'practice', completed: true, stars: 3, position: { x: 30, y: 45 } },
  { id: 3, title: 'Intro Vocab 2', type: 'vocabulary', completed: false, stars: 0, position: { x: 50, y: 50 } },
  { id: 4, title: 'Practice 2', type: 'practice', completed: false, stars: 0, position: { x: 70, y: 30 } },
  { id: 5, title: 'Final Test', type: 'test', completed: false, stars: 0, position: { x: 85, y: 35 } },
];