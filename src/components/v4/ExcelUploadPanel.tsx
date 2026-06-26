"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExcelUploadPanelProps {
  onBack: () => void;
  onGenerate: (file: File) => void;
  isGenerating: boolean;
}

export function ExcelUploadPanel({ onBack, onGenerate, isGenerating }: ExcelUploadPanelProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected: File | undefined) => {
    if (!selected) return;

    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx') {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel workbook (.xlsx) spreadsheet.",
        variant: "destructive"
      });
      return;
    }

    setFile(selected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    validateAndSetFile(selected);
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    onGenerate(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-syne font-bold text-sm text-ddt-accent uppercase tracking-wide">
          Upload Scientific Observations
        </h3>
        <p className="text-xs text-ddt-muted">
          Upload the compiled Excel observation sheet (.xlsx) containing trials and calculated concrete strengths.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!file ? triggerSelectFile : undefined}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
          !file ? "cursor-pointer" : ""
        } ${
          dragOver
            ? "border-ddt-accent bg-ddt-accent/5"
            : file
            ? "border-emerald-500/40 bg-emerald-950/5"
            : "border-ddt-border hover:border-slate-500 bg-slate-900/20"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx"
          className="hidden"
          disabled={isGenerating}
        />

        {file ? (
          <div className="flex items-center justify-between w-full max-w-md bg-ddt-surface border border-ddt-border p-4 rounded-xl relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-ddt-text truncate max-w-[200px] sm:max-w-[280px]">
                  {file.name}
                </p>
                <p className="text-[10px] text-ddt-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              disabled={isGenerating}
              className="p-1 rounded-full text-ddt-muted hover:bg-slate-800 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800">
              <Upload className="w-5 h-5 text-ddt-muted" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-ddt-text hover:text-ddt-accent transition-colors">Click to upload</span> or drag and drop
            </div>
            <p className="text-[10px] text-ddt-muted">
              Supported format: .xlsx spreadsheet files only
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isGenerating}
          className="border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs px-4 py-2 rounded-xl"
        >
          ← Back
        </Button>
        <Button
          type="submit"
          disabled={!file || isGenerating}
          className="bg-ddt-lime hover:bg-ddt-lime/90 text-black font-bold text-xs px-6 py-2 rounded-xl shadow-md disabled:opacity-50"
        >
          {isGenerating ? "Processing..." : "Generate Report Draft →"}
        </Button>
      </div>
    </form>
  );
}
