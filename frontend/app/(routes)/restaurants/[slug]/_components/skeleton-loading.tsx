import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonLoading = () => {
  return (
    <div className="min-h-screen bg-cream p-2 mb-5">
      {/* Full Width Hero Section Skeleton */}
      <div className="relative h-[calc(65vh)] rounded-xl overflow-hidden">
        <Skeleton className="w-full h-full" />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Title Overlay Skeleton */}
        <div className="absolute bottom-20 left-0 right-0 text-center p-6 md:p-8 z-50">
          {/* Restaurant name */}
          <Skeleton className="h-12 md:h-16 w-80 max-w-[90%] mx-auto mb-4 bg-cream/20" />
          {/* Address */}
          <Skeleton className="h-5 w-64 max-w-[80%] mx-auto mb-4 bg-cream/20" />
          {/* Badges */}
          <div className="flex items-center justify-center gap-5 mb-4">
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-24 rounded-full bg-cream/30" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full bg-cream/30" />
          </div>
          {/* Social Share Buttons */}
          <div className="flex justify-center">
            <Skeleton className="h-10 w-48 rounded-lg bg-cream/30" />
          </div>
        </div>
      </div>

      {/* Overlapping Restaurant Map Skeleton */}
      <div className="relative -mt-16 mb-8 mx-2 z-10">
        <Skeleton className="h-[300px] md:h-[350px] max-w-6xl w-[70vw] max-md:w-[80vw] mx-auto rounded-xl shadow-lg" />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Influencer Reviews Section Skeleton */}
        <div className="mb-8">
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-5" /> {/* Users icon */}
            <Skeleton className="h-6 w-40" /> {/* "Influencer Reviews" text */}
            <Skeleton className="h-6 w-8 rounded-full" /> {/* Badge */}
          </div>
          
          {/* Review Cards */}
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6">
                    {/* Header Section with Influencer Info */}
                    <div className="flex items-start gap-4">
                      {/* Influencer Avatar */}
                      <div className="flex-shrink-0">
                        <Skeleton className="w-12 h-12 rounded-full" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            {/* Influencer name */}
                            <Skeleton className="h-6 w-32 mb-1" />
                            {/* Visit date */}
                            <div className="flex items-center gap-1">
                              <Skeleton className="w-3 h-3" /> {/* Calendar icon */}
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                          {/* View Profile Button */}
                          <Skeleton className="h-8 w-24 rounded-md" />
                        </div>
                      </div>
                    </div>

                    {/* Quotes Section - Two Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {Array.from({ length: 2 }).map((_, quoteIndex) => (
                        <div key={quoteIndex} className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                          <div className="flex items-start gap-2">
                            <Skeleton className="w-4 h-4 mt-0.5 flex-shrink-0" /> {/* Quote icon */}
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Video Section - Full Width */}
                    <div className="w-full">
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <Skeleton className="absolute top-0 left-0 w-full h-full rounded-lg" />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Skeleton className="w-16 h-16 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Google Reviews Section Skeleton */}
        <div className="mb-8">
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-7 w-40" /> {/* "Google Reviews" text */}
            <Skeleton className="h-6 w-16 rounded-full" /> {/* Badge */}
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-4 h-4" />
              ))}
            </div>
            <Skeleton className="h-4 w-24" /> {/* Rating text */}
          </div>
          
          {/* Review Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  {/* Reviewer Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-1" /> {/* Reviewer name */}
                      <Skeleton className="h-3 w-16" /> {/* Review date */}
                    </div>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="w-3 h-3" />
                    ))}
                  </div>
                  
                  {/* Review Text */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoading;
