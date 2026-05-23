"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

interface PracticeDetailStateProps {
  backHref: string
  message: string
  showSignIn?: boolean
}

export function PracticeDetailState({ backHref, message, showSignIn = false }: PracticeDetailStateProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />
      <Link
        href={backHref}
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-6 text-center">
          <p className="text-white/75">{message}</p>
          {showSignIn && (
            <Link href="/sign-in" className="inline-flex mt-4 px-5 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold">
              Go to sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
