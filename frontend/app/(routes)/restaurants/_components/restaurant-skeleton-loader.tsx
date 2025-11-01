"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RestaurantSkeletonLoader() {
  return (
    <Card className="h-full flex flex-col overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group p-4">
      {/* Image Section - matches RestaurantCard's h-48 rounded-lg */}
      <div className="relative h-48 rounded-lg overflow-hidden">
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
      <CardContent className="p-0 flex flex-col flex-1 justify-between gap-3">
        {/* Top: Restaurant basic info */}
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
        
        {/* Bottom: Listings (quotes) and CTA button */}
        <div className="flex flex-col gap-3">
          {/* Listings Section - flexible height */}
          <div>
            {/* Influencer listing */}
            <div className="flex items-center mb-2">
              <Skeleton className="w-8 h-8 rounded-full mr-2" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
          
          {/* Button Section - matches actual button */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}