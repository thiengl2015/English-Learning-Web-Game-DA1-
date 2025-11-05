"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export function SiteHeader() {
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToAbout = (e: React.MouseEvent) => {
    e.preventDefault()
    const aboutSection = document.getElementById("about")
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Logo size={40} />
          <span className="w-36 justify-center text-cyan-300 text-2xl font-normal font-['DFVN_Obelix_Pro']">
            TECHDIES
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          <button onClick={scrollToTop} className="text-white hover:text-cyan-300 transition-colors font-medium">
            Home
          </button>
          <button onClick={scrollToAbout} className="text-white hover:text-cyan-300 transition-colors font-medium">
            About us
          </button>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="bg-white/10 text-white/90 border-white/40 hover:bg-white/20 font-medium backdrop-blur-sm rounded-lg"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild className="bg-white text-sky-900 hover:bg-sky-100 font-semibold rounded-lg">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
