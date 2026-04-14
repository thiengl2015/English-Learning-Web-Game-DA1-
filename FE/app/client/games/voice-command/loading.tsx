import { Mic } from "lucide-react"

export default function VoiceCommandLoading() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-6 font-mono">
      <div className="relative w-20 h-20">
        <span className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping opacity-40" />
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500 flex items-center justify-center bg-slate-900">
          <Mic className="w-9 h-9 text-cyan-300" />
        </div>
      </div>
      <p className="text-cyan-400 text-sm tracking-widest animate-pulse">INITIALIZING VOICE SYSTEMS...</p>
    </div>
  )
}
