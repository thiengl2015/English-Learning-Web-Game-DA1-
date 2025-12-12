"use client"

import { useState } from "react"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CosmicBackground } from "@/components/cosmic-background"

export default function AssistantPage() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  const userName = "Odixee"

  const suggestions = ["Tạo hội thoại theo chủ đề trường học", "Từ vựng topic gia đình", "Community nghĩa là gì?"]

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { role: "user", content: message }])
      setMessage("")
      // TODO: Integrate AI response here
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      {/* Back to Menu Button */}
      <Link
        href="/client"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Menu</span>
      </Link>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Greeting Section */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white">Hi, {userName}!</h1>
            <p className="text-xl text-cyan-300">How can I help you?</p>
          </div>

          {/* Chat Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
            {/* Messages Display Area */}
            {messages.length > 0 && (
              <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                        msg.role === "user" ? "bg-cyan-500 text-white" : "bg-white/20 text-white"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage()
                  }
                }}
                placeholder="Ask Techdies something"
                className="w-full bg-white/5 border-white/20 text-white placeholder:text-gray-300 rounded-2xl pr-12 h-14 text-lg focus-visible:!border-white/80 focus-visible:!ring-white/50"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-3 justify-center">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setMessage(suggestion)}
                className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:border-cyan-400 transition-all duration-300 shadow-lg text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
