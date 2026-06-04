"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function InviteModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "ops_manager">("staff");
  
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const inviteMutation = trpc.staff.invite.useMutation({
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
      });
      setOpen(false);
      setEmail("");
      utils.staff.getPendingInvitations.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    inviteMutation.mutate({ email, role });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-ddt-surface border-ddt-border text-ddt-text">
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@laboratory.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-ddt-input border-ddt-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v: "staff" | "ops_manager") => setRole(v)}>
              <SelectTrigger className="bg-ddt-input border-ddt-border">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff (Field/Report)</SelectItem>
                <SelectItem value="ops_manager">Operations Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={inviteMutation.isPending || !email}
              className="bg-ddt-lime text-black font-semibold hover:bg-ddt-lime/90"
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
