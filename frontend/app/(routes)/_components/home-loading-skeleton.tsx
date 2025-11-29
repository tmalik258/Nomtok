import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoadingSkeleton() {
  return (
    <div className="min-h-screen p-2">
      {/* Hero Section Skeleton */}
      <div className="relative min-h-[calc(100vh-1rem)] flex items-center justify-center overflow-hidden pt-20 rounded-2xl">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <Skeleton className="h-16 w-96 mx-auto mb-6 bg-white/20" />
          <Skeleton className="h-8 w-80 mx-auto mb-12 bg-white/20" />
          <div className="max-w-2xl mx-auto mb-12">
            <Skeleton className="h-14 w-full rounded-lg mb-4 bg-white/20" />
            <Skeleton className="h-14 w-32 mx-auto rounded-lg bg-white/20" />
          </div>
          <div className="mb-16">
            <Skeleton className="h-5 w-40 mx-auto mb-4 bg-white/20" />
            <div className="flex flex-wrap justify-center gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-10 w-24 rounded-full bg-white/20"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews Section Skeleton */}
      <div className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <div className="flex justify-center gap-4 overflow-hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-80">
                  <Skeleton className="h-96 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* About Nomtok Section Skeleton */}
      <div className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Reviews Section Skeleton */}
      <div className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <div className="flex justify-center gap-4 overflow-hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-80">
                  <Skeleton className="h-96 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mark Weins Section Skeleton */}
      <div className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <div className="flex justify-center gap-4 overflow-hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-80">
                  <Skeleton className="h-96 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second City Section Skeleton */}
      <div className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <div className="flex justify-center gap-4 overflow-hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-80">
                  <Skeleton className="h-96 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

