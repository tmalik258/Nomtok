"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Copy } from 'lucide-react';
import { createClient } from '@/lib/utils/supabase/client';
import { toast } from 'sonner';

export function RealtimeDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('Unknown');
  const [eventsReceived, setEventsReceived] = useState(0);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const [supabaseConfig, setSupabaseConfig] = useState<{ url: boolean; key: boolean }>({ url: false, key: false });

  useEffect(() => {
    // Check Supabase configuration
    setSupabaseConfig({
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    // Test subscription
    const supabase = createClient();
    let testChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupTest = () => {
      testChannel = supabase
        .channel('diagnostics-test', {
          config: {
            broadcast: { self: false }
          }
        })
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'jobs' 
          },
          (payload) => {
            console.log('🔔 Diagnostics: Event received!', payload);
            setEventsReceived(prev => prev + 1);
            setLastEventTime(new Date().toLocaleTimeString());
          }
        )
        .subscribe((status) => {
          console.log('🔔 Diagnostics: Status:', status);
          setSubscriptionStatus(status);
        });
    };

    setupTest();

    return () => {
      if (testChannel) {
        testChannel.unsubscribe();
      }
    };
  }, []);

  const copyDiagnostics = () => {
    const diagnostics = `
Supabase Configuration:
- URL: ${supabaseConfig.url ? '✅ Configured' : '❌ Missing'}
- Key: ${supabaseConfig.key ? '✅ Configured' : '❌ Missing'}

Subscription Status: ${subscriptionStatus}
Events Received: ${eventsReceived}
Last Event: ${lastEventTime || 'Never'}

Troubleshooting:
1. ✅ Realtime enabled on jobs table
2. ❌ Missing RLS Policy - This is the issue!
3. Run SQL in Supabase Dashboard:
   CREATE POLICY IF NOT EXISTS "Allow anon to read jobs for realtime"
   ON public.jobs FOR SELECT TO anon USING (true);
4. Refresh page after creating policy
    `.trim();

    navigator.clipboard.writeText(diagnostics);
    toast.success('Diagnostics copied to clipboard');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50"
      >
        <AlertCircle className="h-4 w-4 mr-2" />
        Realtime Diagnostics
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-96 max-w-[calc(100vw-2rem)] shadow-2xl border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Realtime Diagnostics</CardTitle>
            <CardDescription className="text-xs mt-1">
              Check Supabase realtime connection status
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-600">Supabase URL:</span>
            <Badge variant={supabaseConfig.url ? 'default' : 'destructive'}>
              {supabaseConfig.url ? 'Configured' : 'Missing'}
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-600">Supabase Key:</span>
            <Badge variant={supabaseConfig.key ? 'default' : 'destructive'}>
              {supabaseConfig.key ? 'Configured' : 'Missing'}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Subscription Status:</span>
            <Badge 
              variant={
                subscriptionStatus === 'SUBSCRIBED' ? 'default' :
                subscriptionStatus === 'SUBSCRIBING' ? 'secondary' :
                'destructive'
              }
            >
              {subscriptionStatus}
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Events Received:</span>
            <span className="font-semibold">{eventsReceived}</span>
          </div>
          {lastEventTime && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Event:</span>
              <span className="font-semibold">{lastEventTime}</span>
            </div>
          )}
        </div>

        {subscriptionStatus === 'SUBSCRIBED' && eventsReceived === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
            <div className="font-semibold mb-1">⚠️ No events received</div>
            <div className="space-y-1 mb-2">
              <div>Realtime is enabled but no events are coming through.</div>
              <div className="font-semibold mt-1">Most likely cause: Missing RLS Policy</div>
            </div>
            <div className="bg-white border border-amber-300 rounded p-2 mt-2">
              <div className="font-semibold mb-1">Quick Fix:</div>
              <div className="space-y-1 text-xs">
                <div>1. Go to Supabase Dashboard → SQL Editor</div>
                <div>2. Run this SQL:</div>
                <div className="bg-gray-100 p-1 rounded font-mono text-[10px] mt-1 break-all">
                  CREATE POLICY IF NOT EXISTS &quot;Allow anon to read jobs for realtime&quot;<br/>
                  ON public.jobs FOR SELECT TO anon USING (true);
                </div>
                <div className="mt-1">3. Refresh this page</div>
              </div>
            </div>
          </div>
        )}

        {(subscriptionStatus === 'TIMED_OUT' || subscriptionStatus === 'CHANNEL_ERROR') && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
            <div className="font-semibold mb-1">❌ Connection Failed</div>
            <div className="space-y-1">
              <div>Check browser console for details</div>
              <div>Verify Supabase realtime is enabled</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={copyDiagnostics}
            className="flex-1"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Diagnostics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}