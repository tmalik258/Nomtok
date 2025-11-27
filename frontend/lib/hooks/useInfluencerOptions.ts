'use client';

import { useCallback, useRef } from 'react';
import type { SearchableOption } from '@/components/ui/async-searchable-select';
import { influencerActions } from '@/lib/actions/influencer-actions';
import { Influencer } from '../types';

interface CacheEntry {
  data: SearchableOption[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useInfluencerOptions = (city?: string) => {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const fetchInfluencerOptions = useCallback(async (query: string): Promise<SearchableOption[]> => {
    try {
      // Create cache key
      const cacheKey = `influencers:${query || ''}:${city || ''}`;
      const cached = cacheRef.current.get(cacheKey);
      
      // Check cache validity
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      // First try direct fetch by identifier (supports UUID or slug)
      if (query && query.trim().length > 0) {
        try {
          const influencer = await influencerActions.getInfluencer(query.trim(), { include_listings: false, include_video_details: false });
          if (influencer) {
            const result = [{ id: influencer.slug, name: influencer.name }];
            // Cache the result
            cacheRef.current.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
          }
        } catch {
          // Ignore and fall back to name search
        }
      }

      // Fallback to search by name (with city filter if provided)
      const { influencers } = await influencerActions.getInfluencers({
        name: query || '',
        city: city || undefined,
        limit: 20,
        include_listings: false,
        include_video_details: false,
      });

      const result = influencers.map((i: Influencer) => ({ id: i.slug, name: i.name }));
      
      // Cache the result
      cacheRef.current.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
      return [];
    }
  }, [city]);

  return { fetchInfluencerOptions };
};