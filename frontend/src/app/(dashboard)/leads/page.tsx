"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LeadConvertModal } from "@/components/leads/lead-convert-modal";
import {
  Target,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  DollarSign,
  CheckCircle2,
  Eye,
} from "lucide-react";

const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "CONVERTED"];
const LEAD_SOURCES = [
  "WEBSITE",
  "LINKEDIN",
  "REFERRAL",
  "EMAIL",
  "ADVERTISEMENT",
  "COLD_CALL",
  "OTHER",
];

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
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "WEBSITE",
    status: "NEW",
    value: 0,
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = `/api/v1/leads?search=${encodeURIComponent(search)}`;
      if (selectedStatus) {
        query += `&status=${selectedStatus}`;
      }
      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data.leads || []);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedStatus]);

  const handleOpenCreate = () => {
    setSelectedLead(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "WEBSITE",
      status: "NEW",
      value: 0,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source,
      status: lead.status,
      value: lead.value,
      notes: lead.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = selectedLead
        ? `/api/v1/leads/${selectedLead.id}`
        : "/api/v1/leads";
      const method = selectedLead ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value) || 0,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchLeads();
      }
    } catch {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/leads/${selectedLead.id}`, {
        method: "DELETE",
      });
      setSaving(false);
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedLead(null);
        fetchLeads();
      }
    } catch {
      setSaving(false);
    }
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
      <PageHeader
        title="Leads"
        description="Track prospective leads, lead scoring, and status qualification."
        actionText="Capture Lead"
        onAction={handleOpenCreate}
        icon={Target}
      />

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Lead Name</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Source</th>
                <th className="px-6 py-3.5">Estimated Value</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No leads found. Click "Capture Lead" to create a record.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isConvertible =
                    lead.status !== "CONVERTED" && lead.status !== "LOST";
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="hover:text-primary transition-colors flex items-center gap-1.5 group"
                        >
                          <span>{lead.name}</span>
                          <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-normal mt-0.5">
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-primary" />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-foreground">
                        {lead.company || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`px-2.5 py-1 rounded-md border font-semibold ${getStatusBadge(lead.status)}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {lead.source}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        ${lead.value ? lead.value.toLocaleString() : "0"}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {isConvertible ? (
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsConvertModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                            title="Convert Lead"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Convert
                          </button>
                        ) : lead.status === "CONVERTED" ? (
                          <Link
                            href={`/leads/${lead.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-md hover:bg-amber-500/20"
                          >
                            Converted
                          </Link>
                        ) : null}

                        <Link
                          href={`/leads/${lead.id}`}
                          className="p-1.5 inline-block rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLead ? "Edit Lead" : "Capture New Lead"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Lead Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Estimated Value ($)
              </label>
              <input
                type="number"
                min="0"
                value={formData.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Lead Source
              </label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LEAD_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Lead Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-sm hover:bg-primary/90 transition-colors shadow-xs"
            >
              {saving ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${selectedLead?.name}"?`}
        loading={saving}
      />

      {/* Lead Conversion Modal */}
      <LeadConvertModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        lead={selectedLead}
        onSuccess={() => {
          fetchLeads();
        }}
      />
    </div>
  );
}
