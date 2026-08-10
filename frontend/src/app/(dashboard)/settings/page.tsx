"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Settings, User, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "Admin");
  const [lastName, setLastName] = useState(user?.lastName || "User");
  const [email, setEmail] = useState(user?.email || "admin@iccrm.io");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSaving(true);

    try {
      const token = localStorage.getItem("ic_crm_token");
      const res = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        updateUser(data.data.user);
        setStatus({ type: "success", message: "Profile updated successfully" });
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to update profile",
        });
      }
    } catch {
      setSaving(false);
      setStatus({
        type: "error",
        message: "Network error while updating profile",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Profile"
        description="Manage your account profile, preferences, and organization settings."
        icon={Settings}
      />

      {status && (
        <div
          className={`p-4 rounded-md text-sm border flex items-center gap-2 ${
            status.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* User Profile Form */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg text-foreground">
            User Profile Settings
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm shadow-xs"
            >
              {saving ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
