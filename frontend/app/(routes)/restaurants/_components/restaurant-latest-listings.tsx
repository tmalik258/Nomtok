"use client";

import type { RestaurantLatestListingsProps } from "@/lib/types";
import { RestaurantGridView } from "./restaurant-grid-view";

interface RestaurantLatestListingsPropsWithLoading
  extends RestaurantLatestListingsProps {
  loading?: boolean;
}

export function RestaurantLatestListings({
  restaurants,
  loading = false,
}: RestaurantLatestListingsPropsWithLoading) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Listings</h2>
      <RestaurantGridView filteredRestaurants={restaurants} loading={loading} />
    </div>
  );
}
