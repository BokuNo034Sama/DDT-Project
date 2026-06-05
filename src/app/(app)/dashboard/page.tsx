"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface UserProfile {
  role: string;
  full_name: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("users")
            .select("full_name, role")
            .eq("id", user.id)
            .single();
          if (data) {
            setProfile(data as UserProfile);
          }
        }
      } catch (err) {
        console.error("Error loading user dashboard profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  if (loading || !profile) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (profile.role === "staff") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <StaffDashboard userName={profile.full_name} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ManagerDashboard userName={profile.full_name} />
    </div>
  );
}
