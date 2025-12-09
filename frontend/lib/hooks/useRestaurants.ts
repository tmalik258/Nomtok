"use client";

import { useState, useEffect, useCallback } from "react";
import { Restaurant, SearchParams } from "@/lib/types";
import { restaurantActions } from "@/lib/actions";

export const useRestaurants = (params?: SearchParams) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(
    async (searchParams?: SearchParams) => {
      setLoading(true);
      setError(null);
      try {
        const data = await restaurantActions.getRestaurants(
          searchParams || params
        );
        setRestaurants(data.restaurants);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch restaurants"
        );
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  const searchByCity = useCallback(async (city: string, includeListings = false, includeVideoDetails = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantActions.searchRestaurantsByCity(city, includeListings, includeVideoDetails);
      setRestaurants(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search restaurants"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => fetchRestaurants(params), [fetchRestaurants, params]);

  return {
    restaurants,
    loading,
    error,
    fetchRestaurants,
    searchByCity,
    refetch,
  };
};

export const useRestaurant = (slug: string, includeListings = false, includeVideoDetails = true, skip = false) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = useCallback(async () => {
    if (!slug || skip) return;

    setLoading(true);
    setError(null);
    try {
      const data = await restaurantActions.getRestaurant(slug, includeListings, includeVideoDetails);
      setRestaurant(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch restaurant"
      );
    } finally {
      setLoading(false);
    }
  }, [slug, includeListings, includeVideoDetails, skip]);

  useEffect(() => {
    if (!skip) {
      fetchRestaurant();
    }
  }, [slug, fetchRestaurant, skip]);

  return {
    restaurant,
    loading,
    error,
    refetch: fetchRestaurant,
  };
};

// New hook specifically for fetching restaurant with listings (replaces useRestaurantListings)
export const useRestaurantWithListings = (slug: string, includeVideoDetails = false, skip = false) => {
  return useRestaurant(slug, true, includeVideoDetails, skip);
};
