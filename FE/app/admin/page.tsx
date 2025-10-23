"use client"

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
import { Users, TrendingUp, Zap, MessageSquare } from "lucide-react"
import { useState } from "react"

const userGrowthDataWeek = [
  { period: "06/07", users: 400, active: 240 },
  { period: "07/07", users: 520, active: 320 },
  { period: "08/07", users: 680, active: 450 },
  { period: "09/07", users: 890, active: 620 },
  { period: "10/07", users: 1200, active: 850 },
  { period: "11/07", users: 1450, active: 1050 },
  { period: "12/07", users: 1680, active: 1200 },
  { period: "13/07", users: 1850, active: 1350 },
]

const userGrowthDataMonth = [
  { period: "Jan", users: 400, active: 240 },
  { period: "Feb", users: 520, active: 320 },
  { period: "Mar", users: 680, active: 450 },
  { period: "Apr", users: 890, active: 620 },
  { period: "May", users: 1200, active: 850 },
  { period: "Jun", users: 1450, active: 1050 },
  { period: "Jul", users: 1680, active: 1200 },
  { period: "Aug", users: 1900, active: 1400 },
  { period: "Sep", users: 2150, active: 1600 },
  { period: "Oct", users: 2400, active: 1850 },
  { period: "Nov", users: 2700, active: 2100 },
  { period: "Dec", users: 3000, active: 2350 },
]

const userGrowthDataYear = [
  { period: "2020", users: 2400, active: 1400 },
  { period: "2021", users: 5200, active: 3200 },
  { period: "2022", users: 8900, active: 6200 },
  { period: "2023", users: 12000, active: 8500 },
  { period: "2024", users: 18500, active: 13500 },
  { period: "2025", users: 24500, active: 18000 },
]

const subscriptionData = [
  { period: "06/07", free: 280, super: 120 },
  { period: "07/07", free: 320, super: 140 },
  { period: "08/07", free: 380, super: 160 },
  { period: "09/07", free: 450, super: 200 },
  { period: "10/07", free: 520, super: 240 },
  { period: "11/07", free: 580, super: 280 },
  { period: "12/07", free: 620, super: 320 },
  { period: "13/07", free: 680, super: 350 },
]

const topFavoritedTopics = [
  { rank: "01", name: "Unit 1: Greetings", popularity: 450, percentage: "46%" },
  { rank: "02", name: "Unit 2: Food & Drinks", popularity: 420, percentage: "43%" },
  { rank: "03", name: "Unit 3: Daily Activities", popularity: 380, percentage: "39%" },
  { rank: "04", name: "Unit 4: Travel", popularity: 350, percentage: "36%" },
]

const statCards = [
  { title: "Total Users", value: "1,450", icon: Users, trend: "+12%" },
  { title: "Active Users", value: "1,050", icon: TrendingUp, trend: "+8%" },
  { title: "AI Accuracy", value: "94.2%", icon: Zap, trend: "+2.1%" },
  { title: "Feedback Count", value: "342", icon: MessageSquare, trend: "+15%" },
]

const subscriptionSummary = [
  { name: "Free", value: 680, color: "#a1a1aa" },
  { name: "Super", value: 350, color: "#00d9ff" }, 
]

export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<"week" | "month" | "year">("month")

  const getChartData = () => {
    switch (timePeriod) {
      case "week":
        return userGrowthDataWeek
      case "year":
        return userGrowthDataYear
      default:
        return userGrowthDataMonth
    }
  }

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your platform overview.</p>
      </div>

      {/* Stats Grid */}
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

      {/* Charts Row 1: User Growth and Users' Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-card border-border lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">User Growth</CardTitle>
                <CardDescription>Active and total users over time</CardDescription>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimePeriod("week")}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    timePeriod === "week"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  WEEK
                </button>
                <button
                  onClick={() => setTimePeriod("month")}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    timePeriod === "month"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  MONTH
                </button>
                <button
                  onClick={() => setTimePeriod("year")}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    timePeriod === "year"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  YEAR
                </button>
              </div>
            </div>
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
                <LineChart data={getChartData()} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3a52" />
                  <XAxis
                    dataKey="period"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#00d9ff"
                    strokeWidth={2}
                    dot={{ fill: "#00d9ff", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ fill: "#7c3aed", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Users' Subscription Chart */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Users' Subscription</CardTitle>
            <CardDescription>Free vs Super subscription distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ChartContainer
              config={{

                free: { label: "Free", color: "#a1a1aa" },
                super: { label: "Super", color: "#00d9ff" },
              }}
              className="w-full h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {subscriptionSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex gap-8 mt-6 pt-6 border-t border-border w-full justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#a1a1aa" }}
                  ></span>
                  Free
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">680</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#00d9ff" }}
                  ></span>
                  Super
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">350</p>
              </div>
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
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(topic.popularity / 450) * 100}%` }}
                      ></div>
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

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription>Latest user interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { user: "John Doe", action: "Completed Vocabulary Quiz", time: "2 hours ago" },
              { user: "Jane Smith", action: "Unlocked Level 5", time: "4 hours ago" },
              { user: "Mike Johnson", action: "Submitted Feedback", time: "6 hours ago" },
              { user: "Sarah Williams", action: "Completed Daily Challenge", time: "8 hours ago" },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{activity.user}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
