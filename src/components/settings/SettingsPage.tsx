"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  Building2,
  AlertTriangle,
  Loader2,
  Save,
  ShieldAlert,
} from "lucide-react";

export function SettingsPage() {
  const { toast } = useToast();
  const [role, setRole] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: tenant, isLoading } = trpc.settings.getTenant.useQuery();

  const [labName, setLabName] = useState("");
  const [codePrefix, setCodePrefix] = useState("");
  const [confirmSlug, setConfirmSlug] = useState("");
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user;
      setRole((user?.app_metadata?.role as string) || null);
    });
  }, []);

  useEffect(() => {
    if (tenant) {
      setLabName(tenant.name ?? "");
      setCodePrefix(tenant.code_prefix ?? "");
    }
  }, [tenant]);

  const updateMutation = trpc.settings.updateTenant.useMutation({
    onSuccess: () => {
      toast({ title: "Settings saved", description: "Lab settings updated successfully." });
      utils.settings.getTenant.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deactivateMutation = trpc.settings.deactivateTenant.useMutation({
    onSuccess: () => {
      toast({
        title: "Lab deactivated",
        description: "The laboratory account has been deactivated.",
        variant: "destructive",
      });
      window.location.assign("/auth/login");
    },
    onError: (err) => {
      toast({ title: "Deactivation failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName || !codePrefix) {
      toast({
        title: "Required fields missing",
        description: "Lab name and code prefix are required.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ name: labName, code_prefix: codePrefix.toUpperCase() });
  };

  const handleDeactivate = () => {
    deactivateMutation.mutate({ confirmSlug });
  };

  const isLabOwner = role === "lab_owner" || role === "super_admin";

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <LoadingSkeleton type="detail" rows={4} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-syne text-ddt-text tracking-tight">
          Lab Settings
        </h1>
        <p className="text-sm text-ddt-muted mt-1">
          Manage your laboratory&apos;s name, code prefix, and account settings.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-ddt-border bg-ddt-raised flex items-center gap-2">
          <Building2 className="w-4 h-4 text-ddt-accent" />
          <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted">
            Laboratory Profile
          </h2>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="lab-name" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
              Laboratory Name *
            </Label>
            <Input
              id="lab-name"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g. DDT Structure Ltd"
              className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent"
              required
            />
            <p className="text-[10px] text-ddt-faint">
              This name appears across all reports and documents.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code-prefix" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
              NDT Code Prefix *
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="code-prefix"
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="e.g. K"
                maxLength={4}
                className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent font-mono uppercase w-32"
                required
              />
              <div className="flex items-center gap-2 bg-ddt-raised border border-ddt-border rounded-lg px-3 py-2">
                <span className="text-xs text-ddt-muted">Preview:</span>
                <span className="font-mono text-sm font-bold text-ddt-accent">
                  {codePrefix || "K"}001
                </span>
              </div>
            </div>
            <p className="text-[10px] text-ddt-faint">
              1–4 uppercase letters. Applied to all newly created project codes.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              className="bg-ddt-accent text-black font-semibold hover:bg-ddt-accent/90 gap-2"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
              ) : (
                <><Save className="w-4 h-4" /><span>Save Settings</span></>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Tenant Info (read-only) */}
      <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6">
        <h3 className="text-xs font-syne font-bold uppercase tracking-wider text-ddt-muted mb-4">
          Account Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] text-ddt-faint uppercase tracking-wider font-semibold mb-1">Lab Slug</p>
            <p className="font-mono text-ddt-text">{tenant?.slug ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-ddt-faint uppercase tracking-wider font-semibold mb-1">Status</p>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
              tenant?.is_active
                ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"
                : "bg-red-950/30 text-red-400 border-red-500/20"
            }`}>
              {tenant?.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <p className="text-[10px] text-ddt-faint uppercase tracking-wider font-semibold mb-1">Created</p>
            <p className="font-mono text-ddt-text text-xs">
              {tenant?.created_at
                ? new Date(tenant.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {isLabOwner && (
        <div className="bg-red-950/10 border border-red-500/20 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/20 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-red-400">
              Danger Zone
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-ddt-text mb-1">Deactivate Laboratory</h3>
              <p className="text-xs text-ddt-muted leading-relaxed">
                This will permanently deactivate your lab account. All staff will lose access immediately.
                This action <strong className="text-red-400">cannot be undone</strong>.
              </p>
            </div>

            {!isDeactivateOpen ? (
              <Button
                type="button"
                onClick={() => setIsDeactivateOpen(true)}
                className="bg-transparent border border-red-500/30 text-red-400 hover:bg-red-950/20 hover:border-red-500/60 transition-all text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                Deactivate Lab
              </Button>
            ) : (
              <div className="space-y-3 bg-red-950/10 border border-red-500/10 rounded-lg p-4">
                <p className="text-xs text-red-400 font-semibold">
                  Type the lab slug <span className="font-mono bg-red-950/30 px-1.5 py-0.5 rounded">{tenant?.slug}</span> to confirm:
                </p>
                <Input
                  value={confirmSlug}
                  onChange={(e) => setConfirmSlug(e.target.value)}
                  placeholder={tenant?.slug ?? "lab-slug"}
                  className="bg-ddt-input border-red-500/30 text-ddt-text focus:border-red-400 focus:ring-red-400 font-mono text-sm"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={confirmSlug !== tenant?.slug || deactivateMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40"
                  >
                    {deactivateMutation.isPending ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Deactivating...</>
                    ) : (
                      "Confirm Deactivation"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setIsDeactivateOpen(false); setConfirmSlug(""); }}
                    className="text-ddt-muted hover:text-ddt-text text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
