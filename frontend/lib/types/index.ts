export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Cuisine {
  id: string;
  name: string;
  created_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  google_place_id?: string;
  google_rating?: number;
  business_status: string;
  photo_url?: string;
  tags?: Tag[];
  cuisines?: Cuisine[];
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  videos?: Video[];
  listings?: Listing[];
}

export interface Influencer {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  // region?: string;
  // country?: string;
  youtube_channel_id: string;
  youtube_channel_url?: string;
  subscriber_count?: number;
  total_videos?: number;
  created_at: string;
  updated_at: string;
  videos?: Video[];
  listings?: Listing[];
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description?: string;
  influencer?: Influencer;
  youtube_video_id: string;
  video_url: string;
  published_at?: string;
  transcription?: string;
  status?: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
  listings_count?: number;
}

export interface VideosResponse {
  videos: Video[];
  total: number;
}

export interface ReviewSections {
  history_context?: string;
  overview?: string;
  what_they_ate?: string[];
  verbatim_quotes?: string[];
  nomtok_reflection?: string;
}

export interface Listing {
  id: string;
  restaurant_id?: string;
  restaurant?: Restaurant;
  video_id?: string;
  video?: Video;
  influencer_id?: string;
  influencer?: Influencer;
  visit_date?: string;
  review_sections?: ReviewSections;
  confidence_score?: number;
  timestamp?: number;  // Video timestamp in seconds for start time
  approved?: boolean;
  created_at: string;
  updated_at: string;
}

// Re-export organized types
export * from './api';
export * from './components';
export * from './dashboard';
export * from './google-reviews';
export * from './ui';
export * from './auth';