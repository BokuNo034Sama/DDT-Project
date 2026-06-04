"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface JITCodePrefixModalProps {
  isOpen: boolean;
  tenantName: string;
}

export function JITCodePrefixModal({ isOpen, tenantName }: JITCodePrefixModalProps) {
  const [prefix, setPrefix] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const updateTenantMutation = trpc.settings.updateTenant.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!/^[A-Z]{1,4}$/.test(prefix)) {
      setError("Prefix must be 1 to 4 uppercase letters only.");
      return;
    }

    await updateTenantMutation.mutateAsync({
      name: tenantName,
      code_prefix: prefix,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}> {/* Prevent closing */}
      <DialogContent className="sm:max-w-md bg-ddt-surface border-ddt-border" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="font-syne text-2xl text-ddt-accent">
            Set Lab Code Prefix
          </DialogTitle>
          <DialogDescription className="font-sans text-ddt-muted pt-2">
            Before creating your first real project, please select a unique 1-4 letter prefix for your lab (e.g., &apos;ABC&apos;). This will be used to generate your NDT codes (e.g., ABC-001).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Input
              id="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="e.g. STR, LAB"
              maxLength={4}
              required
              className="bg-ddt-input border-ddt-border text-ddt-text focus:ring-ddt-accent text-lg uppercase"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={updateTenantMutation.isPending || !prefix}
            className="w-full bg-ddt-accent hover:bg-ddt-accent-dim text-black font-bold h-11"
          >
            {updateTenantMutation.isPending ? "Saving..." : "Save Prefix"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
