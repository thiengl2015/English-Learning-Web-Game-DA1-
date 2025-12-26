"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { CosmicBackground } from "@/components/cosmic-background"
import { RobotMascot } from "@/components/robot-mascot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

interface HeaderStar {
  top: string;
  left: string;
  animation: string;
}

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Hiệu ứng ngôi sao nền (Giữ nguyên giao diện của bạn)
  const [headerStars, setHeaderStars] = useState<HeaderStar[]>([]);
  useEffect(() => {
    const generatedStars = [...Array(20)].map((): HeaderStar => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animation: `pulse ${2 + Math.random() * 2}s infinite`,
    }));
    setHeaderStars(generatedStars);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1. Gọi API Login đến cổng 5000
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json() // Nhận phản hồi từ AuthController

      if (!response.ok) {
        throw new Error(result.message || "Đăng nhập thất bại. Vui lòng thử lại.")
      }

      // 2. TRUY XUẤT DỮ LIỆU TỪ LỚP 'data'
      // Vì Backend dùng successResponse(res, result, ...), dữ liệu sẽ nằm trong result.data
      const token = result.data.token;
      const user = result.data.user;

      // 3. Lưu token vào localStorage
      localStorage.setItem('token', token);
      
      // 4. KIỂM TRA ROLE VÀ ĐIỀU HƯỚNG
      if (user && user.role === 'admin') {
        router.push("/admin"); 
      } else {
        alert("Đăng nhập thành công!");
        router.push("/client"); 
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <CosmicBackground />
      <Card className="relative w-full max-w-md bg-white/98 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden">
        
        {/* Header với Robot (Giữ nguyên thiết kế) */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 px-8 py-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {headerStars.map((star, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: star.top,
                  left: star.left,
                  animation: star.animation,
                }}
              />
            ))}
          </div>
          <Link href="/" className="text-white/90 text-sm mb-4 relative z-10">
            Welcome to <span className="font-bold text-cyan-300">TECHDIES</span>
          </Link>
          <RobotMascot className="relative z-10" />
        </div>

        {/* Form Đăng nhập */}
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-900">USER LOGIN</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium"> Email </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  className="pl-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password font-medium"> Password </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div 
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-cyan-500" /> : <Eye className="w-5 h-5 text-cyan-500" />}
                </div>
              </div>
            </div>
            
            {/* Hiển thị lỗi */}
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            <div className="text-right">
              <Link href="/reset-password" title="Go to reset password" className="text-cyan-500 hover:text-cyan-600 text-sm font-medium"> 
                Forgot Password? 
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-white text-cyan-600 border-2 border-cyan-500 hover:bg-cyan-50 font-bold text-lg rounded-xl shadow-md transition-all active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </Button>

            <div className="text-center">
              <span className="text-gray-500 text-sm">Don't have an account? </span>
              <Link href="/sign-up" className="text-cyan-500 hover:text-cyan-600 font-bold text-sm"> 
                Create Account 
              </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}