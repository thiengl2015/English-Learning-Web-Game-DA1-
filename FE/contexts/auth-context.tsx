"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

interface User {
  id: number
  email: string
  username: string
  display_name?: string
  role: string
  avatar?: string
  xp?: number
  level?: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = "http://localhost:5000/api"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      fetchUserData(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUserData = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setUser(json.data)
      }
    } catch {
      // Token may be invalid
      localStorage.removeItem("token")
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = useCallback(async () => {
    if (!token) return
    await fetchUserData(token)
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || "Login failed")

    const { token: newToken, user: userData } = json.data
    localStorage.setItem("token", newToken)
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}