// Admin actions types
export interface Job {
  id: string;
  job_type: 'scrape_youtube' | 'transcription_nlp' | 'refresh_youtube_cookies';
  trigger_type: 'manual' | 'system';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  title: string;
  description: string;
  progress: number;
  total_items: number;
  processed_items: number;
  result_data: Record<string, undefined> | null;
  error_messages?: string[];
  started_at?: string;
  completed_at?: string;
  redis_lock_key?: string;
  queue_size?: number;
  items_in_progress?: number;
  failed_items?: number;
  retry_count?: number;
  max_retries?: number;
  estimated_completion_time?: string;
  processing_rate?: number;
  last_heartbeat?: string;
  cancellation_requested?: boolean;
  cancelled_at?: string;
}

export interface TriggerScrapeResponse {
  message: string;
  job_id: string;
}

export interface TriggerNLPResponse {
  message: string;
  job_id: string;
}

// Search and pagination types
export interface SearchParams {
  city?: string;
  name?: string;
  video_id?: string;
  restaurant_id?: string;
  influencer_id?: string;
  tag?: string;
  cuisine?: string;
  price_level?: number;
  sort_by?: string;
  skip?: number;
  limit?: number;
  offset?: number;
  approved_status?: string;
  include_listings?: boolean;
  include_video_details?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  pagination?: PaginationResult;
}

// Restaurant API types
export interface CityRestaurants {
  city: string;
  restaurants: Restaurant[];
}

export interface TopCitiesWithRestaurantsResponse {
  cities: CityRestaurants[];
}

// Paginated responses
export interface PaginatedRestaurantsParams extends Omit<SearchParams, 'skip' | 'limit'> {
  page: number;
  limit: number;
}

export interface PaginatedRestaurantsResponse {
  restaurants: Restaurant[];
  total: number;
}

export interface PaginatedInfluencersParams {
  page: number;
  limit: number;
  search?: string;
  region?: string;
  sortBy?: 'name' | 'subscriber_count' | 'total_videos' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedInfluencersResponse {
  influencers: Influencer[];
  total: number;
}

// Influencer API types
export interface InfluencerParams {
  region?: string;
  limit?: number;
  include_stats?: boolean;
}

// Hook options
export interface UseApiWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
}

// Pexels API types
export interface UsePexelsImageProps {
  query: string;
  fallbackUrl?: string;
  size?: 'small' | 'medium' | 'large';
}

// Import base types
import type { Restaurant, Influencer } from './index';