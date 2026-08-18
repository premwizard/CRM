"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Shield,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Briefcase,
} from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "ADMIN",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await register(formData);
    setSubmitting(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to create organization account.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-grid-pattern opacity-50">
        <div className="absolute top-[20%] right-[25%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[130px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[25%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[140px] animate-pulse" />
      </div>

      <div className="w-full max-w-md bg-card/80 backdrop-blur-2xl border border-border/80 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/30 border border-white/20 group-hover:scale-105 transition-transform">
              IC
            </div>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Create Enterprise Account
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Set up your organization user profile to access IC CRM
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 text-xs bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                First Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Sarah"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-background/60 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Jenkins"
                required
                className="w-full px-3 py-2.5 bg-background/60 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="sarah@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background/60 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-background/60 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            <span>{submitting ? "Creating Profile..." : "Create Account"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
          Already registered?{" "}
          <Link
            href="/login"
            className="text-primary font-bold hover:underline"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
