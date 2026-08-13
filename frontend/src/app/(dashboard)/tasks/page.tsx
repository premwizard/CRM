"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  DataTablePagination,
  PaginationMeta,
} from "@/components/ui/data-table-pagination";
import {
  CheckSquare,
  Search,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Building2,
  UserCheck,
  Target,
  Briefcase,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: string;
  status: string;
  assignedTo?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  contact?: { id: string; firstName: string; lastName: string; email: string } | null;
  company?: { id: string; name: string } | null;
  lead?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
  createdAt: string;
}

interface EntityOption {
  id: string;
  name: string;
}

function TasksContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const selectedStatus = searchParams.get("status") || "";
  const selectedPriority = searchParams.get("priority") || "";
  const isOverdueFilter = searchParams.get("overdue") === "true";
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

  // Entity dropdown options
  const [contacts, setContacts] = useState<EntityOption[]>([]);
  const [companies, setCompanies] = useState<EntityOption[]>([]);
  const [leads, setLeads] = useState<EntityOption[]>([]);
  const [deals, setDeals] = useState<EntityOption[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Form State
  const [relationType, setRelationType] = useState<
    "none" | "contact" | "company" | "lead" | "deal"
  >("none");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    status: "TODO",
    assignedTo: "",
    contactId: "",
    companyId: "",
    leadId: "",
    dealId: "",
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

  const fetchTasks = useCallback(async () => {
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
      if (selectedPriority) query.set("priority", selectedPriority);
      if (isOverdueFilter) query.set("overdue", "true");

      const res = await fetch(`/api/v1/tasks?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.tasks || []);
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
    page,
    pageSize,
    sortBy,
    sortOrder,
    search,
    selectedStatus,
    selectedPriority,
    isOverdueFilter,
  ]);

  const fetchEntities = async () => {
    try {
      const [contRes, compRes, leadRes, dealRes] = await Promise.all([
        fetch("/api/v1/contacts?pageSize=100"),
        fetch("/api/v1/companies?pageSize=100"),
        fetch("/api/v1/leads?pageSize=100"),
        fetch("/api/v1/deals?pageSize=100"),
      ]);

      const contData = await contRes.json();
      const compData = await compRes.json();
      const leadData = await leadRes.json();
      const dealData = await dealRes.json();

      if (contData.success) {
        setContacts(
          (contData.data.contacts || []).map((c: any) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
          })),
        );
      }
      if (compData.success) {
        setCompanies(
          (compData.data.companies || []).map((c: any) => ({
            id: c.id,
            name: c.name,
          })),
        );
      }
      if (leadData.success) {
        setLeads(
          (leadData.data.leads || []).map((l: any) => ({
            id: l.id,
            name: l.name,
          })),
        );
      }
      if (dealData.success) {
        setDeals(
          (dealData.data.deals || []).map((d: any) => ({
            id: d.id,
            name: d.name,
          })),
        );
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchEntities();
  }, []);

  const handleSort = (field: string) => {
    const isSameField = sortBy === field;
    const nextOrder = isSameField && sortOrder === "asc" ? "desc" : "asc";
    updateUrlParams({ sortBy: field, sortOrder: nextOrder, page: 1 });
  };

  const handleOpenCreate = () => {
    setSelectedTask(null);
    setRelationType("none");
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      status: "TODO",
      assignedTo: "",
      contactId: "",
      companyId: "",
      leadId: "",
      dealId: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setSelectedTask(task);

    let rel: "none" | "contact" | "company" | "lead" | "deal" = "none";
    if (task.contactId) rel = "contact";
    else if (task.companyId) rel = "company";
    else if (task.leadId) rel = "lead";
    else if (task.dealId) rel = "deal";
    setRelationType(rel);

    setFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo || "",
      contactId: task.contactId || "",
      companyId: task.companyId || "",
      leadId: task.leadId || "",
      dealId: task.dealId || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = selectedTask
        ? `/api/v1/tasks/${selectedTask.id}`
        : "/api/v1/tasks";
      const method = selectedTask ? "PUT" : "POST";

      const payload = {
        title: formData.title,
        description: formData.description || null,
        dueDate: formData.dueDate || null,
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo || null,
        contactId: relationType === "contact" ? formData.contactId : null,
        companyId: relationType === "company" ? formData.companyId : null,
        leadId: relationType === "lead" ? formData.leadId : null,
        dealId: relationType === "deal" ? formData.dealId : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchTasks();
      }
    } catch {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });
      setSaving(false);
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedTask(null);
        fetchTasks();
      }
    } catch {
      setSaving(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "HIGH":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold";
      case "MEDIUM":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "CANCELLED":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20 line-through";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  const checkIsOverdue = (task: TaskItem) => {
    if (!task.dueDate) return false;
    if (task.status === "COMPLETED" || task.status === "CANCELLED")
      return false;
    return new Date(task.dueDate) < new Date();
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
        title="CRM Action Tasks"
        description="Schedule to-do items, track customer follow-up actions, and monitor overdue deadlines."
        actionText="Create Task"
        onAction={handleOpenCreate}
        icon={CheckSquare}
      />

      {/* Toolbar & Filter Panel */}
      <div className="bg-card p-4 rounded-lg border border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
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
            <option value="">All Task Statuses</option>
            {TASK_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => updateUrlParams({ priority: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary Filter Row: Overdue Toggle */}
        <div className="flex items-center gap-3 pt-1 border-t border-border/50 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <button
            onClick={() =>
              updateUrlParams({ overdue: isOverdueFilter ? null : "true", page: 1 })
            }
            className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-colors ${
              isOverdueFilter
                ? "bg-red-500/10 text-red-600 border-red-500/30"
                : "bg-secondary text-secondary-foreground hover:bg-accent border-border"
            }`}
          >
            {isOverdueFilter ? "🚨 Showing Overdue Only" : "Filter Overdue Tasks"}
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase text-[11px] tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort("title")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Task Title {getSortIcon("title")}
                </th>
                <th
                  onClick={() => handleSort("dueDate")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Due Date {getSortIcon("dueDate")}
                </th>
                <th
                  onClick={() => handleSort("priority")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Priority {getSortIcon("priority")}
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-6 py-3.5 cursor-pointer hover:bg-accent/50 select-none"
                >
                  Status {getSortIcon("status")}
                </th>
                <th className="px-6 py-3.5">Related Entity</th>
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
                    Loading action tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground space-y-1"
                  >
                    <CheckSquare className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
                    <p className="font-semibold text-foreground text-sm">
                      No tasks match current filters
                    </p>
                    <p className="text-xs">
                      Try clearing search parameters or create a new task.
                    </p>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const isOverdue = checkIsOverdue(task);
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{task.title}</span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-extrabold uppercase rounded animate-pulse">
                              Overdue
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground font-normal line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-foreground">
                        {task.dueDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              className={`w-3.5 h-3.5 ${
                                isOverdue ? "text-red-500" : "text-primary"
                              }`}
                            />
                            <span
                              className={
                                isOverdue ? "text-red-600 font-bold" : ""
                              }
                            >
                              {new Date(task.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getPriorityBadgeClass(
                            task.priority,
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getStatusBadgeClass(
                            task.status,
                          )}`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {task.contact ? (
                          <Link
                            href={`/contacts/${task.contact.id}`}
                            className="inline-flex items-center gap-1 text-purple-600 font-semibold hover:underline"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            {task.contact.firstName} {task.contact.lastName}
                          </Link>
                        ) : task.company ? (
                          <Link
                            href={`/companies/${task.company.id}`}
                            className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            {task.company.name}
                          </Link>
                        ) : task.lead ? (
                          <Link
                            href={`/leads/${task.lead.id}`}
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                          >
                            <Target className="w-3.5 h-3.5" />
                            {task.lead.name}
                          </Link>
                        ) : task.deal ? (
                          <Link
                            href={`/deals/${task.deal.id}`}
                            className="inline-flex items-center gap-1 text-amber-600 font-semibold hover:underline"
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            {task.deal.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Unlinked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                          title="Delete Task"
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
        title={selectedTask ? "Edit Task" : "Create Action Task"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Send updated pricing proposal"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TASK_PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TASK_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary CRM Relation Selector */}
          <div className="bg-muted/40 p-3.5 rounded-lg border border-border space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Link Primary CRM Entity
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Entity Type
                </label>
                <select
                  value={relationType}
                  onChange={(e) =>
                    setRelationType(
                      e.target.value as
                        | "none"
                        | "contact"
                        | "company"
                        | "lead"
                        | "deal",
                    )
                  }
                  className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="none">-- Unlinked Task --</option>
                  <option value="contact">Contact</option>
                  <option value="company">Company</option>
                  <option value="lead">Lead</option>
                  <option value="deal">Deal</option>
                </select>
              </div>

              {relationType === "contact" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Select Contact
                  </label>
                  <select
                    value={formData.contactId}
                    onChange={(e) =>
                      setFormData({ ...formData, contactId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose Contact --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {relationType === "company" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Select Company
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) =>
                      setFormData({ ...formData, companyId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose Company --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {relationType === "lead" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Select Lead
                  </label>
                  <select
                    value={formData.leadId}
                    onChange={(e) =>
                      setFormData({ ...formData, leadId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {relationType === "deal" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Select Deal
                  </label>
                  <select
                    value={formData.dealId}
                    onChange={(e) =>
                      setFormData({ ...formData, dealId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose Deal --</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
              {saving ? "Saving..." : "Save Task"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${selectedTask?.title}"?`}
        loading={saving}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading tasks...</div>}>
      <TasksContent />
    </Suspense>
  );
}
