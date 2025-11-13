'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { adminInfluencerActions } from '@/lib/actions';
import { Influencer } from '@/lib/types';
import { CreateInfluencerByUrlFormData } from '@/lib/validations/influencer';

interface ApiError {
  response?: {
    data?: {
      detail?: string | Array<{ loc: string[]; msg: string; type: string; input?: unknown }>;
    };
  };
  message?: string;
}

interface InfluencerFormData {
  name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  youtube_channel_id: string;
  youtube_channel_url?: string;
  subscriber_count?: number;
  region?: string;
  country?: string;
}

interface AdminInfluencerResponse {
  message: string;
  influencer_id: string;
}

export function useAdminInfluencer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInfluencer = async (data: CreateInfluencerByUrlFormData): Promise<AdminInfluencerResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      let response: AdminInfluencerResponse;
      
      // Check if it's YouTube URL-based creation
      if ('youtube_url' in data && Object.keys(data).length === 1) {
        response = await adminInfluencerActions.createInfluencerByUrl(data as CreateInfluencerByUrlFormData);

        return response;
      }

      return null
    } catch (err) {
      const error = err as ApiError;
      let errorMessage = 'Failed to create influencer';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Extract the first validation error message
          errorMessage = detail[0].msg || 'Validation error occurred';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInfluencer = async (
    influencerId: string,
    data: Partial<InfluencerFormData>
  ): Promise<AdminInfluencerResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminInfluencerActions.updateInfluencer(influencerId, data);
      toast.success('Influencer updated successfully');
      return response;
    } catch (err) {
      const error = err as ApiError;
      let errorMessage = 'Failed to update influencer';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Extract the first validation error message
          errorMessage = detail[0].msg || 'Validation error occurred';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteInfluencer = async (influencerId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await adminInfluencerActions.deleteInfluencer(influencerId);
      toast.success('Influencer deleted successfully');
      return true;
    } catch (err) {
      const error = err as ApiError;
      let errorMessage = 'Failed to delete influencer';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Extract the first validation error message
          errorMessage = detail[0].msg || 'Validation error occurred';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInfluencer = async (influencerId: string): Promise<Influencer | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminInfluencerActions.getInfluencer(influencerId);
      return response;
    } catch (err) {
      const error = err as ApiError;
      let errorMessage = 'Failed to fetch influencer';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Extract the first validation error message
          errorMessage = detail[0].msg || 'Validation error occurred';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createInfluencer,
    updateInfluencer,
    deleteInfluencer,
    getInfluencer,
    loading,
    error,
  };
}