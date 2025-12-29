"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CosmicBackground } from "@/components/cosmic-background"
import Link from "next/link"
import { ArrowLeft, Camera, Lock, User, Target, Globe, Clock, CreditCard, ChevronDown, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// --- Cấu hình API URL (Nên đưa vào file .env) ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// --- Định nghĩa kiểu dữ liệu (Interface) ---
interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: string;
  subscription: string;
  current_level: string;
  learning_goal: string;
  daily_goal: number; // API trả về số
  native_language: string;
}

// --- Dialog Component ---
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  isLoading?: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-md rounded-3xl p-8 border border-cyan-300/30 shadow-2xl max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <p className="text-cyan-100 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-white font-semibold"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Confirm
          </Button>
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            className="flex-1 bg-transparent border-cyan-300/50 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  
  // State quản lý User data
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true) // Loading ban đầu của trang
  const [isSaving, setIsSaving] = useState(false) // Loading khi bấm nút Save

  // State quản lý UI/Input
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [isSubscriptionExpanded, setIsSubscriptionExpanded] = useState(false)

  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Dữ liệu tĩnh
  const transactions = [
    { id: "TXN-2024-001", date: "2024-01-15", amount: "$9.99", status: "Completed" },
    { id: "TXN-2023-012", date: "2023-12-15", amount: "$9.99", status: "Completed" },
    { id: "TXN-2023-011", date: "2023-11-15", amount: "$9.99", status: "Completed" },
  ]

  // --- 1. GET PROFILE ---
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (response.ok) {
          setUser(result.data);
        } else {
            // Token hết hạn hoặc lỗi
           console.error("Failed to fetch user", result);
           if (response.status === 401) router.push('/sign-in');
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  // --- 2. CHANGE PASSWORD ---
  const handleUpdatePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("Confirm password does not match!");
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: "PUT",
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password updated successfully!");
        setIsEditingPassword(false);
        setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordConfirm(false);
      } else {
        alert(data.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Network error");
    } finally {
        setIsSaving(false);
    }
  }

  // --- 3. UPDATE PROFILE INFO ---
  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          display_name: user.display_name,
          native_language: user.native_language,
          current_level: user.current_level,
          learning_goal: user.learning_goal,
          daily_goal: user.daily_goal
        })
      });

      if (response.ok) {
        alert("Profile updated successfully!");
        setShowSaveConfirm(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      alert("Error saving changes");
    } finally {
        setIsSaving(false);
    }
  }

  // --- 4. UPLOAD AVATAR ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        // Cập nhật URL avatar mới từ server trả về để hiển thị ngay lập tức
        if(user) {
            setUser({ ...user, avatar_url: result.data.avatar_url });
        }
        setIsEditingAvatar(false);
        setPreviewUrl(null);
        setSelectedFile(null);
        alert("Avatar uploaded!");
      } else {
        alert(result.message || "Upload failed");
      }
    } catch (error) {
      alert("Network error during upload");
    } finally {
        setIsSaving(false);
    }
  }

  // --- MÀN HÌNH LOADING KHI MỚI VÀO TRANG ---
  if (isPageLoading) {
      return (
        <div className="min-h-screen relative flex items-center justify-center">
             <CosmicBackground />
             <div className="z-10 text-white flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
                <p className="text-xl font-medium">Loading profile...</p>
             </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      <ConfirmDialog
        isOpen={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={handleUpdatePassword}
        isLoading={isSaving}
        title="Update Password"
        message="Are you sure you want to update your password? You will need to use the new password for future logins."
      />

      <ConfirmDialog
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleSaveChanges}
        isLoading={isSaving}
        title="Save Changes"
        message="Are you sure you want to save all changes to your profile?"
      />

      <Link
        href="/client"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back to Menu</span>
      </Link>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-cyan-300">Manage your account and learning preferences</p>
        </div>

        {/* Account & Identity Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Account & Identity</h2>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-cyan-300/50 shadow-xl">
                <AvatarImage 
                  // Logic hiển thị ảnh: 
                  // 1. Ảnh preview (nếu user vừa chọn file)
                  // 2. Ảnh từ server (nếu có, nối với base url)
                  // 3. Ảnh placeholder
                  src={
                    previewUrl || 
                    (user?.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : "/placeholder.svg")
                  } 
                  className="object-cover"
                  crossOrigin="anonymous" // Quan trọng nếu load ảnh từ domain khác hoặc localhost
                />
                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-4xl font-bold">
                   {user?.username?.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute bottom-0 right-0 bg-cyan-400 hover:bg-cyan-500 rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            {isEditingAvatar && (
              <div className="mt-4 w-full max-w-md">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-white/20 border-cyan-300/50 text-white file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-400 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                />
                <div className="flex gap-2 mt-2">
                  <Button 
                    className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-white" 
                    onClick={handleUploadAvatar} 
                    disabled={!selectedFile || isSaving}
                  >
                    {isSaving ? "Uploading..." : "Save"}
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent text-white border-white/20" onClick={() => {
                    setIsEditingAvatar(false);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">User Name (Locked)</Label>
              <Input
                value={user?.username || ""}
                disabled
                className="bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Display Name</Label>
              <Input
                value={user?.display_name || ""}
                onChange={(e) => user && setUser({...user, display_name: e.target.value})}
                className="bg-white/20 border-cyan-300/50 text-white focus:ring-2 focus:ring-cyan-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Password Settings</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingPassword(!isEditingPassword)}
                  className="text-cyan-300 hover:text-cyan-400 hover:bg-white/10"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
              {isEditingPassword && (
                <div className="space-y-3 mt-3 p-4 bg-white/10 rounded-xl">
                  <Input
                    type="password"
                    placeholder="Current password"
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                    className="bg-white/20 border-cyan-300/50 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="New password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    className="bg-white/20 border-cyan-300/50 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    className="bg-white/20 border-cyan-300/50 text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowPasswordConfirm(true)}
                      className="flex-1 bg-cyan-400 hover:bg-cyan-500"
                      disabled={!passwords.oldPassword || !passwords.newPassword}
                    >
                      Update Password
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent text-white"
                      onClick={() => setIsEditingPassword(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Learning Profile & Goals Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Learning Profile & Goals</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Current Level</Label>
              <Select 
                value={user?.current_level} 
                onValueChange={(val) => user && setUser({...user, current_level: val})}
              >
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                  <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Learning Goal</Label>
              <Select 
                value={user?.learning_goal} 
                onValueChange={(val) => user && setUser({...user, learning_goal: val})}
              >
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="ielts">IELTS Preparation</SelectItem>
                  <SelectItem value="toeic">TOEIC Preparation</SelectItem>
                  <SelectItem value="daily">Daily Communication</SelectItem>
                  <SelectItem value="academic">Academic Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Daily Goal (Minutes)
              </Label>
              <Select 
                value={user?.daily_goal?.toString()} 
                onValueChange={(val) => user && setUser({...user, daily_goal: parseInt(val)})}
              >
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Native Language
              </Label>
              <Select 
                value={user?.native_language} 
                onValueChange={(val) => user && setUser({...user, native_language: val})}
              >
                <SelectTrigger className="bg-white/20 border-cyan-300/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Vietnamese</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mb-6 flex justify-center">
          <Button
            onClick={() => setShowSaveConfirm(true)}
            className="bg-gradient-to-br from-green-300 to-cyan-300 text-purple-800 shadow-lg hover:shadow-cyan-500/50 px-12 py-6 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Save Changes
          </Button>
        </div>

        {/* Subscription Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <button
            onClick={() => setIsSubscriptionExpanded(!isSubscriptionExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-cyan-300" />
              <h2 className="text-2xl font-bold text-white">Subscription & Payment</h2>
            </div>
            <ChevronDown
              className={`w-6 h-6 text-cyan-300 transition-transform duration-300 ${isSubscriptionExpanded ? "rotate-180" : ""}`}
            />
          </button>

          {isSubscriptionExpanded && (
            <div className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <Label className="text-white">Account Type</Label>
                  <div className="bg-white/20 border border-cyan-300/50 rounded-lg px-4 py-3">
                    <span className="text-cyan-300 font-semibold text-lg">
                      {user?.role === 'admin' ? "Premium (Admin)" : (user?.subscription || "Free")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Next Renewal Date</Label>
                  <div className="bg-white/20 border border-cyan-300/50 rounded-lg px-4 py-3">
                    <span className="text-white">Not applicable</span>
                  </div>
                </div>
              </div>
              
              {/* Transaction History giữ nguyên */}
               <div className="space-y-3">
                <Label className="text-white text-lg">Transaction History</Label>
                <div className="bg-white/10 rounded-xl overflow-hidden border border-cyan-300/30">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-4 py-3 text-left text-cyan-300 font-semibold">Transaction ID</th>
                          <th className="px-4 py-3 text-left text-cyan-300 font-semibold">Date</th>
                          <th className="px-4 py-3 text-left text-cyan-300 font-semibold">Amount</th>
                          <th className="px-4 py-3 text-left text-cyan-300 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction, index) => (
                          <tr
                            key={transaction.id}
                            className={`${index !== transactions.length - 1 ? "border-b border-white/10" : ""} hover:bg-white/5 transition-colors`}
                          >
                            <td className="px-4 py-3 text-white font-mono text-sm">{transaction.id}</td>
                            <td className="px-4 py-3 text-white">{transaction.date}</td>
                            <td className="px-4 py-3 text-white font-semibold">{transaction.amount}</td>
                            <td className="px-4 py-3">
                              <span className="text-green-300 bg-green-300/20 px-3 py-1 rounded-full text-sm">
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}