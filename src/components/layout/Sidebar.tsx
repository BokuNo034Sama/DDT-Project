"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Search,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { ProfileWithTenant } from "@/types";
import { User as AuthUser } from "@supabase/supabase-js";
import { TrialBanner } from "@/components/billing/TrialBanner";

interface SidebarProps {
  user: AuthUser | null;
  profile: ProfileWithTenant | null;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Search Reports", href: "/search", icon: Search },
  { name: "Performance", href: "/performance", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[200px] bg-ddt-surface border-r border-ddt-border sticky top-0 h-screen z-40">
        <div className="p-6">
          <Link href="/dashboard" className="flex flex-col">
            <span className="font-syne text-xl font-bold text-ddt-accent leading-tight">
              DDT Structure
            </span>
            <span className="text-[10px] text-ddt-muted font-sans mt-1 uppercase tracking-wider">
              {profile?.tenant?.name || "Laboratory"}
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
                  isActive
                    ? "text-ddt-text border-l-2 border-ddt-accent bg-ddt-accent/5 ml-[-2px] rounded-l-none"
                    : "text-ddt-muted hover:text-ddt-text hover:bg-ddt-raised"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive
                      ? "text-ddt-accent"
                      : "text-ddt-faint group-hover:text-ddt-muted"
                  )}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <TrialBanner />

        <div className="p-4 border-t border-ddt-border bg-ddt-surface">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-ddt-accent flex items-center justify-center text-black font-bold text-xs shrink-0">
              {getInitials(profile?.full_name || user?.email || "U")}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-ddt-text truncate">
                {profile?.full_name || "User"}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-ddt-accent font-bold truncate">
                {profile?.role?.replace("_", " ") || "Staff"}
              </span>
            </div>
          </div>
          <form action={signOut}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-ddt-muted hover:text-red-400 hover:bg-red-400/10 h-9 px-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs">Sign Out</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-ddt-surface border-t border-ddt-border flex justify-around items-center h-16 px-2 z-50">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                isActive ? "text-ddt-accent" : "text-ddt-faint"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">
                {item.name.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
