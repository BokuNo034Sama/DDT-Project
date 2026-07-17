"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Shield, 
  Settings, 
  Calendar, 
  Power, 
  Plus, 
  User, 
  Clock, 
  Loader2, 
  Sparkles, 
  X,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: tenants, isLoading: loadingTenants, refetch: refetchTenants } = trpc.admin.listTenants.useQuery();
  const { data: auditLogs, isLoading: loadingLogs, refetch: refetchLogs } = trpc.admin.listAuditLogs.useQuery();

  const setSubscriptionMutation = trpc.admin.setTenantSubscription.useMutation({
    onSuccess: () => {
      refetchTenants();
      refetchLogs();
    },
    onError: (err) => {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to update subscription.",
        variant: "destructive",
      });
    }
  });

  // Modal State
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  
  // Grant Form State
  const [grantPlan, setGrantPlan] = useState<"starter" | "pro">("pro");
  const [grantDuration, setGrantDuration] = useState<string>("30"); // "30", "60", "90", "180", "365", "custom"
  const [customDate, setCustomDate] = useState<string>("");
  const [grantStatus, setGrantStatus] = useState<"active" | "trial" | "cancelled">("active");

  // Identify "My Lab" for quick grant
  const myLab = tenants?.find((t: any) => 
    t.slug === "ddt-structure" || 
    t.name.toLowerCase().includes("ddt structure") || 
    t.name.toLowerCase().includes("alpha")
  );

  const handleQuickGrant = async () => {
    if (!myLab) {
      toast({
        title: "Lab Not Found",
        description: "Could not identify your test lab workspace in the list.",
        variant: "destructive"
      });
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      await setSubscriptionMutation.mutateAsync({
        tenantId: myLab.id,
        plan: "pro",
        status: "active",
        daysToGrant: 365
      });

      toast({
        title: "Pro Access Granted",
        description: `Pro access granted to ${myLab.name} until ${format(expiresAt, "MMMM d, yyyy")}`,
      });
    } catch (e) {
      // Handled by onError
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      let days: number | undefined = undefined;
      let expires: string | undefined = undefined;

      if (grantDuration === "custom") {
        if (!customDate) {
          toast({
            title: "Validation Error",
            description: "Please select a custom expiration date.",
            variant: "destructive"
          });
          return;
        }
        expires = new Date(customDate).toISOString();
      } else {
        days = parseInt(grantDuration, 10);
      }

      await setSubscriptionMutation.mutateAsync({
        tenantId: selectedTenant.id,
        plan: grantPlan,
        status: grantStatus,
        daysToGrant: days,
        expiresAt: expires
      });

      const expiryLabel = days 
        ? format(new Date(Date.now() + days * 24 * 60 * 60 * 1000), "MMM d, yyyy")
        : format(new Date(customDate), "MMM d, yyyy");

      toast({
        title: "Subscription Updated",
        description: `${grantPlan.toUpperCase()} access granted to ${selectedTenant.name} until ${expiryLabel}`,
      });

      setSelectedTenant(null); // Close modal
    } catch (err) {
      // Handled by onError
    }
  };

  // Quick action updates
  const handleQuickAction = async (action: "extend_trial" | "suspend" | "restore") => {
    if (!selectedTenant) return;

    try {
      let plan: "starter" | "pro" = (selectedTenant.plan_name as any) || "starter";
      let status: "trial" | "active" | "cancelled" = "active";
      let days: number | undefined = undefined;
      let expires: string | undefined = undefined;

      if (action === "extend_trial") {
        status = "trial";
        days = 14;
      } else if (action === "suspend") {
        status = "cancelled";
      } else if (action === "restore") {
        status = "active";
      }

      await setSubscriptionMutation.mutateAsync({
        tenantId: selectedTenant.id,
        plan,
        status,
        daysToGrant: days,
      });

      toast({
        title: "Quick Action Applied",
        description: `Successfully applied action to ${selectedTenant.name}`,
      });
      setSelectedTenant(null);
    } catch (err) {
      // Handled by onError
    }
  };

  if (loadingTenants) return <LoadingSkeleton type="table" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-ddt-surface border border-ddt-border rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-syne font-bold text-ddt-text">Super Admin Control Panel</h1>
            <p className="text-xs text-ddt-muted mt-0.5">Manage workspaces and lab subscriptions globally</p>
          </div>
        </div>

        {/* Quick own-lab Pro Access shortcut */}
        {myLab && (
          <div className="flex items-center gap-3 bg-ddt-bg border border-ddt-border p-2 px-4 rounded-xl">
            <div className="text-left">
              <span className="text-[10px] font-bold text-ddt-muted uppercase tracking-wider block">My Lab Workspace</span>
              <span className="text-xs font-semibold text-ddt-text">{myLab.name}</span>
            </div>
            <button
              type="button"
              disabled={setSubscriptionMutation.isPending}
              onClick={handleQuickGrant}
              className="bg-[#A3E635] hover:bg-[#A3E635]/90 text-black text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {setSubscriptionMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Grant Pro Access (1 Year)</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Workspaces Table Card */}
      <div className="bg-ddt-surface border border-ddt-border rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-syne font-bold text-ddt-text mb-4 uppercase tracking-wider">All Workspaces</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-ddt-bg text-ddt-muted border-b border-ddt-border font-mono text-xs uppercase">
              <tr>
                <th className="px-4 py-4">Lab Name</th>
                <th className="px-4 py-4">Slug / Prefix</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Expires / Renewal</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ddt-border">
              {tenants?.map((tenant: any) => {
                const planLabel = tenant.plan_name || "starter";
                const isPro = planLabel === "pro";
                const statusLabel = tenant.subscription_status || "trial";
                const expiry = tenant.expires_at;

                return (
                  <tr key={tenant.id} className="hover:bg-ddt-bg/40 transition-colors">
                    <td className="px-4 py-4 font-semibold text-ddt-text">{tenant.name}</td>
                    <td className="px-4 py-4 text-ddt-muted font-mono text-xs">
                      {tenant.slug} <span className="text-ddt-faint font-sans">({tenant.code_prefix})</span>
                    </td>
                    <td className="px-4 py-4 font-bold font-syne">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-[10px] uppercase border",
                        isPro 
                          ? "bg-purple-950/40 text-purple-400 border-purple-500/20" 
                          : "bg-blue-950/40 text-blue-400 border-blue-500/20"
                      )}>
                        {planLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-xs">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full",
                        statusLabel === "active" ? "bg-green-500/10 text-green-400 border border-green-500/10" :
                        statusLabel === "trial" ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" :
                        statusLabel === "past_due" ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" :
                        "bg-red-500/10 text-red-400 border border-red-500/10"
                      )}>
                        {statusLabel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-ddt-muted text-xs font-mono">
                      {expiry ? format(new Date(expiry), "MMM dd, yyyy") : "Never"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setGrantPlan((tenant.plan_name as any) || "pro");
                          setGrantStatus((tenant.subscription_status as any) || "active");
                          setGrantDuration("30");
                        }}
                        className="bg-ddt-input hover:bg-ddt-bg border border-ddt-border text-ddt-text hover:text-ddt-accent hover:border-ddt-accent text-xs font-semibold py-1.5 px-3 rounded-xl transition-all"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Activity Audit Log */}
      <div className="bg-ddt-surface border border-ddt-border rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-syne font-bold text-ddt-text mb-4 uppercase tracking-wider">Admin Activity Log</h2>
        
        <div className="overflow-x-auto">
          {loadingLogs ? (
            <div className="flex items-center justify-center p-8 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-ddt-accent" />
              <span className="text-sm text-ddt-muted">Loading logs...</span>
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <p className="text-sm text-ddt-faint italic p-4 text-center">No recent administrative changes logged.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-ddt-bg text-ddt-muted border-b border-ddt-border font-mono text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Lab</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 font-mono">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ddt-border text-xs">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-ddt-bg/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-ddt-text">
                      {log.admin?.full_name || "System Admin"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono bg-ddt-input px-1.5 py-0.5 rounded border border-ddt-border">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-ddt-text">
                      {log.tenant?.name || "System"}
                    </td>
                    <td className="px-4 py-3 text-ddt-muted truncate max-w-[240px]">
                      {log.details ? (
                        <span>
                          Plan: {log.details.plan?.toUpperCase()}, Status: {log.details.status?.toUpperCase()}
                          {log.details.daysGranted ? ` (${log.details.daysGranted} days)` : ""}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-ddt-faint">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manage Subscription Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-xl overflow-hidden border rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200"
            style={{
              background: "#0F172A",
              borderColor: "var(--color-border)",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-ddt-border/30">
              <h4 className="font-syne font-bold text-base text-ddt-text">
                Manage Subscription — {selectedTenant.name}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="p-1 rounded-lg text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Current Status Info card */}
              <div className="bg-ddt-bg/50 border border-ddt-border/30 p-4 rounded-xl grid grid-cols-3 gap-2 text-xs">
                <div className="space-y-1">
                  <span className="text-ddt-muted font-mono uppercase tracking-wider block text-[10px]">Current Plan</span>
                  <span className="font-bold text-ddt-text uppercase">{selectedTenant.plan_name || "starter"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-ddt-muted font-mono uppercase tracking-wider block text-[10px]">Status</span>
                  <span className="font-bold text-ddt-text uppercase">{selectedTenant.subscription_status || "trial"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-ddt-muted font-mono uppercase tracking-wider block text-[10px]">Expires</span>
                  <span className="font-bold text-ddt-text">
                    {selectedTenant.expires_at ? format(new Date(selectedTenant.expires_at), "MMM d, yyyy") : "Never"}
                  </span>
                </div>
              </div>

              {/* Grant access form */}
              <form onSubmit={handleGrantAccess} className="space-y-5">
                <h5 className="text-xs uppercase tracking-wider text-ddt-accent font-bold pb-2 border-b border-ddt-border/20">
                  Grant Premium Access
                </h5>

                {/* Plan Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-ddt-muted uppercase tracking-wider">Select Plan</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGrantPlan("starter")}
                      className={cn(
                        "p-3 rounded-xl border text-center font-bold text-xs transition-all",
                        grantPlan === "starter"
                          ? "bg-blue-950/30 border-blue-500/50 text-blue-300"
                          : "bg-ddt-input border-ddt-border/50 text-ddt-muted hover:border-ddt-border"
                      )}
                    >
                      Starter (₦15,000/month)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrantPlan("pro")}
                      className={cn(
                        "p-3 rounded-xl border text-center font-bold text-xs transition-all",
                        grantPlan === "pro"
                          ? "bg-purple-950/30 border-purple-500/50 text-purple-300"
                          : "bg-ddt-input border-ddt-border/50 text-ddt-muted hover:border-ddt-border"
                      )}
                    >
                      Pro (₦45,000/month)
                    </button>
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-ddt-muted uppercase tracking-wider">Select Duration</label>
                  <select
                    className="w-full p-3 bg-ddt-input border border-ddt-border rounded-xl text-ddt-text text-xs focus:outline-none focus:border-ddt-accent"
                    value={grantDuration}
                    onChange={(e) => setGrantDuration(e.target.value)}
                  >
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">6 Months</option>
                    <option value="365">1 Year</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>

                {/* Custom Date Input */}
                {grantDuration === "custom" && (
                  <div className="space-y-2 animate-in slide-in-from-top-1 duration-150">
                    <label htmlFor="custom-date-picker" className="block text-xs font-bold text-ddt-muted uppercase tracking-wider">Select Custom Expiry Date</label>
                    <input
                      id="custom-date-picker"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full p-3 bg-ddt-input border border-ddt-border rounded-xl text-ddt-text text-xs focus:outline-none focus:border-ddt-accent"
                    />
                  </div>
                )}

                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-ddt-muted uppercase tracking-wider">Select Subscription Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGrantStatus("active")}
                      className={cn(
                        "p-2.5 rounded-xl border text-center font-bold text-xs transition-all",
                        grantStatus === "active"
                          ? "bg-green-950/30 border-green-500/50 text-green-300"
                          : "bg-ddt-input border-ddt-border/50 text-ddt-muted hover:border-ddt-border"
                      )}
                    >
                      Active (Full)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrantStatus("trial")}
                      className={cn(
                        "p-2.5 rounded-xl border text-center font-bold text-xs transition-all",
                        grantStatus === "trial"
                          ? "bg-blue-950/30 border-blue-500/50 text-blue-300"
                          : "bg-ddt-input border-ddt-border/50 text-ddt-muted hover:border-ddt-border"
                      )}
                    >
                      Trial
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrantStatus("cancelled")}
                      className={cn(
                        "p-2.5 rounded-xl border text-center font-bold text-xs transition-all",
                        grantStatus === "cancelled"
                          ? "bg-red-950/30 border-red-500/50 text-red-300"
                          : "bg-ddt-input border-ddt-border/50 text-ddt-muted hover:border-ddt-border"
                      )}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={setSubscriptionMutation.isPending}
                  className="w-full bg-[#A3E635] hover:bg-[#A3E635]/90 text-black py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {setSubscriptionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Grant Access</span>
                </button>
              </form>

              {/* Quick actions panel */}
              <div className="space-y-3 pt-4 border-t border-ddt-border/20">
                <h5 className="text-xs uppercase tracking-wider text-ddt-muted font-bold block mb-1">
                  Quick Actions
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAction("extend_trial")}
                    disabled={setSubscriptionMutation.isPending}
                    className="p-2.5 border border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    Extend Trial +14d
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction("suspend")}
                    disabled={setSubscriptionMutation.isPending}
                    className="p-2.5 border border-red-500/20 hover:border-red-500/50 bg-red-950/10 hover:bg-red-950/20 text-red-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    Suspend Access
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction("restore")}
                    disabled={setSubscriptionMutation.isPending}
                    className="p-2.5 border border-green-500/20 hover:border-green-500/50 bg-green-950/10 hover:bg-green-950/20 text-green-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    Restore Access
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-5 bg-ddt-raised/30 border-t border-ddt-border/30">
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="px-4 py-2 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
