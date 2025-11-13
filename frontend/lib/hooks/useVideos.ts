'use client';

import { useState, useEffect, useCallback } from 'react';
import { Video } from '@/lib/types';
import { videoActions } from '@/lib/actions';
import { adminVideoActions } from '@/lib/actions/admin-video-actions';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';

interface PaginatedVideosParams {
  title?: string;
  youtube_video_id?: string;
  video_title?: string;
  video_url?: string;
  influencer_id?: string;
  influencer_name?: string;
  has_listings?: boolean;
  status?: "all" | "completed" | "pending" | "failed";
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PaginatedVideosResponse {
  videos: Video[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useVideos = (initialParams?: PaginatedVideosParams) => {
  const [data, setData] = useState<PaginatedVideosResponse>({
    videos: [],
    totalCount: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginatedVideosParams>({
    page: 1,
    limit: 12,
    ...initialParams
  });

  const fetchVideos = useCallback(async (searchParams?: PaginatedVideosParams) => {
    const currentParams = searchParams || params;
    const { page = 1, limit = 12, status, influencer_id, influencer_name, ...otherParams } = currentParams;
    
    setLoading(true);
    setError(null);
    
    // Prefer influencer_id; fallback to normalized influencer_name
    const normalizedInfluencerName = influencer_id ? undefined : (influencer_name ? influencer_name.trim().toLowerCase() : undefined);

    console.log(
      'Fetching videos with',
      influencer_id ? `influencer_id: ${influencer_id}` : `influencer_name: ${normalizedInfluencerName}`
    );

    try {
      const response = await videoActions.getVideos({
        ...otherParams,
        influencer_id: influencer_id ? influencer_id.trim() : undefined,
        influencer_name: normalizedInfluencerName,
        status: status === 'all' ? undefined : status,
        skip: (page - 1) * limit,
        limit
      });
      
      const videos = response.videos || [];
      const totalCount = response.total || 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      setData({
        videos,
        totalCount,
        page,
        limit,
        totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<PaginatedVideosParams>) => {
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

  const setSearchTerm = useCallback((title: string) => {
    updateParams({ title, page: 1 }); // Reset to first page when searching
  }, [updateParams]);

  const setInfluencerFilter = useCallback((influencer_id: string) => {
    updateParams({ influencer_id: influencer_id.trim(), page: 1 });
  }, [updateParams]);

  const setHasListingsFilter = useCallback((has_listings?: boolean) => {
    updateParams({ has_listings, page: 1 }); // Reset to first page when filtering
  }, [updateParams]);

  const setSortBy = useCallback((sort_by: string) => {
    updateParams({ sort_by, page: 1 }); // Reset to first page when changing sort
  }, [updateParams]);

  const setSortOrder = useCallback((sort_order: 'asc' | 'desc') => {
    updateParams({ sort_order, page: 1 }); // Reset to first page when changing sort order
  }, [updateParams]);

  const setProcessedStatusFilter = useCallback((status: "all" | "completed" | "pending" | "failed") => {
    updateParams({ status, page: 1 }); // Reset to first page when filtering
  }, [updateParams]);

  useEffect(() => {
    fetchVideos(params);
  }, [params, fetchVideos]);

  return {
    // Data properties
    videos: data.videos,
    totalCount: data.totalCount,
    totalPages: data.totalPages,
    loading,
    error,
    params,
    
    // Methods
    fetchVideos,
    updateParams,
    goToPage,
    setPage,
    setLimit,
    setSearchTerm,
    setInfluencerFilter,
    setHasListingsFilter,
    setProcessedStatusFilter,
    setSortBy,
    setSortOrder,
    refetch: () => fetchVideos(params)
  };
};

export const useInfluencerVideos = (influencerSlug: string, limit = 20) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!influencerSlug) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await videoActions.getVideosByInfluencer(influencerSlug, limit);
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [influencerSlug, limit]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos
  };
};

/**
 * Hook for creating videos from YouTube URL
 */
export const useCreateVideo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVideoFromUrl = useCallback(async (data: { youtube_url: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const video = await adminVideoActions.createVideoFromUrl(data);
      toast.success('Video created successfully');
      return video;
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const errorMessage = axiosErr.response?.data?.detail || axiosErr.message || 'Failed to create video';
      setError(errorMessage);
      toast.error(errorMessage);
      throw axiosErr;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createVideoFromUrl,
    loading,
    error
  };
};

/**
 * Hook for deleting a video by ID
 */
export const useDeleteVideo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteVideo = useCallback(async (videoId: string) => {
    setLoading(true);
    setError(null);

    try {
      await adminVideoActions.deleteVideo(videoId);
      toast.success('Video deleted successfully');
      return true;
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const errorMessage = axiosErr.response?.data?.detail || axiosErr.message || 'Failed to delete video';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteVideo,
    loading,
    error,
  };
};