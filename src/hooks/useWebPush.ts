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

const timeoutPromise = (ms: number) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error("Device handshake timed out. Check domain scope or clear browser site cache.")), ms)
);

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveSubscriptionMutation = trpc.notifications.saveSubscription.useMutation();
  const savePushSubscriptionMutation = trpc.notifications.savePushSubscription.useMutation();
  const removeSubscriptionMutation = trpc.notifications.removeSubscription.useMutation();

  // Retrieve current active subscription
  const getSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return null;
    }
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (!registrations || registrations.length === 0) {
        return null;
      }
      const registration = registrations[0];
      return await registration.pushManager.getSubscription();
    } catch (err) {
      console.error("Error retrieving active subscription instance:", err);
      return null;
    }
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
      // Bypasses the .ready deadlock by pulling what's currently in memory
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations && registrations.length > 0) {
          checkSubscription();
        } else {
          setLoading(false);
        }
      }).catch((err) => {
        console.error("Error checking active registrations on init:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [checkSubscription]);

  // Subscribe user
  const subscribeUser = useCallback(async () => {
    const setIsEnabling = setLoading;
    const setIsEnabled = setIsSubscribed;
    
    const utils = {
      notifications: {
        saveSubscription: {
          mutate: async (input: { endpoint: string; auth_key: string; p256dh_key: string }) => {
            return savePushSubscriptionMutation.mutateAsync({
              endpoint: input.endpoint,
              auth_key: input.auth_key,
              p256dh_key: input.p256dh_key,
            });
          }
        }
      }
    };

    try {
      setIsEnabling(true);
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("❌ Permission denied by user.");
        setIsEnabling(false);
        return;
      }

      alert("Step 1: Fetching current worker instance...");
      let registration = await navigator.serviceWorker.getRegistration('/');

      if (!registration) {
        alert("Step 2: Registering fresh worker mapping...");
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }

      if (!registration || !registration.pushManager) {
        alert("❌ Critical Error: Push Management is unavailable on this browser instance.");
        setIsEnabling(false);
        return;
      }

      alert("Step 3: Synchronizing hardware push channels...");
      // Direct execution pass without waiting for statechange loops
      const publicVapidKey = "BOw0T71w5QrGUHWfzX0waikm0fJbjsqkZEaIDb2ffpdp0hHcYYPEonNC7yDWP2Yh6jVhYx7e9yBqNhWElnxBwqY";

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as any
      });

      alert("Step 4: Shipping hardware tokens to Supabase...");
      const subscriptionJSON = subscription.toJSON();

      await utils.notifications.saveSubscription.mutate({
        endpoint: subscriptionJSON.endpoint!,
        auth_key: subscriptionJSON.keys!.auth!,
        p256dh_key: subscriptionJSON.keys!.p256dh!
      });

      alert("🏆 SUCCESS: Secure hardware link created in database!");
      setIsEnabled(true);
    } catch (err: any) {
      alert(`❌ Handshake Interrupted: ${err.message || err}`);
      console.error(err);
    } finally {
      setIsEnabling(false);
    }
  }, [savePushSubscriptionMutation]);

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
