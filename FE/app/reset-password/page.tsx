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
import { Mail, Lock, Eye, EyeOff, Hash } from "lucide-react" 

interface HeaderStar {
  top: string;
  left: string;
  animation: string;
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Nhập email, 2: Nhập OTP & Mật khẩu mới
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    password?: string;
    confirmPassword?: string;
    api?: string; 
  }>({});

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [headerStars, setHeaderStars] = useState<HeaderStar[]>([]);

  useEffect(() => {
    const generatedStars = [...Array(20)].map((): HeaderStar => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animation: `pulse ${2 + Math.random() * 2}s infinite`,
    }));
    setHeaderStars(generatedStars);
  }, []);

  // BƯỚC 1: YÊU CẦU GỬI MÃ OTP
  const handleGetOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Không thể gửi yêu cầu OTP.")
      }

      alert("Mã OTP đã được gửi đến email của bạn!");
      setStep(2); 
    } catch (error: any) {
      setErrors({ api: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // BƯỚC 2: XÁC THỰC OTP VÀ ĐỔI MẬT KHẨU
  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Kiểm tra Frontend trước
    const newErrors: typeof errors = {};
    if (otp.length !== 6) newErrors.otp = "Mã OTP phải có 6 chữ số.";
    if (password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    if (password !== confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Gửi chính xác theo resetPasswordValidation: email, otp, newPassword, confirmPassword
        body: JSON.stringify({ 
          email, 
          otp, 
          newPassword: password, 
          confirmPassword 
        }), 
      })

      const result = await response.json()

      if (!response.ok) {
        // Bóc tách mảng lỗi từ express-validator
        if (result.errors) {
          const backendErrors: any = {};
          result.errors.forEach((err: any) => {
            backendErrors[err.path === "newPassword" ? "password" : err.path] = err.msg;
          });
          setErrors(backendErrors);
          return;
        }
        throw new Error(result.message || "Đặt lại mật khẩu thất bại.")
      }

      alert("Mật khẩu của bạn đã được thay đổi thành công!")
      router.push("/sign-in") 

    } catch (error: any) {
      setErrors({ api: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <CosmicBackground />
      <Card className="relative w-full max-w-md bg-white/98 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 px-8 py-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {headerStars.map((star, i) => (
              <div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{ top: star.top, left: star.left, animation: star.animation }} />
            ))}
          </div>
          <Link href="/" className="text-white/90 text-sm mb-4 relative z-10">
            Welcome to <span className="font-bold text-cyan-300">TECHDIES</span>
          </Link>
          <RobotMascot className="relative z-10" />
        </div>

        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-900">RESET PASSWORD</h1>

          <form onSubmit={step === 1 ? handleGetOtp : handleResetPassword} className="space-y-6">
            
            {/* STEP 1: Email Input */}
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium ml-1">Account Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your registered email"
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            )}

            {/* STEP 2: OTP & New Passwords Input */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 font-medium ml-1">Verification Code </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="Your code"
                      className="pl-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password font-medium ml-1">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Your new password"
                      className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-5 h-5 text-cyan-500" /> : <Eye className="w-5 h-5 text-cyan-500" />}
                    </div>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password font-medium ml-1">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="w-5 h-5 text-cyan-500" /> : <Eye className="w-5 h-5 text-cyan-500" />}
                    </div>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </>
            )}

            {errors.api && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                {errors.api}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-white text-cyan-600 border-2 border-cyan-500 hover:bg-cyan-50 font-bold text-lg rounded-xl shadow-md transition-all active:scale-95" 
              disabled={isLoading}
            >
              {isLoading 
                ? (step === 1 ? 'SENDING...' : 'UPDATING...') 
                : (step === 1 ? 'GET OTP' : 'RESET PASSWORD')}
            </Button>

            <div className="text-center">
              <Link href="/sign-in" className="text-cyan-500 hover:text-cyan-600 font-bold text-sm"> 
                Back to Login 
              </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}