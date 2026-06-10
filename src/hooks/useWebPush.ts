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
      // Force set your loading state to true (which triggers "Enabling...")
      setIsEnabling(true); 

      alert("Diagnostic: Registering service worker under current host...");
      
      // 1. Force register explicitly with the current origin to bypass domain configuration blocks
      const registration = await Promise.race([
        navigator.serviceWorker.register('/sw.js', { scope: '/' }),
        timeoutPromise(5000)
      ]) as ServiceWorkerRegistration;

      alert("Diagnostic: Waiting for worker readiness context...");
      // Ensure the worker is completely activated
      await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise(5000)
      ]);

      alert("Diagnostic: Accessing Push Manager...");
      const publicVapidKey = "BOw0T71w5QrGUHWfzX0waikm0fJbjsqkZEaIDb2ffpdp0hHcYYPEonNC7yDWP2Yh6jVhYx7e9yBqNhWElnxBwqY";

      // 2. Request the native hardware token
      const subscription = await Promise.race([
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as any
        }),
        timeoutPromise(5000)
      ]) as any;

      alert("Diagnostic: Hardware key captured! Syncing with Supabase table...");
      const subscriptionJSON = subscription.toJSON();

      // 3. Fire backend tRPC mutation save
      await utils.notifications.saveSubscription.mutate({
        endpoint: subscriptionJSON.endpoint,
        auth_key: subscriptionJSON.keys?.auth || "",
        p256dh_key: subscriptionJSON.keys?.p256dh || ""
      });

      alert("🏆 SUCCESS: Hardware token registered successfully!");
      setIsEnabled(true); // Update UI to "Push On"
    } catch (error: any) {
      alert(`❌ Handshake Blocked: ${error.message || error}`);
      console.error("Handshake execution crashed:", error);
    } finally {
      setIsEnabling(false); // CRITICAL: Always kill the infinite spinner
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
