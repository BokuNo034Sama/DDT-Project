"use client";

import { trpc } from "@/lib/trpc/client";
import { AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TrialBanner() {
  const { data: subscription, isLoading } = trpc.settings.getSubscription.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  console.log("getSubscription data:", subscription);

  if (isLoading) return null;
  if (!subscription) return null;
  if (subscription.status !== "trial") return null;

  const isUrgent = subscription.daysRemaining <= 7;

  return (
    <div className="px-3 py-2 font-inter text-xs">
      <div
        className={cn(
          "p-3 rounded-lg border flex flex-col gap-1.5 transition-all",
          isUrgent
            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
            : "bg-[#0D1F3C] border-[#1E3A5F] text-[#60A5FA]"
        )}
      >
        <div className="flex items-start gap-1.5 leading-snug">
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-ddt-text">
              {subscription.daysRemaining} {subscription.daysRemaining === 1 ? "day" : "days"} left in your free trial
            </span>
            <Link
              href="/settings?tab=billing"
              className={cn(
                "font-bold hover:underline flex items-center gap-1 text-[11px] mt-0.5",
                isUrgent ? "text-amber-400" : "text-[#60A5FA]"
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
