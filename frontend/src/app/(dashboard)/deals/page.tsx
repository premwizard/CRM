"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DealKanbanBoard } from "@/components/deals/deal-kanban-board";
import { SalesForecastAnalytics } from "@/components/deals/sales-forecast-analytics";
import {
  DollarSign,
  Search,
  Edit2,
  Trash2,
  Building2,
  User,
  Calendar,
  Eye,
  LayoutGrid,
  List as ListIcon,
  Percent,
  TrendingUp,
  BarChart3,
} from "lucide-react";

const DEAL_STAGES = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const FORECAST_CATEGORIES = ["OPEN", "COMMIT", "BEST_CASE", "CLOSED"];

interface CompanyOption {
  id: string;
  name: string;
}

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability?: number | null;
  forecastCategory?: string | null;
  owner?: string | null;
  expectedCloseDate?: string | null;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  contactId?: string | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  notes?: string | null;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list" | "analytics">("board");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    companyId: "",
    contactId: "",
    value: 0,
    stage: "NEW",
    probability: 50,
    forecastCategory: "OPEN",
    owner: "",
    expectedCloseDate: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      let query = `/api/v1/deals?search=${encodeURIComponent(search)}`;
      if (selectedStage) {
        query += `&stage=${selectedStage}`;
      }
      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setDeals(data.data.deals || []);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [compRes, contRes] = await Promise.all([
        fetch("/api/v1/companies"),
        fetch("/api/v1/contacts"),
      ]);

      const compData = await compRes.json();
      const contData = await contRes.json();

      if (compData.success) {
        setCompanies(compData.data.companies || []);
      }
      if (contData.success) {
        setContacts(contData.data.contacts || []);
      }
    } catch {
      // Error handling
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeals();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedStage]);

  const handleOpenCreate = (defaultStage: string = "NEW") => {
    setSelectedDeal(null);
    setFormData({
      name: "",
      companyId: "",
      contactId: "",
      value: 0,
      stage: defaultStage,
      probability: defaultStage === "WON" ? 100 : defaultStage === "LOST" ? 0 : 50,
      forecastCategory: defaultStage === "WON" || defaultStage === "LOST" ? "CLOSED" : "OPEN",
      owner: "",
      expectedCloseDate: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (deal: Deal) => {
    setSelectedDeal(deal);
    setFormData({
      name: deal.name,
      companyId: deal.companyId || "",
      contactId: deal.contactId || "",
      value: deal.value || 0,
      stage: deal.stage,
      probability: deal.probability ?? 50,
      forecastCategory: deal.forecastCategory || "OPEN",
      owner: deal.owner || "",
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
        : "",
      notes: deal.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = selectedDeal
        ? `/api/v1/deals/${selectedDeal.id}`
        : "/api/v1/deals";
      const method = selectedDeal ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchDeals();
      }
    } catch {
      setSaving(false);
    }
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)),
    );

    try {
      const res = await fetch(`/api/v1/deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        fetchDeals();
      } else {
        fetchDeals();
      }
    } catch {
      fetchDeals();
    }
  };

  const handleDelete = async () => {
    if (!selectedDeal) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/v1/deals/${selectedDeal.id}`, {
        method: "DELETE",
      });
      setSaving(false);
      if (res.ok) {
        setIsDeleteModalOpen(false);
        fetchDeals();
      }
    } catch {
      setSaving(false);
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "NEW":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "QUALIFIED":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "PROPOSAL":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "NEGOTIATION":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
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
      <PageHeader
        title="Deals & Sales Pipeline Forecast"
        description="Track revenue opportunities, probability-weighted pipeline, forecast categories, and Kanban board stages."
        actionText="New Deal"
        onAction={() => handleOpenCreate("NEW")}
      />

      {/* Control & Filter Bar */}
      <div className="bg-card p-4 rounded-lg border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center bg-muted p-1 rounded-md border border-border">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewMode === "board"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
              Forecast Matrix
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Stages</option>
            {DEAL_STAGES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View: Board | List | Analytics */}
      {viewMode === "board" ? (
        <DealKanbanBoard
          deals={deals}
          onStageChange={handleStageChange}
          onEditDeal={handleOpenEdit}
          onDeleteDeal={(deal) => {
            setSelectedDeal(deal);
            setIsDeleteModalOpen(true);
          }}
          onCreateDealInStage={(stage) => handleOpenCreate(stage)}
        />
      ) : viewMode === "analytics" ? (
        <SalesForecastAnalytics />
      ) : (
        /* Deals Table List View */
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Deal Name</th>
                  <th className="px-6 py-3.5">Gross Value</th>
                  <th className="px-6 py-3.5">Weighted Value</th>
                  <th className="px-6 py-3.5">Stage</th>
                  <th className="px-6 py-3.5">Forecast Category</th>
                  <th className="px-6 py-3.5">Company & Contact</th>
                  <th className="px-6 py-3.5">Expected Close</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      Loading deals...
                    </td>
                  </tr>
                ) : deals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No deals found. Click "New Deal" to open a pipeline
                      opportunity.
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => {
                    const prob = deal.probability ?? 50;
                    const weighted = (deal.value || 0) * (prob / 100);

                    return (
                      <tr
                        key={deal.id}
                        className="hover:bg-accent/40 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-foreground">
                          <Link
                            href={`/deals/${deal.id}`}
                            className="hover:text-primary transition-colors flex items-center gap-1.5 group"
                          >
                            <span>{deal.name}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-bold text-foreground">
                          ${deal.value ? deal.value.toLocaleString() : "0"}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-amber-700 bg-amber-500/5">
                          ${weighted.toLocaleString()} ({prob}%)
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span
                            className={`px-2.5 py-1 rounded-md border font-semibold ${getStageBadge(
                              deal.stage,
                            )}`}
                          >
                            {deal.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="px-2 py-0.5 rounded border bg-secondary font-bold text-secondary-foreground">
                            {deal.forecastCategory || "OPEN"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs space-y-1">
                          {deal.company && (
                            <div className="flex items-center gap-1.5 text-primary font-medium">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{deal.company.name}</span>
                            </div>
                          )}
                          {deal.contact && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <User className="w-3.5 h-3.5" />
                              <span>
                                {deal.contact.firstName} {deal.contact.lastName}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {deal.expectedCloseDate ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {new Date(
                                  deal.expectedCloseDate,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(deal)}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                            title="Edit Deal"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDeal(deal);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                            title="Delete Deal"
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
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDeal ? "Edit Deal" : "Open New Deal"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Deal Name *
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
                Deal Value ($) *
              </label>
              <input
                type="number"
                min="0"
                required
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
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Pipeline Stage *
              </label>
              <select
                value={formData.stage}
                onChange={(e) =>
                  setFormData({ ...formData, stage: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DEAL_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    probability: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Forecast Category
              </label>
              <select
                value={formData.forecastCategory}
                onChange={(e) =>
                  setFormData({ ...formData, forecastCategory: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {FORECAST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Company
              </label>
              <select
                value={formData.companyId}
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- No Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Contact
              </label>
              <select
                value={formData.contactId}
                onChange={(e) =>
                  setFormData({ ...formData, contactId: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- No Contact --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedCloseDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Owner / Sales Rep
              </label>
              <input
                type="text"
                placeholder="Owner name"
                value={formData.owner}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
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
              {saving ? "Saving..." : "Save Deal"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Deal"
        message={`Are you sure you want to delete deal "${selectedDeal?.name}"?`}
        loading={saving}
      />
    </div>
  );
}
