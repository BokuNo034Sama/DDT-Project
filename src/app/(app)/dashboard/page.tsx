"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setRole(user.app_metadata.role as string);
        const { data } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (data) setUserName(data.full_name);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  if (loading || !role) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  const isManager = role === "ops_manager" || role === "lab_owner" || role === "super_admin";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {isManager ? (
        <ManagerDashboard userName={userName} />
      ) : (
        <StaffDashboard userName={userName} />
      )}
    </div>
  );
}
