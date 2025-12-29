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

// Đổi URL này thành địa chỉ backend thực tế của bạn
const API_BASE_URL = "http://localhost:5000/api";

interface HeaderStar {
  top: string;
  left: string;
  animation: string;
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
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

  // --- API 1: Gửi yêu cầu quên mật khẩu ---
  const handleGetOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrors({})

    if (!email) {
      setErrors({ email: "Vui lòng nhập email." })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Gửi mã OTP thất bại.")
      }

      // Thành công thì chuyển sang bước nhập OTP
      setStep(2);

    } catch (error: any) {
      setErrors({ api: error.message || "Lỗi kết nối server" })
    } finally {
      setIsLoading(false)
    }
  }

  // --- API 2: Reset mật khẩu với OTP ---
  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrors({})

    const newErrors: { otp?: string; password?: string; confirmPassword?: string } = {};
    if (!otp) newErrors.otp = "Vui lòng nhập mã OTP.";
    if (password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự."; // Backend validate min 6
    if (password !== confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email,       // Cần gửi lại email
          otp: otp,
          newPassword: password, // Backend yêu cầu key là 'newPassword'
          confirmPassword: confirmPassword 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Reset mật khẩu thất bại.")
      }

      // Thành công -> Điều hướng về trang đăng nhập
      alert("Mật khẩu đã được đặt lại thành công!") // Có thể dùng Toast thay alert
      router.push("/sign-in")

    } catch (error: any) {
      setErrors({ api: error.message || "Lỗi kết nối server" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <CosmicBackground />
      <Card className="relative w-full max-w-md bg-white/98 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
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

        {/* Form */}
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-900">
            {step === 1 ? "FORGOT PASSWORD" : "RESET PASSWORD"}
          </h1>

          <form onSubmit={step === 1 ? handleGetOtp : handleResetPassword} className="space-y-6">
            {step === 1 && (
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
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 font-medium"> Code (OTP): </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      className="pl-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                    />
                  </div>
                  {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium"> New Password: </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 chars, 1 uppercase, 1 number"
                      className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {showPassword ? ( <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setShowPassword(false)} /> ) : ( <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setShowPassword(true)} /> )}
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-700 font-medium"> Confirm password: </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {showConfirmPassword ? ( <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setShowConfirmPassword(false)} /> ) : ( <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setShowConfirmPassword(true)} /> )}
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </>
            )}

            {errors.api && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{errors.api}</p>}

            {/* Nút bấm */}
            {step === 1 && (
              <Button type="submit" className="w-full h-12 bg-white text-cyan-500 border-2 border-cyan-500 hover:bg-cyan-50 font-bold text-lg rounded-xl transition-all" disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : 'Get OTP'}
              </Button>
            )}

            {step === 2 && (
              <Button type="submit" className="w-full h-12 bg-white text-cyan-500 border-2 border-cyan-500 hover:bg-cyan-50 font-bold text-lg rounded-xl transition-all" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Change Password'}
              </Button>
            )}
            
            <div className="text-center">
              <Link href="/sign-in" className="text-cyan-500 hover:text-cyan-600 font-medium"> Back to Log-in </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}