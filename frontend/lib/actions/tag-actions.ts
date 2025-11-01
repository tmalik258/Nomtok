import { Tag } from '@/lib/types';
import api, { adminApi, cachedApiGet } from '../api';

// In-memory cache for all tags to avoid repeated fetching across mounts
let allTagsCache: Tag[] | null = null;
let allTagsCacheKey: string | null = null;

interface PaginatedTagsResponse {
  tags: Tag[];
  total: number;
}

type TagsListResponse = Tag[] | { tags?: Tag[] };

export const tagActions = {
  /**
   * Get tags with optional filters
   */
  async getTags(params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<Tag[]> {
    try {
      const { data } = await cachedApiGet<TagsListResponse>('/tags/', { params }, { ttlMs: 5 * 60 * 1000, keySuffix: 'tags-list', namespace: 'tags' });
      // Handle both old and new response formats for backward compatibility
      return Array.isArray(data) ? data : (data.tags ?? []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  },

  /**
   * Get paginated tags with total count
   */
  async getTagsPaginated(params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedTagsResponse> {
    try {
      const { data } = await cachedApiGet('/tags/', { params }, { ttlMs: 5 * 60 * 1000, keySuffix: 'tags-paginated', namespace: 'tags' });
      // Handle both old and new response formats
      if (Array.isArray(data)) {
        // Old format - return as paginated response
        return {
          tags: data,
          total: data.length
        };
      }
      // New format - return as is
      return data as PaginatedTagsResponse;
    } catch (error) {
      console.error('Error fetching paginated tags:', error);
      throw error;
    }
  },

  /**
   * Get a single tag by ID
   */
  async getTag(tagId: string): Promise<Tag> {
    try {
      const { data } = await cachedApiGet(`/tags/${tagId}/`, undefined, { ttlMs: 60 * 60 * 1000, keySuffix: `tag:${tagId}`, namespace: 'tags' });
      return data as Tag;
    } catch (error) {
      console.error(`Error fetching tag ${tagId}:`, error);
      throw error;
    }
  },

  /**
   * Search tags by name
   */
  async searchTagsByName(name: string, limit = 20): Promise<Tag[]> {
    try {
      const { data } = await cachedApiGet('/tags/', {
        params: {
          name,
          limit,
        },
      }, { ttlMs: 10 * 60 * 1000, keySuffix: `tags-search:${name}:${limit}`, namespace: 'tags' });
      return data as Tag[];
    } catch (error) {
      console.error(`Error searching tags by name "${name}":`, error);
      throw error;
    }
  },

  /**
   * Get all available cuisine tags
   */
  async getAllTags(limit = 100, city?: string): Promise<Tag[]> {
    try {
      const cacheKey = `${limit}:${city ?? ''}`;
      if (allTagsCache && allTagsCacheKey === cacheKey) {
        return allTagsCache;
      }
      const { data } = await cachedApiGet<TagsListResponse>('/tags/', {
        params: {
          limit,
          city,
        },
      }, { ttlMs: 60 * 60 * 1000, keySuffix: 'tags-all', namespace: 'tags' });
      const tags = Array.isArray(data) ? data : (data.tags ?? []);
      allTagsCache = tags;
      allTagsCacheKey = cacheKey;
      return tags;
    } catch (error) {
      console.error('Error fetching all tags:', error);
      throw error;
    }
  },

  /**
   * Create a new tag
   */
  async createTag(tagData: { name: string; description?: string }): Promise<Tag> {
    try {
      const response = await adminApi.post('/tags/', tagData);
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  },

  /**
   * Update an existing tag
   */
  async updateTag(tagId: string, tagData: { name?: string; description?: string }): Promise<Tag> {
    try {
      const response = await adminApi.put(`/tags/${tagId}/`, tagData);
      return response.data;
    } catch (error) {
      console.error(`Error updating tag ${tagId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<void> {
    try {
      await adminApi.delete(`/tags/${tagId}/`);
    } catch (error) {
      console.error(`Error deleting tag ${tagId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a restaurant from a tag
   */
  async removeRestaurantFromTag(tagId: string, restaurantId: string): Promise<void> {
    try {
      await api.delete(`/tags/${tagId}/restaurants/${restaurantId}/`);
    } catch (error) {
      console.error(`Error removing restaurant ${restaurantId} from tag ${tagId}:`, error);
      throw error;
    }
  },

  // Admin Restaurant Tag Management
  /**
   * Update restaurant tags (admin only)
   */
  async adminUpdateRestaurantTags(restaurantId: string, tagIds: string[]): Promise<void> {
    try {
      await adminApi.put(`/restaurants/${restaurantId}/tags/`, {
        tag_ids: tagIds
      });
    } catch (error) {
      console.error(`Error updating tags for restaurant ${restaurantId}:`, error);
      throw error;
    }
  },
};