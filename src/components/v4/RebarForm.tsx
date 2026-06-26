"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RebarMeasurements } from "@/types";

interface RebarFormProps {
  onBack: () => void;
  onNext: (rebarData: RebarMeasurements) => void;
}

export function RebarForm({ onBack, onNext }: RebarFormProps) {
  const [column, setColumn] = useState({ mainBar: 16, links: 10, spacing: 300, coverDepth: 45 });
  const [beam, setBeam] = useState({ mainBar: 16, links: 10, spacing: 300, coverDepth: 55 });
  const [slab, setSlab] = useState({ mainBar: 12, links: 0, spacing: 200, coverDepth: 50 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ column, beam, slab });
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
                type="number"
                value={slab.mainBar}
                onChange={(e) => setSlab({ ...slab, mainBar: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Links (mm)</Label>
              <Input
                type="text"
                value={slab.links === 0 ? "-" : slab.links}
                onChange={(e) => setSlab({ ...slab, links: parseInt(e.target.value) || 0 })}
                placeholder="-"
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Spacing (mm)</Label>
              <Input
                type="number"
                value={slab.spacing}
                onChange={(e) => setSlab({ ...slab, spacing: parseInt(e.target.value) || 0 })}
                className="bg-ddt-input border-ddt-border text-ddt-text mt-1 rounded-xl h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ddt-muted">Cover Depth (mm)</Label>
              <Input
                type="number"
                value={slab.coverDepth}
                onChange={(e) => setSlab({ ...slab, coverDepth: parseInt(e.target.value) || 0 })}
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
