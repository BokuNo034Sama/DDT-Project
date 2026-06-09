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
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Push notifications are not supported in this browser.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Request Notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied by user.");
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Get the VAPID key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key is missing in environmental variables.");
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });

      // Extract raw keys
      const rawSubscription = subscription.toJSON();
      const p256dh = rawSubscription.keys?.p256dh;
      const auth = rawSubscription.keys?.auth;

      if (!subscription.endpoint || !p256dh || !auth) {
        throw new Error("Failed to retrieve standard subscription keys.");
      }

      // Sync with database
      await saveSubscriptionMutation.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh,
          auth,
        },
      });

      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Failed to subscribe user to Web Push:", err);
      setError(err.message || "Subscription failed");
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
