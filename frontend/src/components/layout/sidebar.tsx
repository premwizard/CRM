"use client";

import React, { useState } from "react";
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
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

export interface NavGroup {
  title: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

export const navGroups: NavGroup[] = [
  {
    title: "Core CRM",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Contacts", href: "/contacts", icon: Users, badge: "2.4k", badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      { name: "Companies", href: "/companies", icon: Building2 },
      { name: "Leads", href: "/leads", icon: Target, badge: "Hot", badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
      { name: "Deals", href: "/deals", icon: DollarSign, badge: "$1.4M", badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Tasks", href: "/tasks", icon: CheckSquare, badge: "5", badgeColor: "bg-primary/10 text-primary border-primary/20" },
      { name: "Activities", href: "/activities", icon: Activity },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { name: "Segments", href: "/segments", icon: Layers },
      { name: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        "border-r border-border bg-card/95 backdrop-blur-xl flex flex-col h-screen sticky top-0 transition-all duration-300 z-30 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header & Workspace Selector */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-primary-foreground font-black text-sm shadow-md shadow-primary/25 border border-white/20 shrink-0">
            IC
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-extrabold text-foreground text-base tracking-tight block truncate">
                IC CRM
              </span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Enterprise
              </span>
            </div>
          )}
        </div>

        {/* Collapse / Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Grouped Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {group.title}
              </h3>
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  {/* Active Indicator Bar */}
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-foreground rounded-r-full" />
                  )}

                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.name}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground border-white/20"
                          : item.badgeColor || "bg-secondary text-muted-foreground border-border"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile & System Status Footer */}
      <div className="p-3 border-t border-border/80 bg-card/60">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/40 border border-border/60">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.firstName ? user.firstName.charAt(0) : "A"}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-foreground truncate">
                {user ? `${user.firstName} ${user.lastName}` : "Admin Operations"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email || "admin@iccrm.io"}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 mx-auto flex items-center justify-center font-bold text-xs">
            {user?.firstName ? user.firstName.charAt(0) : "A"}
          </div>
        )}
      </div>
    </aside>
  );
}
