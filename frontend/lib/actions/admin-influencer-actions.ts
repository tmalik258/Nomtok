import { adminApi } from '../api';
import { Influencer } from '@/lib/types';

interface InfluencerCreateByUrlData {
  youtube_url: string;
}

interface InfluencerUpdateData {
  name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  youtube_channel_id?: string;
  youtube_channel_url?: string;
  subscriber_count?: number;

}

interface AdminInfluencerResponse {
  message: string;
  influencer_id: string;
}

export const adminInfluencerActions = {
  /**
   * Create a new influencer using YouTube URL
   */
  createInfluencerByUrl: async (data: InfluencerCreateByUrlData): Promise<AdminInfluencerResponse> => {
    const response = await adminApi.post('/admin/influencers/', data);
    return response.data;
  },

  /**
   * Update an existing influencer
   */
  updateInfluencer: async (
    influencerId: string,
    data: InfluencerUpdateData
  ): Promise<AdminInfluencerResponse> => {
    const response = await adminApi.patch(`/influencers/${influencerId}/`, data);
    return response.data;
  },

  /**
   * Delete an influencer
   */
  deleteInfluencer: async (influencerId: string): Promise<{ message: string }> => {
    const response = await adminApi.delete(`/influencers/${influencerId}/`);
    return response.data;
  },

  /**
   * Get a single influencer by ID (admin view)
   */
  getInfluencer: async (influencerId: string): Promise<Influencer> => {
    const response = await adminApi.get(`/influencers/${influencerId}/`);
    return response.data;
  },

  /**
   * Get all influencers with admin privileges
   */
  getInfluencers: async (params?: {
    skip?: number;
    limit?: number;
    include_inactive?: boolean;
    name?: string;
    youtube_channel_id?: string;
  }): Promise<Influencer[]> => {
    const response = await adminApi.get('/influencers', { params });
    return response.data;
  },
};