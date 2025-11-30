import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function InfluencerCardSkeleton() {
  return (
    <Card className="overflow-hidden shadow-lg py-0">
      <CardContent className="p-4">
        {/* Card Header with Banner */}
        <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 relative rounded-xl mb-2">
          <Skeleton className="absolute -bottom-8 left-4 w-16 h-16 rounded-full border-4 border-white" />
        </div>
        <div className="pt-8 px-2">
          <div className="mb-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-16 w-full mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-12 rounded-xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InfluencersLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Skeleton className="h-16 w-96 mx-auto mb-6 bg-cream/20" />
            <Skeleton className="h-6 w-128 mx-auto mb-12 bg-cream/20" />
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-cream/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Skeleton className="h-12 w-16 mx-auto mb-3 bg-cream/30" />
                  <Skeleton className="h-4 w-24 mx-auto bg-cream/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search Section Skeleton */}
        <div className="bg-cream rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
          <div className="text-center mb-6">
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <InfluencerCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}