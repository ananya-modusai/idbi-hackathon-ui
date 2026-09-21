import { Skeleton } from "@/components/ui/skeleton"

export function LoadingMessage() {
  return (
    <div className="flex justify-start mb-1">
      <div className="max-w-[70%] rounded-2xl px-3 py-1.5 bg-gray-100 text-gray-900 rounded-bl-none">
        <div className="flex gap-1 items-center h-5">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </div>
    </div>
  )
} 