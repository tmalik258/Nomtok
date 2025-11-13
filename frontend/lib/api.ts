import axios, { AxiosRequestConfig } from 'axios';
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

// Perf: instrument request/response timing and payload size for influencers endpoint
api.interceptors.request.use((config) => {
  // Mark start time
  config.__startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  return config;
});

api.interceptors.response.use(
  (response) => {
    const start = response.config.__startTime ?? Date.now();
    const end = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const durationMs = Math.max(0, end - start);

    const url = `${response.config.baseURL || ''}${response.config.url || ''}`;
    const isInfluencersReq = /\/influencers\/?$/i.test(response.config.url || '') || /\/influencers\//i.test(response.config.url || '');

    // Try to get payload size
    const headerLen = Number(response.headers?.['content-length']) || Number(response.headers?.['Content-Length']) || 0;
    let approxBytes = headerLen;
    if (!approxBytes) {
      try {
        const str = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        approxBytes = str.length; // UTF-16 length; rough estimate
      } catch {}
    }

    // Only log influencers metrics to keep console clean
    if (isInfluencersReq && typeof window !== 'undefined') {
      console.info(
        `[perf] GET ${url} — ${durationMs.toFixed(0)}ms, ~${approxBytes}B, status ${response.status}`
      );
    }

    return response;
  },
  (error) => {
    const cfg: Partial<AxiosRequestConfig> = error?.config || {};
    const start = cfg.__startTime ?? Date.now();
    const end = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const durationMs = Math.max(0, end - start);
    const url = `${cfg.baseURL || ''}${cfg.url || ''}`;
    const isInfluencersReq = /\/influencers\/?$/i.test(cfg.url || '') || /\/influencers\//i.test(cfg.url || '');
    if (isInfluencersReq && typeof window !== 'undefined') {
      console.warn(`[perf] GET ${url} failed — ${durationMs.toFixed(0)}ms`, error?.message || error);
    }
    return Promise.reject(error);
  }
);

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