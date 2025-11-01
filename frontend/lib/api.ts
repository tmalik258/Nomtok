import axios from 'axios';
import { cachedAxiosGet, clearAll } from './utils/cache';
import { createClient } from '@/lib/utils/supabase/client';

export { restaurantActions as restaurantApi } from './actions/restaurant-actions';
export { influencerActions as influencerApi } from './actions/influencer-actions';
export { listingActions as listingApi } from './actions/listing-actions';
export { googleReviewsActions as googleReviewsApi } from './actions/google-reviews-actions';

// Base API instance - still used by action files
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Admin API instance for admin endpoints
export const adminApi = axios.create({
  baseURL: '/api/admin',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
adminApi.interceptors.request.use(
  async (config) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Invalidate frontend caches on successful admin mutations
adminApi.interceptors.response.use(
  (response) => {
    const method = (response.config.method || 'get').toLowerCase();
    if (method !== 'get') {
      try {
        clearAll();
      } catch {}
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Cached GET wrapper using localStorage-based cache with ETag support
export async function cachedApiGet<T>(
  url: string,
  config?: Parameters<typeof api.get<T>>[1],
  options?: {
    ttlMs?: number;
    storage?: 'local' | 'session';
    namespace?: string;
    preferCache?: boolean;
    keySuffix?: string;
  }
): Promise<{ data: T; fromCache: boolean; isStale: boolean; etag?: string }> {
  return cachedAxiosGet<T>(api, url, config, options);
}

export default api;