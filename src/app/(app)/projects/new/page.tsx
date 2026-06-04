"use client";

import { trpc } from "@/lib/trpc/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { JITCodePrefixModal } from "@/components/projects/JITCodePrefixModal";
import { NewProjectForm } from "@/components/projects/NewProjectForm";

export default function NewProjectPage() {
  const { data: tenant, isLoading: isTenantLoading } = trpc.settings.getTenant.useQuery();

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
        <NewProjectForm />
      </div>
    </div>
  );
}
