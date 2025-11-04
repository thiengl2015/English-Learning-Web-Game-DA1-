import type React from "react"
import { GalaxyBackground } from "@/components/galaxy-background"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <GalaxyBackground />
      <main className="relative z-10">{children}</main>
    </div>
  )
}
