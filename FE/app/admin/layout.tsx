"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Users, BookOpen, Brain, MessageSquare, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/resources", label: "Resource", icon: BookOpen },
  { href: "/admin/ai-performance", label: "AI Performance", icon: Brain },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    console.log("[v0] Logging out admin user")
    // In production, this would clear session/tokens and redirect to login
    router.push("/sign-in")
  }

  return (
    <div className=" dark flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center w-full"}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            {sidebarOpen && <span className="font-bold text-lg text-sidebar-foreground">TECHDIES</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  } ${!sidebarOpen && "justify-center px-0"}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                  !sidebarOpen && "justify-center px-0"
                }`}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>Log-out</span>}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-800 border-cyan-500/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Are you sure you want to log out? You will need to sign in again to access the admin panel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-cyan-500/30">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-cyan-500 text-white hover:bg-cyan-600">
                  Log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Toggle Button */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
