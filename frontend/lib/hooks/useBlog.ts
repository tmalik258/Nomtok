'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlogPost, BlogsResponse } from '@/lib/types';
import { blogActions } from '@/lib/actions/blog-actions';

interface UseBlogParams {
  category?: string;
  featured?: boolean;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}

export const useBlog = (params?: UseBlogParams) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = useCallback(async (searchParams?: UseBlogParams) => {
    const currentParams = searchParams || params;
    setLoading(true);
    setError(null);

    try {
      const response: BlogsResponse = await blogActions.getBlogPosts(currentParams);
      setBlogs(response.blogs || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return {
    blogs,
    total,
    loading,
    error,
    refetch: fetchBlogs,
  };
};

export const useBlogPost = (slug: string) => {
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await blogActions.getBlogPost(slug);
      setBlog(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog post');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug, fetchBlog]);

  return {
    blog,
    loading,
    error,
    refetch: fetchBlog,
  };
};

export const useFeaturedBlogs = (limit: number = 10) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: BlogsResponse = await blogActions.getFeaturedBlogPosts(limit);
      setBlogs(response.blogs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured blog posts');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeaturedBlogs();
  }, [fetchFeaturedBlogs]);

  return {
    blogs,
    loading,
    error,
    refetch: fetchFeaturedBlogs,
  };
};
