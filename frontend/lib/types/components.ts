// Component-specific interfaces and types

// Restaurant components
export interface RestaurantCardProps {
  restaurant: Restaurant;
}

export interface RestaurantMapProps {
  restaurants: Restaurant[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export interface RestaurantGridViewProps {
  restaurants: Restaurant[];
  isLoading?: boolean;
}

export interface RestaurantMapViewProps {
  restaurants: Restaurant[];
  isLoading?: boolean;
  center?: [number, number];
  zoom?: number;
}

export interface RestaurantHeroSectionProps {
  totalCount: number;
  currentCity?: string;
}

export interface RestaurantLatestListingsProps {
  restaurants: Restaurant[];
}

export interface TagFilterDropdownProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: Tag[];
  isLoading?: boolean;
}

export interface CuisineFilterDropdownProps {
  selectedCuisines: string[];
  onCuisinesChange: (cuisines: string[]) => void;
  availableCuisines: Cuisine[];
  isLoading?: boolean;
}

export interface RestaurantsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

// Influencer components
export interface InfluencerWithStats extends Influencer {
  totalVideos: number;
}

export interface InfluencersGridProps {
  influencers: InfluencerWithStats[];
  isLoading?: boolean;
}

export interface InfluencersSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export interface InfluencersHeroProps {
  totalCount: number;
  featuredInfluencers: InfluencerWithStats[];
}

export interface InfluencersPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export interface HeroSectionProps {
  influencer: Influencer;
}

export interface ProfileDetailsProps {
  influencer: Influencer;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export interface SignaturePicksCardProps {
  influencerId: string;
}

export interface TrendingQuoteProps {
  quote: string;
  restaurant: string;
  videoTitle: string;
  publishedAt: string;
}

export interface AllReviewsProps {
  influencerId: string;
  limit?: number;
}

// Video components
export interface VideoSliderProps {
  videos: Video[];
  title?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  className?: string;
}

// UI components
export interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
}

export interface GoogleReviewsProps {
  placeId: string;
  maxReviews?: number;
  showRating?: boolean;
}



// Error boundary
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

// Retry wrapper
export interface RetryWrapperProps {
  children: React.ReactNode;
  maxRetries?: number;
  onRetry?: () => void;
  fallback?: React.ReactNode;
}

export interface RetryState {
  retryCount: number;
  isRetrying: boolean;
  error?: Error;
}

// Loading states
export interface GridSkeletonProps {
  count?: number;
  className?: string;
}

export interface PageLoadingProps {
  message?: string;
  showSpinner?: boolean;
}

export interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface RetryLoadingProps {
  onRetry: () => void;
  message?: string;
  isRetrying?: boolean;
}

export interface SectionLoadingProps {
  title?: string;
  description?: string;
  className?: string;
}

export interface RestaurantSearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  getSearchPlaceholder: (searchType: string) => string;
  selectedCuisines: Cuisine[];
  onCuisinesChange: (cuisines: Cuisine[]) => void;
  updateSearchQuery: (query: string) => void;
  updateSearchType: (type: string) => void;
  updateSortBy: (sortBy: string) => void;
  updateSelectedCuisines: (cuisines: Cuisine[]) => void;
  selectedInfluencerId?: string;
  onInfluencerIdChange: (id?: string) => void;
  updateSelectedInfluencerId: (id?: string) => void;
  selectedPriceLevel?: number;
  onPriceLevelChange: (priceLevel?: number) => void;
  updateSelectedPriceLevel: (priceLevel?: number) => void;
  city?: string;
}

// Import base types
import type { Restaurant, Influencer, Video, Tag, Cuisine } from './index';