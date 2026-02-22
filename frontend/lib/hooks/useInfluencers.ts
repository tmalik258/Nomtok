'use client';

import { useState, useEffect, useCallback } from 'react';
import { Influencer } from '@/lib/types';
import { influencerActions } from '@/lib/actions';

interface InfluencersParams {
  name?: string;
  id?: string;
  youtube_channel_id?: string;
  youtube_channel_url?: string;
  include_video_details?: boolean;
  sort_by?: string;
  page?: number;
  limit?: number;
}

interface InfluencersResponse {
  influencers: Influencer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useInfluencer = (slug: string, params?: {
  include_listings?: boolean;
  include_video_details?: boolean;
}) => {
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencer = useCallback(async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await influencerActions.getInfluencer(slug, params);
      setInfluencer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencer');
    } finally {
      setLoading(false);
    }
  }, [slug, params]);

  useEffect(() => {
    fetchInfluencer();
  }, [fetchInfluencer]);

  return {
    influencer,
    loading,
    error,
    refetch: fetchInfluencer
  };
};

export const useInfluencers = (initialParams?: InfluencersParams) => {
  const [data, setData] = useState<InfluencersResponse>({
    influencers: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<InfluencersParams>({
    page: 1,
    limit: 12,
    ...initialParams
  });

  const fetchInfluencers = useCallback(async (searchParams?: InfluencersParams) => {
    const currentParams = searchParams || params;
    const { page = 1, limit = 12, ...otherParams } = currentParams;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await influencerActions.getInfluencers({
        ...otherParams,
        skip: (page - 1) * limit,
        limit,
        include_listings: false
      });
      
      // Handle the new backend response structure with total count
      const influencers = Array.isArray(response) ? response : response.influencers || [];
      const total = Array.isArray(response) ? response.length : response.total || 0;
      const totalPages = Math.ceil(total / limit);
      
      setData({
        influencers,
        total,
        page,
        limit,
        totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencers');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<InfluencersParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const goToPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setSearchQuery = useCallback((name: string) => {
    updateParams({ name, page: 1 }); // Reset to first page when searching
  }, [updateParams]);

  const setSortBy = useCallback((sort_by: string) => {
    updateParams({ sort_by, page: 1 }); // Reset to first page when changing sort
  }, [updateParams]);

  useEffect(() => {
    fetchInfluencers(params);
  }, [params, fetchInfluencers]);

  return {
    ...data,
    loading,
    error,
    params,
    fetchInfluencers,
    updateParams,
    goToPage,
    setSearchQuery,
    setSortBy,
    refetch: () => fetchInfluencers(params)
  };
};