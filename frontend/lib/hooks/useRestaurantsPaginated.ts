'use client';

import { useState, useEffect, useCallback } from 'react';
import { Restaurant, SearchParams } from '@/lib/types';
import { restaurantActions } from '@/lib/actions';

interface PaginatedRestaurantsParams extends Omit<SearchParams, 'skip' | 'limit'> {
  page?: number;
  limit?: number;
}

interface PaginatedRestaurantsResponse {
  restaurants: Restaurant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useRestaurantsPaginated = (initialParams?: PaginatedRestaurantsParams) => {
  const [data, setData] = useState<PaginatedRestaurantsResponse>({
    restaurants: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginatedRestaurantsParams>({
    page: 1,
    limit: 12,
    ...initialParams
  });
  
  const fetchRestaurants = useCallback(async (searchParams?: PaginatedRestaurantsParams) => {
    const currentParams = searchParams || params;
    const { page = 1, limit = 12, ...otherParams } = currentParams;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await restaurantActions.getRestaurantsWithListings({
        ...otherParams,
        skip: (page - 1) * limit,
        limit
      });
      
      // Handle the paginated response from the API
      const restaurants = response.restaurants || [];
      const total = response.total || 0;
      const totalPages = Math.ceil(total / limit);
      
      setData({
        restaurants,
        total,
        page,
        limit,
        totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<PaginatedRestaurantsParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const goToPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setSearchQuery = useCallback((name: string) => {
    updateParams({ name, page: 1 }); // Reset to first page when searching
  }, [updateParams]);

  const setCityFilter = useCallback((city: string) => {
    updateParams({ city, page: 1 }); // Reset to first page when filtering by city
  }, [updateParams]);

  const setTagFilter = useCallback((tag: string) => {
    updateParams({ tag, page: 1 }); // Reset to first page when filtering by tag
  }, [updateParams]);

  const setCuisineFilter = useCallback((cuisine: string) => {
    updateParams({ cuisine, page: 1 }); // Reset to first page when filtering by cuisine
  }, [updateParams]);

  const setInfluencerFilter = useCallback((influencer_id?: string) => {
    updateParams({ influencer_id, page: 1 }); // Reset to first page when filtering by influencer
  }, [updateParams]);

  const setSortBy = useCallback((sort_by: string) => {
    updateParams({ sort_by, page: 1 }); // Reset to first page when changing sort
  }, [updateParams]);

  useEffect(() => {
    fetchRestaurants(params);
  }, [params, fetchRestaurants]);

  return {
    ...data,
    loading,
    error,
    params,
    fetchRestaurants,
    updateParams,
    goToPage,
    setSearchQuery,
    setCityFilter,
    setTagFilter,
    setCuisineFilter,
    setInfluencerFilter,
    setSortBy,
    refetch: () => fetchRestaurants(params)
  };
};