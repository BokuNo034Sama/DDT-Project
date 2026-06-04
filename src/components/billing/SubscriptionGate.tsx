"use client";

import { usePathname } from "next/navigation";
import { ProfileWithTenant } from "@/types";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { ShieldAlert, LogOut, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SubscriptionGateProps {
  profile: ProfileWithTenant | null;
  children: React.ReactNode;
}

export function SubscriptionGate({ profile, children }: SubscriptionGateProps) {
  const pathname = usePathname();

  const isInactive = profile?.tenant?.subscription_status === "inactive";
  const isLabOwner = profile?.role === "lab_owner" || profile?.role === "super_admin";
  const isSettingsPage = pathname === "/settings";

  if (isInactive) {
    if (isLabOwner && isSettingsPage) {
      return <>{children}</>;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ddt-bg p-4 font-sans text-ddt-text select-none animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-ddt-surface border border-red-500/20 rounded-2xl shadow-2xl p-8 space-y-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-950/30 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-syne tracking-tight text-ddt-text">
              Workspace Suspended
            </h1>
            <p className="text-sm text-ddt-muted leading-relaxed">
              {isLabOwner
                ? "Your laboratory subscription is currently inactive. Please renew your subscription to reactivate operations and resume structure testing and reporting."
                : "Your laboratory subscription is currently inactive. Please contact your Lab Owner to reactivate the workspace."}
            </p>
          </div>

          {isLabOwner ? (
            <div className="w-full pt-2 flex flex-col gap-3">
              <Button asChild className="bg-ddt-accent hover:bg-ddt-accent/90 text-black font-semibold w-full gap-2">
                <Link href="/settings">
                  <span>Go to Billing & Settings</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <form action={signOut} className="w-full">
                <Button type="submit" variant="ghost" className="w-full text-ddt-muted hover:text-red-400 hover:bg-red-400/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </Button>
              </form>
            </div>
          ) : (
            <div className="w-full pt-2">
              <form action={signOut} className="w-full">
                <Button type="submit" className="w-full bg-ddt-raised border border-ddt-border text-ddt-text hover:bg-ddt-surface gap-2 font-semibold">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
