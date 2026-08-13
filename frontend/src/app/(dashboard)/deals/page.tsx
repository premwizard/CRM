"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DealKanbanBoard } from "@/components/deals/deal-kanban-board";
import { SalesForecastAnalytics } from "@/components/deals/sales-forecast-analytics";
import {
  DataTablePagination,
  PaginationMeta,
} from "@/components/ui/data-table-pagination";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
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
  tags?: { tag: { id: string; name: string; color?: string | null } }[];
  createdAt: string;
}

interface TagItem {
  id: string;
  name: string;
}

function DealsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"board" | "list" | "analytics">(
    "board",
  );
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const selectedStage = searchParams.get("stage") || "";
  const selectedForecastCategory = searchParams.get("forecastCategory") || "";
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

  // Modal state
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

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: viewMode === "list" ? String(page) : "1",
        pageSize: viewMode === "list" ? String(pageSize) : "100",
        sortBy,
        sortOrder,
      });
      if (search) query.set("search", search);
      if (selectedStage) query.set("stage", selectedStage);
      if (selectedForecastCategory)
        query.set("forecastCategory", selectedForecastCategory);
      if (selectedTagId) query.set("tagId", selectedTagId);

      const res = await fetch(`/api/v1/deals?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDeals(data.data.deals || []);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [
    viewMode,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search,
    selectedStage,
    selectedForecastCategory,
    selectedTagId,
  ]);

  const fetchCompaniesAndContacts = async () => {
    try {
      const [compRes, contRes, tagRes] = await Promise.all([
        fetch("/api/v1/companies?pageSize=100"),
        fetch("/api/v1/contacts?pageSize=100"),
        fetch("/api/v1/tags"),
      ]);
      const compData = await compRes.json();
      const contData = await contRes.json();
      const tagData = await tagRes.json();

      if (compData.success) setCompanies(compData.data.companies || []);
      if (contData.success) setContacts(contData.data.contacts || []);
      if (tagData.success) setTags(tagData.data.tags || []);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    fetchCompaniesAndContacts();
  }, []);

  const handleSort = (field: string) => {
    const isSameField = sortBy === field;
    const nextOrder = isSameField && sortOrder === "asc" ? "desc" : "asc";
    updateUrlParams({ sortBy: field, sortOrder: nextOrder, page: 1 });
  };

  const handleOpenCreate = (stage: string = "NEW") => {
    setSelectedDeal(null);
    setFormData({
      name: "",
      companyId: "",
      contactId: "",
      value: 0,
      stage,
      probability: 50,
      forecastCategory: "OPEN",
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
      value: deal.value,
      stage: deal.stage,
      probability: deal.probability ?? 50,
      forecastCategory: deal.forecastCategory || "OPEN",
      owner: deal.owner || "",
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
        : "",
      notes: "",
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
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value) || 0,
          probability: Number(formData.probability) || 0,
          companyId: formData.companyId || null,
          contactId: formData.contactId || null,
        }),
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
        setSelectedDeal(null);
        fetchDeals();
      }
    } catch {
      setSaving(false);
    }
  };

  const totalPipelineValue = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const totalWeightedValue = deals.reduce(
    (acc, d) => acc + (d.value || 0) * ((d.probability ?? 50) / 100),
    0,
  );

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

  const getSortIcon = (field: string) => {
    if (sortBy !== field)
      return (
        <ArrowUpDown className="w-3 h-3 text-muted-foreground opacity-50 ml-1 inline" />
      );
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-primary ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary ml-1 inline" />
    );
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
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
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
              onChange={(e) => updateUrlParams({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => updateUrlParams({ stage: e.target.value, page: 1 })}
            className="px-3 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Stages</option>
            {DEAL_STAGES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          {tags.length > 0 && (
            <select
              value={selectedTagId}
              onChange={(e) => updateUrlParams({ tagId: e.target.value, page: 1 })}
              className="px-3 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Total Pipeline & Weighted Summary Badge */}
        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span>Gross: ${totalPipelineValue.toLocaleString()}</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Weighted: ${totalWeightedValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === "analytics" ? (
        <SalesForecastAnalytics />
      ) : viewMode === "board" ? (
        <DealKanbanBoard
          deals={deals}
          onStageChange={async (dealId, newStage) => {
            await fetch(`/api/v1/deals/${dealId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stage: newStage }),
            });
            fetchDeals();
          }}
          onEditDeal={(deal) => handleOpenEdit(deal as any)}
          onDeleteDeal={(deal) => {
            setSelectedDeal(deal as any);
            setIsDeleteModalOpen(true);
          }}
          onCreateDealInStage={handleOpenCreate}
        />
      ) : (
        /* Table View */
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase text-[11px] tracking-wider">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                  >
                    Deal Name {getSortIcon("name")}
                  </th>
                  <th
                    onClick={() => handleSort("value")}
                    className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                  >
                    Deal Value {getSortIcon("value")}
                  </th>
                  <th
                    onClick={() => handleSort("probability")}
                    className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                  >
                    Weighted Pipeline {getSortIcon("probability")}
                  </th>
                  <th
                    onClick={() => handleSort("stage")}
                    className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                  >
                    Stage {getSortIcon("stage")}
                  </th>
                  <th className="px-6 py-3.5">Forecast Category</th>
                  <th className="px-6 py-3.5">Related Entity</th>
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
                      Loading deals database...
                    </td>
                  </tr>
                ) : deals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-muted-foreground space-y-1"
                    >
                      <DollarSign className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
                      <p className="font-semibold text-foreground text-sm">
                        No deals match current filters
                      </p>
                      <p className="text-xs">
                        Try clearing search parameters or create a new deal.
                      </p>
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
                          {deal.owner && (
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">
                              Owner: {deal.owner}
                            </p>
                          )}

                          {/* Tag Pills */}
                          {deal.tags && deal.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {deal.tags.map((t) => (
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
                        <td className="px-6 py-4 font-bold text-foreground">
                          ${deal.value ? deal.value.toLocaleString() : "0"}
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-600">
                          ${weighted.toLocaleString()} ({prob}%)
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span
                            className={`px-2.5 py-1 rounded-md border font-semibold ${getStageBadge(deal.stage)}`}
                          >
                            {deal.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded font-bold uppercase text-[10px]">
                            {deal.forecastCategory || "OPEN"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {deal.company ? (
                            <Link
                              href={`/companies/${deal.company.id}`}
                              className="font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              {deal.company.name}
                            </Link>
                          ) : deal.contact ? (
                            <Link
                              href={`/contacts/${deal.contact.id}`}
                              className="font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              <User className="w-3.5 h-3.5" />
                              {deal.contact.firstName} {deal.contact.lastName}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1">
                          <Link
                            href={`/deals/${deal.id}`}
                            className="p-1.5 inline-block rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
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

          {/* Server-Side Pagination Bar */}
          <DataTablePagination
            pagination={pagination}
            onPageChange={(newPage) => updateUrlParams({ page: newPage })}
            onPageSizeChange={(newPageSize) =>
              updateUrlParams({ pageSize: newPageSize, page: 1 })
            }
          />
        </div>
      )}

      {/* Create / Edit Deal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDeal ? "Edit Deal" : "Create New Deal"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Deal Title / Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise License Expansion"
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
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Pipeline Stage
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
                Win Probability (%)
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
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Forecast Category
              </label>
              <select
                value={formData.forecastCategory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    forecastCategory: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
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
                Company Account
              </label>
              <select
                value={formData.companyId}
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Select Company --</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Primary Contact
              </label>
              <select
                value={formData.contactId}
                onChange={(e) =>
                  setFormData({ ...formData, contactId: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Select Contact --</option>
                {contacts.map((cont) => (
                  <option key={cont.id} value={cont.id}>
                    {cont.firstName} {cont.lastName}
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
                  setFormData({
                    ...formData,
                    expectedCloseDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Deal Owner
              </label>
              <input
                type="text"
                placeholder="e.g. Prem"
                value={formData.owner}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading deals...</div>}>
      <DealsContent />
    </Suspense>
  );
}
