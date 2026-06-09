"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Award,
  Flame,
  BookOpen,
  TrendingUp,
  Mail,
  Calendar,
  Globe,
  Target,
  Clock,
  CreditCard,
  Bell,
  Volume2,
  Moon,
  Music,
  RefreshCw,
} from "lucide-react"
import { getAdminUser, updateAdminUserStatus, type AdminUser } from "@/lib/api/admin"

const formatDate = (value?: string | null) => {
  if (!value) return "Never"
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value))
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = String(params.id)
  const [activeTab, setActiveTab] = useState<"profile" | "progress" | "subscription" | "settings">("profile")
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")

  const tabs = [
    { id: "profile", label: "Learning Profile", icon: BookOpen },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Bell },
  ]

  const loadUser = async () => {
    setIsLoading(true)
    setError("")

    try {
      const data = await getAdminUser(userId)
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load user.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleStatusToggle = async () => {
    if (!user) return
    setIsUpdating(true)
    setError("")

    try {
      const updated = await updateAdminUserStatus(user.id, user.status === "Active" ? "Inactive" : "Active")
      setUser(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user status.")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/admin/users")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardContent className="pt-6 text-gray-300">Loading user...</CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/admin/users")} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardContent className="pt-6 text-gray-300">{error || "User not found."}</CardContent>
        </Card>
      </div>
    )
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/users")}
          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <Button
          variant="outline"
          disabled={isUpdating}
          onClick={handleStatusToggle}
          className="border-cyan-500/30 bg-transparent text-cyan-300 hover:bg-cyan-500/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? "animate-spin" : ""}`} />
          {user.status === "Active" ? "Set Inactive" : "Activate User"}
        </Button>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-2 border-cyan-400">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <Badge
                  className={
                    user.status === "Active"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {user.status}
                </Badge>
              </div>
              <p className="text-cyan-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <p className="text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {formatDate(user.joined_date)}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 text-center">
                <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">XP Points</p>
                <p className="text-xl font-bold text-white">{user.progress.total_xp.toLocaleString()}</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 text-center">
                <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Current Streak</p>
                <p className="text-xl font-bold text-white">{user.progress.streak_days}</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 text-center">
                <BookOpen className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Lessons Done</p>
                <p className="text-xl font-bold text-white">{user.progress.lessons_completed}</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Level</p>
                <p className="text-lg font-bold text-white capitalize">{user.current_level}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              } whitespace-nowrap gap-3`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {activeTab === "profile" && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white">Learning Information</CardTitle>
            <CardDescription className="text-gray-400">User's learning profile and goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Info icon={TrendingUp} label="Current Level" value={user.current_level} />
              <Info icon={Target} label="Learning Goal" value={user.learning_goal} />
              <Info icon={Clock} label="Daily Goal" value={`${user.daily_goal} minutes`} />
              <Info icon={Globe} label="Native Language" value={user.native_language || "N/A"} />
              <Info icon={Calendar} label="Last Active" value={formatDate(user.last_active)} />
              <Info icon={Award} label="League" value={user.progress.league} />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "progress" && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white">Learning Progress</CardTitle>
            <CardDescription className="text-gray-400">Track user's learning journey and achievements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressRow label="Completed Lessons" value={user.progress.lessons_completed} max={100} />
            <ProgressRow label="Completed Units" value={user.progress.units_completed} max={12} />
            <ProgressRow label="Known Words" value={user.progress.words_learned} max={2000} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Metric label="Weekly XP" value={user.progress.weekly_xp.toLocaleString()} />
              <Metric label="Study Minutes" value={user.progress.total_study_minutes.toLocaleString()} />
              <Metric label="Last Progress Date" value={user.progress.last_active_date || "N/A"} />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "subscription" && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white">Subscription Details</CardTitle>
            <CardDescription className="text-gray-400">User subscription and payment history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Metric label="Plan Type" value={user.subscription} />
              <Metric label="Premium Expiry" value={formatDate(user.premium_expires_at)} />
              <Metric label="Transactions" value={String(user.transactions?.length || 0)} />
            </div>

            <div className="pt-6 border-t border-cyan-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
              <div className="space-y-3">
                {(user.transactions || []).length === 0 ? (
                  <p className="text-sm text-gray-400">No transactions yet.</p>
                ) : (
                  user.transactions?.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-cyan-500/10"
                    >
                      <div>
                        <p className="font-semibold text-white">{transaction.package_type}</p>
                        <p className="text-sm text-gray-400">{formatDate(transaction.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatMoney(transaction.amount)}</p>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "settings" && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white">User Settings</CardTitle>
            <CardDescription className="text-gray-400">Saved client settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow icon={Bell} label="Push Notifications" value={user.settings.push_notifications} />
            <SettingRow icon={Mail} label="Email Reminders" value={user.settings.email_reminders} />
            <SettingRow icon={Volume2} label="Sound Effects" value={user.settings.sound_effects} />
            <SettingRow icon={Music} label="Background Music" value={user.settings.background_music} />
            <SettingRow icon={Moon} label="Dark Mode" value={user.settings.dark_mode} />
            <Metric label="Music Volume" value={`${user.settings.music_volume}%`} />
            <Metric label="Audio Playback Volume" value={`${user.settings.audio_volume}%`} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp
  label: string
  value: string | number
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-400 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </p>
      <p className="text-lg font-semibold text-white capitalize">{value}</p>
    </div>
  )
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div>
      <div className="flex justify-between mb-2">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-white">{value.toLocaleString()}</p>
      </div>
      <Progress value={percent} className="h-2 bg-slate-700/50" />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-500/10">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-white mt-1">{value}</p>
    </div>
  )
}

function SettingRow({ icon: Icon, label, value }: { icon: typeof Bell; label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-cyan-500/10">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-cyan-400" />
        <div>
          <p className="font-medium text-white">{label}</p>
          <p className="text-sm text-gray-400">{value ? "Enabled" : "Disabled"}</p>
        </div>
      </div>
      <Switch checked={value} disabled className="data-[state=checked]:bg-cyan-500" />
    </div>
  )
}
