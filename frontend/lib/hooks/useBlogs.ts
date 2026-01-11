'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '@/lib/types';
import { blogActions } from '@/lib/actions/blog-actions';

interface BlogsParams {
  category?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface BlogsResponse {
  blogs: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useBlogs = (initialParams?: BlogsParams) => {
  const [data, setData] = useState<BlogsResponse>({
    blogs: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<BlogsParams>({
    page: 1,
    limit: 12,
    sort_by: 'published_at',
    sort_order: 'desc',
    ...initialParams
  });

  const fetchBlogs = useCallback(async (searchParams?: BlogsParams) => {
    const currentParams = searchParams || params;
    const { page = 1, limit = 12, ...otherParams } = currentParams;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await blogActions.getBlogPosts({
        ...otherParams,
        skip: (page - 1) * limit,
        limit,
      });
      
      // Handle the paginated response from the API
      const blogs = response.blogs || [];
      const total = response.total || 0;
      const totalPages = Math.ceil(total / limit);
      
      setData({
        blogs,
        total,
        page,
        limit,
        totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<BlogsParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const goToPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setCategoryFilter = useCallback((category?: string) => {
    updateParams({ category, page: 1 }); // Reset to first page when filtering
  }, [updateParams]);

  const setFeaturedFilter = useCallback((featured?: boolean) => {
    updateParams({ featured, page: 1 }); // Reset to first page when filtering
  }, [updateParams]);

  useEffect(() => {
    fetchBlogs(params);
  }, [params, fetchBlogs]);

  return {
    ...data,
    loading,
    error,
    params,
    fetchBlogs,
    updateParams,
    goToPage,
    setCategoryFilter,
    setFeaturedFilter,
    refetch: () => fetchBlogs(params)
  };
};
