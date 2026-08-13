"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LeadConvertModal } from "@/components/leads/lead-convert-modal";
import {
  Target,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { ActivityTimeline } from "@/components/timeline/activity-timeline";
import { EntityNotes } from "@/components/notes/entity-notes";

interface ConvertedCompany {
  id: string;
  name: string;
}

interface ConvertedContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ConvertedDeal {
  id: string;
  name: string;
  value: number;
}

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source: string;
  status: string;
  value: number;
  notes?: string | null;
  convertedAt?: string | null;
  convertedCompanyId?: string | null;
  convertedContactId?: string | null;
  convertedDealId?: string | null;
  convertedCompany?: ConvertedCompany | null;
  convertedContact?: ConvertedContact | null;
  convertedDeal?: ConvertedDeal | null;
  createdAt: string;
  updatedAt: string;
}

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const fetchLead = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/leads/${id}`);
      const data = await res.json();
      if (data.success && data.data?.lead) {
        setLead(data.data.lead);
      } else {
        setError(data.error || "Lead not found");
      }
    } catch {
      setError("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading lead details...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error || "Lead not found"}</span>
        </div>
      </div>
    );
  }

  const isConverted = lead.status === "CONVERTED" || Boolean(lead.convertedAt);
  const isLost = lead.status === "LOST";
  const isConvertible = !isConverted && !isLost;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "CONTACTED":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "QUALIFIED":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "CONVERTED":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "LOST":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Leads List
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-lg border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
            <span
              className={`px-3 py-1 rounded-md border text-xs font-bold ${getStatusBadge(
                lead.status,
              )}`}
            >
              {lead.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Source: {lead.source}</span>
            <span>•</span>
            <span>Created: {formatDate(lead.createdAt)}</span>
          </p>
        </div>

        {/* Action Convert Button */}
        <div className="flex flex-col items-end gap-1">
          {isConvertible && (
            <button
              onClick={() => setIsConvertModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Convert Lead
            </button>
          )}

          {isConverted && (
            <div className="space-y-1 text-right">
              <button
                disabled
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-lg text-sm cursor-not-allowed border border-border"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Convert Lead
              </button>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                This lead has already been converted.
              </p>
            </div>
          )}

          {isLost && (
            <div className="space-y-1 text-right">
              <button
                disabled
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-400 font-bold rounded-lg text-sm cursor-not-allowed"
              >
                Convert Lead
              </button>
              <p className="text-xs text-red-500 font-medium">
                Leads with status LOST cannot be converted.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Converted Summary Card (Shown when Converted) */}
      {isConverted && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-emerald-500/30 p-6 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold uppercase tracking-wider">
                Converted
              </h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              Converted: {formatDate(lead.convertedAt)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Clickable Company */}
            <div className="bg-card p-4 rounded-md border border-border space-y-1 hover:border-primary transition-colors">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" /> Company
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              {lead.convertedCompany ? (
                <Link
                  href="/companies"
                  className="font-bold text-foreground hover:text-primary transition-colors text-base block pt-1"
                >
                  {lead.convertedCompany.name}
                </Link>
              ) : (
                <span className="font-semibold text-foreground text-base block pt-1">
                  {lead.company || "N/A"}
                </span>
              )}
            </div>

            {/* Clickable Contact */}
            <div className="bg-card p-4 rounded-md border border-border space-y-1 hover:border-primary transition-colors">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" /> Contact
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              {lead.convertedContact ? (
                <Link
                  href="/contacts"
                  className="font-bold text-foreground hover:text-primary transition-colors text-base block pt-1"
                >
                  {lead.convertedContact.firstName}{" "}
                  {lead.convertedContact.lastName}
                </Link>
              ) : (
                <span className="font-semibold text-foreground text-base block pt-1">
                  {lead.name}
                </span>
              )}
            </div>

            {/* Clickable Deal */}
            <div className="bg-card p-4 rounded-md border border-border space-y-1 hover:border-primary transition-colors">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-primary" /> Deal
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              {lead.convertedDeal ? (
                <Link
                  href="/deals"
                  className="font-bold text-foreground hover:text-primary transition-colors text-base block pt-1"
                >
                  {lead.convertedDeal.name}
                </Link>
              ) : (
                <span className="text-muted-foreground text-sm block pt-1">
                  No deal created
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Contact Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Email
                </span>
                <span className="font-medium text-foreground">
                  {lead.email || "—"}
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
                  {lead.phone || "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Company
                </span>
                <span className="font-medium text-foreground">
                  {lead.company || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Valuation & Metrics */}
        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Lead Qualification
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Estimated Potential Value
                </span>
                <span className="font-bold text-foreground text-lg">
                  ${lead.value ? lead.value.toLocaleString() : "0"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Source
                </span>
                <span className="font-mono text-foreground font-semibold">
                  {lead.source}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Notes & Remarks
          </h3>
          <div className="text-sm text-foreground space-y-2">
            {lead.notes ? (
              <p className="whitespace-pre-wrap text-muted-foreground">
                {lead.notes}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                No notes available for this lead.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes System */}
      <EntityNotes
        entityType="lead"
        entityId={lead.id}
        entityName={lead.name}
      />

      {/* Activity Timeline */}
      <ActivityTimeline
        entityType="lead"
        entityId={lead.id}
        entityName={lead.name}
      />

      {/* Convert Modal */}
      <LeadConvertModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        lead={lead}
        onSuccess={() => {
          fetchLead();
        }}
      />
    </div>
  );
}
