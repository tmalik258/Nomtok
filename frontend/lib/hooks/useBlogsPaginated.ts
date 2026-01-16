'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlogPost } from '@/lib/types';
import { adminBlogActions } from '@/lib/actions/admin-blog-actions';

interface PaginatedBlogsParams {
  page?: number;
  limit?: number;
  search?: string;
  is_published?: boolean;
  is_featured?: boolean;
  category_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PaginatedBlogsResponse {
  blogs: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useBlogsPaginated = (initialParams?: PaginatedBlogsParams) => {
  const [data, setData] = useState<PaginatedBlogsResponse>({
    blogs: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginatedBlogsParams>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialParams
  });
  
  const fetchBlogs = useCallback(async (searchParams?: PaginatedBlogsParams) => {
    const currentParams = searchParams || params;
    const { page = 1, limit = 10, ...otherParams } = currentParams;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminBlogActions.getBlogs({
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

  const updateParams = useCallback((newParams: Partial<PaginatedBlogsParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const goToPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setSearchQuery = useCallback((search: string) => {
    updateParams({ search, page: 1 }); // Reset to first page when searching
  }, [updateParams]);

  const setPublishedFilter = useCallback((is_published?: boolean) => {
    updateParams({ is_published, page: 1 }); // Reset to first page when filtering
  }, [updateParams]);

  const setFeaturedFilter = useCallback((is_featured?: boolean) => {
    updateParams({ is_featured, page: 1 }); // Reset to first page when filtering
  }, [updateParams]);

  const setCategoryFilter = useCallback((category_id?: string) => {
    updateParams({ category_id, page: 1 }); // Reset to first page when filtering
  }, [updateParams]);

  const setSortBy = useCallback((sort_by: string) => {
    updateParams({ sort_by, page: 1 }); // Reset to first page when changing sort
  }, [updateParams]);

  const setSortOrder = useCallback((sort_order: 'asc' | 'desc') => {
    updateParams({ sort_order, page: 1 }); // Reset to first page when changing sort order
  }, [updateParams]);

  useEffect(() => {
    fetchBlogs(params);
  }, [params, fetchBlogs]);

  const refetch = useCallback(() => {
    fetchBlogs(params);
  }, [fetchBlogs, params]);

  const optimisticallyUpdateBlog = useCallback((blogId: string, updates: Partial<BlogPost>) => {
    setData(prev => ({
      ...prev,
      blogs: prev.blogs.map(blog => 
        blog.id === blogId ? { ...blog, ...updates } : blog
      )
    }));
  }, []);

  return {
    ...data,
    loading,
    error,
    params,
    fetchBlogs,
    updateParams,
    goToPage,
    setSearchQuery,
    setPublishedFilter,
    setFeaturedFilter,
    setCategoryFilter,
    setSortBy,
    setSortOrder,
    refetch,
    optimisticallyUpdateBlog
  };
};
