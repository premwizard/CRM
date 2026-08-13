"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LeadConvertModal } from "@/components/leads/lead-convert-modal";
import {
  DataTablePagination,
  PaginationMeta,
} from "@/components/ui/data-table-pagination";
import {
  Target,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
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
  tags?: { tag: { id: string; name: string; color?: string | null } }[];
  createdAt: string;
}

interface TagItem {
  id: string;
  name: string;
}

function LeadsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State initialized from URL search params
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const selectedStatus = searchParams.get("status") || "";
  const selectedSource = searchParams.get("source") || "";
  const selectedTagId = searchParams.get("tagId") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [pagination, setPagination] = useState<PaginationMeta>({
    page,
    pageSize,
    totalItems: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });

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

  // Helper to update URL params
  const updateUrlParams = useCallback(
    (newParams: Record<string, string | number | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === null || val === "" || val === undefined) {
          current.delete(key);
        } else {
          current.set(key, String(val));
        }
      });
      router.push(`${pathname}?${current.toString()}`);
    },
    [searchParams, pathname, router],
  );

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (search) query.set("search", search);
      if (selectedStatus) query.set("status", selectedStatus);
      if (selectedSource) query.set("source", selectedSource);
      if (selectedTagId) query.set("tagId", selectedTagId);

      const res = await fetch(`/api/v1/leads?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data.leads || []);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, search, selectedStatus, selectedSource, selectedTagId]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/v1/tags");
      const data = await res.json();
      if (data.success) {
        setTags(data.data.tags || []);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSort = (field: string) => {
    const isSameField = sortBy === field;
    const nextOrder = isSameField && sortOrder === "asc" ? "desc" : "asc";
    updateUrlParams({ sortBy: field, sortOrder: nextOrder, page: 1 });
  };

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

  const getSortIcon = (field: string) => {
    if (sortBy !== field)
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground opacity-50 ml-1 inline" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-primary ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary ml-1 inline" />
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads Directory"
        description="Track prospective leads, lead scoring, and status qualification with advanced filters."
        actionText="Capture Lead"
        onAction={handleOpenCreate}
        icon={Target}
      />

      {/* Toolbar & Filter Panel */}
      <div className="bg-card p-4 rounded-lg border border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads by name, email, or company..."
              value={search}
              onChange={(e) => updateUrlParams({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => updateUrlParams({ status: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => updateUrlParams({ source: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Lead Sources</option>
            {LEAD_SOURCES.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Filter Row: Tag Filter */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-semibold">Filter by Tag:</span>
            <select
              value={selectedTagId}
              onChange={(e) => updateUrlParams({ tagId: e.target.value, page: 1 })}
              className="px-2.5 py-1 text-xs bg-background border border-input rounded-md focus:ring-1 focus:ring-primary"
            >
              <option value="">-- All Tags --</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase text-[11px] tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Lead Name {getSortIcon("name")}
                </th>
                <th className="px-6 py-3.5">Company</th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Status {getSortIcon("status")}
                </th>
                <th
                  onClick={() => handleSort("source")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Source {getSortIcon("source")}
                </th>
                <th
                  onClick={() => handleSort("value")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Estimated Value {getSortIcon("value")}
                </th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground animate-pulse"
                  >
                    Loading leads database...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground space-y-1"
                  >
                    <Target className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
                    <p className="font-semibold text-foreground text-sm">
                      No leads match current filters
                    </p>
                    <p className="text-xs">
                      Try clearing search parameters or capture a new lead.
                    </p>
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

                        {/* Tag Pills */}
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {lead.tags.map((t) => (
                              <span
                                key={t.tag.id}
                                style={{
                                  backgroundColor: `${t.tag.color || "#3B82F6"}15`,
                                  color: t.tag.color || "#3B82F6",
                                  borderColor: `${t.tag.color || "#3B82F6"}30`,
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold border rounded-full"
                              >
                                {t.tag.name}
                              </span>
                            ))}
                          </div>
                        )}
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

        {/* Server-Side Pagination Bar */}
        <DataTablePagination
          pagination={pagination}
          onPageChange={(newPage) => updateUrlParams({ page: newPage })}
          onPageSizeChange={(newPageSize) =>
            updateUrlParams({ pageSize: newPageSize, page: 1 })
          }
        />
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

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading leads...</div>}>
      <LeadsContent />
    </Suspense>
  );
}
