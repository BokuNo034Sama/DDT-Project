"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ConcreteGradeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNext: (drawingProvided: boolean, concreteGrade: string) => void;
}

export function ConcreteGradeModal({
  isOpen,
  onOpenChange,
  onNext,
}: ConcreteGradeModalProps) {
  const [drawingProvided, setDrawingProvided] = useState<boolean>(false);
  const [concreteGrade, setConcreteGrade] = useState<string>("25");

  const handleNext = () => {
    onNext(drawingProvided, drawingProvided ? concreteGrade : "25");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ddt-raised border border-ddt-border text-ddt-text max-w-md w-[95%] sm:w-full rounded-2xl p-6 shadow-xl">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="font-syne text-lg font-bold text-ddt-accent uppercase tracking-wide">
            Report Bot — Before We Start
          </DialogTitle>
          <DialogDescription className="text-ddt-muted text-xs">
            Confirm drawing availability and the concrete design grade for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question 1: Drawings */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-ddt-text">
              Were structural drawings provided for this project?
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDrawingProvided(true)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  drawingProvided
                    ? "bg-ddt-accent/10 border-ddt-accent text-ddt-accent font-bold"
                    : "bg-ddt-input border-ddt-border text-ddt-muted hover:border-ddt-border-strong hover:text-ddt-text"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawingProvided(false);
                  setConcreteGrade("25");
                }}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  !drawingProvided
                    ? "bg-ddt-accent/10 border-ddt-accent text-ddt-accent font-bold"
                    : "bg-ddt-input border-ddt-border text-ddt-muted hover:border-ddt-border-strong hover:text-ddt-text"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Question 2: Grade */}
          {drawingProvided ? (
            <div className="space-y-2 animate-in fade-in duration-200">
              <Label htmlFor="concrete-grade" className="text-sm font-semibold text-ddt-text">
                What is the concrete design grade?
              </Label>
              <Input
                id="concrete-grade"
                type="number"
                value={concreteGrade}
                onChange={(e) => setConcreteGrade(e.target.value)}
                placeholder="e.g. 25, 30, 35"
                min="1"
                className="bg-ddt-input border-ddt-border text-ddt-text focus:border-ddt-accent focus:ring-1 focus:ring-ddt-accent rounded-xl"
              />
              <span className="text-[10px] text-ddt-muted">
                This is the design compressive strength in N/mm²
              </span>
            </div>
          ) : (
            <div className="p-4 bg-ddt-surface border border-ddt-border rounded-xl text-xs text-ddt-muted leading-relaxed animate-in fade-in duration-200">
              <p className="font-semibold text-ddt-text mb-1">Standard Assumed Strength</p>
              An assumed design strength of <span className="font-bold text-ddt-accent">25N/mm²</span> will be used for the report narrative and analysis calculations.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-ddt-muted hover:text-ddt-text font-medium text-xs rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={drawingProvided && !concreteGrade.trim()}
            className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all"
          >
            Next →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
