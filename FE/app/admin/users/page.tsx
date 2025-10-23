"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const mockUsers = [
  {
    id: "u123",
    username: "rai",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "July 19, 25",
    status: "Active",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "edixe",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "July 19, 25",
    status: "Active",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "brakenull",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "July 19, 25",
    status: "Inactive",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "hansangho",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Super",
    joinedDate: "July 19, 25",
    status: "Active",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "nat",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "July 19, 25",
    status: "Active",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "nat",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "July 19, 25",
    status: "Inactive",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "nat",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "July 19, 25",
    status: "Inactive",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "nat",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "July 19, 25",
    status: "Inactive",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "hansangho",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Super",
    joinedDate: "July 19, 25",
    status: "Active",
    lastActive: "September 19, 25",
  },
  {
    id: "u123",
    username: "nat",
    email: "nat@gmail.com",
    level: 4,
    subscription: "Free",
    joinedDate: "July 19, 25",
    status: "Active",
    lastActive: "September 19, 25",
  },
]

const stats = [
  { label: "Total Users", value: "1,450", color: "text-primary" },
  { label: "Active Users", value: "1,050", color: "text-primary" },
  { label: "Inactive Users", value: "400", color: "text-destructive" },
  { label: "New This Month", value: "125", color: "text-primary" },
]

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [subscriptionFilter, setSubscriptionFilter] = useState("all")

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesSubscription = subscriptionFilter === "all" || user.subscription === subscriptionFilter
    return matchesSearch && matchesStatus && matchesSubscription
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage and monitor all platform users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Users List</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-input border-border text-foreground">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-full md:w-40 bg-input border-border text-foreground">
                <SelectValue placeholder="Filter by subscription" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Super">Super</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground">ID</TableHead>
                  <TableHead className="text-foreground">Username</TableHead>
                  <TableHead className="text-foreground">Email</TableHead>
                  <TableHead className="text-foreground">Level</TableHead>
                  <TableHead className="text-foreground">Subscription</TableHead>
                  <TableHead className="text-foreground">Joined Date</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Last Active</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={index} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-medium text-foreground">{user.id}</TableCell>
                    <TableCell className="text-foreground">{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-foreground">{user.level}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.subscription === "Super"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {user.subscription}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.joinedDate}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === "Active"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.lastActive}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {mockUsers.length} users
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="border-border text-foreground hover:bg-secondary bg-transparent">
                Previous
              </Button>
              <Button variant="outline" className="border-border text-foreground hover:bg-secondary bg-transparent">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
