"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Send, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CosmicBackground } from "@/components/cosmic-background"

const API_BASE_URL = "http://localhost:5000/api";

export default function AssistantPage() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // 1. Thêm State để lưu tên user
  const [userName, setUserName] = useState("Friend") 
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const suggestions = ["Tạo hội thoại theo chủ đề trường học", "Từ vựng topic gia đình", "Community nghĩa là gì?"]

  // 2. Gọi API lấy thông tin User khi component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (data.success && data.data) {
          // Ưu tiên hiển thị display_name, nếu không có thì dùng username
          setUserName(data.data.display_name || data.data.username || "Friend");
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = message;
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setMessage("")
    setIsLoading(true)

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn cần đăng nhập để sử dụng tính năng này");
        setIsLoading(false);
        return;
      }

      let currentConversationId = conversationId;

      if (!currentConversationId) {
        const startRes = await fetch(`${API_BASE_URL}/ai/conversations/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ topic_id: "daily-life" }) 
        });

        const startData = await startRes.json();
        if (!startData.success) throw new Error(startData.message);
        currentConversationId = startData.data.conversation_id;
        setConversationId(currentConversationId);
      }

      const chatRes = await fetch(`${API_BASE_URL}/ai/conversations/${currentConversationId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      const chatData = await chatRes.json();
      if (!chatData.success) throw new Error(chatData.message);

      setMessages(prev => [...prev, { role: "assistant", content: chatData.data.ai_response }])

    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Xin lỗi, tôi đang gặp sự cố kết nối." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />

      <Link
        href="/client"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Menu</span>
      </Link>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-4xl mx-auto space-y-8">

          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white">Hi, {userName}!</h1>
            <p className="text-xl text-cyan-300">How can I help you learn English today?</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 mb-6 border border-white/20 shadow-2xl flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                 <div className="h-full flex items-center justify-center text-white/50 italic">
                    Start a conversation by typing below...
                 </div>
              )}
              
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`px-5 py-3 rounded-2xl max-w-[85%] text-base ${
                      msg.role === "user" 
                        ? "bg-cyan-500 text-white rounded-br-none" 
                        : "bg-white/20 text-white rounded-bl-none border border-white/10"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-5 py-3 rounded-2xl bg-white/20 text-white rounded-bl-none border border-white/10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="relative pt-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                placeholder="Ask Techdies something..."
                className="w-full bg-white/5 border-white/20 text-white placeholder:text-gray-300 rounded-2xl pr-14 h-14 text-lg focus-visible:!border-cyan-400 focus-visible:!ring-cyan-400/30"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                size="icon"
                className="absolute right-2 top-1/2 mt-1 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 rounded-xl w-10 h-10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setMessage(suggestion)}
                disabled={isLoading}
                className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 hover:border-cyan-400 transition-all duration-300 shadow-lg text-sm disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}