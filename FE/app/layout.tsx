import type React from "react"
import type { Metadata } from "next"
import { Roboto_Mono } from "next/font/google"
import { Suspense } from "react"
import "../styles/globals.css"
import { AuthProvider } from "@/contexts/auth-context"

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TECHDIES - Step Outside Your Comfort Zone",
  description: "All progress takes place outside the comfort zone",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-mono ${robotoMono.variable} antialiased`}>
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}
