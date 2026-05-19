import { getSession } from "@/lib/auth/get-session";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-ddt-bg">
      {/* Sidebar handles both desktop (fixed) and mobile (bottom tab bar) */}
      <Sidebar user={session.user} profile={session.profile} />

      <div className="flex flex-1 flex-col overflow-hidden min-h-screen">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-ddt-bg pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
