"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RebarMeasurements } from "@/types";
import { trpc } from "@/lib/trpc/client";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RebarFormProps {
  projectId: string;
  onBack: () => void;
  onNext: (rebarData: RebarMeasurements) => void;
}

export function RebarForm({ projectId, onBack, onNext }: RebarFormProps) {
  const [column, setColumn] = useState({ mainBar: 16, links: 10, spacing: 300, coverDepth: 45 });
  const [beam, setBeam] = useState({ mainBar: 16, links: 10, spacing: 300, coverDepth: 55 });
  
  // Slab details: mainBar and links are strings to allow values like "12/10" and "-"
  const [slabMainBar, setSlabMainBar] = useState("12");
  const [slabLinks, setSlabLinks] = useState("-");
  const [slabSpacing, setSlabSpacing] = useState(200);
  const [slabCoverDepth, setSlabCoverDepth] = useState(50);

  const [selectedProfoscopeId, setSelectedProfoscopeId] = useState<string>("");

  // Query project's logged equipment checks from site visits
  const { data: checks, isLoading: loadingChecks } = trpc.reportBot.getEquipmentChecksByProject.useQuery({
    projectId,
  });

  // Query tenant's lab equipment registry
  const { data: registeredEquipment, isLoading: loadingRegistry } = trpc.equipment.listEquipment.useQuery();

  const siteVisitProfoscopes = (checks || [])
    .filter((c: any) => c.equipment?.equipment_type?.toLowerCase() === "profoscope")
    .map((c: any) => ({
      id: c.equipment.id,
      name: c.equipment.equipment_name,
      serial: c.equipment.serial_number,
      source: "Site Visit Logged",
    }));

  const registryProfoscopes = (registeredEquipment || [])
    .filter((e: any) => e.equipment_type?.toLowerCase() === "profoscope")
    .map((e: any) => ({
      id: e.id,
      name: e.equipment_name,
      serial: e.serial_number,
      source: "Lab Equipment Registry",
    }));

  const profoscopes = siteVisitProfoscopes.length > 0 ? siteVisitProfoscopes : registryProfoscopes;
  const loadingEquipment = loadingChecks && loadingRegistry;

  // Auto-select first Profoscope when loaded
  useEffect(() => {
    if (profoscopes.length > 0 && !selectedProfoscopeId) {
      setSelectedProfoscopeId(profoscopes[0].id);
    }
  }, [profoscopes, selectedProfoscopeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const activeProf = profoscopes.find((p: any) => p.id === selectedProfoscopeId) || {
      id: "manual",
      name: "Profoscope",
      serial: "Unknown Serial",
    };

    onNext({
      profoscopeId: activeProf.id,
      profoscopeName: activeProf.name,
      profoscopeSerial: activeProf.serial,
      column,
      beam,
      slab: {
        mainBar: slabMainBar,
        links: slabLinks,
        spacing: slabSpacing,
        coverDepth: slabCoverDepth,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-syne font-bold text-sm text-ddt-accent uppercase tracking-wide">
          Rebar Measurements from Site
        </h3>
        <p className="text-xs text-ddt-muted">
          Enter the reinforcing steel measurements recorded during the testing. Defaults are pre-filled.
        </p>
      </div>

      {/* Profoscope Equipment Selection */}
      <div className="bg-ddt-surface border border-ddt-border rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-ddt-text border-b border-ddt-border/50 pb-2">
          Profoscope Equipment Selection
        </h4>

        {loadingEquipment ? (
          <div className="flex items-center gap-2 text-xs text-ddt-muted">
            <Loader2 className="w-4 h-4 animate-spin text-ddt-accent" />
            <span>Loading equipment...</span>
          </div>
        ) : profoscopes.length > 0 ? (
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-ddt-muted uppercase tracking-wider">
              Select Profoscope Used *
            </Label>
            {profoscopes.length === 1 ? (
              <div className="bg-ddt-input border border-ddt-border rounded-xl p-3 text-xs text-ddt-text font-mono flex items-center justify-between">
                <div>
                  <span className="font-bold text-ddt-accent font-sans mr-2">{profoscopes[0].name}</span>
                  <span className="text-ddt-muted">S/N: {profoscopes[0].serial}</span>
                </div>
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/10">
                  {profoscopes[0].source}
                </span>
              </div>
            ) : (
              <Select value={selectedProfoscopeId} onValueChange={setSelectedProfoscopeId}>
                <SelectTrigger className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-ddt-accent text-xs">
                  <SelectValue placeholder="Choose a Profoscope" />
                </SelectTrigger>
                <SelectContent className="bg-ddt-surface border-ddt-border text-ddt-text text-xs">
                  {profoscopes.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (S/N: {p.serial})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400 leading-relaxed">
            <span className="font-bold uppercase block mb-1">⚠ No Profoscope Registered/Logged</span>
            There are no Profoscopes logged in the site visits for this project. The report bot will proceed using a default placeholder profoscope.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column */}
        <div className="bg-ddt-surface border border-ddt-border rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-ddt-text border-b border-ddt-border/50 pb-2 flex items-center justify-between">
            <span>Column</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-ddt-raised text-ddt-muted">vertical</span>
          </h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Main Bar (mm)</Label>
              <Input
                type="number"
                value={column.mainBar}
                onChange={(e) => setColumn({ ...column, mainBar: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Links (mm)</Label>
              <Input
                type="number"
                value={column.links}
                onChange={(e) => setColumn({ ...column, links: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Spacing (mm)</Label>
              <Input
                type="number"
                value={column.spacing}
                onChange={(e) => setColumn({ ...column, spacing: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Cover Depth (mm)</Label>
              <Input
                type="number"
                value={column.coverDepth}
                onChange={(e) => setColumn({ ...column, coverDepth: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Beam */}
        <div className="bg-ddt-surface border border-ddt-border rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-ddt-text border-b border-ddt-border/50 pb-2 flex items-center justify-between">
            <span>Beam</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-ddt-raised text-ddt-muted">horizontal</span>
          </h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Main Bar (mm)</Label>
              <Input
                type="number"
                value={beam.mainBar}
                onChange={(e) => setBeam({ ...beam, mainBar: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Links (mm)</Label>
              <Input
                type="number"
                value={beam.links}
                onChange={(e) => setBeam({ ...beam, links: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Spacing (mm)</Label>
              <Input
                type="number"
                value={beam.spacing}
                onChange={(e) => setBeam({ ...beam, spacing: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Cover Depth (mm)</Label>
              <Input
                type="number"
                value={beam.coverDepth}
                onChange={(e) => setBeam({ ...beam, coverDepth: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Slab */}
        <div className="bg-ddt-surface border border-ddt-border rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-ddt-text border-b border-ddt-border/50 pb-2 flex items-center justify-between">
            <span>Slab</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-ddt-raised text-ddt-muted">transverse</span>
          </h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Main Bar (mm)</Label>
              <Input
                type="text"
                value={slabMainBar}
                onChange={(e) => setSlabMainBar(e.target.value)}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Links (mm)</Label>
              <Input
                type="text"
                value={slabLinks}
                onChange={(e) => setSlabLinks(e.target.value)}
                placeholder="-"
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Spacing (mm)</Label>
              <Input
                type="number"
                value={slabSpacing}
                onChange={(e) => setSlabSpacing(parseInt(e.target.value) || 0)}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Cover Depth (mm)</Label>
              <Input
                type="number"
                value={slabCoverDepth}
                onChange={(e) => setSlabCoverDepth(parseInt(e.target.value) || 0)}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs px-4 py-2 rounded-xl"
        >
          ← Back
        </Button>
        <Button
          type="submit"
          className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs px-5 py-2 rounded-xl shadow-md"
        >
          Next →
        </Button>
      </div>
    </form>
  );
}
