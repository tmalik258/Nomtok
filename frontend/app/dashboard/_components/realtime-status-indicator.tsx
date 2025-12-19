"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function RealtimeStatusIndicator() {
  const [status, setStatus] = useState<'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CLOSED' | 'SUBSCRIBING' | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    
    // Create a test subscription to check status
    const channel = supabase
      .channel('jobs-realtime-status-check', {
        config: {
          broadcast: { self: false },
          presence: { key: 'status-check' }
        }
      })
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'jobs' 
        },
        (payload) => {
          console.log('✅ Realtime UPDATE event received:', payload);
          setLastEvent(new Date().toLocaleTimeString());
          setEventCount(prev => prev + 1);
        }
      )
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'jobs' 
        },
        (payload) => {
          console.log('✅ Realtime INSERT event received:', payload);
          setLastEvent(new Date().toLocaleTimeString());
          setEventCount(prev => prev + 1);
        }
      )
      .subscribe((subscriptionStatus) => {
        console.log('📡 Subscription status:', subscriptionStatus);
        setStatus(subscriptionStatus as typeof status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (!status) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'SUBSCRIBED':
        return {
          icon: CheckCircle,
          label: 'Connected',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'SUBSCRIBING':
        return {
          icon: Loader2,
          label: 'Connecting...',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-spin'
        };
      case 'TIMED_OUT':
      case 'CHANNEL_ERROR':
        return {
          icon: XCircle,
          label: 'Connection Failed',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'CLOSED':
        return {
          icon: AlertCircle,
          label: 'Disconnected',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-2 px-3 py-1.5`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>
      {status === 'SUBSCRIBED' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-2 shadow-lg text-xs">
          <div className="text-gray-600 dark:text-gray-400">
            Events received: <span className="font-semibold text-gray-900 dark:text-gray-100">{eventCount}</span>
          </div>
          {lastEvent && (
            <div className="text-gray-600 dark:text-gray-400 mt-1">
              Last event: <span className="font-semibold text-gray-900 dark:text-gray-100">{lastEvent}</span>
            </div>
          )}
          {eventCount === 0 && (
            <div className="text-amber-600 dark:text-amber-400 mt-1 text-xs">
              ⚠️ No events received. Check Supabase configuration.
            </div>
          )}
        </div>
      )}
      {(status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-2 shadow-lg text-xs max-w-xs">
          <div className="text-red-800 dark:text-red-200 font-semibold mb-1">
            Realtime Connection Failed
          </div>
          <div className="text-red-700 dark:text-red-300 space-y-1">
            <div>1. Check Supabase Dashboard → Database → Replication</div>
            <div>2. Enable replication on &quot;jobs&quot; table</div>
            <div>3. Check RLS policies allow SELECT for anon role</div>
          </div>
        </div>
      )}
    </div>
  );
}