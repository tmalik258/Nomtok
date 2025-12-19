import { useEffect, useCallback, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Job } from '../types';
import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';
import { showBrowserNotification } from '../services/browser-notifications';

interface UseJobsRealtimeProps {
  onJobUpdate?: (job: Job) => void;
  onJobCreate?: (job: Job) => void;
  onJobDelete?: (jobId: string) => void;
}

type SubscriptionStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CLOSED' | 'SUBSCRIBING';

export const useJobsRealtime = ({ onJobUpdate, onJobCreate, onJobDelete }: UseJobsRealtimeProps = {}) => {
  const supabase = createClient();
  const pathname = usePathname();
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const isDashboard = pathname?.startsWith('/dashboard') ?? false;

  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 1000; // 1 second
  const MAX_RETRY_DELAY = 30000; // 30 seconds

  const calculateRetryDelay = (attempt: number): number => {
    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
    return delay;
  };

  const handleJobUpdate = useCallback((payload: RealtimePostgresChangesPayload<Job>) => {
    const job = payload.new as Job;
    const oldJob = payload.old as Job;
    
    console.log('Job update received:', { 
      jobId: job.id, 
      oldStatus: oldJob?.status, 
      newStatus: job.status,
      oldProgress: oldJob?.progress,
      newProgress: job.progress,
      oldProcessedItems: oldJob?.processed_items,
      newProcessedItems: job.processed_items
    });
    
    // Always call the callback to update state
    if (onJobUpdate) {
      onJobUpdate(job);
    }

    // Check for status changes
    const statusChanged = oldJob && oldJob.status !== job.status;
    // Check for progress updates (not just status changes)
    const progressChanged = oldJob && (
      oldJob.progress !== job.progress || 
      oldJob.processed_items !== job.processed_items
    );

    // Show toast notification for status changes (only on dashboard)
    if (statusChanged && isDashboard) {
      const statusMessage = getStatusChangeMessage(oldJob.status, job.status);
      if (statusMessage) {
        console.log('Showing status change toast:', statusMessage);
        const toastType = job.status === 'completed' ? 'success' : 
                         job.status === 'failed' ? 'error' : 
                         job.status === 'running' ? 'info' : 'success';
        
        toast[toastType](statusMessage, {
          description: `Job "${job.title}" status changed from ${oldJob.status} to ${job.status}`,
          duration: 5000,
        });
      }
    }

    // Show browser notification for important status changes (works globally)
    if (statusChanged && (job.status === 'completed' || job.status === 'failed')) {
      showBrowserNotification({
        title: getStatusChangeMessage(oldJob.status, job.status) || `Job ${job.status}`,
        body: `Job "${job.title}" has ${job.status}`,
        tag: `job-${job.id}`,
        data: { jobId: job.id, status: job.status }
      });
    }

    // Log progress updates (but don't show toast for progress-only updates)
    if (progressChanged && !statusChanged) {
      console.log('Progress update:', {
        jobId: job.id,
        progress: job.progress,
        processedItems: job.processed_items,
        totalItems: job.total_items
      });
    }
  }, [onJobUpdate, isDashboard]);

  const handleJobCreate = useCallback((payload: RealtimePostgresChangesPayload<Job>) => {
    const job = payload.new as Job;
    
    console.log('Job create received:', { jobId: job.id, title: job.title });
    
    if (onJobCreate) {
      onJobCreate(job);
    }

    // Show toast only on dashboard
    if (isDashboard) {
      toast.success('New job created', {
        description: `Job "${job.title}" has been created`,
        duration: 5000,
      });
    }
  }, [onJobCreate, isDashboard]);

  const handleJobDelete = useCallback((payload: RealtimePostgresChangesPayload<Job>) => {
    const job = payload.old as Job;
    
    console.log('Job delete received:', { jobId: job.id, title: job.title });
    
    if (onJobDelete) {
      onJobDelete(job.id);
    }

    // Show toast only on dashboard
    if (isDashboard) {
      toast.info('Job deleted', {
        description: `Job "${job.title}" has been deleted`,
        duration: 5000,
      });
    }
  }, [onJobDelete, isDashboard]);

  const setupSubscription = useCallback(() => {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      console.log('Cleaning up existing subscription...');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    console.log('Setting up Supabase realtime subscription...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'MISSING');
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'MISSING');
    setSubscriptionStatus('SUBSCRIBING');
    
    const channel = supabase
      .channel('jobs-realtime', {
        config: {
          broadcast: { self: false },
          presence: { key: 'jobs' }
        }
      })
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'jobs'
        },
        (payload: RealtimePostgresChangesPayload<Job>) => {
          console.log('📥 Raw UPDATE payload received:', payload);
          handleJobUpdate(payload);
        }
      )
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'jobs'
        },
        (payload: RealtimePostgresChangesPayload<Job>) => {
          console.log('📥 Raw INSERT payload received:', payload);
          handleJobCreate(payload);
        }
      )
      .on('postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'jobs'
        },
        (payload: RealtimePostgresChangesPayload<Job>) => {
          console.log('📥 Raw DELETE payload received:', payload);
          handleJobDelete(payload);
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Subscription status changed:', status);
        if (err) {
          console.error('❌ Subscription error:', err);
        }
        setSubscriptionStatus(status as SubscriptionStatus);

        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to jobs realtime');
          console.log('🔍 Listening for changes on: public.jobs table');
          console.log('⚠️ If no events are received, check:');
          console.log('   1. Supabase Dashboard → Database → Replication → Enable on jobs table');
          console.log('   2. RLS policies allow SELECT for anon role');
          retryCountRef.current = 0; // Reset retry count on success
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription failed:', status);
          if (err) {
            console.error('Error details:', err);
          }
          
          // Retry with exponential backoff
          if (retryCountRef.current < MAX_RETRIES) {
            const delay = calculateRetryDelay(retryCountRef.current);
            retryCountRef.current += 1;
            
            console.log(`Retrying subscription in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})...`);
            
            retryTimeoutRef.current = setTimeout(() => {
              setupSubscription();
            }, delay);
          } else {
            console.error('❌ Max retries reached. Subscription failed permanently.');
            console.error('💡 Troubleshooting steps:');
            console.error('   1. Verify Supabase realtime is enabled on jobs table');
            console.error('   2. Check RLS policies allow anon SELECT');
            console.error('   3. Verify WebSocket connection (check browser Network tab)');
            toast.error('Failed to connect to real-time updates', {
              description: 'Check browser console for details. Verify Supabase realtime is enabled on jobs table.',
              duration: 15000,
            });
          }
        } else if (status === 'CLOSED') {
          console.log('Subscription closed');
        }
      });

    subscriptionRef.current = channel;
  }, [supabase, handleJobUpdate, handleJobCreate, handleJobDelete]);

  useEffect(() => {
    setupSubscription();

    return () => {
      console.log('Unsubscribing from jobs realtime...');
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      retryCountRef.current = 0;
      setSubscriptionStatus(null);
    };
  }, [setupSubscription]);

  // Expose subscription status for debugging
  useEffect(() => {
    if (subscriptionStatus) {
      console.log('Current subscription status:', subscriptionStatus);
    }
  }, [subscriptionStatus]);
};

function getStatusChangeMessage(oldStatus: string, newStatus: string): string | null {
  const statusMessages: Record<string, Record<string, string>> = {
    'pending': {
      'running': 'Job started processing',
      'failed': 'Job failed to start',
    },
    'running': {
      'completed': 'Job completed successfully',
      'failed': 'Job failed',
      'cancelled': 'Job was cancelled',
    },
    'completed': {
      'running': 'Job restarted',
    },
    'failed': {
      'running': 'Job restarted',
      'pending': 'Job reset to pending',
    },
    'cancelled': {
      'running': 'Job restarted',
      'pending': 'Job reset to pending',
    },
  };

  return statusMessages[oldStatus]?.[newStatus] || null;
}