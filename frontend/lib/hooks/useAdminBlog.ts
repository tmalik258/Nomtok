'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { BlogPost, BlogCategory } from '@/lib/types';
import { BlogCreate, BlogUpdate, BlogCategoryCreate, BlogCategoryUpdate } from '@/lib/actions/admin-blog-actions';
import { AxiosError } from 'axios';

interface AdminBlogResponse {
  message: string;
  blog_id: string;
}

export function useAdminBlog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBlog = async (data: BlogCreate): Promise<AdminBlogResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.post<AdminBlogResponse>('/blog/', data);
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create blog post';
      setError(errorMessage);
      throw error; // Re-throw to let the component handle the error display
    } finally {
      setLoading(false);
    }
  };

  const updateBlog = async (
    blogId: string,
    data: BlogUpdate
  ): Promise<AdminBlogResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.put<AdminBlogResponse>(`/blog/${blogId}/`, data);
      toast.success('Blog post updated successfully');
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update blog post';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async (blogId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await adminApi.delete(`/blog/${blogId}/`);
      toast.success('Blog post deleted successfully');
      return true;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete blog post';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getBlog = useCallback(async (blogId: string): Promise<BlogPost | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.get<BlogPost>(`/blog/${blogId}/`);
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch blog post';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePublishBlog = async (blogId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await adminApi.put(`/blog/${blogId}/publish/`);
      toast.success('Blog post publish status updated');
      return true;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to toggle publish status';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureBlog = async (blogId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await adminApi.put(`/blog/${blogId}/feature/`);
      toast.success('Blog post feature status updated');
      return true;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to toggle feature status';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data: BlogCategoryCreate): Promise<BlogCategory | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.post<BlogCategory>('/blog/categories/', data);
      toast.success('Category created successfully');
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create category';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (
    categoryId: string,
    data: BlogCategoryUpdate
  ): Promise<BlogCategory | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.put<BlogCategory>(`/blog/categories/${categoryId}/`, data);
      toast.success('Category updated successfully');
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update category';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await adminApi.delete(`/blog/categories/${categoryId}/`);
      toast.success('Category deleted successfully');
      return true;
    } catch (err: unknown) {
      const error = err as AxiosError<{ detail: string }>;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete category';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBlog,
    updateBlog,
    deleteBlog,
    getBlog,
    togglePublishBlog,
    toggleFeatureBlog,
    createCategory,
    updateCategory,
    deleteCategory,
    loading,
    error,
  };
}
