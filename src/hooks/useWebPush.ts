import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveSubscriptionMutation = trpc.notifications.saveSubscription.useMutation();
  const removeSubscriptionMutation = trpc.notifications.removeSubscription.useMutation();

  // Retrieve current active subscription
  const getSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return null;
    }
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }, []);

  // Sync subscription state from browser
  const checkSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const subscription = await getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err: any) {
      console.error("Error checking push subscription:", err);
      setError(err.message || "Failed to check subscription");
    } finally {
      setLoading(false);
    }
  }, [getSubscription]);

  // Initial check
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      // Wait for service worker to load / be ready before checking subscription
      navigator.serviceWorker.ready.then(() => {
        checkSubscription();
      });
    } else {
      setLoading(false);
    }
  }, [checkSubscription]);

  // Subscribe user
  const subscribeUser = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Step 1: Checking SW support...');
      
      if (!('serviceWorker' in navigator)) {
        console.error('Service Worker not supported');
        return;
      }
      
      if (!('PushManager' in window)) {
        console.error('Push API not supported');
        return;
      }
      
      console.log('Step 2: Getting SW registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('SW registration:', registration);
      
      console.log('Step 3: Checking permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission !== 'granted') {
        console.error('Permission denied:', permission);
        return;
      }
      
      console.log('Step 4: Getting VAPID key...');
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BLrMnX_JxffaeQ5UVIEFzjctZuKzV48dSzH_Z1HoEMeNGVAs20wqfs6kG-U7C9i4ker9MFabCMvGiwMHZqFj3n4";
      console.log('VAPID key exists:', !!vapidKey);
      console.log('VAPID key length:', vapidKey?.length);
      
      if (!vapidKey) {
        console.error('VAPID public key is missing!');
        return;
      }
      
      console.log('Step 5: Converting VAPID key...');
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      console.log('Key converted:', applicationServerKey.length, 'bytes');
      
      console.log('Step 6: Subscribing to push...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any
      });
      console.log('Subscription created:', subscription.endpoint);
      
      console.log('Step 7: Saving to database...');
      const subscriptionJSON = subscription.toJSON();
      console.log('Subscription JSON:', subscriptionJSON);
      
      await saveSubscriptionMutation.mutateAsync({
        endpoint: subscriptionJSON.endpoint!,
        auth: subscriptionJSON.keys!.auth!,
        p256dh: subscriptionJSON.keys!.p256dh!,
      });
      
      console.log('Step 8: Saved successfully!');
      setIsSubscribed(true);
      
    } catch (error: any) {
      console.error('Push subscription failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    } finally {
      setLoading(false);
    }
  }, [saveSubscriptionMutation]);

  // Unsubscribe user
  const unsubscribeUser = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const subscription = await getSubscription();
      if (subscription) {
        // Notify backend first
        await removeSubscriptionMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });

        // Unsubscribe locally
        const success = await subscription.unsubscribe();
        if (!success) {
          console.warn("Push subscription unsubscribe returned false");
        }
      }
      setIsSubscribed(false);
    } catch (err: any) {
      console.error("Failed to unsubscribe user from Web Push:", err);
      setError(err.message || "Unsubscription failed");
    } finally {
      setLoading(false);
    }
  }, [getSubscription, removeSubscriptionMutation]);

  return {
    isSupported,
    isSubscribed,
    loading,
    error,
    subscribeUser,
    unsubscribeUser,
  };
}
