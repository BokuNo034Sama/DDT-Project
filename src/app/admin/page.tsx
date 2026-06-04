"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatusChip } from "@/components/ui/StatusChip";
import { format } from "date-fns";

export default function AdminPage() {
  const { data: tenants, isLoading, refetch } = trpc.admin.listTenants.useQuery();
  const updateStatusMutation = trpc.admin.updateTenantStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const handleStatusChange = async (tenantId: string, status: "trial" | "active" | "inactive") => {
    if (confirm(`Change status to ${status}?`)) {
      await updateStatusMutation.mutateAsync({ tenantId, status });
    }
  };

  if (isLoading) return <LoadingSkeleton type="table" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-syne font-bold text-ddt-text mb-4">All Workspaces</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-ddt-bg text-ddt-muted border-b border-ddt-border">
              <tr>
                <th className="px-4 py-3">Lab Name</th>
                <th className="px-4 py-3">Slug / Prefix</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ddt-border">
              {tenants?.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-ddt-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-ddt-text">{tenant.name}</td>
                  <td className="px-4 py-3 text-ddt-muted">
                    {tenant.slug} <span className="text-ddt-faint">({tenant.code_prefix})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      tenant.subscription_status === 'active' ? 'bg-green-500/20 text-green-500' :
                      tenant.subscription_status === 'trial' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {tenant.subscription_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ddt-muted">
                    {format(new Date(tenant.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="bg-ddt-input border border-ddt-border rounded p-1 text-xs text-ddt-text"
                      value={tenant.subscription_status}
                      onChange={(e) => handleStatusChange(tenant.id, e.target.value as any)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
