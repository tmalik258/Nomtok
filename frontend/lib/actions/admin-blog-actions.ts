import { adminApi } from '../api';
import { BlogPost, BlogsResponse, BlogCategory } from '@/lib/types';

export interface BlogCreate {
  title: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  is_published?: boolean;
  is_featured?: boolean;
  published_at?: string;
  category_ids?: string[];
}

export interface BlogUpdate {
  title?: string;
  content?: string;
  excerpt?: string;
  cover_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  is_published?: boolean;
  is_featured?: boolean;
  published_at?: string;
  category_ids?: string[];
}

export interface BlogCategoryCreate {
  name: string;
}

export interface BlogCategoryUpdate {
  name?: string;
}

export const adminBlogActions = {
  // Blog Post CRUD
  createBlog: async (blog: BlogCreate) => {
    const response = await adminApi.post('/blog/', blog);
    return response.data;
  },

  getBlogs: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_published?: boolean;
    is_featured?: boolean;
    category_id?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<BlogsResponse> => {
    const response = await adminApi.get('/blog/', { params });
    return response.data;
  },

  getBlog: async (blogId: string): Promise<BlogPost> => {
    const response = await adminApi.get(`/blog/${blogId}/`);
    return response.data;
  },

  updateBlog: async (blogId: string, blog: BlogUpdate) => {
    const response = await adminApi.put(`/blog/${blogId}/`, blog);
    return response.data;
  },

  deleteBlog: async (blogId: string) => {
    const response = await adminApi.delete(`/blog/${blogId}/`);
    return response.data;
  },

  togglePublishBlog: async (blogId: string) => {
    const response = await adminApi.put(`/blog/${blogId}/publish/`);
    return response.data;
  },

  toggleFeatureBlog: async (blogId: string) => {
    const response = await adminApi.put(`/blog/${blogId}/feature/`);
    return response.data;
  },

  // Category CRUD
  createCategory: async (category: BlogCategoryCreate): Promise<BlogCategory> => {
    const response = await adminApi.post('/blog/categories/', category);
    return response.data;
  },

  getCategories: async (): Promise<BlogCategory[]> => {
    const response = await adminApi.get('/blog/categories/');
    return response.data;
  },

  updateCategory: async (categoryId: string, category: BlogCategoryUpdate): Promise<BlogCategory> => {
    const response = await adminApi.put(`/blog/categories/${categoryId}/`, category);
    return response.data;
  },

  deleteCategory: async (categoryId: string) => {
    const response = await adminApi.delete(`/blog/categories/${categoryId}/`);
    return response.data;
  },
};
