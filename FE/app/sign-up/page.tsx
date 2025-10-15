"use client"

import { CosmicBackground } from "@/components/cosmic-background"
import { RobotMascot } from "@/components/robot-mascot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Mail, Lock, Eye, User } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <CosmicBackground />

      <Card className="relative w-full max-w-md bg-white/98 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden">
        {/* Header with Robot */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 px-8 py-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `pulse ${2 + Math.random() * 2}s infinite`,
                }}
              />
            ))}
          </div>
            <Link href="/" className="text-white/90 text-sm mb-4 relative z-10">
            Welcome to <span className="font-bold text-cyan-300">TECHDIES</span>
            </Link>
          <RobotMascot className="relative z-10" />
        </div>

        {/* Form */}
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-900">REGISTER</h1>

          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                User Name:
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="User name"
                  className="pl-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email:
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  className="pl-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password:
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-700 font-medium">
                Confirm password:
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Your password"
                  className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500 cursor-pointer" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-white text-cyan-500 border-2 border-cyan-500 hover:bg-cyan-50 font-bold text-lg rounded-xl mt-6"
            >
              Sign Up
            </Button>

            <div className="text-center">
              <Link href="/sign-in" className="text-cyan-500 hover:text-cyan-600 font-medium">
                Back to Log-in
              </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
