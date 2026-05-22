"use client"

import { ArrowLeft, BookOpen, HelpCircle, Headphones, Mic, BookText } from "lucide-react"
import Link from "next/link"
import { GalaxyBackground } from "@/components/galaxy3-background"

const PRACTICE_OPTIONS = [
  {
    id: "vocabulary",
    title: "Vocabulary Review",
    description: "Review vocabulary by Flashcard",
    icon: BookOpen,
    href: "/client/practice/vocabulary",
    shadowColor: "shadow-cyan-400/30",
  },
  {
    id: "read-answer",
    title: "Read and Answer the Question",
    description: "Improve reading comprehension skills",
    icon: HelpCircle,
    href: "/client/practice/true-false",
    shadowColor: "shadow-cyan-400/30",
  },
  {
    id: "listen-fill",
    title: "Listen and Fill in the Blank",
    description: "Practice listening and writing skills",
    icon: Headphones,
    href: "/client/practice/listen-fill",
    shadowColor: "shadow-cyan-400/30",
  },
  {
    id: "listen-repeat",
    title: "Listen and Repeat",
    description: "Improve pronunciation and speaking",
    icon: Mic,
    href: "/client/practice/listen-repeat",
    shadowColor: "shadow-cyan-400/30",
  },
  {
    id: "read-story",
    title: "Read a Story",
    description: "Enjoy reading stories for practice",
    icon: BookText,
    href: "/client/practice/read-story",
    shadowColor: "shadow-cyan-400/30",
  },
]

export default function PracticePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <GalaxyBackground />

      {/* Decorative blur orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Back Button */}
      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Practice</h1>
          <p className="text-cyan-300 text-lg">Choose a practice mode to improve your skills</p>
        </div>

        {/* Practice Options */}
        <div className="w-full max-w-2xl space-y-4">
          {PRACTICE_OPTIONS.map((option, index) => {
            const IconComponent = option.icon
            return (
              <Link
                key={option.id}
                href={option.href}
                className={`flex items-center gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] ${option.shadowColor} hover:shadow-lg border border-white/10 group`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 flex items-center justify-center`}
                >
                  <IconComponent className="w-8 h-8 text-white group-hover:text-cyan-300 transition-colors" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-cyan-200/70 text-sm">{option.description}</p>
                </div>

                {/* Arrow indicator */}
                <div className="text-cyan-200/70 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
