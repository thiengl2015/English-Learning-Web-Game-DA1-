"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowLeft, Send, Mic, ImageIcon, Bell, MessageCircle, UserPlus, Trophy, Gift, X, MoreVertical, Trash2, Square, Search, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GalaxySpiralBackground } from "@/components/galaxy-spiral-background"

type TabType = "notifications" | "chatting"
type FriendStatus = "none" | "friends" | "pending_sent" | "pending_received"
type FriendRequestStatus = "pending" | "accepted" | "rejected" | "cancelled"

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  type: "text" | "voice" | "image"
  imageUrl?: string
  voiceUrl?: string
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
  type: string
  title: string
  description: string
  timestamp: Date
  isRead: boolean
  friendRequestStatus?: FriendRequestStatus
  fromUser?: {
    id: string
    name: string
    avatar: string
    totalXP: number
    highestRank: string
    highestPosition: number
  }
}

interface PendingFriendRequest {
  id: string
  name: string
  username?: string
  avatar: string
  totalXP: number
  highestRank?: string
  league?: string
  highestPosition?: number
}

interface PendingFriendRequestsResponse {
  received: PendingFriendRequest[]
  sent: PendingFriendRequest[]
}

interface User {
  id: string
  name: string
  avatar: string
  totalXP: number
  highestRank: string
  highestPosition: number
  isFriend: boolean
  friendStatus?: FriendStatus
}

const LEAGUES: Record<string, { icon: string; color: string }> = {
  Bronze: { icon: "🥉", color: "text-orange-400" },
  Silver: { icon: "🥈", color: "text-gray-300" },
  Gold: { icon: "🥇", color: "text-yellow-400" },
  Diamond: { icon: "💎", color: "text-cyan-400" },
  Master: { icon: "👑", color: "text-purple-400" },
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "")
const API_ROOT = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`
const SERVER_ROOT = API_ROOT.replace(/\/api$/, "")

interface ApiResponse<T> {
  success: boolean
  message?: string
  code?: string
  data: T
}

const resolveAssetUrl = (url?: string) => {
  if (!url) return "/placeholder.svg"
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url
  if (url.startsWith("/uploads")) return `${SERVER_ROOT}${url}`
  return url
}

const normalizeNotificationUser = (user: any) => ({
  id: user.id,
  name: user.name || user.display_name || user.username || "Unknown user",
  avatar: resolveAssetUrl(user.avatar),
  totalXP: user.totalXP || user.total_xp || 0,
  highestRank: user.highestRank || user.league || "Bronze",
  highestPosition: user.highestPosition || 1,
})

const getChatMediaDownloadUrl = (url: string) => {
  const marker = "/uploads/chat/"
  const markerIndex = url.indexOf(marker)
  if (markerIndex === -1) return url
  const filename = url.slice(markerIndex + marker.length).split(/[?#]/)[0]
  return `${API_ROOT}/messages/media/download/${encodeURIComponent(filename)}`
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("chatting")
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showFriendProfile, setShowFriendProfile] = useState<Friend | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [showUserProfile, setShowUserProfile] = useState<User | null>(null)
  const [showAddConfirm, setShowAddConfirm] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("current-user")
  const [notice, setNoticeRaw] = useState("")
  const [noticeVariant, setNoticeVariant] = useState<"info" | "error">("info")
  const notify = (text: string, variant: "info" | "error" = "info") => {
    setNoticeRaw(text)
    setNoticeVariant(variant)
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimeRef = useRef(0)
  const recordingCanceledRef = useRef(false)
  const currentUserIdRef = useRef("current-user")
  const selectedFriendIdRef = useRef<string | null>(null)

  const getToken = () => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("token") || ""
  }

  const authHeaders = (): Record<string, string> => {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const normalizeFriend = (friend: Friend): Friend => ({
    ...friend,
    avatar: resolveAssetUrl(friend.avatar),
    lastMessageTime: new Date(friend.lastMessageTime || Date.now()),
    lastMessage: friend.lastMessage || "Start a conversation",
  })

  const normalizeUser = (user: User): User => {
    const friendStatus = user.friendStatus || (user.isFriend ? "friends" : "none")
    return {
      ...user,
      avatar: resolveAssetUrl(user.avatar),
      friendStatus,
      isFriend: friendStatus === "friends",
    }
  }

  const normalizeMessage = (incoming: Message & { receiverId?: string; created_at?: string | Date }): Message => ({
    id: incoming.id,
    senderId: incoming.senderId,
    content: incoming.content,
    timestamp: new Date(incoming.timestamp || incoming.created_at || Date.now()),
    type: incoming.type,
    imageUrl: incoming.imageUrl ? resolveAssetUrl(incoming.imageUrl) : undefined,
    voiceUrl: incoming.voiceUrl ? resolveAssetUrl(incoming.voiceUrl) : undefined,
    voiceDuration: incoming.voiceDuration,
  })

  const fetchJson = async <T,>(url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value))

    const res = await fetch(url, {
      ...init,
      headers,
    })
    const json = (await res.json()) as ApiResponse<T>
    if (!res.ok || !json.success) {
      const error = new Error(json.message || "Request failed") as Error & { code?: string }
      error.code = json.code
      throw error
    }
    return json.data
  }

  const appendMessage = useCallback((friendId: string, incoming: Message & { receiverId?: string; created_at?: string | Date }) => {
    const normalized = normalizeMessage(incoming)
    setMessages((prev) => {
      const current = prev[friendId] || []
      if (current.some((item) => item.id === normalized.id)) return prev
      return {
        ...prev,
        [friendId]: [...current, normalized],
      }
    })

    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === friendId
          ? {
            ...friend,
            lastMessage:
              normalized.type === "image"
                ? "Image"
                : normalized.type === "voice"
                  ? "Voice message"
                  : normalized.content,
            lastMessageTime: normalized.timestamp,
            unreadCount:
              normalized.senderId !== currentUserIdRef.current &&
                selectedFriendIdRef.current !== friendId
                ? friend.unreadCount + 1
                : friend.unreadCount,
          }
          : friend
      )
    )
  }, [])

  const loadFriends = useCallback(async () => {
    const data = await fetchJson<Friend[]>(`${API_ROOT}/friends`)
    setFriends(data.map(normalizeFriend))
  }, [])

  const loadConversation = useCallback(async (friendId: string) => {
    const data = await fetchJson<Message[]>(`${API_ROOT}/messages/${friendId}`)
    setMessages((prev) => ({
      ...prev,
      [friendId]: data.map(normalizeMessage),
    }))
    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === friendId ? { ...friend, unreadCount: 0 } : friend
      )
    )
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const [data, pendingRequests] = await Promise.all([
        fetchJson<{ notifications: any[]; unread_count: number }>(`${API_ROOT}/notifications`),
        fetchJson<PendingFriendRequestsResponse>(`${API_ROOT}/friends/requests`).catch(() => ({
          received: [],
          sent: [],
        })),
      ])

      const pendingReceived = pendingRequests.received || []
      const nextNotifications: Notification[] = (data.notifications || []).map((n) => {
        const metadataUser = n.metadata?.fromUser
        const matchedPendingRequest =
          n.type === "friend_request"
            ? pendingReceived.find((request) => {
                const message = String(n.message || "").toLowerCase()
                const requestName = String(request.name || "").toLowerCase()
                const requestUsername = String(request.username || "").toLowerCase()
                return (
                  metadataUser?.id === request.id ||
                  (requestName.length > 0 && message.includes(requestName)) ||
                  (requestUsername.length > 0 && message.includes(requestUsername))
                )
              })
            : null

        const friendRequestStatus: FriendRequestStatus | undefined =
          n.type === "friend_request" && matchedPendingRequest ? "pending" : undefined

        return {
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.message,
          timestamp: new Date(n.created_at),
          isRead: n.is_read,
          friendRequestStatus,
          fromUser: metadataUser
            ? normalizeNotificationUser(metadataUser)
            : matchedPendingRequest
              ? normalizeNotificationUser(matchedPendingRequest)
              : undefined,
        }
      })

      setNotifications(nextNotifications)
      setSelectedNotification((current) =>
        current ? nextNotifications.find((notification) => notification.id === current.id) || null : current
      )
    } catch {
      /* ignore – notifications are non-critical */
    }
  }, [])

  useEffect(() => {
    currentUserIdRef.current = currentUserId
  }, [currentUserId])

  useEffect(() => {
    selectedFriendIdRef.current = selectedFriend?.id || null
  }, [selectedFriend])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      notify("Please sign in to use chat.")
      return
    }

    let isMounted = true
    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1] || "")) as { id?: string }
      if (tokenPayload.id) {
        currentUserIdRef.current = tokenPayload.id
        setCurrentUserId(tokenPayload.id)
      }
    } catch {
      // Profile request below is the authoritative fallback.
    }

    fetchJson<{ id: string }>(`${API_ROOT}/users/profile`)
      .then((profile) => {
        if (isMounted) setCurrentUserId(profile.id)
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Cannot load profile"))

    loadFriends().catch((err) =>
      notify(err instanceof Error ? err.message : "Cannot load friends")
    )

    loadNotifications().catch(() => {})

    const socket = io(SERVER_ROOT, {
      auth: { token },
      transports: ["websocket", "polling"],
    })
    socketRef.current = socket

    socket.on("connect_error", (err) => {
      notify(err.message || "Socket connection failed")
    })

    socket.on("direct:message", (incoming: Message & { receiverId?: string; created_at?: string | Date }) => {
      const friendId =
        incoming.senderId === currentUserIdRef.current
          ? incoming.receiverId
          : incoming.senderId

      if (friendId) {
        appendMessage(friendId, incoming)
      }
    })

    socket.on("direct:user_online", ({ userId }: { userId: string }) => {
      setFriends((prev) => prev.map((friend) => friend.id === userId ? { ...friend, isOnline: true } : friend))
    })

    socket.on("direct:user_offline", ({ userId }: { userId: string }) => {
      setFriends((prev) => prev.map((friend) => friend.id === userId ? { ...friend, isOnline: false } : friend))
    })

    socket.on("friend:removed", ({ userId }: { userId: string }) => {
      setFriends((prev) => prev.filter((friend) => friend.id !== userId))
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, friendStatus: "none", isFriend: false }
            : user
        )
      )
      setSelectedFriend((prev) => (prev?.id === userId ? null : prev))
      setShowFriendProfile((prev) => (prev?.id === userId ? null : prev))
    })

    socket.on(
      "friend:request_resolved",
      ({
        requesterId,
        addresseeId,
        status,
      }: {
        requesterId: string
        addresseeId: string
        status: FriendRequestStatus
      }) => {
        const currentUserId = currentUserIdRef.current
        const otherUserId = currentUserId === requesterId ? addresseeId : requesterId
        const nextFriendStatus: FriendStatus = status === "accepted" ? "friends" : "none"

        updateSearchUserFriendStatus(otherUserId, nextFriendStatus)

        if (status === "accepted") {
          loadFriends().catch(() => {})
        }

        if (currentUserId === addresseeId) {
          updateFriendRequestNotificationStatus(requesterId, status)
        }
      }
    )

    socket.on("notification:new", () => {
      loadNotifications().catch(() => {})
    })

    return () => {
      isMounted = false
      socket.disconnect()
      socketRef.current = null
    }
  }, [appendMessage, loadFriends, loadNotifications])

  useEffect(() => {
    if (selectedFriend) {
      loadConversation(selectedFriend.id).catch((err) =>
        notify(err instanceof Error ? err.message : "Cannot load messages")
      )
    }
  }, [selectedFriend, loadConversation])

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 1) {
      setAllUsers([])
      return
    }

    const timeout = setTimeout(() => {
      fetchJson<User[]>(`${API_ROOT}/users/search?q=${encodeURIComponent(query)}`)
        .then((data) => setAllUsers(data.map(normalizeUser)))
        .catch((err) => notify(err instanceof Error ? err.message : "Cannot search users"))
    }, 250)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1
          recordingTimeRef.current = next
          return next
        })
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

  const sendDirectMessage = async (friendId: string, payload: { type: Message["type"]; content: string; mediaUrl?: string; voiceDuration?: number }) => {
    const socket = socketRef.current

    if (socket?.connected) {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          reject(new Error("Message send timed out"))
        }, 8000)

        socket.emit("direct:message", { receiverId: friendId, ...payload }, (response: { success: boolean; error?: string; code?: string }) => {
          window.clearTimeout(timer)
          if (response?.success) {
            resolve()
            return
          }

          const error = new Error(response?.error || "Cannot send message") as Error & { code?: string }
          error.code = response?.code
          reject(error)
        })
      })
      return
    }

    const sent = await fetchJson<Message>(`${API_ROOT}/messages/${friendId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    appendMessage(friendId, sent)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedFriend) return

    const content = message.trim()
    setMessage("")

    try {
      await sendDirectMessage(selectedFriend.id, {
        type: "text",
        content,
      })
    } catch (err) {
      const code = (err as { code?: string })?.code
      notify(err instanceof Error ? err.message : "Cannot send message", code === "CONTENT_BLOCKED" ? "error" : "info")
      setMessage(content)
    }
  }

  const uploadChatMedia = async (file: File) => {
    const formData = new FormData()
    formData.append("media", file)

    return fetchJson<{ mediaUrl: string }>(`${API_ROOT}/messages/media`, {
      method: "POST",
      body: formData,
    })
  }

  const handleDownloadImage = async (url: string) => {
    try {
      const downloadUrl = getChatMediaDownloadUrl(url)
      const res = await fetch(downloadUrl, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        throw new Error("Cannot download image")
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = url.split("/").pop()?.split("?")[0] || `chat-image-${Date.now()}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      notify(err instanceof Error ? err.message : "Cannot download image")
    }
  }

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const recorder = mediaRecorderRef.current
      setIsRecording(false)
      if (recorder && recorder.state !== "inactive") {
        recorder.stop()
      }
      return
    }

    if (!selectedFriend) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recordingCanceledRef.current = false
      recordingTimeRef.current = 0
      setRecordingTime(0)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        if (recordingCanceledRef.current || !selectedFriendIdRef.current || audioChunksRef.current.length === 0) {
          return
        }

        const duration = Math.max(recordingTimeRef.current, 1)
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" })

        try {
          const uploaded = await uploadChatMedia(audioFile)
          await sendDirectMessage(selectedFriendIdRef.current, {
            type: "voice",
            content: `Voice message (${formatRecordingTime(duration)})`,
            mediaUrl: uploaded.mediaUrl,
            voiceDuration: duration,
          })
        } catch (err) {
          notify(err instanceof Error ? err.message : "Cannot send voice message")
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      notify(err instanceof Error ? err.message : "Cannot start recording")
    }
  }

  const handleCancelRecording = () => {
    recordingCanceledRef.current = true
    const recorder = mediaRecorderRef.current
    setIsRecording(false)
    setRecordingTime(0)
    recordingTimeRef.current = 0
    if (recorder && recorder.state !== "inactive") {
      recorder.stop()
    }
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedFriend) {
      try {
        const uploaded = await uploadChatMedia(file)
        await sendDirectMessage(selectedFriend.id, {
          type: "image",
          content: "Image",
          mediaUrl: uploaded.mediaUrl,
        })
      } catch (err) {
        const code = (err as { code?: string })?.code
        notify(err instanceof Error ? err.message : "Cannot send image", code === "CONTENT_BLOCKED" ? "error" : "info")
      } finally {
        e.target.value = ""
      }
    }
  }

  const handleAcceptFriendRequest = async (n: Notification) => {
    const requesterId = n.fromUser?.id
    try {
      if (!requesterId) {
        throw new Error("Friend request is no longer available")
      }
      await fetchJson(`${API_ROOT}/friends/${requesterId}/accept`, { method: "POST" })
      loadFriends().catch(() => {})
      updateSearchUserFriendStatus(requesterId, "friends")
      updateFriendRequestNotificationStatus(requesterId, "accepted")
    } catch (err) {
      notify(err instanceof Error ? err.message : "Cannot accept friend request")
    }
  }

  const handleRejectFriendRequest = async (n: Notification) => {
    const requesterId = n.fromUser?.id
    try {
      if (!requesterId) {
        throw new Error("Friend request is no longer available")
      }
      await fetchJson(`${API_ROOT}/friends/${requesterId}/reject`, { method: "POST" })
      updateSearchUserFriendStatus(requesterId, "none")
      updateFriendRequestNotificationStatus(requesterId, "rejected")
    } catch (err) {
      notify(err instanceof Error ? err.message : "Cannot reject friend request")
    }
  }

  const handleRemoveFriend = async () => {
    if (showFriendProfile) {
      try {
        await fetchJson(`${API_ROOT}/friends/${showFriendProfile.id}`, {
          method: "DELETE",
        })
        setFriends((prev) => prev.filter((f) => f.id !== showFriendProfile.id))
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === showFriendProfile.id
              ? { ...u, friendStatus: "none", isFriend: false }
              : u
          )
        )
        if (selectedFriend?.id === showFriendProfile.id) {
          setSelectedFriend(null)
        }
        setShowFriendProfile(null)
        setShowDeleteConfirm(false)
      } catch (err) {
        notify(err instanceof Error ? err.message : "Cannot remove friend")
      }
    }
  }

  const handleSelectNotification = (n: Notification) => {
    setSelectedNotification(n)
    if (!n.isRead) {
      fetchJson(`${API_ROOT}/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {})
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="w-5 h-5 text-cyan-400" />
      case "achievement":
      case "rank_up":
      case "top_3_rank":
        return <Trophy className="w-5 h-5 text-yellow-400" />
      case "rank_down":
        return <Trophy className="w-5 h-5 text-gray-400" />
      case "event":
        return <Bell className="w-5 h-5 text-orange-400" />
      case "payment":
      case "premium_purchase":
        return <Gift className="w-5 h-5 text-green-400" />
      default:
        return <Bell className="w-5 h-5 text-white" />
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead).length

  // Search users by name
  const searchResults = searchQuery.trim()
    ? allUsers
    : []

  const updateSearchUserFriendStatus = (userId: string, friendStatus: FriendStatus) => {
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, friendStatus, isFriend: friendStatus === "friends" }
          : u
      )
    )
    setShowUserProfile((prev) =>
      prev && prev.id === userId
        ? { ...prev, friendStatus, isFriend: friendStatus === "friends" }
        : prev
    )
  }

  const updateFriendRequestNotificationStatus = (requesterId: string, friendRequestStatus: FriendRequestStatus) => {
    const updateNotification = (notification: Notification) =>
      notification.type === "friend_request" && notification.fromUser?.id === requesterId
        ? { ...notification, friendRequestStatus }
        : notification

    setNotifications((prev) => prev.map(updateNotification))
    setSelectedNotification((prev) => (prev ? updateNotification(prev) : prev))
  }

  // Add friend function
  const handleAddFriend = async () => {
    if (showUserProfile && (showUserProfile.friendStatus || "none") === "none") {
      try {
        await fetchJson(`${API_ROOT}/friends/${showUserProfile.id}`, {
          method: "POST",
        })
        updateSearchUserFriendStatus(showUserProfile.id, "pending_sent")
        setShowAddConfirm(false)
        notify(`Friend request sent to ${showUserProfile.name}`)
      } catch (err) {
        notify(err instanceof Error ? err.message : "Cannot add friend")
      }
    }
  }

  const handleCancelFriendRequestFromSearch = async () => {
    if (showUserProfile && showUserProfile.friendStatus === "pending_sent") {
      try {
        await fetchJson(`${API_ROOT}/friends/requests/${showUserProfile.id}`, {
          method: "DELETE",
        })
        updateSearchUserFriendStatus(showUserProfile.id, "none")
        notify(`Friend request to ${showUserProfile.name} was cancelled`)
      } catch (err) {
        notify(err instanceof Error ? err.message : "Cannot cancel friend request")
      }
    }
  }

  const handleAcceptFriendFromSearch = async () => {
    if (showUserProfile && showUserProfile.friendStatus === "pending_received") {
      try {
        await fetchJson(`${API_ROOT}/friends/${showUserProfile.id}/accept`, {
          method: "POST",
        })
        updateSearchUserFriendStatus(showUserProfile.id, "friends")
        loadFriends().catch(() => {})
        notify(`You are now friends with ${showUserProfile.name}`)
      } catch (err) {
        notify(err instanceof Error ? err.message : "Cannot accept friend request")
      }
    }
  }

  // Remove friend from search results
  const handleRemoveFriendFromSearch = async () => {
    if (showUserProfile && showUserProfile.isFriend) {
      try {
        await fetchJson(`${API_ROOT}/friends/${showUserProfile.id}`, {
          method: "DELETE",
        })
        updateSearchUserFriendStatus(showUserProfile.id, "none")
        setFriends((prev) => prev.filter((f) => f.id !== showUserProfile.id))
        if (selectedFriend?.id === showUserProfile.id) {
          setSelectedFriend(null)
        }
        setShowUserProfile(null)
        setShowDeleteConfirm(false)
      } catch (err) {
        notify(err instanceof Error ? err.message : "Cannot remove friend")
      }
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
          className="bg-indigo-100 backdrop-blur-xl rounded-3xl p-6 w-80 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_60px_rgba(6,182,212,0.3)] border border-cyan-300/50"
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
    const friendStatus = showUserProfile.friendStatus || (showUserProfile.isFriend ? "friends" : "none")

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
          className="bg-indigo-100 backdrop-blur-xl rounded-3xl p-6 w-80 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_60px_rgba(6,182,212,0.3)] border border-cyan-300/50"
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
          {friendStatus === "friends" ? (
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
          ) : friendStatus === "pending_sent" ? (
            <Button
              className="w-full py-3 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300"
              onClick={handleCancelFriendRequestFromSearch}
            >
              <X className="w-5 h-5 mr-2" />
              Cancel Request
            </Button>
          ) : friendStatus === "pending_received" ? (
            <Button
              className="w-full py-3 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white transition-all duration-300"
              onClick={handleAcceptFriendFromSearch}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Accept Friend
            </Button>
          ) : (
            // Add Friend
            <Button
              className="w-full py-3 rounded-xl font-semibold bg-cyan-500 hover:bg-cyan-600 text-white transition-all duration-300"
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
          {notice && (
            <div
              className={`flex items-center justify-between rounded-xl border px-4 py-2 text-sm ${
                noticeVariant === "error"
                  ? "border-red-400/50 bg-red-950/70 text-red-100"
                  : "border-cyan-300/30 bg-slate-950/70 text-cyan-100"
              }`}
            >
              <span className="flex items-center gap-2">
                {noticeVariant === "error" && (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
                )}
                {notice}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => notify("")}
                className={`h-7 w-7 hover:bg-white/10 ${noticeVariant === "error" ? "text-red-100" : "text-cyan-100"}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
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
                    {notifications.length === 0 && (
                      <p className="p-6 text-center text-gray-400 text-sm">No notifications yet.</p>
                    )}
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleSelectNotification(notification)}
                        className={`p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 ${selectedNotification?.id === notification.id ? "bg-white/15" : ""
                          } ${!notification.isRead ? "border-l-4 border-yellow-400" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-semibold text-sm">{notification.title}</h3>
                              <span className="text-gray-400 text-xs">{formatTime(notification.timestamp)}</span>
                            </div>
                            <p className="text-gray-300 text-sm truncate">
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
                    {searchResults.map((user) => {
                      const friendStatus = user.friendStatus || (user.isFriend ? "friends" : "none")
                      return (
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
                                {friendStatus === "friends" && <span className="text-cyan-400 ml-2">Friend</span>}
                                {friendStatus === "pending_sent" && <span className="text-orange-300 ml-2">Request sent</span>}
                                {friendStatus === "pending_received" && <span className="text-green-300 ml-2">Wants to connect</span>}
                              </p>
                            </div>
                          </div>
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </div>
                      )
                    })}
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
                      const isOwn = msg.senderId === currentUserId
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
                              <div className="space-y-2">
                                <img
                                  src={msg.imageUrl}
                                  alt="Sent image"
                                  className="rounded-xl max-w-full"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDownloadImage(msg.imageUrl!)}
                                  className={`text-xs underline ${isOwn ? "text-cyan-100" : "text-cyan-300"}`}
                                >
                                  Download image
                                </button>
                              </div>
                            ) : msg.type === "voice" ? (
                              <div
                                className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${isOwn
                                  ? "bg-cyan-400 text-purple-900"
                                  : "bg-white/20 text-white"
                                  }`}
                              >
                                <Mic className="w-4 h-4" />
                                {msg.voiceUrl ? (
                                  <audio controls src={msg.voiceUrl} className="h-8 max-w-[220px]" />
                                ) : (
                                  <p>{msg.content}</p>
                                )}
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
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        {getNotificationIcon(selectedNotification.type)}
                      </div>
                      <h3 className="text-white text-xl font-bold mb-2">{selectedNotification.title}</h3>
                      <p className="text-gray-300 mb-2">{selectedNotification.description}</p>
                      {selectedNotification.type === "friend_request" &&
                        selectedNotification.friendRequestStatus === "pending" &&
                        selectedNotification.fromUser && (
                        <div className="mb-3 mt-2 flex gap-3">
                          <Button
                            onClick={() => handleAcceptFriendRequest(selectedNotification)}
                            className="h-9 bg-cyan-500 px-5 text-white hover:bg-cyan-500/80 transition-colors"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectFriendRequest(selectedNotification)}
                            variant="outline"
                            className="h-9 border-white/30 px-5 text-foreground hover:text-foreground/50 bg-white/20 hover:bg-white/5"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      <p className="text-gray-400 text-sm">{formatTime(selectedNotification.timestamp)}</p>
                    </div>
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
