'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Restaurant } from '@/lib/types';
import { restaurantActions } from '@/lib/actions';

export const useCityListings = (city: string, skipFetch = false, initialData: Restaurant[] = []) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialData);
  const [loading, setLoading] = useState(!skipFetch && initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchCityListings = useCallback(async () => {
    if (!city || skipFetch) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use the new dedicated endpoint for top cities with restaurants
      // This endpoint is optimized and returns only required fields
      const topCitiesData = await restaurantActions.getTopCitiesWithRestaurants(10, 6);
      
      if (!topCitiesData || !topCitiesData.cities) {
        throw new Error('Invalid response format from API');
      }

      // Find the city in the response
      const cityData = topCitiesData.cities.find(
        (c: { city: string }) => c.city === city
      );

      if (!cityData || !cityData.restaurants) {
        // City not found in top cities, fallback to old endpoint
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
      } else {
        // Use restaurants from the dedicated endpoint (already filtered and sorted)
        setRestaurants(cityData.restaurants);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch city listings'
      );
    } finally {
      setLoading(false);
    }
  }, [city, skipFetch]);

  useEffect(() => {
    // If we have initial data or should skip, use initial data and don't fetch
    // This prevents API calls when we have server-side initial data (ISR/SSR)
    if (skipFetch || initialData.length > 0) {
      setLoading(false);
      if (initialData.length > 0 && restaurants.length === 0) {
        // Ensure initial data is set (for ISR/SSR data from getTopCitiesWithRestaurants)
        setRestaurants(initialData);
      }
      hasFetchedRef.current = true; // Mark as handled to prevent any future fetches
      return;
    }

    // Only fetch if we have a city, no initial data, and haven't already fetched
    if (city && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCityListings();
    } else if (!city) {
      setLoading(false);
    }
  }, [city, skipFetch, initialData.length, fetchCityListings, restaurants.length]);

  return {
    restaurants,
    loading,
    error,
    refetch: fetchCityListings,
  };
};

