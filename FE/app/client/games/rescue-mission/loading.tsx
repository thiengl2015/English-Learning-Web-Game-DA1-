export default function RescueMissionLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 via-slate-900 to-black">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white text-lg font-medium">Loading Rescue Mission...</p>
      </div>
    </div>
  )
}
