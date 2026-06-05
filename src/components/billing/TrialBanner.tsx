"use client";

import { trpc } from "@/lib/trpc/client";
import { AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TrialBanner() {
  const { data: subscription, isLoading } = trpc.settings.getSubscription.useQuery();

  if (isLoading || !subscription || subscription.status !== "trial") {
    return null;
  }

  const isUrgent = subscription.daysLeft <= 7;

  return (
    <div className="px-3 py-2">
      <div
        className={cn(
          "p-3 rounded-lg border flex flex-col gap-1.5 transition-all text-xs",
          isUrgent
            ? "bg-amber-950/30 border-amber-500/40 text-amber-200 shadow-md shadow-amber-950/20"
            : "bg-blue-950/20 border-blue-500/20 text-blue-200"
        )}
      >
        <div className="flex items-start gap-1.5 leading-snug">
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-ddt-text">
              {subscription.daysLeft} {subscription.daysLeft === 1 ? "day" : "days"} left in your free trial
            </span>
            <Link
              href="/settings?tab=billing"
              className={cn(
                "font-bold hover:underline flex items-center gap-1 text-[11px] mt-0.5",
                isUrgent ? "text-amber-400" : "text-blue-400"
              )}
            >
              Upgrade now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
