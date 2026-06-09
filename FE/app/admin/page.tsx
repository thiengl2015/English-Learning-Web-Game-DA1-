"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, TrendingUp, UserPlus, MessageSquare, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAdminDashboardSummary, type AdminDashboardSummary } from "@/lib/api/admin"

const fallbackSummary: AdminDashboardSummary = {
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    newThisMonth: 0,
    feedbackCount: 0,
    trends: {
      totalUsers: "0%",
      activeUsers: "0%",
      newThisMonth: "0%",
      feedbackCount: "0%",
    },
  },
  userGrowth: [],
  subscriptions: [],
  recentActivity: [],
}

const subscriptionColors: Record<string, string> = {
  Free: "#a1a1aa",
  Premium: "#00d9ff",
  Super: "#facc15",
}

const topFavoritedTopics = [
  { rank: "01", name: "Unit 1: Greetings", popularity: 450, percentage: "46%" },
  { rank: "02", name: "Unit 2: Food & Drinks", popularity: 420, percentage: "43%" },
  { rank: "03", name: "Unit 3: Daily Activities", popularity: 380, percentage: "39%" },
  { rank: "04", name: "Unit 4: Travel", popularity: 350, percentage: "36%" },
]

const formatTime = (value?: string | null) => {
  if (!value) return "N/A"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary>(fallbackSummary)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = async () => {
    setIsLoading(true)
    setError("")

    try {
      const data = await getAdminDashboardSummary()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground">{payload[0].payload.period}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const statCards = [
    {
      title: "Total Users",
      value: summary.stats.totalUsers.toLocaleString(),
      icon: Users,
      trend: summary.stats.trends.totalUsers,
    },
    {
      title: "Active Users",
      value: summary.stats.activeUsers.toLocaleString(),
      icon: TrendingUp,
      trend: summary.stats.trends.activeUsers,
    },
    {
      title: "New This Month",
      value: summary.stats.newThisMonth.toLocaleString(),
      icon: UserPlus,
      trend: summary.stats.trends.newThisMonth,
    },
    {
      title: "Feedback Count",
      value: summary.stats.feedbackCount.toLocaleString(),
      icon: MessageSquare,
      trend: summary.stats.trends.feedbackCount,
    },
  ]

  const subscriptionSummary = summary.subscriptions.map((item) => ({
    ...item,
    color: subscriptionColors[item.name] || "#7c3aed",
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your platform overview.</p>
        </div>
        <Button variant="outline" onClick={loadDashboard} disabled={isLoading} className="w-fit border-border bg-transparent">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                    <p className="text-xs text-primary mt-2">{stat.trend} from last month</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="bg-card border-border lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-foreground">User Growth</CardTitle>
            <CardDescription>Monthly registered and active users</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                users: { label: "Total Users", color: "#00d9ff" },
                active: { label: "Active Users", color: "#7c3aed" },
              }}
              className="h-80 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.userGrowth} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3a52" />
                  <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#00d9ff" strokeWidth={2} dot={{ fill: "#00d9ff", r: 4 }} />
                  <Line type="monotone" dataKey="active" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Users' Subscription</CardTitle>
            <CardDescription>Subscription distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ChartContainer
              config={{
                free: { label: "Free", color: "#a1a1aa" },
                premium: { label: "Premium", color: "#00d9ff" },
                super: { label: "Super", color: "#facc15" },
              }}
              className="w-full h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={subscriptionSummary} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                    {subscriptionSummary.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border w-full justify-center">
              {subscriptionSummary.map((item) => (
                <div key={item.name} className="text-center">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Most Favorited Topics</CardTitle>
          <CardDescription>Top 4 units with most user favorites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topFavoritedTopics.map((topic) => (
              <div key={topic.rank} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                <div className="w-8 text-center">
                  <p className="font-bold text-primary text-lg">{topic.rank}</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{topic.name}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(topic.popularity / 450) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right">
                  <p className="font-semibold text-primary">{topic.percentage}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription>Latest account and feedback activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              summary.recentActivity.map((activity, idx) => (
                <div key={`${activity.user}-${activity.action}-${idx}`} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(activity.time)}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
