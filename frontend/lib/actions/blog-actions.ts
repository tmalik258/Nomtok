import api from '../api';
import { BlogPost, BlogsResponse, BlogCategory } from '@/lib/types';

export const blogActions = {
  getBlogPosts: async (params?: {
    category?: string;
    featured?: boolean;
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<BlogsResponse> => {
    const response = await api.get('/blog/', { params });
    return response.data;
  },

  getBlogPost: async (slug: string): Promise<BlogPost> => {
    const response = await api.get(`/blog/${slug}/`);
    return response.data;
  },

  getFeaturedBlogPosts: async (limit: number = 10): Promise<BlogsResponse> => {
    const response = await api.get('/blog/featured/', {
      params: { limit }
    });
    return response.data;
  },

  getBlogCategories: async (): Promise<BlogCategory[]> => {
    const response = await api.get('/blog/categories/');
    return response.data;
  },
};
