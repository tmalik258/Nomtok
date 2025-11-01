import { Cuisine, Restaurant } from '@/lib/types';
import api, { adminApi, cachedApiGet } from '../api';

// In-memory cache for all cuisines to avoid repeated fetching across mounts
let allCuisinesCache: Cuisine[] | null = null;
let allCuisinesCacheKey: string | null = null;

interface PaginatedCuisinesResponse {
  cuisines: Cuisine[];
  total: number;
}

export const cuisineActions = {
  /**
   * Get cuisines with optional filters
   */
  async getCuisines(params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<Cuisine[]> {
    try {
      const { data } = await cachedApiGet('/cuisines/', { params }, { ttlMs: 5 * 60 * 1000, keySuffix: 'cuisines-list' });
      // Handle both old and new response formats for backward compatibility
      return Array.isArray(data) ? data : (data as any).cuisines;
    } catch (error) {
      console.error('Error fetching cuisines:', error);
      throw error;
    }
  },

  /**
   * Get paginated cuisines with total count
   */
  async getCuisinesPaginated(params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedCuisinesResponse> {
    try {
      const { data } = await cachedApiGet('/cuisines/', { params }, { ttlMs: 5 * 60 * 1000, keySuffix: 'cuisines-paginated' });
      // Handle both old and new response formats
      if (Array.isArray(data)) {
        // Old format - return as paginated response
        return {
          cuisines: data,
          total: data.length
        };
      }
      // New format - return as is
      return data as PaginatedCuisinesResponse;
    } catch (error) {
      console.error('Error fetching paginated cuisines:', error);
      throw error;
    }
  },

  /**
   * Get a single cuisine by ID
   */
  async getCuisine(cuisineId: string): Promise<Cuisine> {
    try {
      const { data } = await cachedApiGet(`/cuisines/${cuisineId}/`, undefined, { ttlMs: 60 * 60 * 1000, keySuffix: `cuisine:${cuisineId}` });
      return data as Cuisine;
    } catch (error) {
      console.error(`Error fetching cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  /**
   * Search cuisines by name
   */
  async searchCuisinesByName(name: string, limit = 20): Promise<Cuisine[]> {
    try {
      const { data } = await cachedApiGet('/cuisines/', {
        params: {
          name,
          limit,
        },
      }, { ttlMs: 10 * 60 * 1000, keySuffix: `cuisines-search:${name}:${limit}` });
      return data as Cuisine[];
    } catch (error) {
      console.error(`Error searching cuisines by name "${name}":`, error);
      throw error;
    }
  },

  /**
   * Get all available cuisines
   */
  async getAllCuisines(limit = 100, city?: string): Promise<Cuisine[]> {
    try {
      const cacheKey = `${limit}:${city ?? ''}`;
      if (allCuisinesCache && allCuisinesCacheKey === cacheKey) {
        return allCuisinesCache;
      }
      const { data } = await cachedApiGet('/cuisines/', {
        params: {
          limit,
          city,
        },
      }, { ttlMs: 60 * 60 * 1000, keySuffix: 'cuisines-all' });
      const cuisines = Array.isArray(data) ? data : (data as any)?.cuisines ?? [];
      allCuisinesCache = cuisines;
      allCuisinesCacheKey = cacheKey;
      return cuisines;
    } catch (error) {
      console.error('Error fetching all cuisines:', error);
      throw error;
    }
  },

  /**
   * Create a new cuisine
   */
  async createCuisine(cuisineData: { name: string; description?: string }): Promise<Cuisine> {
    try {
      const response = await adminApi.post('/cuisines/', cuisineData);
      return response.data;
    } catch (error) {
      console.error('Error creating cuisine:', error);
      throw error;
    }
  },

  /**
   * Update an existing cuisine
   */
  async updateCuisine(cuisineId: string, cuisineData: { name?: string; description?: string }): Promise<Cuisine> {
    try {
      const response = await adminApi.put(`/cuisines/${cuisineId}/`, cuisineData);
      return response.data;
    } catch (error) {
      console.error(`Error updating cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a cuisine
   */
  async deleteCuisine(cuisineId: string): Promise<void> {
    try {
      await adminApi.delete(`/cuisines/${cuisineId}/`);
    } catch (error) {
      console.error(`Error deleting cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  /**
   * Get restaurants by cuisine ID with pagination
   */
  async getRestaurantsByCuisine(
    cuisineId: string,
    params?: {
      skip?: number;
      limit?: number;
      include_listings?: boolean;
      include_video_details?: boolean;
    }
  ): Promise<{ restaurants: Restaurant[]; total: number }> {
    try {
      const { data } = await cachedApiGet(`/cuisines/${cuisineId}/restaurants/`, { params }, { ttlMs: 5 * 60 * 1000, keySuffix: `cuisine-restaurants:${cuisineId}` });
      return data as { restaurants: Restaurant[]; total: number };
    } catch (error) {
      console.error(`Error fetching restaurants for cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a restaurant from a cuisine
   */
  async removeRestaurantFromCuisine(cuisineId: string, restaurantId: string): Promise<void> {
    try {
      await api.delete(`/cuisines/${cuisineId}/restaurants/${restaurantId}/`);
    } catch (error) {
      console.error(`Error removing restaurant ${restaurantId} from cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  // Admin Restaurant Cuisine Management
  /**
   * Update restaurant cuisines (admin only)
   */
  async adminUpdateRestaurantCuisines(restaurantId: string, cuisineIds: string[]): Promise<void> {
    try {
      await adminApi.put(`/restaurants/${restaurantId}/cuisines/`, {
        cuisine_ids: cuisineIds
      });
    } catch (error) {
      console.error(`Error updating cuisines for restaurant ${restaurantId}:`, error);
      throw error;
    }
  },
};