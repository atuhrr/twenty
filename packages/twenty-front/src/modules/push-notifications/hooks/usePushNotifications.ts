// FORK: Voka CRM — Fase 22: push notification subscription
import { useCallback, useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))).buffer;
};

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return null;

    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();

    setPermission(perm as PushPermission);
    if (perm !== 'granted') return null;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    setSubscription(sub);
    return sub;
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
    }
  }, [subscription]);

  return { permission, subscription, subscribe, unsubscribe, isSupported };
};
