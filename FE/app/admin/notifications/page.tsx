"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Image,
  Plus,
  Send,
  Calendar,
  X,
  Clock,
  Megaphone,
  Layers,
  FileText,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────
type TabType = "personalized" | "broadcast"
type ScheduleType = "immediate" | "scheduled"

interface AdminInbox {
  id: number
  message: string
  time: string
  read: boolean
}

interface ScheduledNotif {
  id: number
  title: string
  createdDate: string
  sendDate: string
  status: "Scheduled" | "Sent" | "Draft"
  audience: string
}

interface Template {
  id: number
  event: string
  title: string
  body: string
  variables: string[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const adminInboxData: AdminInbox[] = [
  { id: 1, message: "user123 just upgraded to Premium", time: "2 min ago", read: false },
  { id: 2, message: "System load exceeded 85%", time: "15 min ago", read: false },
  { id: 3, message: "edixe submitted a new feedback", time: "1 hr ago", read: true },
  { id: 4, message: "hansangho unlocked Level 10", time: "3 hr ago", read: true },
  { id: 5, message: "New user brakenull registered", time: "5 hr ago", read: true },
]

const broadcastHistory: ScheduledNotif[] = [
  { id: 1, title: "Weekly Maintenance Notice", createdDate: "Jun 1, 2026", sendDate: "Jun 2, 2026 02:00", status: "Sent", audience: "All users" },
  { id: 2, title: "New Unit 5 Released!", createdDate: "Jun 5, 2026", sendDate: "Jun 6, 2026 09:00", status: "Sent", audience: "All users" },
  { id: 3, title: "Summer Learning Challenge", createdDate: "Jun 7, 2026", sendDate: "Jun 10, 2026 10:00", status: "Scheduled", audience: "All users" },
  { id: 4, title: "Premium Discount — 30%", createdDate: "Jun 8, 2026", sendDate: "Jun 15, 2026 08:00", status: "Scheduled", audience: "Free users" },
  { id: 5, title: "App Update v2.4", createdDate: "May 20, 2026", sendDate: "May 21, 2026 06:00", status: "Sent", audience: "All users" },
  { id: 6, title: "Holiday Break Draft", createdDate: "Jun 9, 2026", sendDate: "—", status: "Draft", audience: "All users" },
]

const templatesData: Template[] = [
  { id: 1, event: "top_3_rank", title: "Congratulations!", body: "Hey [username], you reached Top 3 on the leaderboard this week!", variables: ["username"] },
  { id: 2, event: "rank_up", title: "Rank Up!", body: "[username] has leveled up to [new_rank]! Keep going!", variables: ["username", "new_rank"] },
  { id: 3, event: "rank_down", title: "Keep Practising", body: "Your rank dropped to [new_rank]. Don't give up, [username]!", variables: ["username", "new_rank"] },
  { id: 4, event: "premium_purchase", title: "Welcome to Premium!", body: "Hi [username], your Premium subscription is now active. Enjoy all features!", variables: ["username"] },
  { id: 5, event: "friend_request", title: "New Friend Request", body: "[sender] wants to be your friend on TECHDIES!", variables: ["sender"] },
  { id: 6, event: "achievement", title: "Achievement Unlocked!", body: "You earned the '[achievement_name]' badge, [username]!", variables: ["username", "achievement_name"] },
  { id: 7, event: "feedback_received", title: "Feedback Received", body: "Thanks [username], your feedback has been submitted successfully.", variables: ["username"] },
]

// ─── Calendar days with scheduled notifications ───────────────────────────────
const scheduledDays = [10, 15]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"]

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ScheduledNotif["status"] }) {
  const map: Record<ScheduledNotif["status"], string> = {
    Sent: "bg-green-500/20 text-green-400 border border-green-500/30",
    Scheduled: "bg-primary/20 text-primary border border-primary/30",
    Draft: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const today = new Date()
  const [activeTab, setActiveTab] = useState<TabType>("personalized")
  const [inboxOpen, setInboxOpen] = useState(false)
  const [inbox, setInbox] = useState(adminInboxData)
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null)
  const [templates, setTemplates] = useState(templatesData)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [scheduleType, setScheduleType] = useState<ScheduleType>("immediate")

  // Broadcast form
  const [bcTitle, setBcTitle] = useState("")
  const [bcBody, setBcBody] = useState("")
  const [bcDate, setBcDate] = useState("")
  const [bcTime, setBcTime] = useState("")

  // New template form
  const [ntEvent, setNtEvent] = useState("")
  const [ntTitle, setNtTitle] = useState("")
  const [ntBody, setNtBody] = useState("")

  const unreadCount = inbox.filter((n) => !n.read).length
  const { firstDay, daysInMonth } = buildCalendar(calYear, calMonth)

  const markAllRead = () => setInbox(inbox.map((n) => ({ ...n, read: true })))

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
    setSelectedDay(null)
  }

  const scheduledForDay = (day: number) =>
    broadcastHistory.filter((n) => {
      if (n.status === "Draft") return false
      const d = new Date(n.sendDate)
      return d.getMonth() === calMonth && d.getFullYear() === calYear && d.getDate() === day
    })

  const hasDot = (day: number) => scheduledForDay(day).length > 0

  return (
    <div className="space-y-8 relative">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-2">Manage system notifications, templates, and broadcasts</p>
        </div>

        {/* Admin Inbox Bell */}
        <div className="relative">
          <Button
            variant="outline"
            className="relative border-border bg-card text-foreground hover:bg-secondary gap-2"
            onClick={() => setInboxOpen(!inboxOpen)}
          >
            <Bell className="w-4 h-4" />
            Admin Inbox
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Dropdown */}
          {inboxOpen && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-foreground text-sm">Admin Inbox</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                  <button onClick={() => setInboxOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {inbox.map((item) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 border-b border-border last:border-0 flex items-start gap-3 ${!item.read ? "bg-primary/5" : ""}`}
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!item.read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${item.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                        {item.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Zone 2: Calendar + Broadcast History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Calendar */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Broadcast Schedule
              </CardTitle>
            </div>
            <CardDescription>Days with a dot have scheduled notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-foreground text-sm">{MONTHS[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
                const isSelected = selectedDay === day
                const dot = hasDot(day)
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-sm transition-colors
                      ${isSelected ? "bg-primary text-primary-foreground font-bold"
                        : isToday ? "bg-primary/20 text-primary font-semibold"
                        : "hover:bg-secondary text-foreground"}`}
                  >
                    {day}
                    {dot && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-destructive"}`} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Day detail */}
            {selectedDay !== null && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  {MONTHS[calMonth]} {selectedDay}
                </p>
                {scheduledForDay(selectedDay).length > 0 ? (
                  <div className="space-y-2">
                    {scheduledForDay(selectedDay).map((n) => (
                      <div key={n.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                        <BellRing className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(n.sendDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        <StatusBadge status={n.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No notifications scheduled.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Broadcast History Table */}
        <Card className="bg-card border-border lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Broadcast History
            </CardTitle>
            <CardDescription>Past and upcoming server-wide notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-foreground">Title</TableHead>
                    <TableHead className="text-foreground">Audience</TableHead>
                    <TableHead className="text-foreground">Created</TableHead>
                    <TableHead className="text-foreground">Send Date</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcastHistory.map((row) => (
                    <TableRow key={row.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="font-medium text-foreground">{row.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.audience}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.createdDate}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.sendDate}</TableCell>
                      <TableCell><StatusBadge status={row.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Zone 3: Tabs ── */}
      <div>
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("personalized")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px
              ${activeTab === "personalized" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Layers className="w-4 h-4" />
            Personalized Notifications
          </button>
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px
              ${activeTab === "broadcast" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Megaphone className="w-4 h-4" />
            Broadcast Campaign
          </button>
        </div>

        {/* ── Tab 1: Personalized ── */}
        {activeTab === "personalized" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Template Library</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Auto-triggered by system events. Edit copy only.</p>
              </div>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                onClick={() => setShowNewTemplate(true)}
              >
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <Card key={tpl.id} className="bg-card border-border group hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-foreground text-sm font-semibold truncate">{tpl.title}</CardTitle>
                        <p className="text-xs text-primary mt-0.5 font-mono">{tpl.event}</p>
                      </div>
                      <button
                        onClick={() => setEditingTemplate(editingTemplate === tpl.id ? null : tpl.id)}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingTemplate === tpl.id ? (
                      <div className="space-y-2">
                        <Input
                          value={tpl.title}
                          onChange={(e) => setTemplates(templates.map((t) => t.id === tpl.id ? { ...t, title: e.target.value } : t))}
                          className="bg-input border-border text-foreground text-xs h-8"
                          placeholder="Notification title"
                        />
                        <Textarea
                          value={tpl.body}
                          onChange={(e) => setTemplates(templates.map((t) => t.id === tpl.id ? { ...t, body: e.target.value } : t))}
                          className="bg-input border-border text-foreground text-xs resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-xs" onClick={() => setEditingTemplate(null)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tpl.body}</p>
                        {tpl.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {tpl.variables.map((v) => (
                              <span key={v} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono">[{v}]</span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* New Template Form */}
            {showNewTemplate && (
              <Card className="bg-card border-primary/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Create New Template
                    </CardTitle>
                    <button onClick={() => setShowNewTemplate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trigger Event</label>
                      <Select onValueChange={setNtEvent}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue placeholder="Select system event" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="lesson_complete">Lesson Completed</SelectItem>
                          <SelectItem value="streak_milestone">Streak Milestone</SelectItem>
                          <SelectItem value="quiz_passed">Quiz Passed</SelectItem>
                          <SelectItem value="daily_reminder">Daily Reminder</SelectItem>
                          <SelectItem value="custom">Custom Event</SelectItem>
                        </SelectContent>
                      </Select>
                      {ntEvent === "custom" && (
                        <Input
                          placeholder="Enter event identifier..."
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground mt-2"
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notification Title</label>
                      <Input
                        value={ntTitle}
                        onChange={(e) => setNtTitle(e.target.value)}
                        placeholder="e.g. Achievement Unlocked!"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Message Body <span className="normal-case text-primary">(use [variable] for dynamic content)</span>
                      </label>
                      <Textarea
                        value={ntBody}
                        onChange={(e) => setNtBody(e.target.value)}
                        placeholder="Hi [username], you just unlocked [achievement_name]!"
                        rows={3}
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                      onClick={() => {
                        if (!ntTitle || !ntBody) return
                        setTemplates([...templates, { id: Date.now(), event: ntEvent || "custom", title: ntTitle, body: ntBody, variables: [] }])
                        setShowNewTemplate(false); setNtEvent(""); setNtTitle(""); setNtBody("")
                      }}
                    >
                      <Plus className="w-4 h-4" /> Save Template
                    </Button>
                    <Button variant="outline" className="border-border text-foreground hover:bg-secondary bg-transparent" onClick={() => setShowNewTemplate(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Tab 2: Broadcast ── */}
        {activeTab === "broadcast" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create Broadcast Campaign</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Send a notification to all or filtered users.</p>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="pt-6 space-y-5">

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notification Title</label>
                  <Input
                    value={bcTitle}
                    onChange={(e) => setBcTitle(e.target.value)}
                    placeholder="e.g. Scheduled Maintenance Tonight"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message Content</label>
                  <Textarea
                    value={bcBody}
                    onChange={(e) => setBcBody(e.target.value)}
                    placeholder="Write your notification content here..."
                    rows={4}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>

                {/* Image attachment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Illustration (optional)</label>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground">
                    <Image className="w-4 h-4 shrink-0" />
                    <span className="text-sm">Click to attach an image for this notification</span>
                  </button>
                </div>

                {/* Audience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target Audience</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="free">Free Users Only</SelectItem>
                      <SelectItem value="premium">Premium Users Only</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedule type */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Send Time</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setScheduleType("immediate")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                        ${scheduleType === "immediate" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Now
                    </button>
                    <button
                      onClick={() => setScheduleType("scheduled")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                        ${scheduleType === "scheduled" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Schedule
                    </button>
                  </div>

                  {scheduleType === "scheduled" && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Date</label>
                        <Input
                          type="date"
                          value={bcDate}
                          onChange={(e) => setBcDate(e.target.value)}
                          className="bg-input border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Time</label>
                        <Input
                          type="time"
                          value={bcTime}
                          onChange={(e) => setBcTime(e.target.value)}
                          className="bg-input border-border text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-secondary bg-transparent gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Save Draft
                  </Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    {scheduleType === "immediate" ? (
                      <><Send className="w-4 h-4" /> Send Now</>
                    ) : (
                      <><Calendar className="w-4 h-4" /> Schedule Broadcast</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Click-outside overlay for inbox */}
      {inboxOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setInboxOpen(false)} />
      )}
    </div>
  )
}
