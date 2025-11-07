import { Listing, SearchParams } from '@/lib/types';
import { CreateListingFormData } from '@/lib/validations/listing-create';
import api, { adminApi } from '../api';

type ListingApprovalResponse = {
  message: string;
  listing_id: string;
  approved: boolean;
};

interface PaginatedListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const listingActions = {
  getListings: async (params?: SearchParams): Promise<Listing[]> => {
    const response = await api.get('/listings/', { params });
    return response.data;
  },

  getPaginatedListings: async (params?: {
    search?: string;
    restaurant_name?: string;
    influencer_name?: string;
    video_title?: string;
    approved?: boolean;
    status?: 'approved' | 'rejected' | 'pending' | 'all';
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedListingsResponse> => {
    try {
      const response = await api.get('/listings/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated listings:', error);
      throw error;
    }
  },
  
  getListing: async (id: string): Promise<Listing> => {
    const response = await api.get(`/listings/${id}/`);
    return response.data;
  },
  
  getListingsByRestaurant: async (restaurantSlug: string): Promise<Listing[]> => {
    const response = await api.get('/listings/', { 
      params: { restaurant_slug: restaurantSlug, approved_status: 'Approved' } 
    });
    return response.data.listings ?? response.data;
  },
  
  getListingsByInfluencer: async (influencerSlug: string): Promise<Listing[]> => {
    const response = await api.get('/listings/', { 
      params: { influencer_slug: influencerSlug, approved_status: 'Approved' } 
    });
    return response.data.listings ?? response.data;
  },
  
  getMostRecentListingByInfluencer: async (influencerSlug: string): Promise<Listing | null> => {
    const response = await api.get('/listings/', { 
      params: { 
        influencer_slug: influencerSlug, 
        approved: true,
        sort_by_published_date: true,
        limit: 1
      } 
    });
    const arr = response.data.listings ?? response.data;
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  },

  createListing: async (data: CreateListingFormData): Promise<Listing> => {
    const payload = {
      ...data,
      visit_date: data.visit_date?.toISOString(),
    };
    
    const response = await adminApi.post("/listings/", payload);
    return response.data;
  },

  updateListing: async (id: string, data: CreateListingFormData): Promise<Listing> => {
    const payload = {
      ...data,
      visit_date: data.visit_date?.toISOString(),
    };
    
    const response = await adminApi.put(`/listings/${id}/`, payload);
    return response.data;
  },

  approveListing: async (id: string): Promise<ListingApprovalResponse> => {
    const response = await adminApi.put(`/listings/approve/${id}/`);
    return response.data;
  },

  disapproveListing: async (id: string): Promise<ListingApprovalResponse> => {
    const response = await adminApi.put(`/listings/disapprove/${id}/`);
    return response.data;
  },

  deleteListing: async (id: string): Promise<void> => {
    await adminApi.delete(`/listings/${id}/`);
  }
};