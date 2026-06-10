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

      alert("Step 1: Inspecting physical service worker registration footprint...");
      
      // 1. Force register explicitly at the root and wait for the browser handle to return
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      
      alert("Step 2: Checking system controller synchronization...");
      
      // 2. If the page doesn't have an active controller assigned yet, force a page claim routine
      if (!navigator.serviceWorker.controller) {
        alert("Step 2.2: Page is uncontrolled. Forcing sync wait handler...");
        await new Promise<void>((resolve) => {
          const checkReady = () => {
            if (registration.active) {
              resolve();
            } else {
              setTimeout(checkReady, 200);
            }
          };
          checkReady();
        });
      }

      alert("Step 2.5: Forcing extra hardware thread cool-down...");
      // Give mobile browser engines an extra structural delay to bind low-level system communication channels
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!registration || !registration.pushManager) {
        alert("❌ Critical Error: Push Management is unavailable on this browser instance.");
        setIsEnabling(false);
        return;
      }

      alert("Step 3: Synchronizing hardware push channels (with latency fallback)...");
      const publicVapidKey = "BOw0T71w5QrGUHWfzX0waikm0fJbjsqkZEaIDb2ffpdp0hHcYYPEonNC7yDWP2Yh6jVhYx7e9yBqNhWElnxBwqY";
      
      let subscription: any = null;
      let retries = 3;
      let delay = 1500;

      while (retries > 0) {
        try {
          // Target the active instance directly to bypass browser execution delays
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as any
          });
          break; 
        } catch (subscribeError: any) {
          retries--;
          alert(`⚠️ Retrying push connection... Attempts left: ${retries}`);
          if (retries === 0) throw subscribeError;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay += 1000;
        }
      }

      alert("Step 4: Shipping hardware tokens to Supabase...");
      const subscriptionJSON = subscription.toJSON();

      await utils.notifications.saveSubscription.mutate({
        endpoint: subscriptionJSON.endpoint!,
        auth_key: subscriptionJSON.keys!.auth!,
        p256dh_key: subscriptionJSON.keys!.p256dh!
      });

      alert("🏆 SUCCESS: Your phone is securely mapped to the system!");
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
