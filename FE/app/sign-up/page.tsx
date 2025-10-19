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
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; } >({});
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = "Vui lòng nhập một địa chỉ email hợp lệ.";
    }
    if (password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp!";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message.toLowerCase().includes("email")) {
          setErrors({ email: data.message });
        }
        throw new Error(data.message || "Đã có lỗi xảy ra.");
      }

      alert("Đăng ký thành công! Sẽ chuyển đến trang đăng nhập.");
      router.push("/sign-in");
    } catch (error: any) {
      console.error("Lỗi đăng ký:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Form Đăng Ký */}
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-900">REGISTER</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium"> User Name: </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input id="username" type="text" placeholder="User name" className="pl-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium"> Email: </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input id="email" type="email" placeholder="Your email" className="pl-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium"> Password: </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Your password" className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
                {showPassword ? ( <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500 cursor-pointer" onClick={() => setShowPassword(false)} /> ) : ( <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500 cursor-pointer" onClick={() => setShowPassword(true)} /> )}
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-700 font-medium"> Confirm password: </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Your password" className="pl-11 pr-11 h-12 border-2 border-gray-200 focus:border-cyan-400 rounded-xl" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                {showConfirmPassword ? ( <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500 cursor-pointer" onClick={() => setShowConfirmPassword(false)} /> ) : ( <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500 cursor-pointer" onClick={() => setShowConfirmPassword(true)} /> )}
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            <Button type="submit" className="w-full h-12 bg-white text-cyan-500 border-2 border-cyan-500 hover:bg-cyan-50 font-bold text-lg rounded-xl mt-6" disabled={isLoading}>
              {isLoading ? "Signing Up..." : "Sign Up"}
            </Button>
            <div className="text-center">
              <Link href="/sign-in" className="text-cyan-500 hover:text-cyan-600 font-medium"> Back to Log-in </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}