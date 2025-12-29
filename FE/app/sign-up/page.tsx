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
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"

interface HeaderStar {
  top: string;
  left: string;
  animation: string;
}

export default function SignUpPage() {
  const router = useRouter()
  
  // States cho form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // State quản lý lỗi chi tiết cho từng ô nhập liệu
  const [errors, setErrors] = useState<{ 
    username?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    general?: string; 
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

  // CẬP NHẬT HÀM CALL API
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});

    // 1. Kiểm tra nhanh tại Frontend 
    const newErrors: typeof errors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (name.length < 3) newErrors.username = "Username phải từ 3-50 ký tự.";
    if (!emailRegex.test(email)) newErrors.email = "Email không hợp lệ.";
    if (password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    if (password !== confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // 2. Gửi yêu cầu đến Backend 
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // CẬP NHẬT: Gửi chính xác các trường mà registerValidation yêu cầu
        body: JSON.stringify({ 
          username: name, // Map trường 'name' của form sang 'username' của API
          email, 
          password, 
          confirmPassword 
        }), 
      });

      const data = await response.json();

      if (!response.ok) {
        const backendErrors: typeof errors = {};

        // Bóc tách lỗi từ mảng 'errors' của express-validator trả về
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: any) => {
            if (err.path === "username") backendErrors.username = err.msg;
            if (err.path === "email") backendErrors.email = err.msg;
            if (err.path === "password") backendErrors.password = err.msg;
            if (err.path === "confirmPassword") backendErrors.confirmPassword = err.msg;
          });
        } else {
          // Lỗi logic khác (ví dụ: Email đã tồn tại)
          backendErrors.general = data.message || "Đã có lỗi xảy ra.";
        }
        
        setErrors(backendErrors);
        return;
      }

      // 3. Đăng ký thành công
      alert("Đăng ký thành công! Chào mừng bạn đến với TECHDIES.");
      router.push("/sign-in");

    } catch (error: any) {
      console.error("Connection Error:", error);
      setErrors({ general: "Không thể kết nối đến máy chủ. Hãy kiểm tra XAMPP và Backend." });
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Form Section */}
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-900">REGISTER</h1>
          
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field: Username */}
            <div className="space-y-1">
              <Label htmlFor="username" className="text-gray-700 font-medium ml-1">User Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input 
                  id="username" 
                  placeholder="Username" 
                  className={`pl-11 h-12 border-2 rounded-xl focus:border-cyan-400 ${errors.username ? 'border-red-300' : 'border-gray-200'}`} 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.username}</p>}
            </div>

            {/* Field: Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-700 font-medium ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="example@mail.com" 
                  className={`pl-11 h-12 border-2 rounded-xl focus:border-cyan-400 ${errors.email ? 'border-red-300' : 'border-gray-200'}`} 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.email}</p>}
            </div>

            {/* Field: Password */}
            <div className="space-y-1">
              <Label htmlFor="password font-medium ml-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Your password" 
                  className={`pl-11 pr-11 h-12 border-2 rounded-xl focus:border-cyan-400 ${errors.password ? 'border-red-300' : 'border-gray-200'}`} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <div 
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-cyan-500" /> : <Eye className="w-5 h-5 text-cyan-500" />}
                </div>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.password}</p>}
            </div>

            {/* Field: Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirm-password font-medium ml-1">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm your password" 
                  className={`pl-11 pr-11 h-12 border-2 rounded-xl focus:border-cyan-400 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
                <div 
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5 text-cyan-500" /> : <Eye className="w-5 h-5 text-cyan-500" />}
                </div>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-white text-cyan-600 border-2 border-cyan-500 hover:bg-cyan-50 font-bold text-lg rounded-xl mt-6 shadow-md transition-all active:scale-95" 
              disabled={isLoading}
            >
              {isLoading ? "PROCCESSING..." : "SIGN UP"}
            </Button>

            <div className="text-center mt-4">
              <span className="text-gray-500 text-sm">Already have an account? </span>
              <Link href="/sign-in" className="text-cyan-500 hover:text-cyan-600 font-bold text-sm">Login</Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}