"use client";

import { useState, useEffect, useCallback } from "react";
import { Listing } from "@/lib/types";
import { listingActions } from "@/lib/actions";

interface PaginatedListingsParams {
  search?: string;
  restaurant_name?: string;
  influencer_name?: string;
  video_title?: string;
  video_id?: string;
  approved?: boolean;
  status?: 'approved' | 'rejected' | 'pending' | 'all';
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  influencer_slug?: string;
  approved_status?: string;
}

interface PaginatedListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useListings = (initialParams?: PaginatedListingsParams, options?: { autoFetch?: boolean }) => {
  const [data, setData] = useState<PaginatedListingsResponse>({
    listings: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginatedListingsParams>({
    page: 1,
    limit: 10,
    status: 'all',
    ...initialParams
  });

  const autoFetch = options?.autoFetch ?? true;

  const fetchListings = useCallback(async (searchParams?: PaginatedListingsParams) => {
    const currentParams = searchParams || params;
    const { page = 1, limit = 10, ...otherParams } = currentParams;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await listingActions.getPaginatedListings({
        ...otherParams,
        page,
        limit
      });
      
      const listings = response.listings || [];
      const total = response.total || 0;
      const totalPages = Math.ceil(total / limit);
      
      setData({
        listings,
        total,
        page,
        limit,
        totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<PaginatedListingsParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const goToPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setLimit = useCallback((limit: number) => {
    updateParams({ limit, page: 1 }); // Reset to first page when changing limit
  }, [updateParams]);

  const setSearchTerm = useCallback((search: string) => {
    updateParams({ search, page: 1 }); // Reset to first page when searching
  }, [updateParams]);

  const setStatusFilter = useCallback((status: 'approved' | 'rejected' | 'pending' | 'all') => {
    updateParams({ status, page: 1 }); // Reset to first page when filtering
  }, [updateParams]);

  const setSortBy = useCallback((sort_by: string) => {
    updateParams({ sort_by, page: 1 }); // Reset to first page when changing sort
  }, [updateParams]);

  const setSortOrder = useCallback((sort_order: 'asc' | 'desc') => {
    updateParams({ sort_order, page: 1 }); // Reset to first page when changing sort order
  }, [updateParams]);

  useEffect(() => {
    if (autoFetch) {
      fetchListings(params);
    }
  }, [params, fetchListings, autoFetch]);

  return {
    // Data properties
    listings: data.listings,
    totalCount: data.total,
    totalPages: data.totalPages,
    loading,
    error,
    params,
    
    // Methods
    fetchListings,
    updateParams,
    goToPage,
    setPage,
    setLimit,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
    setSortOrder,
    refetch: () => fetchListings(params)
  };
};

export const useListing = (id: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getListing(id);
      setListing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch listing");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing, id]);

  return {
    listing,
    loading,
    error,
    refetch: fetchListing,
  };
};

export const useRestaurantListings = (restaurantSlug: string) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!restaurantSlug) return;

    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getListingsByRestaurant(restaurantSlug);
      setListings(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch restaurant listings"
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantSlug]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, restaurantSlug]);

  return {
    listings,
    loading,
    error,
    refetch: fetchListings,
  };
};

export const useMostRecentListing = (influencerSlug: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMostRecentListing = useCallback(async () => {
    if (!influencerSlug) return;

    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getMostRecentListingByInfluencer(
        influencerSlug
      );
      setListing(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch most recent listing"
      );
    } finally {
      setLoading(false);
    }
  }, [influencerSlug]);

  useEffect(() => {
    fetchMostRecentListing();
  }, [fetchMostRecentListing]);

  return {
    listing,
    loading,
    error,
    refetch: fetchMostRecentListing,
  };
};

export const useInfluencerListings = (influencerSlug: string) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!influencerSlug) return;

    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getListingsByInfluencer(influencerSlug);
      setListings(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch influencer listings"
      );
    } finally {
      setLoading(false);
    }
  }, [influencerSlug]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, influencerSlug]);

  return {
    listings,
    loading,
    error,
    refetch: fetchListings,
  };
};
