import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Shield, LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser.user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", authUser.user.id)
    .single();

  if (!userProfile || userProfile.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-ddt-bg font-sans">
      <header className="bg-ddt-surface border-b border-ddt-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold font-syne shadow-md">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-syne font-bold text-ddt-text block leading-none">Super Admin Control</span>
            <span className="text-[10px] text-ddt-muted font-mono leading-none">{userProfile?.full_name || authUser.user.email}</span>
          </div>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-red-400 bg-slate-900/80 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/50 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Switch Account</span>
          </button>
        </form>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
