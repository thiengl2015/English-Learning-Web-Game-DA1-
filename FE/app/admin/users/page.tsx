"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, RefreshCw, Bell, Mail, Moon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getAdminUsers,
  MissingAdminTokenError,
  updateAdminUserStatus,
  type AdminUser,
  type AdminUserStatus,
} from "@/lib/api/admin"

const formatDate = (value?: string | null) => {
  if (!value) return "Never"
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value))
}

export default function UserManagementPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [subscriptionFilter, setSubscriptionFilter] = useState("all")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newThisMonth: 0,
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const loadUsers = async () => {
    setIsLoading(true)
    setError("")

    try {
      const data = await getAdminUsers({
        search: searchTerm.trim(),
        status: statusFilter,
        subscription: subscriptionFilter,
        page,
        limit: 10,
      })

      setUsers(data.users)
      setStats(data.stats)
      setTotalItems(data.pagination.total)
      setTotalPages(Math.max(data.pagination.totalPages, 1))
    } catch (err) {
      if (err instanceof MissingAdminTokenError) {
        setError("Please sign in with an admin account to manage users.")
      } else {
        setError(err instanceof Error ? err.message : "Could not load users.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, subscriptionFilter, page])

  const handleStatusChange = async (user: AdminUser, status: AdminUserStatus) => {
    setUpdatingUserId(user.id)
    setError("")

    try {
      const updated = await updateAdminUserStatus(user.id, status)
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user status.")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), color: "text-primary" },
    { label: "Active Users", value: stats.activeUsers.toLocaleString(), color: "text-primary" },
    { label: "Inactive Users", value: stats.inactiveUsers.toLocaleString(), color: "text-destructive" },
    { label: "New This Month", value: stats.newThisMonth.toLocaleString(), color: "text-primary" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage and monitor all platform users</p>
        </div>
        <Button variant="outline" onClick={loadUsers} disabled={isLoading} className="w-fit border-border bg-transparent">
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

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Users List</CardTitle>
          <CardDescription>Registered users, learning profile, and saved settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, display name, or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={subscriptionFilter}
              onValueChange={(value) => {
                setSubscriptionFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full md:w-44 bg-input border-border text-foreground">
                <SelectValue placeholder="Filter by subscription" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground">User</TableHead>
                  <TableHead className="text-foreground">Level</TableHead>
                  <TableHead className="text-foreground">Subscription</TableHead>
                  <TableHead className="text-foreground">Settings</TableHead>
                  <TableHead className="text-foreground">Joined Date</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Last Active</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground">
                      No users match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-secondary/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div>
                          <p>{user.progress.level}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user.current_level}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            user.subscription === "Free"
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                              : "bg-orange-500/20 text-yellow-300 border-yellow-500/30"
                          }`}
                        >
                          {user.subscription}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 text-muted-foreground">
                          <Bell className={`w-4 h-4 ${user.settings.push_notifications ? "text-primary" : ""}`} />
                          <Mail className={`w-4 h-4 ${user.settings.email_reminders ? "text-primary" : ""}`} />
                          <Moon className={`w-4 h-4 ${user.settings.dark_mode ? "text-primary" : ""}`} />
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.joined_date)}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            user.status === "Active"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.last_active)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/10"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingUserId === user.id}
                            onClick={() => handleStatusChange(user, user.status === "Active" ? "Inactive" : "Active")}
                            className="border-border bg-transparent"
                          >
                            {user.status === "Active" ? "Inactive" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {users.length} of {totalItems} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="border-border text-foreground hover:bg-secondary hover:text-primary bg-transparent"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                className="border-border text-foreground hover:bg-secondary hover:text-primary bg-transparent"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
