export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-950 via-purple-950 to-violet-950">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
        <p className="text-white text-lg font-medium">Loading Signal Check...</p>
      </div>
    </div>
  )
}