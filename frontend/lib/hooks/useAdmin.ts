'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminActions } from '@/lib/actions/admin-actions';
import type { Job } from '@/lib/types/api';

export const useJobs = (params?: {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  job_type?: 'scrape_youtube' | 'transcription_nlp';
  sort_by?: 'created_at' | 'started_at' | 'completed_at' | 'progress' | 'status';
  sort_order?: 'asc' | 'desc';
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminActions.getJobs(params);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fetchJobsSilent = useCallback(async () => {
    setError(null);
    try {
      const data = await adminActions.getJobs(params);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    }
  }, [params]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    data: jobs,
    isLoading: loading,
    error,
    refetch: fetchJobs,
    refetchSilent: fetchJobsSilent
  };
};

export const useJob = (jobId: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await adminActions.getJob(jobId);
      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return {
    job,
    loading,
    error,
    refetch: fetchJob
  };
};

export const useJobActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startJob = useCallback(async (jobId: string): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.startJob(jobId);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeJob = useCallback(async (jobId: string): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.completeJob(jobId);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const failJob = useCallback(async (jobId: string, errorMessage: string): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.failJob(jobId, errorMessage);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fail job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJobProgress = useCallback(async (jobId: string, progress: number, processedItems?: number): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.updateJobProgress(jobId, progress, processedItems);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job progress');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelJob = useCallback(async (jobId: string, reason?: string): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.cancelJob(jobId, reason);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestJobCancellation = useCallback(async (jobId: string, reason?: string): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.requestJobCancellation(jobId, reason);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request job cancellation');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    startJob,
    completeJob,
    failJob,
    updateJobProgress,
    cancelJob,
    requestJobCancellation
  };
};

export const useDataSync = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerYouTubeScraping = useCallback(async (videoIds?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminActions.triggerYouTubeScraping(videoIds);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger YouTube scraping');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerNLPProcessing = useCallback(async (videoIds?: string[], triggerType: 'manual' | 'system' = 'manual') => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminActions.triggerNLPProcessing(videoIds, triggerType);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger NLP processing');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshYouTubeCookies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminActions.refreshYouTubeCookies();
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh YouTube cookies');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getYouTubeCookiesStatus = useCallback(async () => {
    setError(null);
    try {
      const response = await adminActions.getYouTubeCookiesStatus();
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cookies status');
      return null;
    }
  }, []);

  const uploadYouTubeCookies = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminActions.uploadYouTubeCookies(file);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload cookies');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    triggerYouTubeScraping,
    triggerNLPProcessing,
    refreshYouTubeCookies,
    getYouTubeCookiesStatus,
    uploadYouTubeCookies,
  };
};

export const useSystemStats = () => {
  const [stats, setStats] = useState<{
    total_listings: number;
    total_restaurants: number;
    total_influencers: number;
    total_videos: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminActions.getSystemStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data: stats,
    isLoading: loading,
    error,
    refetch: fetchStats
  };
};