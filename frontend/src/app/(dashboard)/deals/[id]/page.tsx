"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ActivityTimeline } from "@/components/timeline/activity-timeline";
import { EntityNotes } from "@/components/notes/entity-notes";
import { EntityTasks } from "@/components/tasks/entity-tasks";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  Building2,
  User,
  AlertCircle,
  Tag,
} from "lucide-react";

interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  expectedCloseDate?: string | null;
  company?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  notes?: string | null;
  createdAt: string;
}

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/deals/${id}`);
      const data = await res.json();
      if (data.success && data.data?.deal) {
        setDeal(data.data.deal);
      } else {
        setError(data.error || "Deal not found");
      }
    } catch {
      setError("Failed to fetch deal details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading deal opportunity details...
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="space-y-4">
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deals
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error || "Deal not found"}</span>
        </div>
      </div>
    );
  }

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "NEW":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "QUALIFIED":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "PROPOSAL":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "NEGOTIATION":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "WON":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "LOST":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Deals Pipeline
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-card p-6 rounded-lg border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {deal.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-md border text-xs font-bold ${getStageBadge(
                  deal.stage,
                )}`}
              >
                {deal.stage}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pipeline Stage Valuation: ${deal.value ? deal.value.toLocaleString() : "0"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Deal Valuation & Stage
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Amount / Value
                </span>
                <span className="font-bold text-foreground text-lg">
                  ${deal.value ? deal.value.toLocaleString() : "0"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Expected Close Date
                </span>
                <span className="font-medium text-foreground">
                  {deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate).toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" },
                      )
                    : "Not set"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Associated Stakeholders
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Company Account
                </span>
                <span className="font-semibold text-foreground">
                  {deal.company?.name || "Unassigned"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Primary Contact
                </span>
                <span className="font-semibold text-foreground">
                  {deal.contact
                    ? `${deal.contact.firstName} ${deal.contact.lastName}`
                    : "Unassigned"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Notes
          </h3>
          <p className="text-xs text-muted-foreground">
            {deal.notes || "No notes recorded for this deal."}
          </p>
        </div>
      </div>

      {/* Notes System */}
      <EntityNotes
        entityType="deal"
        entityId={deal.id}
        entityName={deal.name}
      />

      {/* Tasks System */}
      <EntityTasks
        entityType="deal"
        entityId={deal.id}
        entityName={deal.name}
      />

      {/* Activity Timeline Component */}
      <ActivityTimeline
        entityType="deal"
        entityId={deal.id}
        entityName={deal.name}
      />
    </div>
  );
}
