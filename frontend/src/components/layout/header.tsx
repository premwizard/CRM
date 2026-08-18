"use client";

import React from "react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { GlobalSearch } from "@/components/search/global-search";
import { NotificationBell } from "@/components/layout/notification-bell";
import { User, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = () => {
    if (!user) return "U";
    const firstInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : "";
    const lastInitial = user.lastName ? user.lastName.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}` || "U";
  };

  return (
    <header className="h-16 border-b border-border bg-card/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Interactive Global Search */}
      <GlobalSearch />

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        <ThemeToggle />

        <div className="h-6 w-px bg-border my-auto mx-1" />

        {/* Dynamic Authenticated User Info & Logout Button */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground border border-white/20 flex items-center justify-center font-extrabold text-xs shadow-md shadow-primary/20">
                {getInitials()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold leading-none text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                    {user.role || "ADMIN"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
