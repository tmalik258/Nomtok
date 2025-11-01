'use client';

import { useCallback } from 'react';
import type { SearchableOption } from '@/components/ui/async-searchable-select';
import { influencerActions } from '@/lib/actions/influencer-actions';

export const useInfluencerOptions = () => {
  const fetchInfluencerOptions = useCallback(async (query: string): Promise<SearchableOption[]> => {
    try {
      // First try direct fetch by identifier (supports UUID or slug)
      if (query && query.trim().length > 0) {
        try {
          const influencer = await influencerActions.getInfluencer(query.trim(), { include_listings: false, include_video_details: false });
          if (influencer) {
            return [{ id: influencer.slug, name: influencer.name }];
          }
        } catch (e) {
          // Ignore and fall back to name search
        }
      }

      // Fallback to search by name
      const { influencers } = await influencerActions.getInfluencers({
        name: query || '',
        limit: 20,
        include_listings: false,
        include_video_details: false,
      });

      return influencers.map((i: any) => ({ id: i.slug, name: i.name }));
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
      return [];
    }
  }, []);

  return { fetchInfluencerOptions };
};