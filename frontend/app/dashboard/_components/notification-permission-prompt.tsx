"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, X } from 'lucide-react';
import {
  requestNotificationPermission,
  hasRequestedPermission,
  getNotificationPermission,
} from '@/lib/services/browser-notifications';

export function NotificationPermissionPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check permission status
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Only show prompt if:
    // 1. Notifications are supported
    // 2. Permission hasn't been requested before
    // 3. Permission is default (not granted or denied)
    if (
      'Notification' in window &&
      !hasRequestedPermission() &&
      currentPermission === 'default'
    ) {
      // Show prompt after a short delay to avoid interrupting initial page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    setIsOpen(false);

    if (newPermission === 'granted') {
      // Show a test notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Notifications enabled', {
          body: 'You will now receive notifications for job updates.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Mark as requested so we don't show it again
    if (typeof window !== 'undefined') {
      localStorage.setItem('browser-notification-permission-requested', 'true');
    }
  };

  // Don't render if permission is already granted or denied
  if (permission === 'granted' || permission === 'denied') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle>Enable Browser Notifications</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Get notified when jobs complete or fail, even when you&apos;re not on the dashboard.
            You&apos;ll receive real-time updates about your background jobs.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Not Now
          </Button>
          <Button
            onClick={handleAllow}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-cream"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}