"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSkeletonProps {
  variant?: "restaurant" | "influencer" | "listing" | "hero" | "grid";
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({
  variant = "grid",
  count = 3,
  className = "",
}: LoadingSkeletonProps) {
  const renderRestaurantSkeleton = () => (
    <Card
      className={`overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group p-4 ${className}`}
    >
      {/* Image Section - matches RestaurantCard's h-48 rounded-lg */}
      <div className="relative h-48 rounded-lg overflow-hidden mb-4">
        <Skeleton className="w-full h-full" />
        {/* Rating Badge Skeleton - positioned like actual badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-gray-200 rounded px-2 py-1 flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>

      {/* Content Section - matches CardContent structure */}
      <CardContent className="p-0 flex flex-col flex-grow gap-3">
        {/* Restaurant Info Section */}
        <div>
          {/* Restaurant Name - h3 text-xl */}
          <Skeleton className="h-6 w-3/4 mb-2" />
          {/* City */}
          <Skeleton className="h-4 w-1/2 mb-1" />
          {/* Cuisine Badges */}
          <div className="flex gap-2 mb-1">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-14 rounded" />
          </div>
        </div>

        {/* Listings Section - flexible height */}
        <div className="flex-grow flex flex-col">
          <div className="my-auto space-y-2">
            {/* Influencer listing */}
            <div className="flex items-center">
              <Skeleton className="w-8 h-8 rounded-full mr-2" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Button Section - matches actual button */}
        <Skeleton className="h-10 w-full rounded-md" />
      </CardContent>
    </Card>
  );

  const renderInfluencerSkeleton = () => (
    <Card className={`bg-cream shadow-xl ${className}`}>
      <CardContent className="p-6 text-center">
        <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-8 w-16 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </CardContent>
    </Card>
  );

  const renderListingSkeleton = () => (
    <Card className={`overflow-hidden shadow-lg ${className}`}>
      <div className="relative">
        <Skeleton className="h-64 w-full" />
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </Card>
  );

  const renderHeroSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section Skeleton */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 text-cream">
          <Skeleton className="h-12 md:h-16 w-80 mb-4 bg-cream/20" />
          <Skeleton className="h-6 w-64 mb-2 bg-cream/20" />
        </div>
      </div>

      {/* Overlapping Cards Skeleton */}
      <div className="relative -mt-32 z-10 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map(() => renderInfluencerSkeleton())}
        </div>
      </div>
    </div>
  );

  const renderGridSkeleton = () => (
    <div className={`grid gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  switch (variant) {
    case "restaurant":
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index}>{renderRestaurantSkeleton()}</div>
          ))}
        </>
      );
    case "influencer":
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index}>{renderInfluencerSkeleton()}</div>
          ))}
        </>
      );
    case "listing":
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index}>{renderListingSkeleton()}</div>
          ))}
        </>
      );
    case "hero":
      return renderHeroSkeleton();
    case "grid":
    default:
      return renderGridSkeleton();
  }
}
