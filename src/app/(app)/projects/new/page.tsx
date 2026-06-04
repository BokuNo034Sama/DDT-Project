"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { JITCodePrefixModal } from "@/components/projects/JITCodePrefixModal";

export default function NewProjectPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState({
    clientName: "",
    address: "",
    siteDate: new Date().toISOString().split("T")[0],
    numberOfFloors: "",
  });

  const { data: tenant, isLoading: isTenantLoading } = trpc.settings.getTenant.useQuery();

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      utils.projects.list.invalidate();
      router.push(`/projects/${data.id}`);
    },
    onError: (err) => {
      alert("Failed to create project: " + err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      client_name: formData.clientName,
      address: formData.address,
      site_date: formData.siteDate,
      number_of_floors: formData.numberOfFloors ? parseInt(formData.numberOfFloors) : 1,
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {!isTenantLoading && tenant && (
        <JITCodePrefixModal 
          isOpen={tenant.code_prefix === "TEMP"} 
          tenantName={tenant.name}
        />
      )}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/projects"
          className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">New Project</h1>
          <p className="text-muted-foreground text-sm">Initialize a new NDT structural assessment.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-foreground mb-1">
                Client Name <span className="text-destructive">*</span>
              </label>
              <input
                id="clientName"
                type="text"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Dangote Group"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1">
                Site Address <span className="text-destructive">*</span>
              </label>
              <input
                id="address"
                type="text"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. 14 Victoria Island, Lagos"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="siteDate" className="block text-sm font-medium text-foreground mb-1">
                  Site Date <span className="text-destructive">*</span>
                </label>
                <input
                  id="siteDate"
                  type="date"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.siteDate}
                  onChange={(e) => setFormData({ ...formData, siteDate: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="numberOfFloors" className="block text-sm font-medium text-foreground mb-1">
                  Number of Floors
                </label>
                <input
                  id="numberOfFloors"
                  type="number"
                  min="1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. 4"
                  value={formData.numberOfFloors}
                  onChange={(e) => setFormData({ ...formData, numberOfFloors: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Link
              href="/projects"
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors border border-border"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
