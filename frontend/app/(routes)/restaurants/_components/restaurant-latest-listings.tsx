"use client";

import { RestaurantCard } from "@/components/restaurant-card";
import { RestaurantSkeletonLoader } from "./restaurant-skeleton-loader";
import type { RestaurantLatestListingsProps } from '@/lib/types';

interface RestaurantLatestListingsPropsWithLoading extends RestaurantLatestListingsProps {
  loading?: boolean;
}

export function RestaurantLatestListings({
  restaurants,
  loading = false,
}: RestaurantLatestListingsPropsWithLoading) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <RestaurantSkeletonLoader key={index} />
          ))
        ) : (
          restaurants.slice(0, 3).map((restaurant) => (
            <RestaurantCard
              key={restaurant.slug}
              restaurant={restaurant}
              listings={restaurant.listings || []}
            />
          ))
        )}
      </div>
    </div>
  );
}
