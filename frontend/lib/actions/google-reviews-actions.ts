import { GoogleReviewsResponse } from "@/lib/types/google-reviews";
import api from "../api";

export const googleReviewsActions = {
  /**
   * Get Google Reviews for a restaurant by place ID
   */
  async getGoogleReviews(placeId: string): Promise<GoogleReviewsResponse> {
    try {
      const response = await api.get('/google-reviews/', {
        params: {
          place_id: placeId,
        },
      });
      const result = response.data.result;
      console.log(`Google Reviews: Received ${result.reviews?.length || 0} reviews`, result);
      return result;
    } catch (error) {
      console.error(`Error fetching Google reviews for place ${placeId}:`, error);
      throw error;
    }
  },
};