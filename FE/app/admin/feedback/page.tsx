"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const mockFeedback = [
  {
    id: 1,
    user: "John Doe",
    type: "Review",
    rating: 5,
    message: "Great app! The games are fun and I'm learning a lot.",
    date: "2024-03-15",
    status: "read",
  },
  {
    id: 2,
    user: "Jane Smith",
    type: "Suggestion",
    rating: 4,
    message: "Would love to see more listening exercises.",
    date: "2024-03-14",
    status: "unread",
  },
  {
    id: 3,
    user: "Mike Johnson",
    type: "Bug Report",
    rating: 2,
    message: "The audio doesn't play on some questions.",
    date: "2024-03-13",
    status: "unread",
  },
  {
    id: 4,
    user: "Sarah Williams",
    type: "Review",
    rating: 4,
    message: "Very helpful for improving my English skills.",
    date: "2024-03-12",
    status: "read",
  },
  {
    id: 5,
    user: "Tom Brown",
    type: "Suggestion",
    rating: 3,
    message: "Can we have offline mode?",
    date: "2024-03-11",
    status: "read",
  },
]

const feedbackStats = [
  { label: "Total Feedback", value: "342", color: "text-primary" },
  { label: "Avg Rating", value: "4.2/5", color: "text-primary" },
  { label: "Unread", value: "28", color: "text-primary" },
  { label: "Bug Reports", value: "12", color: "text-destructive" },
]

const ratingDistribution = [
  { stars: 5, count: 156, percentage: 46 },
  { stars: 4, count: 98, percentage: 29 },
  { stars: 3, count: 56, percentage: 16 },
  { stars: 2, count: 22, percentage: 6 },
  { stars: 1, count: 10, percentage: 3 },
]

export default function FeedbackPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedFeedback, setSelectedFeedback] = useState<(typeof mockFeedback)[0] | null>(null)

  const filteredFeedback = mockFeedback.filter((fb) => {
    const matchesSearch =
      fb.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || fb.type === typeFilter
    const matchesStatus = statusFilter === "all" || fb.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
      ))}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback & Reviews</h1>
        <p className="text-muted-foreground mt-2">View and manage user feedback, reviews, and suggestions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {feedbackStats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">User Feedback</CardTitle>
              <CardDescription>All feedback and reviews from users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40 bg-input border-border text-foreground">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Feedback Items */}
              <div className="space-y-3">
                {filteredFeedback.map((fb) => (
                  <div
                    key={fb.id}
                    onClick={() => setSelectedFeedback(fb)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedFeedback?.id === fb.id
                        ? "bg-primary/10 border-primary"
                        : "bg-secondary border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-foreground">{fb.user}</p>
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
                          {fb.status === "unread" && <div className="w-2 h-2 rounded-full bg-primary ml-auto" />}
                        </div>
                        <div className="mb-2">{renderStars(fb.rating)}</div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{fb.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{fb.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Details & Rating Distribution */}
        <div className="space-y-6">
          {/* Selected Feedback Details */}
          {selectedFeedback && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Feedback Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">User</p>
                  <p className="font-medium text-foreground">{selectedFeedback.user}</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Message</p>
                  <p className="text-foreground text-sm">{selectedFeedback.message}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="text-foreground text-sm">{selectedFeedback.date}</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Reply to User
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratingDistribution.map((item) => (
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
