"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ActivityTimeline } from "@/components/timeline/activity-timeline";
import { EntityNotes } from "@/components/notes/entity-notes";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  AlertCircle,
  User,
} from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  notes?: string | null;
  createdAt: string;
}

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContact = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/contacts/${id}`);
      const data = await res.json();
      if (data.success && data.data?.contact) {
        setContact(data.data.contact);
      } else {
        setError(data.error || "Contact not found");
      }
    } catch {
      setError("Failed to fetch contact details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading contact details...
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="space-y-4">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error || "Contact not found"}</span>
        </div>
      </div>
    );
  }

  const fullName = `${contact.firstName} ${contact.lastName}`;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Contacts Directory
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-card p-6 rounded-lg border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
            {contact.firstName[0]}
            {contact.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{contact.jobTitle || "Contact"}</span>
              {contact.company && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-foreground">
                    {contact.company.name}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Direct Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Email
                </span>
                <span className="font-medium text-foreground">
                  {contact.email}
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
                  {contact.phone || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-lg border border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Company Association
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">
                  Account Name
                </span>
                <span className="font-semibold text-foreground">
                  {contact.company?.name || "Independent / Unassigned"}
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
            {contact.notes || "No additional notes provided for this contact."}
          </p>
        </div>
      </div>

      {/* Notes System */}
      <EntityNotes
        entityType="contact"
        entityId={contact.id}
        entityName={fullName}
      />

      {/* Activity Timeline Component */}
      <ActivityTimeline
        entityType="contact"
        entityId={contact.id}
        entityName={fullName}
      />
    </div>
  );
}
