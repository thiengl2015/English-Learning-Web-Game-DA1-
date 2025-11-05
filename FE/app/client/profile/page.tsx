"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CosmicBackground } from "@/components/cosmic-background"
import Link from "next/link"
import { ArrowLeft, Camera, Lock, User, Target, Globe, Clock, CreditCard, ChevronDown } from "lucide-react"
import { useState } from "react"

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-md rounded-3xl p-8 border border-cyan-300/30 shadow-2xl max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <p className="text-cyan-100 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button onClick={onConfirm} className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-white font-semibold">
            Confirm
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-transparent border-cyan-300/50 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [isSubscriptionExpanded, setIsSubscriptionExpanded] = useState(false)

  const transactions = [
    { id: "TXN-2024-001", date: "2024-01-15", amount: "$9.99", status: "Completed" },
    { id: "TXN-2023-012", date: "2023-12-15", amount: "$9.99", status: "Completed" },
    { id: "TXN-2023-011", date: "2023-11-15", amount: "$9.99", status: "Completed" },
  ]

  const handleUpdatePassword = () => {
    setShowPasswordConfirm(false)
    // TODO: Implement password update logic
    console.log("[v0] Password updated")
    setIsEditingPassword(false)
  }

  const handleSaveChanges = () => {
    setShowSaveConfirm(false)
    // TODO: Implement save changes logic
    console.log("[v0] Changes saved")
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      <ConfirmDialog
        isOpen={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={handleUpdatePassword}
        title="Update Password"
        message="Are you sure you want to update your password? You will need to use the new password for future logins."
      />

      <ConfirmDialog
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleSaveChanges}
        title="Save Changes"
        message="Are you sure you want to save all changes to your profile?"
      />

      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-cyan-300">Manage your account and learning preferences</p>
        </div>

        {/* Account & Identity Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Account & Identity</h2>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-cyan-300/50 shadow-xl">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-4xl font-bold">
                  Avt
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute bottom-0 right-0 bg-cyan-400 hover:bg-cyan-500 rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            {isEditingAvatar && (
              <div className="mt-4 w-full max-w-md">
                <Input
                  type="url"
                  placeholder="Enter avatar URL"
                  className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                />
                <div className="flex gap-2 mt-2">
                  <Button className="flex-1 bg-cyan-400 hover:bg-cyan-500">Save</Button>
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsEditingAvatar(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Account Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Full Name</Label>
              <Input
                defaultValue="Odixee"
                className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Display Name</Label>
              <Input
                defaultValue="Odixee"
                className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                defaultValue="odixee@example.com"
                className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Password</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingPassword(!isEditingPassword)}
                  className="text-cyan-300 hover:text-cyan-400 hover:bg-white/10"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
              {isEditingPassword && (
                <div className="space-y-3 mt-3 p-4 bg-white/10 rounded-xl">
                  <Input
                    type="password"
                    placeholder="Current password"
                    className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                  />
                  <Input
                    type="password"
                    placeholder="New password"
                    className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowPasswordConfirm(true)}
                      className="flex-1 bg-cyan-400 hover:bg-cyan-500"
                    >
                      Update Password
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setIsEditingPassword(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Learning Profile & Goals Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Learning Profile & Goals</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Level */}
            <div className="space-y-2">
              <Label className="text-white">Current Level</Label>
              <Select defaultValue="intermediate">
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                  <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Learning Goal */}
            <div className="space-y-2">
              <Label className="text-white">Learning Goal</Label>
              <Select defaultValue="work">
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="ielts">IELTS Preparation</SelectItem>
                  <SelectItem value="toeic">TOEIC Preparation</SelectItem>
                  <SelectItem value="daily">Daily Communication</SelectItem>
                  <SelectItem value="academic">Academic Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Daily Goal */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Daily Goal
              </Label>
              <Select defaultValue="20min">
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10min">10 minutes (10 XP)</SelectItem>
                  <SelectItem value="20min">20 minutes (20 XP)</SelectItem>
                  <SelectItem value="30min">30 minutes (30 XP)</SelectItem>
                  <SelectItem value="50xp">50 XP per day</SelectItem>
                  <SelectItem value="100xp">100 XP per day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Native Language */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Native Language
              </Label>
              <Select defaultValue="vi">
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Vietnamese</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mb-6 flex justify-center">
          <Button
            onClick={() => setShowSaveConfirm(true)}
            className="bg-gradient-to-br from-green-300 to-cyan-300 text-purple-800 shadow-lg hover:shadow-cyan-500/50 px-12 py-6 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Save Changes
          </Button>
        </div>

        {/* Subscription & Payment Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <button
            onClick={() => setIsSubscriptionExpanded(!isSubscriptionExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-cyan-300" />
              <h2 className="text-2xl font-bold text-white">Subscription & Payment</h2>
            </div>
            <ChevronDown
              className={`w-6 h-6 text-cyan-300 transition-transform duration-300 ${isSubscriptionExpanded ? "rotate-180" : ""}`}
            />
          </button>

          {isSubscriptionExpanded && (
            <div className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <Label className="text-white">Account Type</Label>
                  <div className="bg-white/20 border border-cyan-300/50 rounded-lg px-4 py-3">
                    <span className="text-cyan-300 font-semibold text-lg">Premium</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Next Renewal Date</Label>
                  <div className="bg-white/20 border border-cyan-300/50 rounded-lg px-4 py-3">
                    <span className="text-white">February 15, 2024</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white text-lg">Transaction History</Label>
                <div className="bg-white/10 rounded-xl overflow-hidden border border-cyan-300/30">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-4 py-3 text-left text-cyan-300 font-semibold">Transaction ID</th>
                          <th className="px-4 py-3 text-left text-cyan-300 font-semibold">Date</th>
                          <th className="px-4 py-3 text-left text-cyan-300 font-semibold">Amount</th>
                          <th className="px-4 py-3 text-left text-cyan-300 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction, index) => (
                          <tr
                            key={transaction.id}
                            className={`${index !== transactions.length - 1 ? "border-b border-white/10" : ""} hover:bg-white/5 transition-colors`}
                          >
                            <td className="px-4 py-3 text-white font-mono text-sm">{transaction.id}</td>
                            <td className="px-4 py-3 text-white">{transaction.date}</td>
                            <td className="px-4 py-3 text-white font-semibold">{transaction.amount}</td>
                            <td className="px-4 py-3">
                              <span className="text-green-300 bg-green-300/20 px-3 py-1 rounded-full text-sm">
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
