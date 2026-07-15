"use client";

import { useState, useEffect } from "react";
import { NdtCode } from "@/components/ui/NdtCode";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  Calendar,
  Layers,
  Laptop,
  Phone,
  Mail,
  Share2,
  Edit2,
  Loader2,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { ProjectWithRelations } from "@/types";

interface ProjectHeaderProps {
  project: ProjectWithRelations;
  onUpdateSuccess?: () => void;
}

export function ProjectHeader({ project, onUpdateSuccess }: ProjectHeaderProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: (data) => {
      setConfirmDeleteModalOpen(false);
      // Invalidate ALL project-related queries
      utils.projects.list.invalidate();
      utils.projects.getDashboardData.invalidate();
      utils.projects.getOnboardingStatus.invalidate();

      // If on project detail page → navigate away
      router.push("/projects");

      // Show success toast
      toast.success(`Project deleted successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });

  const handleExecuteProjectDeletion = () => {
    if (deleteConfirmationText !== "DELETE") return;
    deleteProject.mutate({ id: project.id });
  };

  const { data: me } = trpc.staff.getMe.useQuery();
  const role = me?.role || null;

  // Form states
  const [clientName, setClientName] = useState(project.client_name || "");
  const [clientEmail, setClientEmail] = useState(project.client_email || "");
  const [clientPhone, setClientPhone] = useState(project.client_phone || "");
  const [address, setAddress] = useState(project.address || "");
  const [numberOfFloors, setNumberOfFloors] = useState(project.number_of_floors ?? 0);
  const [connection, setConnection] = useState(project.connection || "");
  const [siteDate, setSiteDate] = useState(project.site_date || "");
  const [device, setDevice] = useState(project.device || "");

  const utils = trpc.useUtils();
  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Project updated",
        description: "Project details have been updated successfully.",
      });
      setIsOpen(false);
      utils.projects.getById.invalidate({ id: project.id });
      if (onUpdateSuccess) onUpdateSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project details.",
        variant: "destructive",
      });
    },
  });

  const isManager = role === "ops_manager" || role === "lab_owner" || role === "super_admin";

  const handleOpen = () => {
    // Reset values to current project values on open
    setClientName(project.client_name || "");
    setClientEmail(project.client_email || "");
    setClientPhone(project.client_phone || "");
    setAddress(project.address || "");
    setNumberOfFloors(project.number_of_floors ?? 0);
    setConnection(project.connection || "");
    setSiteDate(project.site_date || "");
    setDevice(project.device || "");
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !address || !siteDate) {
      toast({
        title: "Required fields missing",
        description: "Please fill in Client Name, Address, and Site Date.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: project.id,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      address,
      number_of_floors: Number(numberOfFloors),
      connection,
      site_date: siteDate,
      device,
    });
  };

  return (
    <div className="bg-ddt-surface border border-ddt-border rounded-xl shadow-md p-6 relative overflow-hidden transition-all duration-300 hover:border-ddt-border-strong">
      {/* Absolute top decorative Sky Blue glow border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ddt-accent/20 via-ddt-accent to-ddt-accent/20" />

      <div className="flex flex-col gap-6 md:gap-8">
        {/* Top Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <NdtCode code={project.ndt_code} className="text-xl md:text-2xl font-mono tracking-wider" />
              <StatusChip status={project.status as any} />
            </div>
            <h1 className="text-2xl md:text-3xl font-syne font-bold text-ddt-text tracking-tight uppercase">
              {project.client_name}
            </h1>
          </div>
          {isManager && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleOpen}
                className="bg-ddt-raised hover:bg-ddt-border border border-ddt-border hover:border-ddt-accent text-ddt-text hover:text-ddt-accent transition-all duration-200 gap-2 shrink-0 py-5 px-4 rounded-lg w-full sm:w-auto"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Details</span>
              </Button>
              <button
                onClick={() => {
                  setDeleteConfirmationText("");
                  setConfirmDeleteModalOpen(true);
                }}
                className="text-xs font-medium px-4 py-3 border border-slate-800 hover:border-rose-900/50 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all w-full sm:w-auto h-[42px] flex items-center justify-center gap-1.5"
              >
                Delete Project
              </button>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-ddt-border/50 text-sm">
          {/* Section 1: Address & Site Date */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-ddt-accent mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-ddt-muted uppercase tracking-wider block font-semibold mb-0.5">Address</span>
                <span className="text-ddt-text leading-relaxed font-sans">{project.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-ddt-accent shrink-0" />
              <div>
                <span className="text-xs text-ddt-muted uppercase tracking-wider block font-semibold mb-0.5">Site Date</span>
                <span className="text-ddt-text font-sans">
                  {new Date(project.site_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Technical/Specs */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-ddt-accent shrink-0" />
              <div>
                <span className="text-xs text-ddt-muted uppercase tracking-wider block font-semibold mb-0.5">Number of Floors</span>
                <span className="text-ddt-text font-sans font-medium">{project.number_of_floors}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5 text-ddt-accent shrink-0" />
              <div>
                <span className="text-xs text-ddt-muted uppercase tracking-wider block font-semibold mb-0.5">Device / Laptop</span>
                <span className="text-ddt-text font-sans">
                  {project.device || <span className="text-ddt-faint italic font-normal">None Specified</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-ddt-accent shrink-0" />
              <div>
                <span className="text-xs text-ddt-muted uppercase tracking-wider block font-semibold mb-0.5">Referrer / Connection</span>
                <span className="text-ddt-text font-sans">
                  {project.connection || <span className="text-ddt-faint italic font-normal">Direct</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-ddt-accent shrink-0" />
              <div>
                <span className="text-xs text-ddt-muted uppercase tracking-wider block font-semibold mb-0.5">Client Email</span>
                <span className="text-ddt-text font-sans truncate block max-w-[240px]">
                  {project.client_email || <span className="text-ddt-faint italic font-normal">Not Provided</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-ddt-accent shrink-0" />
              <div>
                <span className="text-xs text-ddt-muted uppercase tracking-wider block font-semibold mb-0.5">Client Phone</span>
                <span className="text-ddt-text font-sans">
                  {project.client_phone || <span className="text-ddt-faint italic font-normal">Not Provided</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-ddt-surface border border-ddt-border text-ddt-text max-w-lg w-[95%] sm:w-full rounded-xl">
          <DialogHeader className="text-left">
            <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide">
              Edit Project Details
            </DialogTitle>
            <DialogDescription className="text-ddt-muted text-xs">
              {!isManager 
                ? `Update contact and device information for project ${project.ndt_code}.`
                : `Update the specifications and contact information for project ${project.ndt_code}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-xs font-semibold text-ddt-muted">Client Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
                  required
                  disabled={!isManager}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="siteDate" className="text-xs font-semibold text-ddt-muted">Site Date *</Label>
                <Input
                  id="siteDate"
                  type="date"
                  value={siteDate}
                  onChange={(e) => setSiteDate(e.target.value)}
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
                  required
                  disabled={!isManager}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold text-ddt-muted">Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
                required
                disabled={!isManager}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="floors" className="text-xs font-semibold text-ddt-muted">Number of Floors *</Label>
                <Input
                  id="floors"
                  type="number"
                  min={0}
                  value={numberOfFloors}
                  onChange={(e) => setNumberOfFloors(Number(e.target.value))}
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
                  required
                  disabled={!isManager}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="device" className="text-xs font-semibold text-ddt-muted">Device / Laptop Name</Label>
                <Input
                  id="device"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  placeholder="e.g. Toughbook 04"
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-ddt-muted">Client Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-ddt-muted">Client Phone</Label>
                <Input
                  id="phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+234..."
                  className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="connection" className="text-xs font-semibold text-ddt-muted">Referrer / Connection</Label>
              <Input
                id="connection"
                value={connection}
                onChange={(e) => setConnection(e.target.value)}
                placeholder="e.g. Engr. Kunle"
                className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-sm"
              />
            </div>

            <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised order-2 sm:order-1"
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-ddt-accent text-black font-semibold hover:bg-ddt-accent/90 order-1 sm:order-2"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Delete Confirmation Dialog */}
      {isConfirmDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1527] border border-slate-800 p-6 rounded-xl max-w-md w-full shadow-2xl flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-white">Are you absolutely sure you want to delete this project?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This structural execution will permanently remove the project pipeline, scientific inspection logs, and all compiled field records. This action is completely irreversible.
            </p>

            <div className="flex flex-col space-y-1.5 pt-2">
              <label htmlFor="confirm-delete-input" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Type <span className="text-rose-400 font-bold">DELETE</span> to confirm:
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-slate-900 border border-slate-800 focus:border-rose-900/60 focus:ring-1 focus:ring-rose-900/60 rounded-md py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteModalOpen(false)}
                className="text-xs px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:border-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteProjectDeletion}
                disabled={deleteConfirmationText !== "DELETE" || deleteProject.isPending}
                className="text-xs px-3 py-2 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {deleteProject.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Permanent Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
