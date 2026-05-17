"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, Mic, ImageIcon, Bell, MessageCircle, UserPlus, Trophy, Gift, X, MoreVertical, Trash2, Square, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GalaxySpiralBackground } from "@/components/galaxy-spiral-background"

type TabType = "notifications" | "chatting"

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  type: "text" | "voice" | "image"
  imageUrl?: string
  voiceDuration?: number
}

interface Friend {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  isOnline: boolean
  totalXP: number
  highestRank: string
  highestPosition: number
}

interface Notification {
  id: string
  type: "friend_request" | "payment" | "event" | "achievement"
  title: string
  description: string
  timestamp: Date
  isRead: boolean
  fromUser?: {
    id: string
    name: string
    avatar: string
    totalXP: number
    highestRank: string
    highestPosition: number
  }
}

interface User {
  id: string
  name: string
  avatar: string
  totalXP: number
  highestRank: string
  highestPosition: number
  isFriend: boolean
}

const LEAGUES: Record<string, { icon: string; color: string }> = {
  Bronze: { icon: "🥉", color: "text-orange-400" },
  Silver: { icon: "🥈", color: "text-gray-300" },
  Gold: { icon: "🥇", color: "text-yellow-400" },
  Diamond: { icon: "💎", color: "text-cyan-400" },
  Master: { icon: "👑", color: "text-purple-400" },
}

// Mock data
const MOCK_FRIENDS: Friend[] = [
  {
    id: "f1",
    name: "QuantumQuest",
    avatar: "/placeholder.svg",
    lastMessage: "Hey! How are you doing?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 2,
    isOnline: true,
    totalXP: 28500,
    highestRank: "Diamond",
    highestPosition: 5,
  },
  {
    id: "f2",
    name: "NovaStudent",
    avatar: "/placeholder.svg",
    lastMessage: "Thanks for the help!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
    unreadCount: 0,
    isOnline: true,
    totalXP: 24100,
    highestRank: "Diamond",
    highestPosition: 12,
  },
  {
    id: "f3",
    name: "AstroAce",
    avatar: "/placeholder.svg",
    lastMessage: "Let's study together tomorrow",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unreadCount: 1,
    isOnline: false,
    totalXP: 21800,
    highestRank: "Gold",
    highestPosition: 3,
  },
  {
    id: "f4",
    name: "StellarMind",
    avatar: "/placeholder.svg",
    lastMessage: "Great progress!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 5),
    unreadCount: 0,
    isOnline: false,
    totalXP: 19500,
    highestRank: "Gold",
    highestPosition: 4,
  },
  {
    id: "f5",
    name: "SpaceVoyager",
    avatar: "/placeholder.svg",
    lastMessage: "Check out this lesson",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unreadCount: 0,
    isOnline: true,
    totalXP: 18200,
    highestRank: "Gold",
    highestPosition: 5,
  },
]

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "friend_request",
    title: "Friend Request",
    description: "wants to be your friend",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isRead: false,
    fromUser: {
      id: "u1",
      name: "CometChaser",
      avatar: "/placeholder.svg",
      totalXP: 15600,
      highestRank: "Gold",
      highestPosition: 8,
    },
  },
  {
    id: "n2",
    type: "achievement",
    title: "Congratulations!",
    description: "You reached Top 3 in the leaderboard!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    isRead: false,
  },
  {
    id: "n3",
    type: "event",
    title: "New Event",
    description: "Weekly Challenge starts in 2 hours",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    isRead: true,
  },
  {
    id: "n4",
    type: "friend_request",
    title: "Friend Request",
    description: "wants to be your friend",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isRead: true,
    fromUser: {
      id: "u2",
      name: "NebulaStudent",
      avatar: "/placeholder.svg",
      totalXP: 12400,
      highestRank: "Silver",
      highestPosition: 2,
    },
  },
  {
    id: "n5",
    type: "payment",
    title: "Purchase Successful",
    description: "You bought 500 gems",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
  },
]

// All users for search (includes friends and non-friends)
const MOCK_ALL_USERS: User[] = [
  { id: "f1", name: "QuantumQuest", avatar: "/placeholder.svg", totalXP: 28500, highestRank: "Diamond", highestPosition: 5, isFriend: true },
  { id: "f2", name: "NovaStudent", avatar: "/placeholder.svg", totalXP: 24100, highestRank: "Diamond", highestPosition: 12, isFriend: true },
  { id: "f3", name: "AstroAce", avatar: "/placeholder.svg", totalXP: 21800, highestRank: "Gold", highestPosition: 3, isFriend: true },
  { id: "f4", name: "StellarMind", avatar: "/placeholder.svg", totalXP: 19500, highestRank: "Gold", highestPosition: 4, isFriend: true },
  { id: "f5", name: "SpaceVoyager", avatar: "/placeholder.svg", totalXP: 18200, highestRank: "Gold", highestPosition: 5, isFriend: true },
  { id: "u1", name: "CometChaser", avatar: "/placeholder.svg", totalXP: 15600, highestRank: "Gold", highestPosition: 8, isFriend: false },
  { id: "u2", name: "NebulaStudent", avatar: "/placeholder.svg", totalXP: 12400, highestRank: "Silver", highestPosition: 2, isFriend: false },
  { id: "u3", name: "GalaxyRider", avatar: "/placeholder.svg", totalXP: 22000, highestRank: "Diamond", highestPosition: 8, isFriend: false },
  { id: "u4", name: "StarSeeker", avatar: "/placeholder.svg", totalXP: 16800, highestRank: "Gold", highestPosition: 7, isFriend: false },
  { id: "u5", name: "MoonWalker", avatar: "/placeholder.svg", totalXP: 14200, highestRank: "Silver", highestPosition: 1, isFriend: false },
  { id: "u6", name: "SunChaser", avatar: "/placeholder.svg", totalXP: 11000, highestRank: "Silver", highestPosition: 5, isFriend: false },
  { id: "u7", name: "OrbitMaster", avatar: "/placeholder.svg", totalXP: 9500, highestRank: "Bronze", highestPosition: 2, isFriend: false },
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  f1: [
    { id: "m1", senderId: "f1", content: "Hey! How are you doing?", timestamp: new Date(Date.now() - 1000 * 60 * 5), type: "text" },
    { id: "m2", senderId: "current-user", content: "I'm great! Just finished a lesson", timestamp: new Date(Date.now() - 1000 * 60 * 4), type: "text" },
    { id: "m3", senderId: "f1", content: "That's awesome! Keep it up!", timestamp: new Date(Date.now() - 1000 * 60 * 3), type: "text" },
  ],
  f2: [
    { id: "m4", senderId: "current-user", content: "Let me help you with that question", timestamp: new Date(Date.now() - 1000 * 60 * 35), type: "text" },
    { id: "m5", senderId: "f2", content: "Thanks for the help!", timestamp: new Date(Date.now() - 1000 * 60 * 30), type: "text" },
  ],
  f3: [
    { id: "m6", senderId: "f3", content: "Let's study together tomorrow", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), type: "text" },
  ],
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("chatting")
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES)
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showFriendProfile, setShowFriendProfile] = useState<Friend | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_ALL_USERS)
  const [showUserProfile, setShowUserProfile] = useState<User | null>(null)
  const [showAddConfirm, setShowAddConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      setRecordingTime(0)
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleSendMessage = () => {
    if (!message.trim() || !selectedFriend) return

    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: "current-user",
      content: message,
      timestamp: new Date(),
      type: "text",
    }

    setMessages((prev) => ({
      ...prev,
      [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMessage],
    }))
    setMessage("")
  }

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording and send voice message
      if (selectedFriend && recordingTime > 0) {
        const newMessage: Message = {
          id: `m${Date.now()}`,
          senderId: "current-user",
          content: `Voice message (${formatRecordingTime(recordingTime)})`,
          timestamp: new Date(),
          type: "voice",
          voiceDuration: recordingTime,
        }
        setMessages((prev) => ({
          ...prev,
          [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMessage],
        }))
      }
      setIsRecording(false)
    } else {
      // Start recording
      setIsRecording(true)
    }
  }

  const handleCancelRecording = () => {
    setIsRecording(false)
    setRecordingTime(0)
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedFriend) {
      const newMessage: Message = {
        id: `m${Date.now()}`,
        senderId: "current-user",
        content: "Image",
        timestamp: new Date(),
        type: "image",
        imageUrl: URL.createObjectURL(file),
      }
      setMessages((prev) => ({
        ...prev,
        [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMessage],
      }))
    }
  }

  const handleAcceptFriendRequest = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    )
  }

  const handleRejectFriendRequest = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    )
  }

  const handleRemoveFriend = () => {
    if (showFriendProfile) {
      setFriends((prev) => prev.filter((f) => f.id !== showFriendProfile.id))
      if (selectedFriend?.id === showFriendProfile.id) {
        setSelectedFriend(null)
      }
      setShowFriendProfile(null)
      setShowDeleteConfirm(false)
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="w-5 h-5 text-cyan-400" />
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-400" />
      case "event":
        return <Bell className="w-5 h-5 text-orange-400" />
      case "payment":
        return <Gift className="w-5 h-5 text-green-400" />
      default:
        return <Bell className="w-5 h-5 text-white" />
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead).length

  // Search users by name
  const searchResults = searchQuery.trim()
    ? allUsers.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : []

  // Add friend function
  const handleAddFriend = () => {
    if (showUserProfile && !showUserProfile.isFriend) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === showUserProfile.id ? { ...u, isFriend: true } : u
        )
      )
      // Add to friends list
      const newFriend: Friend = {
        id: showUserProfile.id,
        name: showUserProfile.name,
        avatar: showUserProfile.avatar,
        lastMessage: "",
        lastMessageTime: new Date(),
        unreadCount: 0,
        isOnline: false,
        totalXP: showUserProfile.totalXP,
        highestRank: showUserProfile.highestRank,
        highestPosition: showUserProfile.highestPosition,
      }
      setFriends((prev) => [...prev, newFriend])
      setShowUserProfile(null)
      setShowAddConfirm(false)
    }
  }

  // Remove friend from search results
  const handleRemoveFriendFromSearch = () => {
    if (showUserProfile && showUserProfile.isFriend) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === showUserProfile.id ? { ...u, isFriend: false } : u
        )
      )
      setFriends((prev) => prev.filter((f) => f.id !== showUserProfile.id))
      if (selectedFriend?.id === showUserProfile.id) {
        setSelectedFriend(null)
      }
      setShowUserProfile(null)
      setShowDeleteConfirm(false)
    }
  }

  // Friend Profile Modal
  const renderFriendProfileModal = () => {
    if (!showFriendProfile) return null

    const leagueInfo = LEAGUES[showFriendProfile.highestRank]

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
        onClick={() => {
          setShowFriendProfile(null)
          setShowDeleteConfirm(false)
        }}
      >
        <div
          className="bg-cyan-500 backdrop-blur-xl rounded-3xl p-6 w-80 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_60px_rgba(6,182,212,0.3)] border border-cyan-300/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 text-purple-900/70 hover:text-purple-900 hover:bg-white/20"
            onClick={() => {
              setShowFriendProfile(null)
              setShowDeleteConfirm(false)
            }}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <Avatar className="w-24 h-24 border-4 border-white/50 shadow-xl">
              <AvatarImage src={showFriendProfile.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-3xl font-bold">
                {showFriendProfile.name[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name */}
          <h3 className="text-purple-900 text-xl font-bold text-center mb-4">{showFriendProfile.name}</h3>

          {/* Stats */}
          <div className="flex justify-between items-center gap-2 mb-6">
            {/* Total XP */}
            <div className="flex-1 bg-white/40 rounded-xl p-3 text-center">
              <p className="text-purple-800 text-xs uppercase tracking-wider mb-1">Points</p>
              <p className="text-purple-900 font-bold text-lg">{showFriendProfile.totalXP.toLocaleString()}</p>
            </div>

            {/* Highest Rank */}
            <div className="flex-1 bg-white/40 rounded-xl p-3 text-center">
              <p className="text-purple-800 text-xs uppercase tracking-wider mb-1">Best Rank</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg">{leagueInfo?.icon}</span>
                <span className="text-purple-900 font-bold">#{showFriendProfile.highestPosition}</span>
              </div>
            </div>
          </div>

          {/* Delete Friend Button */}
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-purple-900 text-center text-sm font-medium">Are you sure you want to remove this friend?</p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleRemoveFriend}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-purple-900/30 text-purple-900 hover:bg-white/30"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-full py-3 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white transition-all duration-300"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Remove Friend
            </Button>
          )}
        </div>
      </div>
    )
  }

  // User Profile Modal (for search results)
  const renderUserProfileModal = () => {
    if (!showUserProfile) return null

    const leagueInfo = LEAGUES[showUserProfile.highestRank]

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
        onClick={() => {
          setShowUserProfile(null)
          setShowDeleteConfirm(false)
          setShowAddConfirm(false)
        }}
      >
        <div
          className="bg-cyan-500 backdrop-blur-xl rounded-3xl p-6 w-80 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_60px_rgba(6,182,212,0.3)] border border-cyan-300/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 text-purple-900/70 hover:text-purple-900 hover:bg-white/20"
            onClick={() => {
              setShowUserProfile(null)
              setShowDeleteConfirm(false)
              setShowAddConfirm(false)
            }}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <Avatar className="w-24 h-24 border-4 border-white/50 shadow-xl">
              <AvatarImage src={showUserProfile.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-3xl font-bold">
                {showUserProfile.name[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name */}
          <h3 className="text-purple-900 text-xl font-bold text-center mb-4">{showUserProfile.name}</h3>

          {/* Stats */}
          <div className="flex justify-between items-center gap-2 mb-6">
            {/* Total XP */}
            <div className="flex-1 bg-white/40 rounded-xl p-3 text-center">
              <p className="text-purple-800 text-xs uppercase tracking-wider mb-1">Points</p>
              <p className="text-purple-900 font-bold text-lg">{showUserProfile.totalXP.toLocaleString()}</p>
            </div>

            {/* Highest Rank */}
            <div className="flex-1 bg-white/40 rounded-xl p-3 text-center">
              <p className="text-purple-800 text-xs uppercase tracking-wider mb-1">Best Rank</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg">{leagueInfo?.icon}</span>
                <span className="text-purple-900 font-bold">#{showUserProfile.highestPosition}</span>
              </div>
            </div>
          </div>

          {/* Add/Remove Friend Button */}
          {showUserProfile.isFriend ? (
            // Remove Friend
            showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-purple-900 text-center text-sm font-medium">Are you sure you want to remove this friend?</p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleRemoveFriendFromSearch}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-purple-900/30 text-purple-900 hover:bg-white/30"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full py-3 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white transition-all duration-300"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Remove Friend
              </Button>
            )
          ) : (
            // Add Friend
            <Button
              className="w-full py-3 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white transition-all duration-300"
              onClick={handleAddFriend}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add Friend
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GalaxySpiralBackground />

      {/* Decorative blur orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Friend Profile Modal */}
      {renderFriendProfileModal()}

      {/* User Profile Modal (Search) */}
      {renderUserProfileModal()}

      {/* Back Button */}
      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      {/* Main Content - New Grid Layout */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 p-8">
        <div className="flex flex-col gap-4 h-[calc(90vh-100px)] max-w-6xl w-full">
          {/* Top Row - Tabs + Search Bar (same grid) */}
          <div className="flex gap-4">
            {/* Tabs */}
            <div className="w-[380px] flex gap-4">
              <button
                onClick={() => {
                  setActiveTab("notifications")
                  setSelectedFriend(null)
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === "notifications"
                  ? "bg-yellow-400 text-purple-900 shadow-lg shadow-yellow-400/50"
                  : "bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[20px]">
                      {unreadNotifications}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("chatting")
                  setSelectedNotification(null)
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === "chatting"
                  ? "bg-cyan-400 text-purple-900 shadow-lg shadow-cyan-400/50"
                  : "bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Chatting</span>
                </div>
              </button>
            </div>

            {/* Search Bar - Same height as tabs */}
            <div className="flex-1 relative">

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name..."
                className="w-full h-full bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-gray-400 rounded-xl pl-12 focus-visible:!border-cyan-300 focus-visible:!ring-cyan-300/50"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              {searchQuery && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-white/10 w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Row - List + Content (same grid) */}
          <div className="flex gap-4 flex-1 min-h-0">
            {/* Left Panel - List */}
            <div className="w-[380px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-white font-bold text-lg">
                  {activeTab === "notifications" ? "Notifications" : `My Friends (${friends.length})`}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {activeTab === "notifications" ? (
                  // Notifications List
                  <div className="divide-y divide-white/10">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => setSelectedNotification(notification)}
                        className={`p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 ${selectedNotification?.id === notification.id ? "bg-white/15" : ""
                          } ${!notification.isRead ? "border-l-4 border-yellow-400" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.fromUser ? (
                            <Avatar className="w-12 h-12 border-2 border-white/20">
                              <AvatarImage src={notification.fromUser.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold">
                                {notification.fromUser.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-semibold text-sm">{notification.title}</h3>
                              <span className="text-gray-400 text-xs">{formatTime(notification.timestamp)}</span>
                            </div>
                            <p className="text-gray-300 text-sm truncate">
                              {notification.fromUser && <span className="text-cyan-300">{notification.fromUser.name} </span>}
                              {notification.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Friends List
                  <div className="divide-y divide-white/10">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => setSelectedFriend(friend)}
                        className={`p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 ${selectedFriend?.id === friend.id ? "bg-white/15" : ""
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12 border-2 border-white/20">
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold">
                                {friend.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            {friend.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-purple-900" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-semibold">{friend.name}</h3>
                              <span className="text-gray-400 text-xs">{formatTime(friend.lastMessageTime)}</span>
                            </div>
                            <p className="text-gray-300 text-sm truncate">{friend.lastMessage}</p>
                          </div>
                          {friend.unreadCount > 0 && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] text-center">
                              {friend.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Detail/Chat */}
            <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden flex flex-col">
              {/* Search Results */}
              {searchQuery.trim() && searchResults.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-white font-semibold">Search Results ({searchResults.length})</h3>
                  </div>
                  <div className="divide-y divide-white/10">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => setShowUserProfile(user)}
                        className="p-4 flex items-center justify-between hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-white/20">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold">
                              {user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-white font-semibold">{user.name}</h4>
                            <p className="text-gray-400 text-sm">
                              {user.totalXP.toLocaleString()} XP
                              {user.isFriend && <span className="text-cyan-400 ml-2">Friend</span>}
                            </p>
                          </div>
                        </div>
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchQuery.trim() && searchResults.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2">No users found</h3>
                  <p className="text-gray-400">Try searching with a different name</p>
                </div>
              ) : activeTab === "chatting" && selectedFriend ? (
                // Chat View
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white/20">
                        <AvatarImage src={selectedFriend.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold">
                          {selectedFriend.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-white font-bold">{selectedFriend.name}</h3>
                        <p className="text-cyan-300 text-xs">
                          {selectedFriend.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    {/* 3-dot menu button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-white/10"
                      onClick={() => setShowFriendProfile(selectedFriend)}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {(messages[selectedFriend.id] || []).map((msg) => {
                      const isOwn = msg.senderId === "current-user"
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          {!isOwn && (
                            <Avatar className="w-8 h-8 mr-2 border border-white/20">
                              <AvatarImage src={selectedFriend.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-xs font-bold">
                                {selectedFriend.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%]`}>
                            {!isOwn && (
                              <p className="text-cyan-300 text-xs font-semibold mb-1">{selectedFriend.name}</p>
                            )}
                            {msg.type === "image" && msg.imageUrl ? (
                              <img
                                src={msg.imageUrl}
                                alt="Sent image"
                                className="rounded-xl max-w-full"
                              />
                            ) : msg.type === "voice" ? (
                              <div
                                className={`px-4 py-3 rounded-2xl flex items-center gap-2 ${isOwn
                                  ? "bg-cyan-400 text-purple-900"
                                  : "bg-white/20 text-white"
                                  }`}
                              >
                                <Mic className="w-4 h-4" />
                                <p>{msg.content}</p>
                              </div>
                            ) : (
                              <div
                                className={`px-4 py-3 rounded-2xl ${isOwn
                                  ? "bg-cyan-400 text-purple-900"
                                  : "bg-white/20 text-white"
                                  }`}
                              >
                                <p>{msg.content}</p>
                              </div>
                            )}
                            <p className={`text-gray-400 text-xs mt-1 ${isOwn ? "text-right" : ""}`}>
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-white/10">
                    {isRecording ? (
                      // Recording UI
                      <div className="flex items-center gap-3 bg-red-500/20 rounded-xl p-3">
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-white font-mono text-lg">{formatRecordingTime(recordingTime)}</span>
                          <span className="text-gray-300">Recording...</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelRecording}
                          className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={handleVoiceRecord}
                          className="bg-red-500 hover:bg-red-600 rounded-xl h-10 px-4"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    ) : (
                      // Normal Input UI
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleImageUpload}
                          className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleVoiceRecord}
                          className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Mic className="w-5 h-5" />
                        </Button>
                        <Input
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendMessage()
                          }}
                          placeholder="Type a message here"
                          className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-gray-400 rounded-xl h-12 focus-visible:!border-cyan-300 focus-visible:!ring-cyan-300/50"
                        />
                        <Button
                          onClick={handleSendMessage}
                          className="bg-cyan-500 hover:bg-cyan-600 rounded-xl h-12 px-4"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : activeTab === "notifications" && selectedNotification ? (
                // Notification Detail View
                <div className="flex-1 p-8 flex flex-col items-center justify-center">
                  <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full">
                    {selectedNotification.fromUser ? (
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 border-4 border-white/20 mb-4">
                          <AvatarImage src={selectedNotification.fromUser.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-3xl font-bold">
                            {selectedNotification.fromUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-white text-xl font-bold mb-2">{selectedNotification.fromUser.name}</h3>
                        <p className="text-gray-300 mb-6">{selectedNotification.description}</p>
                        {selectedNotification.type === "friend_request" && (
                          <div className="flex gap-4">
                            <Button
                              onClick={() => handleAcceptFriendRequest(selectedNotification.id)}
                              className="bg-cyan-500 hover:bg-cyan-600 text-white px-8"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleRejectFriendRequest(selectedNotification.id)}
                              variant="outline"
                              className="border-white/30 text-white hover:bg-white/10 px-8"
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                          {getNotificationIcon(selectedNotification.type)}
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">{selectedNotification.title}</h3>
                        <p className="text-gray-300 mb-2">{selectedNotification.description}</p>
                        <p className="text-gray-400 text-sm">{formatTime(selectedNotification.timestamp)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Empty State
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    {activeTab === "notifications" ? (
                      <Bell className="w-12 h-12 text-gray-400" />
                    ) : (
                      <MessageCircle className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">
                    {activeTab === "notifications"
                      ? "Select a notification"
                      : "Select a friend to start chatting"}
                  </h3>
                  <p className="text-gray-400">
                    {activeTab === "notifications"
                      ? "Click on a notification from the list to view details"
                      : "Choose a conversation from the list on the left"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
