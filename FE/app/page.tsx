import { SiteHeader } from "@/components/site-header"
import { CosmicBackground } from "@/components/cosmic-background"
import { RobotMascot } from "@/components/robot-mascot"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Mail, Phone, MapPin, Gamepad2, GalleryHorizontalEnd, CheckCircle, TrendingUp } from "lucide-react"

export default function HomePage() {
  const featureCards = [
    {
      id: 1,
      title: "Gamification",
      content: "Conquer vocabulary through attractive multiple choice games, word matching, fill in the blanks...",
      bgColor: "bg-white/90",
      iconBg: "bg-blue-200",
      iconColor: "text-blue-600",
      icon: Gamepad2,
    },
    {
      id: 2,
      title: "Flashcard",
      content: "Review saved vocabulary anytime, anywhere, helping you remember knowledge scientifically.",
      bgColor: "bg-white/90",
      iconBg: "bg-purple-200",
      iconColor: "text-purple-600",
      icon: GalleryHorizontalEnd,
    },
    {
      id: 3,
      title: "Leapfrog",
      content: "Skip mastered levels and conquer new challenges to save time and find the suitable route.",
      bgColor: "bg-white/90",
      iconBg: "bg-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      id: 4,
      title: "Track progress",
      content: "Set personal goals and track your progress through progress bars and study history",
      bgColor: "bg-white/90",
      iconBg: "bg-yellow-200",
      iconColor: "text-yellow-600",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="min-h-screen">
      <CosmicBackground />
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-100 text-lg mb-4 tracking-wide">All progress takes place outside</p>
          <h1 className="text-white text-6xl md:text-7xl font-bold mb-8 leading-tight">THE COMFORT ZONE</h1>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Tired of boring English lessons? Techdies is the web game that uses cutting-edge AI to make learning English an adventure. Step beyond your limits and discover what you are truly capable of
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-br from-green-300 to-cyan-300 text-purple-800 rounded-full shadow-lg hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 font-bold text-lg px-8 py-6"
          >
            <Link href="/sign-in">Join Now</Link>
          </Button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-16">
            <h2 className="text-4xl text-center font-bold text-purple-900 mb-4">About us</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Welcome to TECHDIES, where innovation meets inspiration. We believe that true progress happens when you dare to step outside your comfort zone. Our platform is designed to empower individuals and teams to reach new heights through cutting-edge technology and collaborative learning experiences.
            </p>
          </div>

          {/* Robot Mascot Section */}
          <div className="text-center mb-16">
            <h3 className="text-white text-3xl font-bold mb-4">Techdies - AI Assistant</h3>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Your friendly AI companion on the journey to excellence
            </p>
            <RobotMascot className="mb-8" />
          </div>

          {/* Feature Cards */}
          <div className="text-center mb-16">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {featureCards.map((card) => {
              const IconComponent = card.icon
              return (
                <Card
                  key={card.id}
                  className={`p-6 text-center ${card.bgColor} backdrop-blur-sm border-[1.5px] border-white/50 rounded-2xl transition-all duration-300 ease-in-out hover:-translate-y-3 hover:shadow-[4px_12px_8px_0px_rgba(103,232,249,0.4)]`}
                >
                  <div
                    className={`w-20 h-20 ${card.iconBg} rounded-full mx-auto mb-1 flex items-center justify-center`}
                  >
                    <IconComponent className={`w-10 h-10 ${card.iconColor}`} />
                  </div>
                  <h4 className="font-bold text-purple-900 mb-1">{card.title}</h4>
                  <p className="text-gray-700 text-sm">{card.content}</p>
                </Card>
              )
            })}
          </div>
            <h3 className="text-white text-3xl font-bold mb-4">Learning is effective and fun</h3>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Tools are designed to help you absorb knowledge quickly and remember it longer
            </p>
          </div>

          {/* CTA Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-purple-900 mb-4">READY TO EXPERIENCE ADVENTURE</h2>
            <p className="text-gray-700 text-lg mb-8">
              Create an account now and discover the learning route designed for you.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-purple-600 text-white hover:bg-purple-700 font-bold px-8 py-6 rounded-full"
            >
              <Link href="/sign-in">Join Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-purple-900 mb-2">Techdies</h3>
            <p className="text-gray-600 text-sm">All progress takes place outside the comfort zone.</p>
          </div>
          <div>
            <h3 className="font-bold text-purple-900 mb-2">Contact</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>123 Main Street, City, Country</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (234) 567-8900</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@techdies.com</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-purple-900 mb-2">Newsletter</h3>
            <p className="text-gray-600 text-sm mb-2">Subscribe the latest newsletter for special deals and updates.</p>
            <Button className="bg-cyan-500 text-white hover:bg-cyan-600 w-full">Submit</Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
