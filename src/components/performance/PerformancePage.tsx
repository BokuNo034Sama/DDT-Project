"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { StaffPerformanceCard } from "./StaffPerformanceCard";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PerformancePage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const now = new Date();
  const defaultMonth = { month: now.getMonth() + 1, year: now.getFullYear() };
  
  const [selectedMonth, setSelectedMonth] = useState(`${defaultMonth.year}-${defaultMonth.month}`);
  
  const monthParts = selectedMonth.split("-");
  const currentQuery = { month: parseInt(monthParts[1]), year: parseInt(monthParts[0]) };

  const { data: months, isLoading: loadingMonths } = trpc.performance.getAllMonths.useQuery();
  const { data: performanceData, isLoading: loadingData } = trpc.performance.monthly.useQuery(currentQuery);

  const handleExportPdf = async () => {
    if (!performanceData) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/reports/performance-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: performanceData,
          month: currentQuery.month,
          year: currentQuery.year,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `performance-report-${currentQuery.year}-${currentQuery.month}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Report generated", description: "Your PDF has been downloaded." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Reports</h1>
          <p className="text-muted-foreground mt-1">Monthly efficiency and quality metrics for your team.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {!loadingMonths && months && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[200px] bg-ddt-surface border-border text-foreground">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent className="bg-ddt-surface border-border">
                {months.map((m) => (
                  <SelectItem key={`${m.value.year}-${m.value.month}`} value={`${m.value.year}-${m.value.month}`}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button 
            variant="outline" 
            className="border-ddt-accent text-ddt-accent hover:bg-ddt-accent hover:text-ddt-bg"
            onClick={handleExportPdf}
            disabled={isExporting || loadingData || !performanceData?.length}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Generating..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {loadingData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="detail" rows={4} />
          <LoadingSkeleton type="detail" rows={4} />
          <LoadingSkeleton type="detail" rows={4} />
        </div>
      ) : !performanceData || performanceData.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12">
          <EmptyState 
            title="No performance data" 
            description={`There is no completed task data for ${months?.find(m => `${m.value.year}-${m.value.month}` === selectedMonth)?.label || 'this month'}.`} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {performanceData.map((report) => (
            <StaffPerformanceCard key={report.user.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
