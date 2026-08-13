"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ActivityTimeline } from "@/components/timeline/activity-timeline";
import { EntityNotes } from "@/components/notes/entity-notes";
import { EntityTasks } from "@/components/tasks/entity-tasks";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  FileText,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/companies/${id}`);
      const data = await res.json();
      if (data.success && data.data?.company) {
        setCompany(data.data.company);
      } else {
        setError(data.error || "Company not found");
      }
    } catch {
      setError("Failed to fetch company details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading company profile...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-4">
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error || "Company not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Companies Directory
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-card p-6 rounded-lg border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {company.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Industry: {company.industry || "General Corporate"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Contact Channels
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Email
                </span>
                <span className="font-medium text-foreground">
                  {company.email || "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Phone
                </span>
                <span className="font-medium text-foreground">
                  {company.phone || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Online & Location
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Website
                </span>
                <span className="font-medium text-foreground">
                  {company.website || "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Address
                </span>
                <span className="font-medium text-foreground">
                  {company.address || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Notes & Info
          </h3>
          <p className="text-xs text-muted-foreground">
            {company.notes || "No company notes recorded."}
          </p>
        </div>
      </div>

      {/* Notes System */}
      <EntityNotes
        entityType="company"
        entityId={company.id}
        entityName={company.name}
      />

      {/* Tasks System */}
      <EntityTasks
        entityType="company"
        entityId={company.id}
        entityName={company.name}
      />

      {/* Activity Timeline Component */}
      <ActivityTimeline
        entityType="company"
        entityId={company.id}
        entityName={company.name}
      />
    </div>
  );
}
