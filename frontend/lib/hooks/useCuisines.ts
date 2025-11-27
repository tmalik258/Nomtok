"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Cuisine } from "@/lib/types";
import { cuisineActions } from "@/lib/actions";

interface CacheEntry {
  data: Cuisine[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useCuisines = () => {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const fetchCuisines = useCallback(async (params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }) => {
    // Create cache key
    const cacheKey = `cuisines:${params?.name || ''}:${params?.id || ''}:${params?.city || ''}:${params?.skip || 0}:${params?.limit || 100}`;
    const cached = cacheRef.current.get(cacheKey);
    
    // Check cache validity
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setCuisines(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await cuisineActions.getCuisines(params);
      setCuisines(data);
      // Cache the result
      cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch cuisines"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllCuisines = useCallback(async (limit = 100, city?: string) => {
    // Create cache key
    const cacheKey = `cuisines:all:${city || ''}:${limit}`;
    const cached = cacheRef.current.get(cacheKey);
    
    // Check cache validity
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setCuisines(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await cuisineActions.getAllCuisines(limit, city);
      setCuisines(data);
      // Cache the result
      cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch all cuisines"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCuisinesByName = useCallback(async (name: string, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cuisineActions.searchCuisinesByName(name, limit);
      setCuisines(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search cuisines"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cuisines,
    loading,
    error,
    fetchCuisines,
    fetchAllCuisines,
    searchCuisinesByName,
  };
};

export const useCuisine = (id: string) => {
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuisine = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await cuisineActions.getCuisine(id);
      setCuisine(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch cuisine"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCuisine();
  }, [fetchCuisine]);

  return {
    cuisine,
    loading,
    error,
    refetch: fetchCuisine,
  };
};