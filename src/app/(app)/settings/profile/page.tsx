"use client";

import { trpc } from "@/lib/trpc/client";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getInitials } from "@/lib/utils";
import { User, Mail, Shield, Fingerprint } from "lucide-react";

export default function ProfileSettingsPage() {
  const { data: me, isLoading } = trpc.staff.getMe.useQuery();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-8 animate-in fade-in">
        <LoadingSkeleton type="detail" rows={4} />
      </div>
    );
  }

  const roleDisplay = me?.role ? me.role.replace("_", " ") : "Staff";
  const initials = getInitials(me?.full_name || me?.email || "U");

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 pt-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-syne text-ddt-text tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-ddt-muted mt-1 font-sans">
          View your account details and organizational role.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-ddt-border bg-ddt-raised flex items-center gap-2">
          <User className="w-4 h-4 text-ddt-accent" />
          <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted">
            Personal Information
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar / Initials Block */}
          <div className="flex items-center gap-4 border-b border-ddt-border pb-6">
            <div className="w-16 h-16 rounded-full bg-ddt-accent flex items-center justify-center text-black font-extrabold text-xl shrink-0 shadow-lg shadow-ddt-accent/10 select-none">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-lg font-bold text-ddt-text truncate">
                {me?.full_name || "User"}
              </h3>
              <p className="text-xs text-ddt-accent font-bold uppercase tracking-wider mt-0.5 select-none">
                {roleDisplay}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-ddt-muted uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-ddt-faint" />
                <span>Full Name</span>
              </div>
              <div className="bg-ddt-input border border-ddt-border rounded-lg px-3 py-2.5 text-ddt-text text-sm select-none">
                {me?.full_name || "—"}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-ddt-muted uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-ddt-faint" />
                <span>Email Address</span>
              </div>
              <div className="bg-ddt-input border border-ddt-border rounded-lg px-3 py-2.5 text-ddt-text text-sm select-none truncate">
                {me?.email || "—"}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-ddt-muted uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-ddt-faint" />
                <span>Role & Permissions</span>
              </div>
              <div className="bg-ddt-input border border-ddt-border rounded-lg px-3 py-2.5 text-ddt-text text-sm font-semibold text-ddt-accent select-none capitalize">
                {roleDisplay}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-ddt-muted uppercase tracking-wider">
                <Fingerprint className="w-3.5 h-3.5 text-ddt-faint" />
                <span>User ID</span>
              </div>
              <div className="bg-ddt-input border border-ddt-border rounded-lg px-3 py-2.5 text-ddt-text font-mono text-xs select-all">
                {me?.id || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
