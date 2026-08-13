"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import {
  Building2,
  UserCheck,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

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
}

interface CompanyOption {
  id: string;
  name: string;
}

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface LeadConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSuccess: () => void;
}

export function LeadConvertModal({
  isOpen,
  onClose,
  lead,
  onSuccess,
}: LeadConvertModalProps) {
  const [companyMode, setCompanyMode] = useState<"new" | "existing">("new");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [existingCompanies, setExistingCompanies] = useState<CompanyOption[]>(
    [],
  );

  const [newCompany, setNewCompany] = useState({
    name: "",
    industry: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [contactMode, setContactMode] = useState<"new" | "existing">("new");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [existingContacts, setExistingContacts] = useState<ContactOption[]>(
    [],
  );

  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    notes: "",
  });

  const [createDeal, setCreateDeal] = useState(true);
  const [dealData, setDealData] = useState({
    name: "",
    value: 0,
    stage: "QUALIFIED",
    expectedCloseDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(
    null,
  );
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);

  // Pre-fill fields whenever modal opens with a lead
  useEffect(() => {
    if (lead && isOpen) {
      setError(null);
      setDuplicateWarning(null);
      setSkipDuplicateCheck(false);

      // Pre-fill Company
      const compName = lead.company || `${lead.name}'s Company`;
      setNewCompany({
        name: compName,
        industry: "",
        website: "",
        email: lead.email || "",
        phone: lead.phone || "",
        address: "",
        notes: lead.notes || "",
      });

      // Pre-fill Contact (split name)
      const nameParts = lead.name.trim().split(" ");
      const firstName = nameParts[0] || lead.name;
      const lastName = nameParts.slice(1).join(" ") || "Contact";

      setNewContact({
        firstName,
        lastName,
        email: lead.email || "",
        phone: lead.phone || "",
        jobTitle: "Lead",
        notes: lead.notes || "",
      });

      // Pre-fill Deal
      setDealData({
        name: lead.company ? `${lead.company} Deal` : `${lead.name} Deal`,
        value: lead.value || 0,
        stage: "QUALIFIED",
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        notes: lead.notes || "",
      });

      // Fetch existing companies & contacts for dropdowns
      fetchCompaniesAndContacts();
    }
  }, [lead, isOpen]);

  const fetchCompaniesAndContacts = async () => {
    try {
      const [compRes, contRes] = await Promise.all([
        fetch("/api/v1/companies"),
        fetch("/api/v1/contacts"),
      ]);

      const compJson = await compRes.json();
      if (compJson.success) {
        setExistingCompanies(compJson.data?.companies || []);
      }

      const contJson = await contRes.json();
      if (contJson.success) {
        setExistingContacts(contJson.data?.contacts || []);
      }
    } catch {
      // Ignore background fetch errors
    }
  };

  if (!lead) return null;

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        companyMode,
        companyId: companyMode === "existing" ? selectedCompanyId : null,
        newCompany: companyMode === "new" ? newCompany : null,
        skipDuplicateCompanyCheck: skipDuplicateCheck,

        contactMode,
        contactId: contactMode === "existing" ? selectedContactId : null,
        newContact: contactMode === "new" ? newContact : null,

        createDeal,
        dealData: createDeal
          ? {
              ...dealData,
              value: Number(dealData.value) || 0,
            }
          : null,
      };

      const res = await fetch(`/api/v1/leads/${lead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.status === 409) {
        setDuplicateWarning(data.error);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to convert lead.");
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert Lead">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lead Overview Card */}
        <div className="bg-accent/40 p-4 rounded-lg border border-border space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
            Lead Overview
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Lead</span>
              <span className="font-semibold text-foreground">{lead.name}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Email</span>
              <span className="font-semibold text-foreground">
                {lead.email || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                Company
              </span>
              <span className="font-semibold text-foreground">
                {lead.company || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                Potential Value
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(lead.value || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-md text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Duplicate Company Warning Banner */}
        {duplicateWarning && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-md text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Duplicate Company Warning</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300">
              {duplicateWarning}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSkipDuplicateCheck(true);
                  setDuplicateWarning(null);
                }}
                className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700"
              >
                Create Duplicate Anyway
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompanyMode("existing");
                  setDuplicateWarning(null);
                }}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-xs font-medium hover:bg-accent"
              >
                Select Existing Company
              </button>
            </div>
          </div>
        )}

        {/* 1. Company Section */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                1. Company
              </h3>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCompanyMode("new")}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                  companyMode === "new"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:bg-accent"
                }`}
              >
                Create New
              </button>
              <button
                type="button"
                onClick={() => setCompanyMode("existing")}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                  companyMode === "existing"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:bg-accent"
                }`}
              >
                Select Existing
              </button>
            </div>
          </div>

          {companyMode === "new" ? (
            <div className="grid grid-cols-2 gap-3 bg-card p-3 rounded-md border border-border">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, name: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={newCompany.industry}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, industry: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={newCompany.website}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, website: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, email: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={newCompany.phone}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, phone: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="bg-card p-3 rounded-md border border-border">
              <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                Choose Existing Company *
              </label>
              <select
                required
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Select Company --</option>
                {existingCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 2. Contact Section */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                2. Contact
              </h3>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContactMode("new")}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                  contactMode === "new"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:bg-accent"
                }`}
              >
                Create New
              </button>
              <button
                type="button"
                onClick={() => setContactMode("existing")}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                  contactMode === "existing"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:bg-accent"
                }`}
              >
                Select Existing
              </button>
            </div>
          </div>

          {contactMode === "new" ? (
            <div className="grid grid-cols-2 gap-3 bg-card p-3 rounded-md border border-border">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={newContact.firstName}
                  onChange={(e) =>
                    setNewContact({ ...newContact, firstName: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={newContact.lastName}
                  onChange={(e) =>
                    setNewContact({ ...newContact, lastName: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={newContact.jobTitle}
                  onChange={(e) =>
                    setNewContact({ ...newContact, jobTitle: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="bg-card p-3 rounded-md border border-border">
              <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                Choose Existing Contact *
              </label>
              <select
                required
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Select Contact --</option>
                {existingContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 3. Deal Section */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                3. Opportunity Deal
              </h3>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={createDeal}
                onChange={(e) => setCreateDeal(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              Create Deal
            </label>
          </div>

          {createDeal && (
            <div className="grid grid-cols-2 gap-3 bg-card p-3 rounded-md border border-border">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Deal Name *
                </label>
                <input
                  type="text"
                  required
                  value={dealData.name}
                  onChange={(e) =>
                    setDealData({ ...dealData, name: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Value (₹ / $)
                </label>
                <input
                  type="number"
                  min="0"
                  value={dealData.value}
                  onChange={(e) =>
                    setDealData({
                      ...dealData,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Stage
                </label>
                <select
                  value={dealData.stage}
                  onChange={(e) =>
                    setDealData({ ...dealData, stage: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="NEW">NEW</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="PROPOSAL">PROPOSAL</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={dealData.expectedCloseDate}
                  onChange={(e) =>
                    setDealData({
                      ...dealData,
                      expectedCloseDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-sm transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? "Converting..." : "Complete Conversion"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
