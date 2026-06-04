"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const dismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setInstallEvent(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!installEvent || isDismissed) return null;

  return (
    <div
      id="pwa-install-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-50 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-ddt-surface border border-ddt-accent/30 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-ddt-accent/20 via-ddt-accent to-ddt-accent/20" />
        <div className="p-4 flex items-start gap-3">
          <div className="p-2 bg-ddt-accent/10 border border-ddt-accent/20 rounded-lg shrink-0">
            <Download className="w-5 h-5 text-ddt-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-syne font-bold text-ddt-text">
              Install DDT Structure
            </p>
            <p className="text-[11px] text-ddt-muted mt-0.5 leading-relaxed">
              Add to your home screen for offline access and faster loading.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 bg-ddt-accent text-black text-xs font-semibold rounded-lg hover:bg-ddt-accent/90 transition-all"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-ddt-muted text-xs hover:text-ddt-text transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-ddt-muted hover:text-ddt-text rounded transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
