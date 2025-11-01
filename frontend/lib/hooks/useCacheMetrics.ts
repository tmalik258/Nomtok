"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

interface CacheMetrics {
  namespace?: string;
  hits: number;
  misses: number;
  memory_cache_size: number;
  redis_enabled: boolean;
}

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
      [key: string]: unknown;
    };
    status?: number;
  };
}

type MetricsResponse = CacheMetrics | Record<string, CacheMetrics>;

interface UseCacheMetricsOptions {
  namespace?: string;
  pollMs?: number; // optional polling interval
}

export const useCacheMetrics = (options: UseCacheMetricsOptions = {}) => {
  const { namespace, pollMs } = options;
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => (namespace ? { namespace } : undefined), [namespace]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get<MetricsResponse>("/cache/metrics", { params });
      setData(resp.data);
    } catch (e) {
      const error = e as ApiError;
      setError(error.response?.data?.message || error.message || "Failed to load cache metrics");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!pollMs || pollMs <= 0) return;
    const id = setInterval(fetchMetrics, pollMs);
    return () => clearInterval(id);
  }, [fetchMetrics, pollMs]);

  return {
    data,
    loading,
    error,
    refresh: fetchMetrics,
  } as const;
};