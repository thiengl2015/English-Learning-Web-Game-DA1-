import { Skeleton } from "@/components/ui/skeleton"

export default function AssistantLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="absolute top-6 left-6 z-20">
        <Skeleton className="h-10 w-40 bg-white/20" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Skeleton className="h-12 w-64 mx-auto bg-white/20" />
            <Skeleton className="h-8 w-48 mx-auto bg-white/20" />
          </div>

          <Skeleton className="h-96 w-full rounded-3xl bg-white/20" />

          <div className="flex flex-wrap gap-3 justify-center">
            <Skeleton className="h-12 w-48 rounded-full bg-white/20" />
            <Skeleton className="h-12 w-40 rounded-full bg-white/20" />
            <Skeleton className="h-12 w-44 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}
