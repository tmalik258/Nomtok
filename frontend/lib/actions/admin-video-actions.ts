import { adminApi } from '../api';
import { Video } from '@/lib/types';

interface VideoCreateFromUrlData {
  youtube_url: string;
}

interface VideoCreateData {
  influencer_id: string;
  youtube_video_id: string;
  title: string;
  description?: string;
  video_url: string;
  published_at?: string;
  transcription?: string;
}

interface VideoUpdateData {
  title?: string;
  description?: string;
  video_url?: string;
  published_at?: string;
  transcription?: string;
  status?: 'pending' | 'completed' | 'failed';
  error_message?: string;
}

export const adminVideoActions = {
  /**
   * Create a new video from YouTube URL
   */
  createVideoFromUrl: async (data: VideoCreateFromUrlData): Promise<Video> => {
    const response = await adminApi.post('/videos/', data);
    return response.data;
  },

  /**
   * Create a new video with manual data
   */
  createVideo: async (data: VideoCreateData): Promise<Video> => {
    const response = await adminApi.post('/videos/', data);
    return response.data;
  },

  /**
   * Update an existing video
   */
  updateVideo: async (videoId: string, data: VideoUpdateData): Promise<Video> => {
    const response = await adminApi.put(`/videos/${videoId}/`, data);
    return response.data;
  },

  /**
   * Delete a video
   */
  deleteVideo: async (videoId: string): Promise<{ message: string }> => {
    const response = await adminApi.delete(`/videos/${videoId}/`);
    return response.data;
  },

  /**
   * Get a single video by ID (admin view)
   */
  getVideo: async (videoId: string): Promise<Video> => {
    const response = await adminApi.get(`/videos/${videoId}/`);
    return response.data;
  },

  /**
   * Get all videos with admin privileges
   */
  getVideos: async (params?: {
    title?: string;
    youtube_video_id?: string;
    video_title?: string;
    video_url?: string;
    influencer_id?: string;
    influencer_name?: string;
    has_listings?: boolean;
    status?: 'completed' | 'pending' | 'failed';
    skip?: number;
    limit?: number;
  }): Promise<Video[]> => {
    const response = await adminApi.get('/videos', { params });
    return response.data;
  },
};