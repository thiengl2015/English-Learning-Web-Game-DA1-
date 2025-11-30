"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Trash2,
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
} from "lucide-react"

// Mock user data - in production this would come from an API
const mockUserData = {
  // 1. User Account & Identity
  userId: "u123456",
  email: "john.doe@example.com",
  displayName: "John Doe",
  fullName: "John Michael Doe",
  avatar: "/placeholder.svg?height=100&width=100",
  createdAt: "January 15, 2024",
  provider: "Google",

  // 2. Learning Profile & Goals
  currentLevel: "Intermediate",
  levelCode: "B1",
  learningGoal: "Business Communication",
  dailyGoal: "30 minutes",
  dailyGoalXP: 50,
  nativeLanguage: "Vietnamese",

  // 3. Progress & Activity Data
  completedLessons: 45,
  currentLesson: "Business Meetings",
  streakDays: 15,
  lastActive: "2 hours ago",
  totalXP: 2450,
  knownWords: 1250,
  savedWords: 85,
  wordMasteryLevel: "Intermediate",

  // 4. Subscription & Payment
  subscriptionType: "Super",
  subscriptionStatus: "Active",
  expiryDate: "January 15, 2025",
  transactions: [
    { id: "TXN001", date: "October 15, 2024", amount: "$9.99", status: "Completed" },
    { id: "TXN002", date: "September 15, 2024", amount: "$9.99", status: "Completed" },
  ],

  // 5. Settings & Preferences
  pushNotifications: true,
  emailReminders: true,
  soundEffects: true,
  darkMode: false,
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "progress" | "subscription" | "settings">("profile")

  const tabs = [
    { id: "profile", label: "Learning Profile", icon: BookOpen },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Bell },
  ]

  const handleDeleteUser = () => {
    console.log("[v0] Deleting user:", params.id)
    // In production, this would call an API to delete the user
    router.push("/admin/users")
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/users")}
          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This action cannot be undone. This will permanently delete the user account and remove all associated
                data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-red-500 text-white hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* User Profile Header */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-2 border-cyan-400">
              <AvatarImage src={mockUserData.avatar || "/placeholder.svg"} alt={mockUserData.displayName} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl">
                {mockUserData.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold text-white">{mockUserData.displayName}</h1>
              <p className="text-cyan-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {mockUserData.email}
              </p>
              <p className="text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {mockUserData.createdAt}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 text-center">
                <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">XP Points</p>
                <p className="text-xl font-bold text-white">{mockUserData.totalXP.toLocaleString()}</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 text-center">
                <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Current Streak</p>
                <p className="text-xl font-bold text-white">{mockUserData.streakDays}</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 text-center">
                <BookOpen className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Lessons Done</p>
                <p className="text-xl font-bold text-white">{mockUserData.completedLessons}</p>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Level</p>
                <p className="text-lg font-bold text-white">{mockUserData.currentLevel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* Tab Content */}
      {activeTab === "profile" && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white">Learning Information</CardTitle>
            <CardDescription className="text-gray-400">User's learning profile and goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Current Level
                </p>
                <p className="text-lg font-semibold text-white">
                  {mockUserData.currentLevel} ({mockUserData.levelCode})
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Learning Goal
                </p>
                <p className="text-lg font-semibold text-white">{mockUserData.learningGoal}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Daily Goal
                </p>
                <p className="text-lg font-semibold text-white">
                  {mockUserData.dailyGoal} ({mockUserData.dailyGoalXP} XP)
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Native Language
                </p>
                <p className="text-lg font-semibold text-white">{mockUserData.nativeLanguage}</p>
              </div>
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
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-400">Completed Lessons</p>
                  <p className="text-sm font-semibold text-white">{mockUserData.completedLessons}</p>
                </div>
                <Progress value={45} className="h-2 bg-slate-700/50" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Current Lesson</p>
                <p className="text-lg font-semibold text-white">{mockUserData.currentLesson}</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-400">Known Words</p>
                  <p className="text-sm font-semibold text-white">{mockUserData.knownWords.toLocaleString()} words</p>
                </div>
                <Progress value={62} className="h-2 bg-slate-700/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "subscription" && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white">Subscription Details</CardTitle>
            <CardDescription className="text-gray-400">Manage user's subscription and payment history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Plan Type</p>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-base px-3 py-1">
                  {mockUserData.subscriptionType}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Status</p>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-base px-3 py-1">
                  {mockUserData.subscriptionStatus}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Expiry Date</p>
                <p className="text-lg font-semibold text-white">{mockUserData.expiryDate}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-cyan-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
              <div className="space-y-3">
                {mockUserData.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-cyan-500/10"
                  >
                    <div>
                      <p className="font-semibold text-white">{transaction.id}</p>
                      <p className="text-sm text-gray-400">{transaction.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{transaction.amount}</p>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "settings" && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white">User Settings</CardTitle>
            <CardDescription className="text-gray-400">Manage user preferences and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-cyan-500/10">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Push Notifications</p>
                    <p className="text-sm text-gray-400">Receive push notifications</p>
                  </div>
                </div>
                <Switch checked={mockUserData.pushNotifications} className="data-[state=checked]:bg-cyan-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-cyan-500/10">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Email Reminders</p>
                    <p className="text-sm text-gray-400">Receive email reminders</p>
                  </div>
                </div>
                <Switch checked={mockUserData.emailReminders} className="data-[state=checked]:bg-cyan-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-cyan-500/10">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Sound Effects</p>
                    <p className="text-sm text-gray-400">Enable sound effects</p>
                  </div>
                </div>
                <Switch checked={mockUserData.soundEffects} className="data-[state=checked]:bg-cyan-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-cyan-500/10">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Dark Mode</p>
                    <p className="text-sm text-gray-400">Enable dark mode</p>
                  </div>
                </div>
                <Switch checked={mockUserData.darkMode} className="data-[state=checked]:bg-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
