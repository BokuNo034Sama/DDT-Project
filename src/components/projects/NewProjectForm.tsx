"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const formSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required"),
  address: z.string().trim().min(1, "Site address is required"),
  siteDate: z.string().trim().min(1, "Site date is required"),
  numberOfFloors: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 1;
  }, { message: "Number of floors must be at least 1" }),
  clientEmail: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  clientPhone: z.string().trim().optional(),
  device: z.string().trim().optional(),
  connection: z.string().trim().optional(),
});

type FormDataType = z.infer<typeof formSchema>;

export function NewProjectForm() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState<FormDataType>({
    clientName: "",
    address: "",
    siteDate: new Date().toISOString().split("T")[0],
    numberOfFloors: "",
    clientEmail: "",
    clientPhone: "",
    device: "",
    connection: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      utils.projects.list.invalidate();
      router.push(`/projects/${data.id}`);
    },
    onError: (err) => {
      alert("Failed to create project: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const data = result.data;

    createMutation.mutate({
      client_name: data.clientName,
      address: data.address,
      site_date: data.siteDate,
      number_of_floors: parseInt(data.numberOfFloors, 10),
      client_email: data.clientEmail || undefined,
      client_phone: data.clientPhone || undefined,
      device: data.device || undefined,
      connection: data.connection || undefined,
    });
  };

  const handleInputChange = (field: keyof FormDataType & string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1: Client Name* | Site Date* */}
        <div className="col-span-1">
          <label htmlFor="clientName" className="block text-sm font-medium text-foreground mb-1 font-sans">
            Client Name <span className="text-destructive">*</span>
          </label>
          <input
            id="clientName"
            type="text"
            className={`w-full rounded-[8px] border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans ${
              errors.clientName ? "border-destructive focus:ring-destructive/50" : "border-input"
            }`}
            placeholder="e.g. Dangote Group"
            value={formData.clientName}
            onChange={(e) => handleInputChange("clientName", e.target.value)}
          />
          {errors.clientName && (
            <p className="mt-1 text-xs text-destructive font-sans">{errors.clientName}</p>
          )}
        </div>

        <div className="col-span-1">
          <label htmlFor="siteDate" className="block text-sm font-medium text-foreground mb-1 font-sans">
            Site Date <span className="text-destructive">*</span>
          </label>
          <input
            id="siteDate"
            type="date"
            className={`w-full rounded-[8px] border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans ${
              errors.siteDate ? "border-destructive focus:ring-destructive/50" : "border-input"
            }`}
            value={formData.siteDate}
            onChange={(e) => handleInputChange("siteDate", e.target.value)}
          />
          {errors.siteDate && (
            <p className="mt-1 text-xs text-destructive font-sans">{errors.siteDate}</p>
          )}
        </div>

        {/* Row 2: Site Address* (full width) */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1 font-sans">
            Site Address <span className="text-destructive">*</span>
          </label>
          <input
            id="address"
            type="text"
            className={`w-full rounded-[8px] border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans ${
              errors.address ? "border-destructive focus:ring-destructive/50" : "border-input"
            }`}
            placeholder="e.g. 14 Victoria Island, Lagos"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
          />
          {errors.address && (
            <p className="mt-1 text-xs text-destructive font-sans">{errors.address}</p>
          )}
        </div>

        {/* Row 3: Number of Floors* | Device (optional) */}
        <div className="col-span-1">
          <label htmlFor="numberOfFloors" className="block text-sm font-medium text-foreground mb-1 font-sans">
            Number of Floors <span className="text-destructive">*</span>
          </label>
          <input
            id="numberOfFloors"
            type="number"
            min="1"
            className={`w-full rounded-[8px] border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans ${
              errors.numberOfFloors ? "border-destructive focus:ring-destructive/50" : "border-input"
            }`}
            placeholder="e.g. 4"
            value={formData.numberOfFloors}
            onChange={(e) => handleInputChange("numberOfFloors", e.target.value)}
          />
          {errors.numberOfFloors && (
            <p className="mt-1 text-xs text-destructive font-sans">{errors.numberOfFloors}</p>
          )}
        </div>

        <div className="col-span-1">
          <label htmlFor="device" className="block text-sm font-medium text-foreground mb-1 font-sans">
            Device / Laptop <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <input
            id="device"
            type="text"
            className="w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans"
            placeholder="e.g. Dell Latitude 5510"
            value={formData.device}
            onChange={(e) => handleInputChange("device", e.target.value)}
          />
        </div>

        {/* Row 4: Client Email (optional) | Client Phone (optional) */}
        <div className="col-span-1">
          <label htmlFor="clientEmail" className="block text-sm font-medium text-foreground mb-1 font-sans">
            Client Email <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <input
            id="clientEmail"
            type="email"
            className={`w-full rounded-[8px] border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans ${
              errors.clientEmail ? "border-destructive focus:ring-destructive/50" : "border-input"
            }`}
            placeholder="e.g. client@example.com"
            value={formData.clientEmail}
            onChange={(e) => handleInputChange("clientEmail", e.target.value)}
          />
          {errors.clientEmail && (
            <p className="mt-1 text-xs text-destructive font-sans">{errors.clientEmail}</p>
          )}
        </div>

        <div className="col-span-1">
          <label htmlFor="clientPhone" className="block text-sm font-medium text-foreground mb-1 font-sans">
            Client Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <input
            id="clientPhone"
            type="text"
            className="w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans"
            placeholder="e.g. 08012345678"
            value={formData.clientPhone}
            onChange={(e) => handleInputChange("clientPhone", e.target.value)}
          />
        </div>

        {/* Row 5: Referrer / Connection (optional, full width) */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="connection" className="block text-sm font-medium text-foreground mb-1 font-sans">
            Referrer / Connection <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <input
            id="connection"
            type="text"
            className="w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-sans"
            placeholder="e.g. Direct, John Doe"
            value={formData.connection}
            onChange={(e) => handleInputChange("connection", e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end gap-3">
        <Link
          href="/projects"
          className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-[8px] transition-colors border border-border font-sans"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-[8px] shadow-sm transition-colors disabled:opacity-50 font-sans"
        >
          {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Project
        </button>
      </div>
    </form>
  );
}
