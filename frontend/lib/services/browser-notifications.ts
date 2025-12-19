interface NotificationOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
}

const NOTIFICATION_PERMISSION_KEY = 'browser-notification-permission-requested';

/**
 * Request browser notification permission
 * @returns Promise resolving to permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  // Check if already granted or denied
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    
    // Store that we've requested permission
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
    }
    
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Check if notification permission has been requested before
 */
export function hasRequestedPermission(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true';
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Show a browser notification
 * @param options Notification options
 */
export function showBrowserNotification(options: NotificationOptions): void {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted:', Notification.permission);
    return;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      tag: options.tag,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      data: options.data,
      requireInteraction: options.requireInteraction || false,
    });

    // Handle notification click - navigate to dashboard if job data is present
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      if (options.data?.jobId) {
        // Navigate to dashboard data-sync page
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard/data-sync';
        }
      }
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  } catch (error) {
    console.error('Error showing browser notification:', error);
  }
}

/**
 * Check if notifications are supported and enabled
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}