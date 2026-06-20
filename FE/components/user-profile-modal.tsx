"use client"

import { useEffect, useState } from "react"
import { Loader2, Trash2, UserPlus, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export type UserProfileFriendStatus =
  | "self"
  | "none"
  | "friends"
  | "pending_sent"
  | "pending_received"

export interface UserProfileModalUser {
  id: string
  name: string
  avatar?: string | null
  totalXP: number
  highestPosition: number
}

interface UserProfileModalProps {
  user: UserProfileModalUser
  friendStatus: UserProfileFriendStatus
  leagueIcon?: string
  isCurrentUser?: boolean
  isLoading?: boolean
  notice?: string | null
  onClose: () => void
  onAddFriend?: () => void | Promise<void>
  onCancelRequest?: () => void | Promise<void>
  onAcceptFriend?: () => void | Promise<void>
  onRemoveFriend?: () => void | Promise<void>
}

export function UserProfileModal({
  user,
  friendStatus,
  leagueIcon,
  isCurrentUser = false,
  isLoading = false,
  notice,
  onClose,
  onAddFriend,
  onCancelRequest,
  onAcceptFriend,
  onRemoveFriend,
}: UserProfileModalProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const shouldShowActions = !isCurrentUser && friendStatus !== "self"

  useEffect(() => {
    setShowRemoveConfirm(false)
  }, [user.id, friendStatus])

  const closeModal = () => {
    setShowRemoveConfirm(false)
    onClose()
  }

  const handleRemoveFriend = async () => {
    await onRemoveFriend?.()
    setShowRemoveConfirm(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-[1px]"
      onClick={closeModal}
    >
      <div
        className="relative w-80 rounded-3xl border border-cyan-300/50 bg-indigo-100 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_60px_rgba(6,182,212,0.3)] backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-3 top-3 text-purple-900/70 hover:bg-white/20 hover:text-purple-900"
          onClick={closeModal}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="mb-4 flex justify-center">
          <Avatar className="h-24 w-24 border-4 border-white/50 shadow-xl">
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-3xl font-bold text-white">
              {user.name[0] || "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        <h3 className="mb-4 text-center text-xl font-bold text-purple-900">{user.name}</h3>

        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex-1 rounded-xl bg-white/40 p-3 text-center">
            <p className="mb-1 text-xs uppercase tracking-wider text-purple-800">Points</p>
            <p className="text-lg font-bold text-purple-900">{user.totalXP.toLocaleString()}</p>
          </div>

          <div className="flex-1 rounded-xl bg-white/40 p-3 text-center">
            <p className="mb-1 text-xs uppercase tracking-wider text-purple-800">Best Rank</p>
            <div className="flex items-center justify-center gap-1">
              {leagueIcon && <span className="text-lg">{leagueIcon}</span>}
              <span className="font-bold text-purple-900">#{user.highestPosition}</span>
            </div>
          </div>
        </div>

        {notice && (
          <p className="mb-4 rounded-xl bg-white/50 px-3 py-2 text-center text-sm font-medium text-purple-900">
            {notice}
          </p>
        )}

        {shouldShowActions && (
          <>
            {friendStatus === "friends" ? (
              showRemoveConfirm ? (
                <div className="space-y-3">
                  <p className="text-center text-sm font-medium text-purple-900">
                    Are you sure you want to remove this friend?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-red-500 text-white hover:bg-red-600"
                      disabled={isLoading}
                      onClick={handleRemoveFriend}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-purple-900/30 text-purple-900 hover:bg-white/30"
                      disabled={isLoading}
                      onClick={() => setShowRemoveConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition-all duration-300 hover:bg-red-600"
                  disabled={isLoading}
                  onClick={() => setShowRemoveConfirm(true)}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Remove Friend
                </Button>
              )
            ) : friendStatus === "pending_sent" ? (
              <Button
                className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white transition-all duration-300 hover:bg-orange-600"
                disabled={isLoading}
                onClick={onCancelRequest}
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <X className="mr-2 h-5 w-5" />}
                Cancel Request
              </Button>
            ) : friendStatus === "pending_received" ? (
              <Button
                className="w-full rounded-xl bg-green-500 py-3 font-semibold text-white transition-all duration-300 hover:bg-green-600"
                disabled={isLoading}
                onClick={onAcceptFriend}
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                Accept Friend
              </Button>
            ) : (
              <Button
                className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-white transition-all duration-300 hover:bg-cyan-600"
                disabled={isLoading}
                onClick={onAddFriend}
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                Add Friend
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
