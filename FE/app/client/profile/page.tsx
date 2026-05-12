"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  Globe,
  Lock,
  QrCode,
  RefreshCw,
  Target,
  User,
  XCircle,
} from "lucide-react"

import { CosmicBackground } from "@/components/cosmic-background"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const PRICE_PER_MONTH = 99000

type UserProfile = {
  id: string
  username: string
  email: string
  display_name?: string | null
  avatar?: string | null
  avatar_url?: string | null
  subscription?: "Free" | "Premium" | "Super"
  native_language?: string | null
  current_level?: "beginner" | "intermediate" | "advanced" | null
  learning_goal?: "travel" | "work" | "ielts" | "toeic" | "daily" | "academic" | null
  daily_goal?: number | null
  role?: string
}

type ProfileForm = {
  username: string
  email: string
  display_name: string
  native_language: string
  current_level: string
  learning_goal: string
  daily_goal: string
}

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

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

function formatVND(amount: number) {
  return `${amount.toLocaleString("vi-VN")} VND`
}

function addMonths(dateStr: string, months: number) {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function getRenewalExpiry(renewalDateStr: string) {
  const date = new Date(renewalDateStr)
  date.setDate(date.getDate() - 1)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function getInitialForm(profile?: UserProfile | null): ProfileForm {
  return {
    username: profile?.username || "",
    email: profile?.email || "",
    display_name: profile?.display_name || profile?.username || "",
    native_language: profile?.native_language || "vi",
    current_level: profile?.current_level || "beginner",
    learning_goal: profile?.learning_goal || "daily",
    daily_goal: String(profile?.daily_goal || 15),
  }
}

function getAvatarUrl(profile: UserProfile | null, previewUrl: string | null) {
  if (previewUrl) return previewUrl

  const avatarPath = profile?.avatar_url || profile?.avatar
  if (!avatarPath) return "/placeholder.svg"

  if (avatarPath.startsWith("http")) return avatarPath
  return `${API_BASE_URL}${avatarPath}`
}

async function parseApiResponse(response: Response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed")
  }

  return payload?.data ?? payload
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<ProfileForm>(getInitialForm())
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [isSubscriptionExpanded, setIsSubscriptionExpanded] = useState(false)

  const [nextRenewalDate, setNextRenewalDate] = useState("2024-02-15")
  const [accountType, setAccountType] = useState<"Premium" | "Free" | "Super">("Free")
  const [isCancelled, setIsCancelled] = useState(false)

  const [showRenewPanel, setShowRenewPanel] = useState(false)
  const [renewMonths, setRenewMonths] = useState("1")
  const [showQR, setShowQR] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showCancelSubConfirm, setShowCancelSubConfirm] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const transactions = useMemo(
    () => [
      { id: "TXN-2024-001", date: "2024-01-15", amount: formatVND(99000), status: "Completed" },
      { id: "TXN-2023-012", date: "2023-12-15", amount: formatVND(99000), status: "Completed" },
      { id: "TXN-2023-011", date: "2023-11-15", amount: formatVND(99000), status: "Completed" },
    ],
    [],
  )

  const months = parseInt(renewMonths) || 1
  const totalAmount = months * PRICE_PER_MONTH
  const newRenewalDate = addMonths(nextRenewalDate, months)
  const avatarUrl = getAvatarUrl(profile, avatarPreviewUrl)

  useEffect(() => {
    const fetchProfile = async () => {
      const storedToken = localStorage.getItem("token")
      if (!storedToken) {
        router.push("/sign-in")
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        const data = (await parseApiResponse(response)) as UserProfile

        setProfile(data)
        setForm(getInitialForm(data))
        setAccountType(data.subscription || "Free")
      } catch (error) {
        setNotice({
          type: "error",
          message: error instanceof Error ? error.message : "Could not load profile",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  useEffect(() => {
    if (!showQR) return

    const detectPaymentTimer = window.setTimeout(() => {
      setIsProcessing(true)

      const completePaymentTimer = window.setTimeout(() => {
        const renewalDate = new Date(nextRenewalDate)
        renewalDate.setMonth(renewalDate.getMonth() + months)

        setNextRenewalDate(renewalDate.toISOString().split("T")[0])
        setAccountType("Premium")
        setIsCancelled(false)
        setPaymentSuccess(true)
        setIsProcessing(false)
        setShowSuccessToast(true)
        setShowQR(false)
      }, 3000)

      return () => window.clearTimeout(completePaymentTimer)
    }, 10000)

    return () => window.clearTimeout(detectPaymentTimer)
  }, [months, nextRenewalDate, showQR])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    }
  }, [avatarPreviewUrl])

  const updateForm = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updatePasswordForm = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }))
  }

  const handleCancelSubscription = () => {
    setShowCancelSubConfirm(false)
    setIsCancelled(true)
  }

  const handleUpdatePassword = async () => {
    setShowPasswordConfirm(false)
    setNotice(null)

    if (!token) {
      router.push("/sign-in")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({ type: "error", message: "Confirm password does not match." })
      return
    }

    try {
      setIsPasswordSaving(true)
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      })

      await parseApiResponse(response)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setIsEditingPassword(false)
      setNotice({ type: "success", message: "Password updated successfully." })
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Could not update password",
      })
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const handleSaveChanges = async () => {
    setShowSaveConfirm(false)
    setNotice(null)

    if (!token) {
      router.push("/sign-in")
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          display_name: form.display_name,
          native_language: form.native_language,
          current_level: form.current_level,
          learning_goal: form.learning_goal,
          daily_goal: Number(form.daily_goal),
        }),
      })

      const updatedProfile = (await parseApiResponse(response)) as UserProfile
      setProfile(updatedProfile)
      setForm(getInitialForm(updatedProfile))
      setAccountType(updatedProfile.subscription || "Free")
      setNotice({ type: "success", message: "Profile updated successfully." })
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Could not save profile",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)

    setSelectedAvatar(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  const handleCancelAvatar = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)

    setSelectedAvatar(null)
    setAvatarPreviewUrl(null)
    setIsEditingAvatar(false)
  }

  const handleUploadAvatar = async () => {
    setNotice(null)

    if (!token) {
      router.push("/sign-in")
      return
    }

    if (!selectedAvatar) {
      setNotice({ type: "error", message: "Please choose an image before saving." })
      return
    }

    const formData = new FormData()
    formData.append("avatar", selectedAvatar)

    try {
      setIsAvatarUploading(true)
      const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await parseApiResponse(response)
      const nextAvatar = data?.avatar_url || data?.avatar

      setProfile((current) => (current ? { ...current, avatar: nextAvatar } : current))
      handleCancelAvatar()
      setNotice({ type: "success", message: "Avatar uploaded successfully." })
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Could not upload avatar",
      })
    } finally {
      setIsAvatarUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <CosmicBackground />
        <div className="relative z-10 rounded-2xl border border-cyan-300/30 bg-white/10 px-6 py-4 text-white backdrop-blur-md">
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-cyan-300">Manage your account and learning preferences</p>
        </div>

        {notice && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm backdrop-blur-md ${
              notice.type === "success"
                ? "border-green-300/40 bg-green-500/15 text-green-100"
                : "border-red-300/40 bg-red-500/15 text-red-100"
            }`}
          >
            {notice.message}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Account & Identity</h2>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-cyan-300/50 shadow-xl">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-4xl font-bold">
                  {(form.display_name || form.username || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => setIsEditingAvatar((current) => !current)}
                className="absolute bottom-0 right-0 bg-cyan-400 hover:bg-cyan-500 rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
                aria-label="Change avatar"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            {isEditingAvatar && (
              <div className="mt-4 w-full max-w-md">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="bg-white/20 border-cyan-300/50 text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-500"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    className="flex-1 bg-cyan-400 hover:bg-cyan-500"
                    onClick={handleUploadAvatar}
                    disabled={!selectedAvatar || isAvatarUploading}
                  >
                    {isAvatarUploading ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCancelAvatar}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Full Name</Label>
              <Input
                value={form.username}
                onChange={(event) => updateForm("username", event.target.value)}
                className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Display Name</Label>
              <Input
                value={form.display_name}
                onChange={(event) => updateForm("display_name", event.target.value)}
                className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Password</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingPassword((current) => !current)}
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
                    value={passwordForm.currentPassword}
                    onChange={(event) => updatePasswordForm("currentPassword", event.target.value)}
                    className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                  />
                  <Input
                    type="password"
                    placeholder="New password"
                    value={passwordForm.newPassword}
                    onChange={(event) => updatePasswordForm("newPassword", event.target.value)}
                    className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => updatePasswordForm("confirmPassword", event.target.value)}
                    className="bg-white/20 border-cyan-300/50 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowPasswordConfirm(true)}
                      className="flex-1 bg-cyan-400 hover:bg-cyan-500"
                      disabled={isPasswordSaving}
                    >
                      {isPasswordSaving ? "Updating..." : "Update Password"}
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

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Learning Profile & Goals</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Current Level</Label>
              <Select value={form.current_level} onValueChange={(value) => updateForm("current_level", value)}>
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

            <div className="space-y-2">
              <Label className="text-white">Learning Goal</Label>
              <Select value={form.learning_goal} onValueChange={(value) => updateForm("learning_goal", value)}>
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

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Daily Goal
              </Label>
              <Select value={form.daily_goal} onValueChange={(value) => updateForm("daily_goal", value)}>
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                  <SelectItem value="100">100 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Native Language
              </Label>
              <Select value={form.native_language} onValueChange={(value) => updateForm("native_language", value)}>
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

        <div className="mb-6 flex justify-center">
          <Button
            onClick={() => setShowSaveConfirm(true)}
            className="bg-gradient-to-br from-green-300 to-cyan-300 text-purple-800 shadow-lg hover:shadow-cyan-500/50 px-12 py-6 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <button
            type="button"
            onClick={() => setIsSubscriptionExpanded((current) => !current)}
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
                  <div className="bg-white/20 border border-cyan-300/50 rounded-lg px-4 py-3 flex items-center gap-2">
                    <span className={`font-semibold text-lg ${accountType !== "Free" ? "text-cyan-300" : "text-white/60"}`}>
                      {accountType}
                    </span>
                    {profile?.role === "admin" && (
                      <span className="text-xs bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
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
                        : new Date(nextRenewalDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                    </span>
                  </div>
                </div>
              </div>

              {!showRenewPanel && (
                <div className="flex flex-wrap gap-3 mb-6">
                  <Button
                    onClick={() => setShowRenewPanel(true)}
                    className="bg-cyan-400/90 text-white hover:bg-cyan-400/20 hover:text-cyan-300 flex items-center gap-2 rounded-2xl"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Renew Subscription
                  </Button>

                  {!isCancelled && accountType !== "Free" && (
                    <Button
                      onClick={() => setShowCancelSubConfirm(true)}
                      variant="outline"
                      className="bg-red-400/20 border-red-400/50 text-white/80 hover:bg-red-600/20 hover:text-red-500 flex items-center gap-2 rounded-2xl"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Subscription
                    </Button>
                  )}

                  {isCancelled && (
                    <Button
                      onClick={() => setIsCancelled(false)}
                      variant="outline"
                      className="bg-transparent border-cyan-300/50 text-cyan-300 hover:bg-cyan-400/10 rounded-2xl"
                    >
                      Re-enable Auto-Renewal
                    </Button>
                  )}
                </div>
              )}

              {showRenewPanel && !paymentSuccess && (
                <div className="mb-6 bg-white/10 rounded-2xl p-6 border border-cyan-300/30">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-bold text-xl flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-cyan-300" />
                      Renew Subscription
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRenewPanel(false)
                        setShowQR(false)
                      }}
                      className="text-cyan-300/90 hover:text-cyan-400/90 transition-colors"
                      aria-label="Close renewal panel"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {!showQR ? (
                    <>
                      <div className="mb-5">
                        <Label className="text-white mb-2 block">Duration</Label>
                        <Select value={renewMonths} onValueChange={setRenewMonths}>
                          <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 month</SelectItem>
                            <SelectItem value="3">3 months</SelectItem>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="bg-white/10 rounded-xl p-4 mb-5 border border-cyan-300/20">
                        <div className="flex justify-between text-white/75 text-sm mb-2">
                          <span>Price per month</span>
                          <span>{formatVND(PRICE_PER_MONTH)}</span>
                        </div>
                        <div className="flex justify-between text-white/75 text-sm mb-2">
                          <span>Duration</span>
                          <span>
                            {months} {months === 1 ? "month" : "months"}
                          </span>
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
                    <div className="flex flex-col items-center">
                      {isProcessing ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                          <div className="w-16 h-16 rounded-full border-4 border-cyan-300 border-t-transparent animate-spin" />
                          <p className="text-white font-medium">Processing payment...</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-cyan-100 text-sm mb-4 text-center">
                            Scan the QR code below to pay{" "}
                            <span className="text-cyan-300 font-bold">{formatVND(totalAmount)}</span>.
                            <br />
                            <span className="text-white/50">Payment will be detected automatically.</span>
                          </p>

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
                            <p className="text-white/60 text-xs mt-1">
                              Content: <span className="text-white">PREMIUM {months}MONTH</span>
                            </p>
                          </div>

                          <p className="text-white/40 text-xs text-center pb-4">
                            This page will automatically update once payment is confirmed.
                          </p>

                          <Button
                            onClick={() => setShowQR(false)}
                            variant="ghost"
                            className="bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                          >
                            <span className="text-white/90 font-medium hover:text-white">Back</span>
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                    <span className="text-white font-medium">Got it!</span>
                  </Button>
                </div>
              )}

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
