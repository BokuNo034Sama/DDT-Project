"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PageShellProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Standard wrapper for page content.
 * Provides consistent padding and allows injecting actions into the TopBar.
 */
export function PageShell({ children, action }: PageShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Portal to inject page-specific actions into the TopBar */}
      {mounted &&
        action &&
        document.getElementById("topbar-action-slot") &&
        createPortal(action, document.getElementById("topbar-action-slot")!)}

      {/* Optional: could also portal the title if needed, 
          but TopBar currently infers it from the URL. */}

      <div className="space-y-6">{children}</div>
    </div>
  );
}
