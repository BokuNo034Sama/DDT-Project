"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { InviteModal } from "./InviteModal";
import { Button } from "@/components/ui/button";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserX, UserCheck, Shield, ShieldAlert, RotateCcw } from "lucide-react";

export default function StaffPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"active" | "deactivated">("active");

  const { data: staffList, isLoading: loadingStaff } = trpc.staff.list.useQuery();
  const { data: deactivatedList, isLoading: loadingDeactivated } = trpc.staff.listDeactivated.useQuery(undefined, {
    enabled: activeTab === "deactivated",
  });
  const { data: invitations, isLoading: loadingInvites } = trpc.staff.getPendingInvitations.useQuery();
  
  const deactivateMutation = trpc.staff.deactivate.useMutation({
    onSuccess: (data) => {
      utils.staff.list.invalidate();
      utils.staff.listDeactivated.invalidate();
      utils.projects.getDashboardData.invalidate();
      utils.projects.getOnboardingStatus.invalidate();

      toast.success(`${data.deactivatedUser || "User"} has been deactivated successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to deactivate: ${error.message}`);
    }
  });

  const reactivateMutation = trpc.staff.reactivate.useMutation({
    onSuccess: (data) => {
      utils.staff.list.invalidate();
      utils.staff.listDeactivated.invalidate();
      utils.projects.getDashboardData.invalidate();
      utils.projects.getOnboardingStatus.invalidate();

      toast.success(`${data.reactivatedUser || "User"} has been reactivated successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to reactivate: ${error.message}`);
    }
  });

  const updateRoleMutation = trpc.staff.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      utils.staff.list.invalidate();
      utils.projects.getOnboardingStatus.invalidate();
    },
    onError: (err) => {
      toast.error(`Error updating role: ${err.message}`);
    }
  });

  const cancelInviteMutation = trpc.staff.cancelInvitation.useMutation({
    onSuccess: () => {
      toast({ title: "Invitation cancelled" });
      utils.staff.getPendingInvitations.invalidate();
    }
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-sky-950 text-sky-400 border-sky-500/20";
      case "lab_owner": return "bg-purple-900 text-purple-100 border-purple-700";
      case "ops_manager": return "bg-sky-950 text-sky-400 border-sky-500/20";
      default: return "bg-blue-900 text-blue-100 border-blue-700";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "lab_owner": return "Lab Owner";
      case "ops_manager": return "Ops Manager";
      default: return "Staff";
    }
  };

  if (loadingStaff) {
    return <LoadingSkeleton type="table" rows={5} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Directory</h1>
          <p className="text-muted-foreground mt-1">Manage staff roles, view efficiency, and invite new members.</p>
        </div>
        <InviteModal>
          <Button className="bg-ddt-lime text-black font-semibold hover:bg-ddt-lime/90">
            Invite Staff
          </Button>
        </InviteModal>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Staff ({staffList?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("deactivated")}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "deactivated"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Deactivated Staff {deactivatedList ? `(${deactivatedList.length})` : ""}
        </button>
      </div>

      {activeTab === "active" ? (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-center">Tasks (M)</th>
                  <th className="px-4 py-3 font-medium text-center">Site Visits (M)</th>
                  <th className="px-4 py-3 font-medium text-center">Faults (M)</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffList?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <EmptyState title="No active staff" description="No team members found." />
                    </td>
                  </tr>
                ) : (
                  staffList?.map((staff: any) => (
                    <tr key={staff.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AvatarCircle initials={staff.full_name?.substring(0, 2).toUpperCase() || "??"} size="sm" />
                          <div>
                            <p className="font-medium">{staff.full_name}</p>
                            <p className="text-xs text-muted-foreground">{staff.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRoleColor(staff.role)}`}>
                          {getRoleName(staff.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {staff.joined_at ? new Date(staff.joined_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">{staff.month_stages_count || 0}</td>
                      <td className="px-4 py-3 text-center">{staff.month_site_visits_count || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={(staff.month_faults_count || 0) > 0 ? "text-red-400 font-medium" : ""}>
                          {staff.month_faults_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-ddt-surface border-ddt-border">
                            {staff.role === 'staff' && (
                              <DropdownMenuItem 
                                onClick={() => updateRoleMutation.mutate({ userId: staff.id, role: 'ops_manager' })}
                                className="cursor-pointer"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Promote to Manager
                              </DropdownMenuItem>
                            )}
                            {staff.role === 'ops_manager' && (
                              <DropdownMenuItem 
                                onClick={() => updateRoleMutation.mutate({ userId: staff.id, role: 'staff' })}
                                className="cursor-pointer"
                              >
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Demote to Staff
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm("Are you sure you want to deactivate this user?")) {
                                  deactivateMutation.mutate({ userId: staff.id });
                                }
                              }}
                              className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-500/10"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {loadingDeactivated ? (
            <LoadingSkeleton type="table" rows={3} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!deactivatedList || deactivatedList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <EmptyState title="No deactivated staff" description="No deactivated staff members found." />
                      </td>
                    </tr>
                  ) : (
                    deactivatedList.map((staff: any) => (
                      <tr key={staff.id} className="hover:bg-secondary/20 transition-colors opacity-75">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AvatarCircle initials={staff.full_name?.substring(0, 2).toUpperCase() || "??"} size="sm" />
                            <div>
                              <p className="font-medium">{staff.full_name}</p>
                              <p className="text-xs text-muted-foreground">{staff.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRoleColor(staff.role)}`}>
                            {getRoleName(staff.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {staff.joined_at ? new Date(staff.joined_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Reactivate ${staff.full_name}?`)) {
                                reactivateMutation.mutate({ userId: staff.id });
                              }
                            }}
                            disabled={reactivateMutation.isPending}
                            className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30 hover:text-emerald-300 gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reactivate
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending Invitations Section */}
      {(!loadingInvites && invitations && invitations.length > 0) && (
        <div className="space-y-4 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold tracking-tight">Pending Invitations</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invitations.map((invite: any) => (
                  <tr key={invite.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{invite.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getRoleName(invite.role)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => cancelInviteMutation.mutate({ id: invite.id })}
                        disabled={cancelInviteMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      >
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
