import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-2">
      {/* Hero Section Skeleton */}
      <div className="relative h-[70vh] w-full overflow-hidden rounded-lg">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 text-cream">
          <Skeleton className="h-12 md:h-16 w-80 mb-4 bg-cream/20" />
          <Skeleton className="h-6 w-64 mb-2 bg-cream/20" />
        </div>
      </div>

      {/* Overlapping Cards Skeleton */}
      <div className="relative z-20 -mt-20 mb-8 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-cream rounded-lg shadow-md p-6 text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Profile Details Skeleton */}
        <div className="bg-cream rounded-lg shadow-md p-8 mb-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <div className="border-t pt-6">
            <Skeleton className="h-6 w-16 mb-4" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Content Cards Skeleton */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {/* Popular Videos Card Skeleton */}
          <Card className="bg-cream shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-48 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Signature Picks Card Skeleton */}
          <Card className="bg-cream shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Quote Card Skeleton */}
          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-cream shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-6 w-6 bg-cream/20" />
                <Skeleton className="h-6 w-40 bg-cream/20" />
              </div>
              <Skeleton className="h-6 w-64 mb-3 bg-cream/20" />
              <Skeleton className="h-4 w-32 bg-cream/20" />
            </CardContent>
          </Card>
        </div>

        {/* Reviews Skeleton */}
        <div className="mb-8">
          {/* Section Header Skeleton */}
          <div className="flex items-center gap-3 mb-8">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>

          {/* Map Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>

          {/* Restaurant Review Cards Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-cream rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Restaurant Image Skeleton */}
                <div className="h-64 relative p-2">
                  <Skeleton className="w-full h-full rounded-md" />
                  {/* Rating Badge Skeleton */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-cream/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <Skeleton className="h-3 w-6" />
                    </div>
                  </div>
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Restaurant Info Skeleton */}
                    <div className="flex-1">
                      {/* Restaurant Name */}
                      <Skeleton className="h-8 w-3/4 mb-3" />

                      {/* Badges (Location & Date) */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>

                      {/* Address */}
                      <Skeleton className="h-4 w-full mb-4" />

                      {/* Review Components Skeleton */}
                      <div className="space-y-4 mb-6">
                        {/* Overall Rating Section */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <Skeleton className="h-5 w-24 mb-2" />
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Skeleton key={star} className="w-4 h-4 rounded-full" />
                              ))}
                            </div>
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <Skeleton className="h-3 w-32" />
                        </div>

                        {/* Food Quality Assessment */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <Skeleton className="h-5 w-28 mb-2" />
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Skeleton key={star} className="w-4 h-4 rounded-full" />
                              ))}
                            </div>
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>

                        {/* Service Evaluation */}
                        <div className="bg-green-50 rounded-lg p-4">
                          <Skeleton className="h-5 w-24 mb-2" />
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Skeleton key={star} className="w-4 h-4 rounded-full" />
                              ))}
                            </div>
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}