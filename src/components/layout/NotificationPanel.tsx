"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { Bell, CheckCheck, AlertCircle, ClipboardCheck, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: string) {
  switch (type) {
    case "task_assigned":
      return <Layers className="w-4 h-4 text-ddt-accent" />;
    case "stage_completed":
      return <ClipboardCheck className="w-4 h-4 text-emerald-400" />;
    case "proof_failed":
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <Bell className="w-4 h-4 text-ddt-muted" />;
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.notifications.list.useQuery();
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const prevUnreadCountRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unreadTasks = notifications?.filter((n: any) => !n.is_read && n.type === 'task_assigned') || [];
    
    if (unreadTasks.length > prevUnreadCountRef.current) {
      // A. Fire the mobile-optimized chime audio stream
      const chime = new Audio('/sounds/chime.mp3');
      chime.play().catch(err => console.log("Audio playback waiting for interaction:", err));

      // B. Trigger the native mobile OS slide-down notification banner
      if ('serviceWorker' in navigator && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          const latestTask = unreadTasks[unreadTasks.length - 1];
          
          // Fetch the active mobile browser registration capsule
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("DDT Structure: New Assignment", {
              body: latestTask.body || "You have been assigned a new task stage.",
              icon: "/icons/icon-192x192.png", // Ensure this points to a valid public PWA asset path
              badge: "/icons/icon-192x192.png",
              vibrate: [200, 100, 200], // Add haptic pulse for Android devices
            } as any);
          });
        }
      }
    }
    
    // Update the reference pointer state
    prevUnreadCountRef.current = unreadTasks.length;
  }, [notifications]);

  const supabase = createClient();

  // Real-time subscription
  useEffect(() => {
    if (!supabase || typeof supabase.channel !== "function") return;

    const channel = supabase
      .channel("notification-panel-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        utils.notifications.list.invalidate();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [utils, supabase]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length ?? 0;

  const handleMarkAllRead = () => {
    markReadMutation.mutate({});
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
          isOpen
            ? "bg-ddt-accent/10 text-ddt-accent"
            : "text-ddt-muted hover:text-ddt-accent hover:bg-ddt-accent/5"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-ddt-accent text-black text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-[360px] max-h-[420px] bg-ddt-surface border border-ddt-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ddt-border bg-ddt-raised">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-ddt-accent" />
              <span className="text-sm font-syne font-bold text-ddt-text uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-ddt-accent text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markReadMutation.isPending}
                  className="text-[10px] text-ddt-accent hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-ddt-accent/5 transition-all"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>All read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-ddt-muted hover:text-ddt-text rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[340px] divide-y divide-ddt-border/30">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-ddt-raised rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Bell className="w-8 h-8 text-ddt-faint mb-2" />
                <p className="text-xs font-medium text-ddt-muted">No notifications yet</p>
                <p className="text-[10px] text-ddt-faint mt-1">
                  You&apos;ll be notified of assignments and task updates here.
                </p>
              </div>
            ) : (
              notifications.map((notification: any) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.is_read) {
                      markReadMutation.mutate({ notificationId: notification.id });
                    }
                    if (notification.related_project_id) {
                      window.location.assign(`/projects/${notification.related_project_id}`);
                    }
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-ddt-raised/50 transition-all duration-150",
                    !notification.is_read && "bg-ddt-accent/3"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg border shrink-0 mt-0.5",
                    !notification.is_read
                      ? "bg-ddt-accent-bg border-ddt-accent/20"
                      : "bg-ddt-raised border-ddt-border"
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-xs leading-snug",
                        !notification.is_read ? "font-semibold text-ddt-text" : "font-medium text-ddt-muted"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="w-1.5 h-1.5 bg-ddt-accent rounded-full shrink-0 mt-1" />
                      )}
                    </div>
                    {notification.body && (
                      <p className="text-[10px] text-ddt-faint mt-0.5 leading-relaxed line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-[9px] text-ddt-faint font-mono mt-1">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
