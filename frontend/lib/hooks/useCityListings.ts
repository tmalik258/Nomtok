'use client';

import { useState, useEffect, useCallback } from 'react';
import { Restaurant } from '@/lib/types';
import { restaurantActions } from '@/lib/actions';

export const useCityListings = (city: string) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCityListings = useCallback(async () => {
    if (!city) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Get restaurants by city with listings included
      const allRestaurants = await restaurantActions.searchRestaurantsByCity(
        city,
        true, // includeListings
        false // includeVideoDetails
      );

      if (!Array.isArray(allRestaurants)) {
        throw new Error('Invalid response format from API');
      }

      // Filter restaurants that have approved listings
      const restaurantsWithListings = allRestaurants.filter(
        (restaurant: Restaurant) =>
          restaurant.listings &&
          restaurant.listings.length > 0 &&
          restaurant.listings.some((listing) => listing.approved === true)
      );

      // Filter listings to only approved ones for each restaurant
      const restaurantsWithApprovedListings = restaurantsWithListings.map(
        (restaurant: Restaurant) => ({
          ...restaurant,
          listings: restaurant.listings?.filter(
            (listing) => listing.approved === true
          ) || [],
        })
      );

      // Sort by rating (if available) or number of listings, limit to 6
      const sortedRestaurants = restaurantsWithApprovedListings
        .sort((a, b) => {
          const aRating = a.google_rating || 0;
          const bRating = b.google_rating || 0;
          if (bRating !== aRating) {
            return bRating - aRating;
          }
          // Fallback to number of listings
          return (b.listings?.length || 0) - (a.listings?.length || 0);
        })
        .slice(0, 6);

      setRestaurants(sortedRestaurants);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch city listings'
      );
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchCityListings();
  }, [fetchCityListings]);

  return {
    restaurants,
    loading,
    error,
    refetch: fetchCityListings,
  };
};

