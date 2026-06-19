"use client"

import { useState, useEffect } from "react"
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
  Loader2,
  RefreshCw,
} from "lucide-react"
import {
  getAdminInbox,
  markAdminInboxAllRead,
  getCampaigns,
  createCampaign,
  getTemplates,
  updateTemplate,
  createTemplate,
  MissingNotificationTokenError,
  type NotificationCampaign,
  type NotificationTemplate,
  type UserNotification,
} from "@/lib/api/notifications"

type TabType = "personalized" | "broadcast"
type ScheduleType = "immediate" | "scheduled"
type TriggerType = "schedule" | "level_reached" | "units_completed" | "streak" | "xp_milestone" | "resume_activity"

const AUDIENCE_LABEL: Record<string, string> = {
  all: "All users",
  free: "Free users",
  premium: "Premium users",
  inactive: "Inactive users",
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  sent: "Sent",
  cancelled: "Cancelled",
}

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: "schedule", label: "Scheduled broadcast" },
  { value: "level_reached", label: "When user reaches a level" },
  { value: "units_completed", label: "When user completes N units" },
  { value: "streak", label: "When user hits a streak (days)" },
  { value: "xp_milestone", label: "When user reaches XP milestone" },
  { value: "resume_activity", label: "Welcome back after inactivity (days)" },
]

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-green-500/20 text-green-400 border border-green-500/30",
    active: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    scheduled: "bg-primary/20 text-primary border border-primary/30",
    draft: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
    cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || map.draft}`}>{STATUS_LABEL[status] || status}</span>
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} d ago`
}

function campaignSendDate(c: NotificationCampaign): string {
  if (c.trigger_type === "schedule") {
    const at = c.trigger_config?.scheduled_at || c.sent_at
    return at ? new Date(at).toLocaleString() : "Send now"
  }
  return "On condition"
}

export default function NotificationsPage() {
  const today = new Date()
  const [activeTab, setActiveTab] = useState<TabType>("personalized")
  const [inboxOpen, setInboxOpen] = useState(false)
  const [inbox, setInbox] = useState<UserNotification[]>([])
  const [inboxUnread, setInboxUnread] = useState(0)
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [scheduleType, setScheduleType] = useState<ScheduleType>("immediate")

  // Broadcast form
  const [bcTitle, setBcTitle] = useState("")
  const [bcBody, setBcBody] = useState("")
  const [bcImage, setBcImage] = useState("")
  const [bcDate, setBcDate] = useState("")
  const [bcTime, setBcTime] = useState("")
  const [bcAudience, setBcAudience] = useState("all")
  const [triggerType, setTriggerType] = useState<TriggerType>("schedule")
  const [condValue, setCondValue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formMsg, setFormMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // New template form
  const [ntEvent, setNtEvent] = useState("")
  const [ntCustomEvent, setNtCustomEvent] = useState("")
  const [ntTitle, setNtTitle] = useState("")
  const [ntBody, setNtBody] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)

  const { firstDay, daysInMonth } = buildCalendar(calYear, calMonth)

  const loadNotifications = async () => {
    setIsLoading(true)
    setError("")

    try {
      const [inboxData, campaignData, templateData] = await Promise.all([
        getAdminInbox(),
        getCampaigns(),
        getTemplates(),
      ])
      setInbox(inboxData.notifications)
      setInboxUnread(inboxData.unread_count)
      setCampaigns(campaignData)
      setTemplates(templateData)
    } catch (err) {
      if (err instanceof MissingNotificationTokenError) {
        setError("Please sign in with an admin account to manage notifications.")
      } else {
        setError(err instanceof Error ? err.message : "Could not load notifications.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAllRead = async () => {
    try {
      await markAdminInboxAllRead()
      const data = await getAdminInbox()
      setInbox(data.notifications)
      setInboxUnread(data.unread_count)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark inbox as read.")
    }
  }

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
    campaigns.filter((c) => {
      if (c.trigger_type !== "schedule" || c.status === "draft") return false
      const at = c.trigger_config?.scheduled_at || c.sent_at
      if (!at) return false
      const d = new Date(at)
      return d.getMonth() === calMonth && d.getFullYear() === calYear && d.getDate() === day
    })

  const hasDot = (day: number) => scheduledForDay(day).length > 0

  const resetBroadcast = () => {
    setBcTitle(""); setBcBody(""); setBcImage(""); setBcDate(""); setBcTime("")
    setBcAudience("all"); setTriggerType("schedule"); setCondValue(""); setScheduleType("immediate")
  }

  const buildTriggerConfig = () => {
    switch (triggerType) {
      case "schedule":
        if (scheduleType === "scheduled" && bcDate) {
          const iso = new Date(`${bcDate}T${bcTime || "00:00"}`).toISOString()
          return { scheduled_at: iso }
        }
        return {}
      case "level_reached":
        return { level: Number(condValue) || 1 }
      case "units_completed":
        return { units: Number(condValue) || 1 }
      case "streak":
        return { streak_days: Number(condValue) || 1 }
      case "xp_milestone":
        return { xp: Number(condValue) || 100 }
      case "resume_activity":
        return { inactive_days: Number(condValue) || 7 }
      default:
        return {}
    }
  }

  const submitCampaign = async (draft: boolean) => {
    if (!bcTitle.trim() || !bcBody.trim()) {
      setFormMsg({ type: "err", text: "Vui lòng nhập tiêu đề và nội dung." })
      return
    }
    setSubmitting(true)
    setFormMsg(null)
    try {
      await createCampaign({
        title: bcTitle,
        message: bcBody,
        image_url: bcImage || undefined,
        audience: bcAudience,
        trigger_type: triggerType,
        trigger_config: buildTriggerConfig(),
        draft,
      })
      setFormMsg({ type: "ok", text: draft ? "Đã lưu nháp." : "Đã tạo thông báo thành công." })
      resetBroadcast()
      await loadNotifications()
    } catch (e: any) {
      setFormMsg({ type: "err", text: e.message || "Tạo thông báo thất bại" })
    } finally {
      setSubmitting(false)
    }
  }

  const saveTemplateEdit = async (tpl: NotificationTemplate) => {
    try {
      await updateTemplate(tpl.id, { title: tpl.title, body: tpl.body })
      setEditingTemplate(null)
      await loadNotifications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update template.")
    }
  }

  const submitNewTemplate = async () => {
    const event = ntEvent === "custom" ? ntCustomEvent.trim() : ntEvent
    if (!event || !ntTitle || !ntBody) return
    setSavingTemplate(true)
    try {
      await createTemplate({ event, title: ntTitle, body: ntBody })
      setShowNewTemplate(false)
      setNtEvent(""); setNtCustomEvent(""); setNtTitle(""); setNtBody("")
      await loadNotifications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create template.")
    } finally {
      setSavingTemplate(false)
    }
  }

  return (
    <div className="space-y-8 relative">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-2">Manage system notifications, templates, and broadcasts</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadNotifications} disabled={isLoading} className="border-border bg-card text-foreground hover:text-foreground/50 hover:bg-secondary gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Admin Inbox Bell */}
          <div className="relative">
            <Button
              variant="outline"
              className="relative border-border bg-card text-foreground hover:text-foreground/50 hover:bg-secondary hover:text-foreground/50 gap-2"
              onClick={() => setInboxOpen(!inboxOpen)}
            >
              <Bell className="w-4 h-4" />
              Admin Inbox
              {inboxUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                  {inboxUnread}
                </span>
              )}
            </Button>

            {inboxOpen && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-foreground text-sm">Admin Inbox</span>
                <div className="flex items-center gap-2">
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                  <button onClick={() => setInboxOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {isLoading && <p className="px-4 py-6 text-center text-xs text-muted-foreground">Loading inbox...</p>}
                {!isLoading && inbox.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted-foreground">No notifications.</p>}
                {inbox.map((item) => (
                  <div key={item.id} className={`px-4 py-3 border-b border-border last:border-0 flex items-start gap-3 ${!item.is_read ? "bg-primary/5" : ""}`}>
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!item.is_read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${item.is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{item.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* ── Zone 2: Calendar + Broadcast History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-foreground text-sm">{MONTHS[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

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
                    {dot && <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-destructive"}`} />}
                  </button>
                )
              })}
            </div>

            {selectedDay !== null && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{MONTHS[calMonth]} {selectedDay}</p>
                {scheduledForDay(selectedDay).length > 0 ? (
                  <div className="space-y-2">
                    {scheduledForDay(selectedDay).map((n) => (
                      <div key={n.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                        <BellRing className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(n.trigger_config?.scheduled_at || n.sent_at || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
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

        <Card className="bg-card border-border lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Broadcast History
            </CardTitle>
            <CardDescription>Past and upcoming notifications</CardDescription>
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
                  {isLoading && (
                    <TableRow className="border-border"><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6">Loading campaigns...</TableCell></TableRow>
                  )}
                  {!isLoading && campaigns.length === 0 && (
                    <TableRow className="border-border"><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6">No campaigns yet.</TableCell></TableRow>
                  )}
                  {!isLoading && campaigns.map((row) => (
                    <TableRow key={row.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="font-medium text-foreground">{row.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{AUDIENCE_LABEL[row.audience] || row.audience}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{campaignSendDate(row)}</TableCell>
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
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={() => setShowNewTemplate(true)}>
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {isLoading && (
                <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-border bg-secondary p-6 text-sm text-muted-foreground">
                  Loading templates...
                </div>
              )}
              {!isLoading && templates.length === 0 && (
                <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-border bg-secondary p-6 text-sm text-muted-foreground">
                  No templates yet.
                </div>
              )}
              {!isLoading && templates.map((tpl) => (
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
                          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-xs" onClick={() => saveTemplateEdit(tpl)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setEditingTemplate(null); loadNotifications() }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tpl.body}</p>
                        {tpl.variables?.length > 0 && (
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
                      <Select value={ntEvent} onValueChange={setNtEvent}>
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
                          value={ntCustomEvent}
                          onChange={(e) => setNtCustomEvent(e.target.value)}
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
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" disabled={savingTemplate} onClick={submitNewTemplate}>
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
              <p className="text-sm text-muted-foreground mt-0.5">Send a notification by schedule or when users meet a condition.</p>
            </div>

            {formMsg && (
              <div className={`rounded-lg px-4 py-3 text-sm ${formMsg.type === "ok" ? "border border-green-500/40 bg-green-500/10 text-green-400" : "border border-red-500/40 bg-red-500/10 text-red-400"}`}>
                {formMsg.text}
              </div>
            )}

            <Card className="bg-card border-border">
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notification Title</label>
                  <Input value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} placeholder="e.g. Scheduled Maintenance Tonight" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message Content</label>
                  <Textarea value={bcBody} onChange={(e) => setBcBody(e.target.value)} placeholder="Write your notification content here..." rows={4} className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Illustration URL (optional)</label>
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <Input value={bcImage} onChange={(e) => setBcImage(e.target.value)} placeholder="/images/banner.png" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target Audience</label>
                  <Select value={bcAudience} onValueChange={setBcAudience}>
                    <SelectTrigger className="bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="free">Free Users Only</SelectItem>
                      <SelectItem value="premium">Premium Users Only</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Trigger type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trigger</label>
                  <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
                    <SelectTrigger className="bg-input border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {TRIGGER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedule fields (only for schedule trigger) */}
                {triggerType === "schedule" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Send Time</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setScheduleType("immediate")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                          ${scheduleType === "immediate" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
                      >
                        <Send className="w-3.5 h-3.5" /> Send Now
                      </button>
                      <button
                        onClick={() => setScheduleType("scheduled")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                          ${scheduleType === "scheduled" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
                      >
                        <Clock className="w-3.5 h-3.5" /> Schedule
                      </button>
                    </div>

                    {scheduleType === "scheduled" && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Date</label>
                          <Input type="date" value={bcDate} onChange={(e) => setBcDate(e.target.value)} className="bg-input border-border text-foreground" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Time</label>
                          <Input type="time" value={bcTime} onChange={(e) => setBcTime(e.target.value)} className="bg-input border-border text-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Condition value (for non-schedule triggers) */}
                {triggerType !== "schedule" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {triggerType === "level_reached" && "Target level"}
                      {triggerType === "units_completed" && "Number of units completed"}
                      {triggerType === "streak" && "Streak days"}
                      {triggerType === "xp_milestone" && "XP milestone"}
                      {triggerType === "resume_activity" && "Inactive days before welcome-back"}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={condValue}
                      onChange={(e) => setCondValue(e.target.value)}
                      placeholder="e.g. 5"
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Matching users receive this notification when they meet the condition.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-border">
                  <Button variant="outline" disabled={submitting} className="border-border text-foreground hover:bg-secondary bg-transparent gap-2" onClick={() => submitCampaign(true)}>
                    <FileText className="w-4 h-4" /> Save Draft
                  </Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" disabled={submitting} onClick={() => submitCampaign(false)}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : triggerType === "schedule" && scheduleType === "immediate" ? <Send className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    {triggerType === "schedule" ? (scheduleType === "immediate" ? "Send Now" : "Schedule Broadcast") : "Activate Trigger"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {inboxOpen && <div className="fixed inset-0 z-40" onClick={() => setInboxOpen(false)} />}
    </div>
  )
}
