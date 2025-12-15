"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CosmicBackground } from "@/components/cosmic-background"

export default function ClientFeedbackPage() {
  const [feedbackType, setFeedbackType] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [message, setMessage] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // TODO: Here you would send the feedback to the backend/database
    const feedbackData = {
      type: feedbackType,
      rating: rating,
      message: message,
      date: new Date().toISOString().split("T")[0],
      status: "unread",
    }

    console.log("Feedback submitted:", feedbackData)

    // Show success message
    setIsSubmitted(true)

    // Reset form after 2 seconds
    setTimeout(() => {
      setFeedbackType("")
      setRating(0)
      setMessage("")
      setIsSubmitted(false)
    }, 2000)
  }

  const isFormValid = feedbackType !== "" && rating > 0 && message.trim() !== ""

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
              Send Feedback
            </h1>
            <p className="text-cyan-300 text-lg">Help us improve your learning experience</p>
          </div>

          {/* Feedback Form */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Thank You!</h2>
                <p className="text-white/80">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Feedback Type */}
                <div>
                  <label className="block text-white mb-2 text-lg">Feedback Type</label>
                  <Select value={feedbackType} onValueChange={setFeedbackType}>
                    <SelectTrigger className="w-full bg-white/20 border-white/30 text-white backdrop-blur-sm h-12 text-base">
                      <SelectValue placeholder="Select feedback type" className="text-cyan-300" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Review" className="text-white hover:bg-slate-700">
                        Review
                      </SelectItem>
                      <SelectItem value="Suggestion" className="text-white hover:bg-slate-700">
                        Suggestion
                      </SelectItem>
                      <SelectItem value="Bug Report" className="text-white hover:bg-slate-700">
                        Bug Report
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-white font-semibold mb-3 text-lg">Rating</label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-all duration-200 hover:scale-110"
                      >
                        <Star
                          className={`w-12 h-12 ${
                            star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-white/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-center text-white/80 mt-2">
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-white font-semibold mb-2 text-lg">Your Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think..."
                    className="min-h-32 bg-white/20 border-white/30 text-white placeholder:text-white/50 backdrop-blur-sm resize-none text-base"
                  />
                  <p className="text-white/60 text-sm mt-2">{message.length}/500 characters</p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full bg-gradient-to-br from-green-300 to-cyan-300 text-purple-800 shadow-lg hover:shadow-cyan-500/50 px-12 py-6 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
