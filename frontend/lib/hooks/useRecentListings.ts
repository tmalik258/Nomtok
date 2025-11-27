'use client';

import { useState, useEffect, useCallback } from 'react';
import { Listing, Restaurant } from '@/lib/types';
import { listingActions } from '@/lib/actions';

export const useRecentListings = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getPaginatedListings({
        approved_status: 'Approved',
        sort_by: 'created_at',
        sort_order: 'desc',
        limit: 6,
        page: 1,
      });
      
      // Extract unique restaurants from listings
      const restaurantMap = new Map<string, Restaurant>();
      (data.listings || []).forEach((listing: Listing) => {
        if (listing.restaurant) {
          const restaurantId = listing.restaurant.id;
          if (!restaurantMap.has(restaurantId)) {
            // Initialize restaurant with empty listings array
            restaurantMap.set(restaurantId, {
              ...listing.restaurant,
              listings: [],
            });
          }
          // Add listing to restaurant's listings array
          const restaurant = restaurantMap.get(restaurantId)!;
          if (restaurant.listings) {
            restaurant.listings.push(listing);
          } else {
            restaurant.listings = [listing];
          }
        }
      });
      
      setRestaurants(Array.from(restaurantMap.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentListings();
  }, [fetchRecentListings]);

  return {
    restaurants,
    loading,
    error,
    refetch: fetchRecentListings,
  };
};

