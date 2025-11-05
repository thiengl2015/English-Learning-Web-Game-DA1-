"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Mail, Volume2, Music, Sun, Moon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { CosmicBackground } from "@/components/cosmic-background"

export default function SettingsPage() {
  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailReminders, setEmailReminders] = useState(true)

  // Sound settings
  const [soundEffects, setSoundEffects] = useState(true)
  const [backgroundMusic, setBackgroundMusic] = useState(true)
  const [musicVolume, setMusicVolume] = useState([70])
  const [audioVolume, setAudioVolume] = useState([80])

  // Display settings
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      {/* Back button */}
      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Settings & Preferences</h1>
            <p className="text-cyan-200 text-lg">Customize your learning experience</p>
          </div>

          {/* Settings sections */}
          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Bell className="w-6 h-6 text-cyan-400" />
                Notification Settings
              </h2>

              <div className="space-y-4">
                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-purple-400" />
                    <div>
                      <Label htmlFor="push-notifications" className="text-white font-medium cursor-pointer">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-cyan-200/70">Receive notifications about your progress</p>
                    </div>
                  </div>
                  <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                {/* Email Reminders */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <div>
                      <Label htmlFor="email-reminders" className="text-white font-medium cursor-pointer">
                        Email Reminders
                      </Label>
                      <p className="text-sm text-cyan-200/70">Get progress reports and reminders via email</p>
                    </div>
                  </div>
                  <Switch id="email-reminders" checked={emailReminders} onCheckedChange={setEmailReminders} />
                </div>
              </div>
            </div>

            {/* Sound Settings */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Volume2 className="w-6 h-6 text-cyan-400" />
                Sound Settings
              </h2>

              <div className="space-y-6">
                {/* Sound Effects Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-pink-400" />
                    <div>
                      <Label htmlFor="sound-effects" className="text-white font-medium cursor-pointer">
                        Sound Effects
                      </Label>
                      <p className="text-sm text-cyan-200/70">Enable button clicks and interaction sounds</p>
                    </div>
                  </div>
                  <Switch id="sound-effects" checked={soundEffects} onCheckedChange={setSoundEffects} />
                </div>

                {/* Background Music Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-pink-400" />
                    <div>
                      <Label htmlFor="background-music" className="text-white font-medium cursor-pointer">
                        Background Music
                      </Label>
                      <p className="text-sm text-cyan-200/70">Play ambient music while learning</p>
                    </div>
                  </div>
                  <Switch id="background-music" checked={backgroundMusic} onCheckedChange={setBackgroundMusic} />
                </div>

                {/* Background Music Volume */}
                {backgroundMusic && (
                  <div className="p-4 bg-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-medium flex items-center gap-2">
                        <Music className="w-4 h-4 text-pink-400" />
                        Background Music Volume
                      </Label>
                      <span className="text-cyan-200 font-medium">{musicVolume[0]}%</span>
                    </div>
                    <Slider value={musicVolume} onValueChange={setMusicVolume} max={100} step={1} className="w-full" />
                  </div>
                )}

                {/* Audio Playback Volume */}
                <div className="p-4 bg-white/5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-medium flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-pink-400" />
                      Audio Playback Volume
                    </Label>
                    <span className="text-cyan-200 font-medium">{audioVolume[0]}%</span>
                  </div>
                  <p className="text-sm text-cyan-200/70">Volume for listening exercises and pronunciation</p>
                  <Slider value={audioVolume} onValueChange={setAudioVolume} max={100} step={1} className="w-full" />
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                {darkMode ? <Moon className="w-6 h-6 text-cyan-400" /> : <Sun className="w-6 h-6 text-cyan-400" />}
                Display Settings
              </h2>

              <div className="space-y-4">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Moon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-400" />
                    )}
                    <div>
                      <Label htmlFor="dark-mode" className="text-white font-medium cursor-pointer">
                        Dark Mode
                      </Label>
                      <p className="text-sm text-cyan-200/70">For reading exercises, games, and flashcards</p>
                    </div>
                  </div>
                  <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-8 text-center">
            <button className="px-8 py-4 bg-gradient-to-br from-green-300 to-cyan-300 text-purple-800 font-bold rounded-full shadow-lg hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
