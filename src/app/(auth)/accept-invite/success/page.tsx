import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, CheckCircle, Activity, ShieldCheck, BarChart } from "lucide-react";

export default async function AcceptInviteSuccessPage() {
  const supabase = createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser.user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, first_name:full_name, tenants(name)")
    .eq("id", authUser.user.id)
    .single();

  if (!userProfile) {
    redirect("/dashboard");
  }

  const firstName = userProfile.first_name.split(" ")[0] || "there";
  const labName = userProfile.tenants?.name || "your new lab";
  const role = userProfile.role;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-[560px] space-y-8 rounded-[24px] bg-white p-8 sm:p-12 border border-[#D1D5DB] shadow-2xl">
        {role === "staff" ? (
          // Staff View - Operational Scorecard
          <>
            <div className="text-center space-y-2">
              <h1 className="font-sans text-[32px] font-bold text-[#1A1917] tracking-tight leading-tight">
                Welcome to the team, {firstName}!
              </h1>
              <p className="font-sans text-[16px] text-[#6B6960]">
                You&apos;ve joined {labName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-[16px] p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="font-sans font-bold text-[#1A1917]">Speed Score</p>
                  <p className="font-sans text-[12px] text-[#6B6960]">24hr benchmark</p>
                </div>
              </div>
              <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-[16px] p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="font-sans font-bold text-[#1A1917]">Quality Score</p>
                  <p className="font-sans text-[12px] text-[#6B6960]">Zero fault target</p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-[#F9FAFB] p-6 rounded-[16px] border border-[#E5E7EB]">
              <p className="font-sans text-[16px] text-[#4B5563] leading-relaxed">
                Your core focus is moving assigned structural engineering reviews cleanly through the pipeline from WIP to Proof Ready. Completing reviews within the 24-hour benchmark boosts your Speed score. Avoiding report rejections maintains a flawless Quality score.
              </p>
            </div>
          </>
        ) : (
          // Ops Manager View - Bottleneck Monitor
          <>
            <div className="text-center space-y-2">
              <h1 className="font-sans text-[32px] font-bold text-[#1A1917] tracking-tight leading-tight">
                Welcome to the operations deck, {firstName}!
              </h1>
              <p className="font-sans text-[16px] text-[#6B6960]">
                You&apos;ve joined {labName}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-[12px] p-4 flex flex-col items-center text-center space-y-2">
                <Activity className="w-6 h-6 text-[#3B82F6]" />
                <p className="font-sans text-[13px] font-bold text-[#1A1917]">Pipeline control</p>
              </div>
              <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-[12px] p-4 flex flex-col items-center text-center space-y-2">
                <ShieldCheck className="w-6 h-6 text-[#3B82F6]" />
                <p className="font-sans text-[13px] font-bold text-[#1A1917]">Quality gate</p>
              </div>
              <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-[12px] p-4 flex flex-col items-center text-center space-y-2">
                <BarChart className="w-6 h-6 text-[#3B82F6]" />
                <p className="font-sans text-[13px] font-bold text-[#1A1917]">Performance tracker</p>
              </div>
            </div>

            <div className="mt-8 bg-[#F9FAFB] p-6 rounded-[16px] border border-[#E5E7EB]">
              <p className="font-sans text-[16px] text-[#4B5563] leading-relaxed">
                You are the controller of the lab pipeline. Your workspace highlights bottlenecked testing stages, manages incoming project registrations, and oversees the final quality control loop before reports ship to LSMTL.
              </p>
            </div>
          </>
        )}

        <div className="mt-8 pt-4">
          <Link href="/dashboard" className="block">
            <button className="w-full bg-[#A3E635] hover:bg-[#90D028] text-[#1A1917] font-bold h-[52px] rounded-full transition-colors flex items-center justify-center space-x-2 text-[16px]">
              <span>{role === "staff" ? "Go to my tasks" : "Open the command centre"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
