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
  CreditCard,
  CheckCircle2,
  Zap,
  X,
  ArrowRight,
  Wrench,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";

export function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"profile" | "billing" | "equipment">("profile");

  // Equipment states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEq, setSelectedEq] = useState<any>(null);

  const [newEqName, setNewEqName] = useState("");
  const [newEqSerial, setNewEqSerial] = useState("");
  const [newEqType, setNewEqType] = useState("UPV");

  const [editEqName, setEditEqName] = useState("");
  const [editEqSerial, setEditEqSerial] = useState("");

  const { data: equipmentList, refetch: refetchEquipment } = trpc.equipment.listEquipment.useQuery(undefined, {
    enabled: activeTab === "equipment",
  });

  const addEquipmentMutation = trpc.equipment.addEquipment.useMutation({
    onSuccess: () => {
      toast({ title: "Equipment added", description: "The equipment was added successfully." });
      refetchEquipment();
      setIsAddOpen(false);
      setNewEqName("");
      setNewEqSerial("");
      setNewEqType("UPV");
    },
    onError: (err) => {
      toast({ title: "Failed to add equipment", description: err.message, variant: "destructive" });
    }
  });

  const deactivateEquipmentMutation = trpc.equipment.deactivateEquipment.useMutation({
    onSuccess: () => {
      toast({ title: "Equipment deactivated", description: "The equipment was deactivated." });
      refetchEquipment();
    },
    onError: (err) => {
      toast({ title: "Failed to deactivate", description: err.message, variant: "destructive" });
    }
  });

  const updateEquipmentMutation = trpc.equipment.updateEquipment.useMutation({
    onSuccess: () => {
      toast({ title: "Equipment updated", description: "The equipment was updated successfully." });
      refetchEquipment();
      setIsEditOpen(false);
      setSelectedEq(null);
    },
    onError: (err) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    }
  });

  const utils = trpc.useUtils();
  const { data: tenant, isLoading } = trpc.settings.getTenant.useQuery();
  const { data: subscription, isLoading: isLoadingSub } = trpc.settings.getSubscription.useQuery();
  const { data: me } = trpc.staff.getMe.useQuery();
  const role = me?.role || null;

  const [labName, setLabName] = useState("");
  const [codePrefix, setCodePrefix] = useState("");
  const [confirmSlug, setConfirmSlug] = useState("");
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  const [simulateData, setSimulateData] = useState<{
    tenantId: string;
    planName: string;
    price: string;
  } | null>(null);

  useEffect(() => {
    if (tenant) {
      setLabName(tenant.name ?? "");
      setCodePrefix(tenant.code_prefix ?? "");
    }
  }, [tenant]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("tab") === "billing" ||
      params.get("billing_simulate") === "true" ||
      params.get("billing")
    ) {
      setActiveTab("billing");
    }

    if (params.get("billing_simulate") === "true") {
      setSimulateData({
        tenantId: params.get("tenantId") || "",
        planName: params.get("planName") || "DDT Pro Plan",
        price: params.get("price") || "45000",
      });
    }

    if (params.get("billing") === "success") {
      toast({
        title: "Payment successful!",
        description: "Your workspace subscription is now active.",
      });
      utils.settings.getTenant.invalidate();
      utils.settings.getSubscription.invalidate();
      const url = new URL(window.location.href);
      url.searchParams.delete("billing");
      window.history.replaceState({}, "", url.pathname + url.search);
    } else if (params.get("billing") === "error") {
      const reason = params.get("reason") || "Unknown error";
      toast({
        title: "Payment failed",
        description: `There was an issue processing your payment: ${reason}`,
        variant: "destructive",
      });
      const url = new URL(window.location.href);
      url.searchParams.delete("billing");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [utils, toast]);

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

  const initializeBillingMutation = trpc.settings.initializeBillingSession.useMutation({
    onSuccess: (res) => {
      if (res.authorization_url) {
        window.location.assign(res.authorization_url);
      }
    },
    onError: (err) => {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    },
  });

  const simulatePaymentMutation = trpc.settings.simulatePayment.useMutation({
    onSuccess: () => {
      toast({ title: "Payment Simulated", description: "Workspace subscription is now active." });
      utils.settings.getTenant.invalidate();
      utils.settings.getSubscription.invalidate();
      setSimulateData(null);
      const url = new URL(window.location.href);
      url.searchParams.delete("billing_simulate");
      url.searchParams.delete("tenantId");
      url.searchParams.delete("planName");
      url.searchParams.delete("price");
      window.history.replaceState({}, "", url.pathname + url.search);
    },
    onError: (err) => {
      toast({ title: "Simulation failed", description: err.message, variant: "destructive" });
    },
  });

  const cancelSubscriptionMutation = trpc.settings.cancelSubscription.useMutation({
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your workspace has been suspended.",
        variant: "destructive",
      });
      utils.settings.getTenant.invalidate();
      utils.settings.getSubscription.invalidate();
    },
    onError: (err) => {
      toast({ title: "Cancellation failed", description: err.message, variant: "destructive" });
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

  if (isLoading || isLoadingSub) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <LoadingSkeleton type="detail" rows={4} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-syne text-ddt-text tracking-tight">
          Lab Settings
        </h1>
        <p className="text-sm text-ddt-muted mt-1">
          Manage your laboratory&apos;s details, code prefix, and billing subscriptions.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-ddt-border">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-sm font-semibold tracking-wide border-b-2 transition-all ${
            activeTab === "profile"
              ? "border-ddt-accent text-ddt-text"
              : "border-transparent text-ddt-muted hover:text-ddt-text"
          }`}
        >
          Lab Profile
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "billing"
              ? "border-ddt-accent text-ddt-text"
              : "border-transparent text-ddt-muted hover:text-ddt-text"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing & Subscription</span>
        </button>
        <button
          onClick={() => setActiveTab("equipment")}
          className={`px-4 py-2 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "equipment"
              ? "border-ddt-accent text-ddt-text"
              : "border-transparent text-ddt-muted hover:text-ddt-text"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Lab Equipment Registry</span>
        </button>
      </div>

      {/* Tab Panel: Profile */}
      {activeTab === "profile" && (
        <div className="space-y-8 animate-in fade-in duration-300">
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
                  className="bg-ddt-lime text-black font-semibold hover:bg-ddt-lime/90 gap-2"
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

          {/* Tenant Info */}
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
                  tenant?.subscription_status === "active"
                    ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"
                    : tenant?.subscription_status === "trial"
                    ? "bg-sky-950/30 text-sky-400 border-sky-500/20"
                    : "bg-red-950/30 text-red-400 border-red-500/20"
                }`}>
                  {tenant?.subscription_status === "active" ? "Active" : tenant?.subscription_status === "trial" ? "Trial" : "Inactive"}
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
      )}

      {/* Tab Panel: Equipment */}
      {activeTab === "equipment" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-ddt-border bg-ddt-raised flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-ddt-accent" />
                <h2 className="text-sm font-syne font-bold uppercase tracking-wider text-ddt-muted">
                  Lab Equipment Registry
                </h2>
              </div>
              {isLabOwner && (
                <Button
                  onClick={() => setIsAddOpen(true)}
                  disabled={equipmentList && equipmentList.length >= 8}
                  className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 shadow transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Equipment</span>
                </Button>
              )}
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-ddt-muted leading-relaxed">
                Register and manage the equipment used by your field engineers during site visits (maximum of 8 active devices). Registered equipment will be available for checklist verification when logging site visits.
              </p>

              {equipmentList && equipmentList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipmentList.map((eq: any) => (
                    <div
                      key={eq.id}
                      className="bg-ddt-input border border-ddt-border hover:border-ddt-border-strong rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-ddt-raised text-ddt-accent border border-ddt-border font-bold">
                            {eq.equipment_type}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-ddt-text mt-1">{eq.equipment_name}</h4>
                        <p className="text-xs text-ddt-muted font-mono">S/N: {eq.serial_number}</p>
                      </div>

                      {isLabOwner && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ddt-border/50">
                          <Button
                            onClick={() => {
                              setSelectedEq(eq);
                              setEditEqName(eq.equipment_name);
                              setEditEqSerial(eq.serial_number);
                              setIsEditOpen(true);
                            }}
                            variant="ghost"
                            className="h-8 text-xs text-ddt-muted hover:text-ddt-text px-2.5 rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => deactivateEquipmentMutation.mutate({ equipmentId: eq.id })}
                            disabled={deactivateEquipmentMutation.isPending}
                            variant="ghost"
                            className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 px-2.5 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Deactivate
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-ddt-border rounded-xl text-center space-y-2">
                  <p className="text-sm text-ddt-muted font-medium">No registered equipment found.</p>
                  <p className="text-xs text-ddt-faint">Add equipment to start tracking site usage verification checklist.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <div className="bg-ddt-surface border border-ddt-border rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-ddt-border pb-3">
              <h4 className="font-syne font-bold text-ddt-text text-base uppercase tracking-wider">Add Lab Equipment</h4>
              <button onClick={() => setIsAddOpen(false)} className="text-ddt-muted hover:text-ddt-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="eq-name" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">Equipment Name *</Label>
                <Input
                  id="eq-name"
                  value={newEqName}
                  onChange={(e) => setNewEqName(e.target.value)}
                  placeholder="e.g. UPV (Pundit PL-200)"
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eq-serial" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">Serial Number *</Label>
                <Input
                  id="eq-serial"
                  value={newEqSerial}
                  onChange={(e) => setNewEqSerial(e.target.value)}
                  placeholder="e.g. Box-B/UP01-004-0036"
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eq-type" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">Equipment Type *</Label>
                <select
                  id="eq-type"
                  value={newEqType}
                  onChange={(e) => setNewEqType(e.target.value)}
                  className="w-full bg-ddt-input border border-ddt-border focus:border-ddt-accent rounded-md py-2 px-3 text-sm text-ddt-text focus:outline-none"
                >
                  <option value="UPV">UPV</option>
                  <option value="Profoscope">Profoscope</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-ddt-border flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="text-ddt-muted hover:text-ddt-text text-xs">
                Cancel
              </Button>
              <Button
                onClick={() =>
                  addEquipmentMutation.mutate({
                    equipmentName: newEqName,
                    serialNumber: newEqSerial,
                    equipmentType: newEqType,
                  })
                }
                disabled={addEquipmentMutation.isPending || !newEqName.trim() || !newEqSerial.trim()}
                className="bg-ddt-lime text-black font-bold hover:bg-ddt-lime/90 text-xs"
              >
                {addEquipmentMutation.isPending ? "Adding..." : "Add Equipment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {isEditOpen && selectedEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <div className="bg-ddt-surface border border-ddt-border rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-ddt-border pb-3">
              <h4 className="font-syne font-bold text-ddt-text text-base uppercase tracking-wider">Edit Equipment</h4>
              <button onClick={() => { setIsEditOpen(false); setSelectedEq(null); }} className="text-ddt-muted hover:text-ddt-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-eq-name" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">Equipment Name *</Label>
                <Input
                  id="edit-eq-name"
                  value={editEqName}
                  onChange={(e) => setEditEqName(e.target.value)}
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-eq-serial" className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">Serial Number *</Label>
                <Input
                  id="edit-eq-serial"
                  value={editEqSerial}
                  onChange={(e) => setEditEqSerial(e.target.value)}
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-ddt-border flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => { setIsEditOpen(false); setSelectedEq(null); }} className="text-ddt-muted hover:text-ddt-text text-xs">
                Cancel
              </Button>
              <Button
                onClick={() =>
                  updateEquipmentMutation.mutate({
                    equipmentId: selectedEq.id,
                    equipmentName: editEqName,
                    serialNumber: editEqSerial,
                  })
                }
                disabled={updateEquipmentMutation.isPending || !editEqName.trim() || !editEqSerial.trim()}
                className="bg-ddt-lime text-black font-bold hover:bg-ddt-lime/90 text-xs"
              >
                {updateEquipmentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Billing */}
      {activeTab === "billing" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Subscription State Overview */}
          <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-syne font-bold uppercase tracking-wider text-ddt-muted">
                  Subscription Status
                </h3>
                <p className="text-2xl font-bold font-syne text-ddt-text mt-1">
                  {tenant?.subscription_status === "active"
                    ? "Active Suite Subscription"
                    : tenant?.subscription_status === "trial"
                    ? "Trial Workspace"
                    : "Inactive / Suspended"}
                </p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                tenant?.subscription_status === "active"
                  ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"
                  : tenant?.subscription_status === "trial"
                  ? "bg-sky-950/30 text-sky-400 border-sky-500/20"
                  : "bg-red-950/30 text-red-400 border-red-500/20"
              }`}>
                {tenant?.subscription_status ?? "Trial"}
              </span>
            </div>

            <div className="border-t border-ddt-border pt-4 text-sm text-ddt-muted leading-relaxed">
              {tenant?.subscription_status === "active" ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <p>
                    Your workspace is active. You have full access to unlimited NDT reports, staff dashboards, performance metrics, and the Proofread Bot.
                  </p>
                  {isLabOwner && (
                    <Button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to cancel your subscription? This will immediately suspend workspace access."
                          )
                        ) {
                          cancelSubscriptionMutation.mutate();
                        }
                      }}
                      disabled={cancelSubscriptionMutation.isPending}
                      className="bg-transparent border border-red-500/30 text-red-400 hover:bg-red-950/20 hover:border-red-500/60 shrink-0 text-xs font-semibold"
                    >
                      {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  )}
                </div>
              ) : tenant?.subscription_status === "trial" ? (
                <p>
                  Your laboratory is currently operating under the 14-day free trial. Upgrade below to secure uninterrupted access to the automated engineering reports and QA audits.
                </p>
              ) : (
                <p className="text-red-400 font-medium">
                  Access to this workspace has been suspended. Please select a subscription plan below to reactivate operations.
                </p>
              )}
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-syne font-bold uppercase tracking-wider text-ddt-muted">
              Available Subscription Plans
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Starter Plan */}
              <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md overflow-hidden flex flex-col justify-between">
                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ddt-accent bg-ddt-accent-bg px-2 py-0.5 rounded border border-ddt-accent/10">
                      Starter Suite
                    </span>
                    <h4 className="text-lg font-syne font-bold text-ddt-text mt-2">DDT Starter Plan</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-syne text-ddt-text">₦15,000</span>
                      <span className="text-xs text-ddt-muted">/ month</span>
                    </div>
                  </div>
                  <p className="text-xs text-ddt-muted leading-relaxed">
                    Perfect for small NDT labs getting started with digital operations.
                  </p>
                  <ul className="text-xs text-ddt-muted space-y-2 pt-2 border-t border-ddt-border">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Up to 10 staff members</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Standard project pipeline tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Basic client management</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-ddt-raised border-t border-ddt-border">
                  {subscription?.status === "active" && subscription?.planName === "starter" ? (
                    <div className="flex items-center justify-center gap-2 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 py-2 rounded-lg text-xs font-bold w-full">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Current Active Plan</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() =>
                        initializeBillingMutation.mutate({
                          planName: "DDT Starter Plan",
                          price: 15000,
                          origin: window.location.origin,
                        })
                      }
                      disabled={initializeBillingMutation.isPending}
                      className="w-full bg-ddt-raised border border-ddt-border text-ddt-text hover:bg-ddt-surface text-xs font-semibold gap-2"
                    >
                      {initializeBillingMutation.isPending ? "Initializing..." : (subscription?.status === "active" ? "Downgrade to Starter" : "Subscribe to Starter")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Pro Plan */}
              <div className="bg-ddt-surface border-2 border-ddt-accent rounded-xl shadow-lg overflow-hidden flex flex-col justify-between relative">
                <div className="absolute top-0 right-0 bg-ddt-lime text-black text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  Popular
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/10">
                      Full command deck
                    </span>
                    <h4 className="text-lg font-syne font-bold text-ddt-text mt-2">DDT Pro Plan</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-syne text-ddt-text">₦45,000</span>
                      <span className="text-xs text-ddt-muted">/ month</span>
                    </div>
                  </div>
                  <p className="text-xs text-ddt-muted leading-relaxed">
                    Unlock full technical capabilities, offline synchronicity, and automated AI proofreading audits.
                  </p>
                  <ul className="text-xs text-ddt-muted space-y-2 pt-2 border-t border-ddt-border">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Everything in Starter</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Up to 50 staff members</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>AI-powered report proofreading</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>LSMTL guideline compliance checks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Proofread Bot document error detection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Minor error auto-correction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ddt-accent" />
                      <span>Advanced performance analytics</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-ddt-raised border-t border-ddt-border">
                  {subscription?.status === "active" && subscription?.planName === "pro" ? (
                    <div className="flex items-center justify-center gap-2 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 py-2 rounded-lg text-xs font-bold w-full">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Current Active Plan</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() =>
                        initializeBillingMutation.mutate({
                          planName: "DDT Pro Plan",
                          price: 45000,
                          origin: window.location.origin,
                        })
                      }
                      disabled={initializeBillingMutation.isPending}
                      className="w-full bg-ddt-lime text-black hover:bg-ddt-lime/90 text-xs font-bold gap-2"
                    >
                      {initializeBillingMutation.isPending ? "Initializing..." : (subscription?.status === "active" ? "Upgrade to Pro" : "Subscribe to Pro")}
                      <ArrowRight className="w-3.5 h-3.5 text-black" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Gateway Overlay */}
      {simulateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <div className="bg-ddt-surface border-2 border-ddt-accent rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-ddt-border pb-3">
              <div className="flex items-center gap-2 text-ddt-accent">
                <Zap className="w-5 h-5" />
                <h4 className="font-syne font-bold">Paystack Sandbox Gateway</h4>
              </div>
              <button
                onClick={() => {
                  setSimulateData(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete("billing_simulate");
                  url.searchParams.delete("tenantId");
                  url.searchParams.delete("planName");
                  url.searchParams.delete("price");
                  window.history.replaceState({}, "", url.pathname + url.search);
                }}
                className="text-ddt-muted hover:text-ddt-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-ddt-muted">
              <p>
                No active Paystack API Keys were detected in your configuration. The application has safely entered the{" "}
                <strong className="text-ddt-accent">Mock Billing Sandbox</strong>.
              </p>

              <div className="bg-ddt-raised border border-ddt-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Plan Name:</span>
                  <span className="font-mono text-ddt-text">{simulateData.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Amount Due:</span>
                  <span className="font-mono text-ddt-text">₦{Number(simulateData.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Workspace ID:</span>
                  <span className="font-mono text-ddt-text text-xs">{simulateData.tenantId.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={() =>
                  simulatePaymentMutation.mutate({
                    tenantId: simulateData.tenantId,
                    planName: simulateData.planName,
                  })
                }
                disabled={simulatePaymentMutation.isPending}
                className="w-full bg-ddt-lime text-black font-bold hover:bg-ddt-lime/90"
              >
                {simulatePaymentMutation.isPending ? "Simulating..." : "Complete Simulated Payment"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSimulateData(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete("billing_simulate");
                  url.searchParams.delete("tenantId");
                  url.searchParams.delete("planName");
                  url.searchParams.delete("price");
                  window.history.replaceState({}, "", url.pathname + url.search);
                }}
                className="text-ddt-muted hover:text-ddt-text"
              >
                Cancel Sandbox Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
