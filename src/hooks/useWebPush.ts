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

      // 🔍 CRITICAL CHECKPOINT: Explicitly poll or wait until the worker is active in memory
      alert("Step 2.5: Verifying worker activation readiness...");
      
      // If the worker is still installing or waiting, wait for it to take over active status
      if (!registration.active) {
        const activeWorker = registration.installing || registration.waiting;
        if (activeWorker) {
          await new Promise<void>((resolve) => {
            activeWorker.addEventListener('statechange', (e: any) => {
              if (e.target.state === 'activated' || registration.active) {
                resolve();
              }
            });
            // Safety timeout: don't let it hang forever if already activating
            setTimeout(() => resolve(), 2000);
          });
        }
      }

      // Double-check fallback: Give the browser an extra operational tick to promote the worker to active
      if (!registration.active) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!registration || !registration.pushManager) {
        alert("❌ Critical Error: Push Management is unavailable on this browser instance.");
        setIsEnabling(false);
        return;
      }

      alert("Step 3: Synchronizing hardware push channels (with latency fallback)...");
      const publicVapidKey = "BOw0T71w5QrGUHWfzX0waikm0fJbjsqkZEaIDb2ffpdp0hHcYYPEonNC7yDWP2Yh6jVhYx7e9yBqNhWElnxBwqY";
      
      let subscription: any = null;
      let retries = 3;
      let delay = 1000; // 1 second operational cooldown

      while (retries > 0) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as any
          });
          // If successful, break cleanly out of the retry container
          break; 
        } catch (subscribeError: any) {
          retries--;
          console.warn(`Hardware activation latency detected. Retries remaining: ${retries}. Retrying in ${delay}ms...`);
          
          if (retries === 0) {
            // No retries left, throw the original error down to the main catch block
            throw subscribeError; 
          }
          
          // Asynchronously sleep to give the browser engine time to stabilize its push network bindings
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay += 500; // Step up the delay linearly for the next pass
        }
      }

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
