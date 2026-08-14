"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { BulkActionsBar } from "@/components/ui/bulk-actions-bar";
import { exportToCsv } from "@/lib/export-utils";
import {
  DataTablePagination,
  PaginationMeta,
} from "@/components/ui/data-table-pagination";
import {
  Users,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  UserCheck,
} from "lucide-react";

interface CompanyOption {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  owner?: string | null;
  notes?: string | null;
  tags?: { tag: { id: string; name: string; color?: string | null } }[];
  createdAt: string;
}

interface TagItem {
  id: string;
  name: string;
  color?: string | null;
}

function ContactsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const search = searchParams.get("search") || "";
  const selectedCompanyId = searchParams.get("companyId") || "";
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
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    companyId: "",
    owner: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

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

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (search) query.set("search", search);
      if (selectedCompanyId) query.set("companyId", selectedCompanyId);
      if (selectedTagId) query.set("tagId", selectedTagId);

      const res = await fetch(`/api/v1/contacts?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.data.contacts || []);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, search, selectedCompanyId, selectedTagId]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/v1/companies?pageSize=100");
      const data = await res.json();
      if (data.success) {
        setCompanies(data.data.companies || []);
      }
    } catch {
      // Fallback
    }
  };

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
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchCompanies();
    fetchTags();
  }, []);

  // Multi-Selection Logic
  const allSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Bulk Actions Handler
  const handleExecuteBulkAction = async (
    action: string,
    actionData?: Record<string, unknown>,
  ) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      if (action === "export") {
        const res = await fetch("/api/v1/bulk/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "export", ids: selectedIds }),
        });
        const data = await res.json();
        if (data.success && data.data?.contacts) {
          const exportRows = data.data.contacts.map((c: Contact) => ({
            ID: c.id,
            "First Name": c.firstName,
            "Last Name": c.lastName,
            Email: c.email,
            Phone: c.phone || "",
            "Job Title": c.jobTitle || "",
            Company: c.company?.name || "",
            Owner: c.owner || "",
            Tags: c.tags?.map((t) => t.tag.name).join("; ") || "",
            "Created At": c.createdAt,
          }));
          exportToCsv(`contacts_export_${new Date().toISOString().slice(0, 10)}.csv`, exportRows);
        }
      } else {
        const res = await fetch("/api/v1/bulk/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ids: selectedIds, data: actionData }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSelectedIds([]);
          fetchContacts();
          fetchTags();
        }
      }
    } catch {
      // Error handling
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSort = (field: string) => {
    const isSameField = sortBy === field;
    const nextOrder = isSameField && sortOrder === "asc" ? "desc" : "asc";
    updateUrlParams({ sortBy: field, sortOrder: nextOrder, page: 1 });
  };

  const handleOpenCreate = () => {
    setSelectedContact(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      companyId: "",
      owner: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || "",
      jobTitle: contact.jobTitle || "",
      companyId: contact.companyId || "",
      owner: contact.owner || "",
      notes: contact.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = selectedContact
        ? `/api/v1/contacts/${selectedContact.id}`
        : "/api/v1/contacts";
      const method = selectedContact ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId: formData.companyId || null,
          owner: formData.owner || null,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchContacts();
      }
    } catch {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContact) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/contacts/${selectedContact.id}`, {
        method: "DELETE",
      });
      setSaving(false);
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedContact(null);
        fetchContacts();
      }
    } catch {
      setSaving(false);
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
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Contacts Directory"
        description="Manage customer profiles, direct contacts, and company relationships."
        actionText="Add Contact"
        onAction={handleOpenCreate}
        icon={Users}
      />

      {/* Toolbar & Filter Panel */}
      <div className="bg-card p-4 rounded-lg border border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts by name, email, or job title..."
              value={search}
              onChange={(e) => updateUrlParams({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Company Filter */}
          <select
            value={selectedCompanyId}
            onChange={(e) => updateUrlParams({ companyId: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Companies</option>
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
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

      {/* Contacts Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                </th>
                <th
                  onClick={() => handleSort("firstName")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Contact Name {getSortIcon("firstName")}
                </th>
                <th
                  onClick={() => handleSort("email")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Email & Phone {getSortIcon("email")}
                </th>
                <th className="px-6 py-3.5">Job Title</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Owner</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground animate-pulse"
                  >
                    Loading contacts database...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-muted-foreground space-y-1"
                  >
                    <Users className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
                    <p className="font-semibold text-foreground text-sm">
                      No contacts match current filters
                    </p>
                    <p className="text-xs">
                      Try clearing search parameters or create a new contact.
                    </p>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  return (
                    <tr
                      key={contact.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-accent/40"
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(contact.id)}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="hover:text-primary transition-colors flex items-center gap-1.5 group"
                        >
                          <span>
                            {contact.firstName} {contact.lastName}
                          </span>
                          <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                        </Link>

                        {/* Tag Pills */}
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {contact.tags.map((t) => (
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
                      <td className="px-6 py-4 text-xs font-normal text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-foreground">
                        {contact.jobTitle || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-foreground">
                        {contact.company ? (
                          <Link
                            href={`/companies/${contact.company.id}`}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            {contact.company.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground font-normal">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-foreground">
                        {contact.owner ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold text-[11px]">
                            <UserCheck className="w-3 h-3 text-primary" />
                            {contact.owner}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-normal">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="p-1.5 inline-block rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(contact)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                          title="Delete Contact"
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

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        entityType="contacts"
        tags={tags}
        onClearSelection={() => setSelectedIds([])}
        onExecuteAction={handleExecuteBulkAction}
        loading={bulkLoading}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedContact ? "Edit Contact" : "Add New Contact"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Phone Number
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
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Company Account
              </label>
              <select
                value={formData.companyId}
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Independent / None --</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Owner Name
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul, Arun, Priya"
              value={formData.owner}
              onChange={(e) =>
                setFormData({ ...formData, owner: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
              {saving ? "Saving..." : "Save Contact"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete contact "${selectedContact?.firstName} ${selectedContact?.lastName}"?`}
        loading={saving}
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading contacts...</div>}>
      <ContactsContent />
    </Suspense>
  );
}
