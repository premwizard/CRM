"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  DollarSign,
  CheckSquare,
  Activity,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "Deals", href: "/deals", icon: DollarSign },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Activities", href: "/activities", icon: Activity },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
          IC
        </div>
        <div>
          <span className="font-bold text-foreground text-lg tracking-tight">
            IC CRM
          </span>
          <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            Enterprise Suite
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-md border border-border/50">
          <Shield className="w-4 h-4 text-emerald-500" />
          <div>
            <p className="font-semibold text-foreground">Phase 0 Core</p>
            <p className="text-[10px]">PostgreSQL & Prisma Ready</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
