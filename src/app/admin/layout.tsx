import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    .select("role")
    .eq("id", authUser.user.id)
    .single();

  if (!userProfile || userProfile.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-ddt-bg font-sans">
      <header className="bg-ddt-surface border-b border-ddt-border px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold font-syne">
            A
          </div>
          <span className="font-syne font-bold text-ddt-text">Super Admin Control</span>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
