"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, MessageCircle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  getAdminFeedback,
  MissingFeedbackTokenError,
  updateFeedbackStatus,
  type FeedbackItem,
  type FeedbackStats,
  type FeedbackStatus,
} from "@/lib/api/feedback"

const emptyStats: FeedbackStats = {
  total: 0,
  averageRating: 0,
  unread: 0,
  bugReports: 0,
  ratingDistribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percentage: 0 })),
  byType: {},
  byStatus: {},
}

const getUserName = (feedback: FeedbackItem) =>
  feedback.user?.display_name || feedback.user?.username || feedback.user?.email || "Deleted user"

const formatDate = (value?: string | null) => {
  if (!value) return "N/A"
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export default function FeedbackPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [stats, setStats] = useState<FeedbackStats>(emptyStats)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")

  const loadFeedback = async () => {
    setIsLoading(true)
    setError("")

    try {
      const data = await getAdminFeedback({
        search: searchTerm.trim(),
        type: typeFilter,
        status: statusFilter,
        page,
        limit: 10,
      })

      setFeedback(data.feedback)
      setStats(data.stats)
      setTotalPages(Math.max(data.pagination.totalPages, 1))
      setTotalItems(data.pagination.total)

      if (selectedFeedback && !data.feedback.some((item) => item.id === selectedFeedback.id)) {
        setSelectedFeedback(null)
      }
    } catch (err) {
      if (err instanceof MissingFeedbackTokenError) {
        setError("Please sign in with an admin account to view feedback.")
      } else {
        setError(err instanceof Error ? err.message : "Could not load feedback.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, statusFilter, page])

  const handleStatusChange = async (status: FeedbackStatus) => {
    if (!selectedFeedback || isUpdating) return
    setIsUpdating(true)
    setError("")

    try {
      const updated = await updateFeedbackStatus(selectedFeedback.id, status)
      setSelectedFeedback(updated)
      setFeedback((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      await loadFeedback()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update feedback status.")
    } finally {
      setIsUpdating(false)
    }
  }

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
      ))}
    </div>
  )

  const statCards = [
    { label: "Total Feedback", value: stats.total.toLocaleString(), color: "text-primary" },
    { label: "Avg Rating", value: `${stats.averageRating.toFixed(1)}/5`, color: "text-primary" },
    { label: "Unread", value: stats.unread.toLocaleString(), color: "text-primary" },
    { label: "Bug Reports", value: stats.bugReports.toLocaleString(), color: "text-destructive" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feedback & Reviews</h1>
          <p className="text-muted-foreground mt-2">View and manage user feedback, reviews, and suggestions</p>
        </div>
        <Button variant="outline" onClick={loadFeedback} disabled={isLoading} className="w-fit border-border bg-transparent text-foreground hover:text-foreground/50 hover:bg-secondary transition-colors">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">User Feedback</CardTitle>
              <CardDescription>All feedback and reviews from users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full md:w-40 bg-input border-border text-foreground">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Suggestion">Suggestion</SelectItem>
                    <SelectItem value="Bug Report">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full md:w-40 bg-input border-border text-foreground">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="rounded-lg border border-border bg-secondary p-6 text-sm text-muted-foreground">
                    Loading feedback...
                  </div>
                ) : feedback.length === 0 ? (
                  <div className="rounded-lg border border-border bg-secondary p-6 text-sm text-muted-foreground">
                    No feedback matches the current filters.
                  </div>
                ) : (
                  feedback.map((fb) => (
                    <button
                      key={fb.id}
                      type="button"
                      onClick={() => setSelectedFeedback(fb)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedFeedback?.id === fb.id
                          ? "bg-primary/10 border-primary"
                          : "bg-secondary border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p className="font-medium text-foreground">{getUserName(fb)}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                fb.type === "Bug Report"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : fb.type === "Suggestion"
                                    ? "bg-accent/10 text-accent border-accent/30"
                                    : "bg-primary/10 text-primary border-primary/30"
                              }`}
                            >
                              {fb.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {fb.status}
                            </Badge>
                            {fb.status === "unread" && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <div className="mb-2">{renderStars(fb.rating)}</div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{fb.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{formatDate(fb.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {feedback.length} of {totalItems} feedback
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    className="border-border bg-transparent"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                    className="border-border bg-transparent"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedFeedback && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Feedback Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User</p>
                  <p className="font-medium text-foreground">{getUserName(selectedFeedback)}</p>
                  {selectedFeedback.user?.email && <p className="text-xs text-muted-foreground">{selectedFeedback.user.email}</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <Badge
                    className={`${
                      selectedFeedback.type === "Bug Report"
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : selectedFeedback.type === "Suggestion"
                          ? "bg-accent/10 text-accent border-accent/30"
                          : "bg-primary/10 text-primary border-primary/30"
                    }`}
                  >
                    {selectedFeedback.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rating</p>
                  {renderStars(selectedFeedback.rating)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedFeedback.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Message</p>
                  <p className="text-foreground text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="text-foreground text-sm">{formatDate(selectedFeedback.created_at)}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    disabled={isUpdating || selectedFeedback.status === "read"}
                    onClick={() => handleStatusChange("read")}
                    className="border-border bg-transparent"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mark as Read
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isUpdating || selectedFeedback.status === "resolved"}
                    onClick={() => handleStatusChange("resolved")}
                  >
                    Resolve Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.ratingDistribution.map((item) => (
                <div key={item.stars} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm text-foreground">{item.stars} stars</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
