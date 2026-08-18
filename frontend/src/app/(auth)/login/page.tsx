"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to authenticate. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-grid-pattern opacity-50">
        <div className="absolute top-[20%] left-[25%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[130px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[25%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[140px] animate-pulse" />
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
              Sign In to IC CRM
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your enterprise credentials to access your sales workspace
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
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background/60 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-background/60 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            <span>{submitting ? "Authenticating..." : "Sign In to Workspace"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
          Don't have an enterprise account?{" "}
          <Link
            href="/register"
            className="text-primary font-bold hover:underline"
          >
            Register workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
