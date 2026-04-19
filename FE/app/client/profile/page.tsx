"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CosmicBackground } from "@/components/cosmic-background"
import Link from "next/link"
import { ArrowLeft, Camera, Lock, User, Target, Globe, Clock, CreditCard, ChevronDown, CheckCircle, XCircle, QrCode, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"

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

const PRICE_PER_MONTH = 99000 // VND

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + " ₫"
}

function addMonths(dateStr: string, months: number) {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function getRenewalExpiry(renewalDateStr: string) {
  // Premium stays active until next renewal date - 1 day
  const date = new Date(renewalDateStr)
  date.setDate(date.getDate() - 1)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export default function ProfilePage() {
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [isSubscriptionExpanded, setIsSubscriptionExpanded] = useState(false)

  // Subscription state
  const [nextRenewalDate, setNextRenewalDate] = useState("2024-02-15")
  const [accountType, setAccountType] = useState<"Premium" | "Free">("Premium")
  const [isCancelled, setIsCancelled] = useState(false)

  // Renewal flow state
  const [showRenewPanel, setShowRenewPanel] = useState(false)
  const [renewMonths, setRenewMonths] = useState("1")
  const [showQR, setShowQR] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Cancel confirm state
  const [showCancelSubConfirm, setShowCancelSubConfirm] = useState(false)

  const transactions = [
    { id: "TXN-2024-001", date: "2024-01-15", amount: formatVND(99000), status: "Completed" },
    { id: "TXN-2023-012", date: "2023-12-15", amount: formatVND(99000), status: "Completed" },
    { id: "TXN-2023-011", date: "2023-11-15", amount: formatVND(99000), status: "Completed" },
  ]

  const months = parseInt(renewMonths) || 1
  const totalAmount = months * PRICE_PER_MONTH
  const newRenewalDate = addMonths(nextRenewalDate, months)

  // Simulate QR payment success after 10 seconds when QR is shown
  useEffect(() => {
    if (!showQR) return
    const timer = setTimeout(() => {
      setIsProcessing(true)
      setTimeout(() => {
        // Update subscription
        const d = new Date(nextRenewalDate)
        d.setMonth(d.getMonth() + months)
        setNextRenewalDate(d.toISOString().split("T")[0])
        setAccountType("Premium")
        setIsCancelled(false)
        setPaymentSuccess(true)
        setIsProcessing(false)
        setShowSuccessToast(true)
        setShowQR(false)
      }, 3000)
    }, 10000)
    return () => clearTimeout(timer)
  }, [showQR])

  const handleCancelSubscription = () => {
    setShowCancelSubConfirm(false)
    setIsCancelled(true)
    // Premium stays until next renewal date - 1
  }

  const handleUpdatePassword = () => {
    setShowPasswordConfirm(false)
    setIsEditingPassword(false)
  }

  const handleSaveChanges = () => {
    setShowSaveConfirm(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-green-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-green-300/50 animate-in slide-in-from-right">
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-bold">Payment Successful!</p>
            <p className="text-sm text-green-100">A confirmation email has been sent to you.</p>
          </div>
        </div>
      )}

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

      <ConfirmDialog
        isOpen={showCancelSubConfirm}
        onClose={() => setShowCancelSubConfirm(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message={`Your Premium access will remain active until ${getRenewalExpiry(nextRenewalDate)}. After that, your account will revert to Free.`}
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
              {/* Account info */}
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <Label className="text-white">Account Type</Label>
                  <div className="bg-white/20 border border-cyan-300/50 rounded-lg px-4 py-3 flex items-center gap-2">
                    <span className={`font-semibold text-lg ${accountType === "Premium" ? "text-cyan-300" : "text-white/60"}`}>
                      {accountType}
                    </span>
                    {isCancelled && (
                      <span className="text-xs bg-orange-400/20 text-orange-300 border border-orange-400/30 px-2 py-0.5 rounded-full">
                        Cancels {getRenewalExpiry(nextRenewalDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">{isCancelled ? "Active Until" : "Next Renewal Date"}</Label>
                  <div className="bg-white/20 border border-cyan-300/50 rounded-lg px-4 py-3">
                    <span className="text-white">
                      {isCancelled
                        ? getRenewalExpiry(nextRenewalDate)
                        : new Date(nextRenewalDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!showRenewPanel && (
                <div className="flex flex-wrap gap-3 mb-6">
                  <Button
                    onClick={() => setShowRenewPanel(true)}
                    className="bg-cyan-400/90 text-white hover:bg-cyan-400/20  hover:text-cyan-300 flex items-center gap-2 rounded-2xl"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Renew Subscription
                  </Button>

                  {!isCancelled && accountType === "Premium" && (
                    <Button
                      onClick={() => setShowCancelSubConfirm(true)}
                      variant="outline"
                      className="bg-red-400/20 border-red-400/50 text-white/80 hover:bg-red-600/20  hover:text-red-500 flex items-center gap-2 rounded-2xl"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Subscription
                    </Button>
                  )}

                  {isCancelled && (
                    <Button
                      onClick={() => { setIsCancelled(false) }}
                      variant="outline"
                      className="bg-transparent border-cyan-300/50 text-cyan-300 hover:bg-cyan-400/10 rounded-2xl"
                    >
                      Re-enable Auto-Renewal
                    </Button>
                  )}
                </div>
              )}

              {/* Renewal Panel */}
              {showRenewPanel && !paymentSuccess && (
                <div className="mb-6 bg-white/10 rounded-2xl p-6 border border-cyan-300/30">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-bold text-xl flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-cyan-300" />
                      Renew Subscription
                    </h3>
                    <button
                      onClick={() => { setShowRenewPanel(false); setShowQR(false) }}
                      className="text-cyan-300/90 hover:text-cyan-400/90 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {!showQR ? (
                    <>
                      {/* Month selector — dropdown */}
                      <div className="mb-5">
                        <Label className="text-white mb-2 block">Duration</Label>
                        <Select value={renewMonths} onValueChange={setRenewMonths}>
                          <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 month </SelectItem>
                            <SelectItem value="3">3 months </SelectItem>
                            <SelectItem value="6">6 months </SelectItem>
                            <SelectItem value="12">12 months </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price summary */}
                      <div className="bg-white/10 rounded-xl p-4 mb-5 border border-cyan-300/20">
                        <div className="flex justify-between text-white/75 text-sm mb-2">
                          <span>Price per month</span>
                          <span>{formatVND(PRICE_PER_MONTH)}</span>
                        </div>
                        <div className="flex justify-between text-white/75 text-sm mb-2">
                          <span>Duration</span>
                          <span>{months} {months === 1 ? "month" : "months"}</span>
                        </div>
                        <div className="border-t border-white/20 my-2" />
                        <div className="flex justify-between text-white font-bold text-m">
                          <span>Total</span>
                          <span className="text-cyan-300">{formatVND(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-white/75">New renewal date</span>
                          <span className="text-cyan-300">{newRenewalDate}</span>
                        </div>
                      </div>

                      {/* Payment method */}
                      <div className="mb-5">
                        <Label className="text-white mb-2 block">Payment Method</Label>
                        <div className="flex items-center gap-3 bg-white/10 border border-cyan-300/40 rounded-xl px-4 py-3 cursor-pointer">
                          <QrCode className="w-5 h-5 text-cyan-300" />
                          <span className="text-white text-sm">QR Code (Bank Transfer)</span>
                          <CheckCircle className="w-4 h-4 text-cyan-300 ml-auto" />
                        </div>
                      </div>

                      <Button
                        onClick={() => setShowQR(true)}
                        className="w-full bg-gradient-to-br from-green-300 to-cyan-300 text-purple-800 font-bold py-3 text-base rounded-2xl shadow-lg hover:shadow-cyan-500/40 hover:scale-102 transition-all duration-300"
                      >
                        Confirm
                      </Button>
                    </>
                  ) : (
                    /* QR Code payment screen */
                    <div className="flex flex-col items-center">
                      {isProcessing ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                          <div className="w-16 h-16 rounded-full border-4 border-cyan-300 border-t-transparent animate-spin" />
                          <p className="text-white font-medium">Processing payment...</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-cyan-100 text-sm mb-4 text-center">
                            Scan the QR code below to pay <span className="text-cyan-300 font-bold">{formatVND(totalAmount)}</span>.
                            <br />
                            <span className="text-white/50">Payment will be detected automatically.</span>
                          </p>

                          {/* QR Code image (VietQR placeholder) */}
                          <div className="relative bg-white p-4 rounded-2xl shadow-2xl mb-4">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=VIETQR|STK:1234567890|BANK:VCB|AMOUNT:${totalAmount}|DESC:PREMIUM-${months}MONTH`}
                              alt="Payment QR Code"
                              width={220}
                              height={220}
                              className="rounded-lg"
                            />
                          </div>

                          <div className="bg-white/10 rounded-xl px-6 py-3 border border-cyan-300/20 text-center mb-4 w-full">
                            <p className="text-white/60 text-xs">Transfer amount</p>
                            <p className="text-cyan-300 font-bold text-xl">{formatVND(totalAmount)}</p>
                            <p className="text-white/60 text-xs mt-1">Content: <span className="text-white">PREMIUM {months}MONTH</span></p>
                          </div>

                          <p className="text-white/40 text-xs text-center pb-4">
                            This page will automatically update once payment is confirmed.
                          </p>

                          <Button
                            onClick={() => { setShowQR(false) }}
                            variant="ghost"
                            className="bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                          >
                            <span className="text-white/90 font-medium hover:text-white"> Back </span>
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payment success inline */}
              {paymentSuccess && (
                <div className="mb-6 flex flex-col items-center gap-3 bg-green-500/15 rounded-2xl p-6 border border-green-400/30">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                  <p className="text-white font-bold text-xl">Payment Confirmed!</p>
                  <p className="text-green-200 text-sm text-center pb-2">
                    Your subscription has been renewed. A confirmation email has been sent.
                  </p>
                  <Button
                    onClick={() => {
                      setPaymentSuccess(false)
                      setShowRenewPanel(false)
                      setShowSuccessToast(false)
                      setIsSubscriptionExpanded(true)
                    }}
                    className="bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    <span className="text-white font-medium"> Got it! </span>
                  </Button>
                </div>
              )}

              {/* Transaction History */}
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
