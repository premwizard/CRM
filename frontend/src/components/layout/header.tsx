"use client";

import React from "react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { GlobalSearch } from "@/components/search/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Interactive Global Search */}
      <GlobalSearch />

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        <ThemeToggle />

        <div className="h-6 w-px bg-border my-auto mx-1" />

        {/* User Info & Logout Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 p-1 rounded-md">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-semibold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold leading-none text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : "Admin User"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {user?.email || "admin@iccrm.io"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
