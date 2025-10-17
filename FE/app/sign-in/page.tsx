"use client"

// Thêm useEffect vào import
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { CosmicBackground } from "@/components/cosmic-background"
import { RobotMascot } from "@/components/robot-mascot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
// Thêm EyeOff để làm chức năng hiện/ẩn mật khẩu
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

// Interface cho các ngôi sao ở header để sửa lỗi Hydration
interface HeaderStar {
  top: string;
  left: string;
  animation: string;
}

export default function SignInPage() {
  const router = useRouter()

  // State để quản lý dữ liệu form
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // State cho chức năng hiện/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false)
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
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại. Vui lòng thử lại.")
      }

      // **QUAN TRỌNG: Lưu token vào localStorage**
      localStorage.setItem('token', data.token);

      alert("Đăng nhập thành công!")
      router.push("/") // Chuyển hướng về trang chính (chưa làm)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false) // Kết thúc trạng thái loading dù thành công hay thất bại
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <CosmicBackground />
      <Card className="relative w-full max-w-md bg-white/98 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden">
        {/* Header with Robot */}
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

        {/* Form */}
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-900">USER LOGIN</h1>
          
          {/* Gắn hàm handleSubmit vào sự kiện onSubmit của form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium"> Email: </Label>
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium"> Password: </Label>
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
                {showPassword ? (
                  <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500 cursor-pointer" onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500 cursor-pointer" onClick={() => setShowPassword(true)} />
                )}
              </div>
            </div>
            
            {/* Hiển thị lỗi nếu có */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="text-right">
              <Link href="#" className="text-cyan-500 hover:text-cyan-600 text-sm font-medium"> Forgot Password? </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-white text-cyan-500 border-2 border-cyan-500 hover:bg-cyan-50 font-bold text-lg rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <Link href="/sign-up" className="text-cyan-500 hover:text-cyan-600 font-medium"> Create Account </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}