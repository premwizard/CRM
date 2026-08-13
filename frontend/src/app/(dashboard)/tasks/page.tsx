"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  CheckSquare,
  Search,
  Edit2,
  Trash2,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Building2,
  UserCheck,
  Target,
  Briefcase,
  Link as LinkIcon,
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
}

interface EntityOption {
  id: string;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

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

  const fetchEntities = async () => {
    try {
      const [resContacts, resCompanies, resLeads, resDeals] = await Promise.all([
        fetch("/api/v1/contacts"),
        fetch("/api/v1/companies"),
        fetch("/api/v1/leads"),
        fetch("/api/v1/deals"),
      ]);

      const [dataC, dataComp, dataL, dataD] = await Promise.all([
        resContacts.json(),
        resCompanies.json(),
        resLeads.json(),
        resDeals.json(),
      ]);

      if (dataC.success) {
        setContacts(
          (dataC.data.contacts || []).map(
            (c: { id: string; firstName: string; lastName: string }) => ({
              id: c.id,
              name: `${c.firstName} ${c.lastName}`,
            }),
          ),
        );
      }

      if (dataComp.success) {
        setCompanies(
          (dataComp.data.companies || []).map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          })),
        );
      }

      if (dataL.success) {
        setLeads(
          (dataL.data.leads || []).map((l: { id: string; name: string }) => ({
            id: l.id,
            name: l.name,
          })),
        );
      }

      if (dataD.success) {
        setDeals(
          (dataD.data.deals || []).map((d: { id: string; name: string }) => ({
            id: d.id,
            name: d.name,
          })),
        );
      }
    } catch {
      // Fallback
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = `/api/v1/tasks?search=${encodeURIComponent(search)}`;
      if (selectedStatus) query += `&status=${selectedStatus}`;
      if (selectedPriority) query += `&priority=${selectedPriority}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.tasks || []);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedStatus, selectedPriority]);

  const handleOpenCreate = () => {
    setSelectedTask(null);
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
        fetchTasks();
      }
    } catch {
      setSaving(false);
    }
  };

  const isOverdue = (task: TaskItem) => {
    if (!task.dueDate) return false;
    if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "HIGH":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "MEDIUM":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "CANCELLED":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & To-Dos"
        description="Schedule follow-up actions, assign team members, and track related CRM items."
        actionText="Create Task"
        onAction={handleOpenCreate}
      />

      {/* Filter Bar */}
      <div className="bg-card p-4 rounded-lg border border-border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            {TASK_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Task</th>
                <th className="px-6 py-3.5">Related Entity</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Assigned To</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No tasks found. Click "Create Task" to schedule a to-do
                    item.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr
                      key={task.id}
                      className={`transition-colors ${
                        overdue
                          ? "bg-red-500/5 hover:bg-red-500/10"
                          : "hover:bg-accent/40"
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          {overdue && (
                            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-red-600 text-white rounded tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              OVERDUE
                            </span>
                          )}
                          <span
                            className={
                              task.status === "COMPLETED"
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground font-normal mt-0.5 max-w-xs truncate">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Related Entity Badge */}
                      <td className="px-6 py-4 text-xs font-medium">
                        {task.contact ? (
                          <Link
                            href={`/contacts/${task.contact.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>
                              {task.contact.firstName} {task.contact.lastName}
                            </span>
                          </Link>
                        ) : task.company ? (
                          <Link
                            href={`/companies/${task.company.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{task.company.name}</span>
                          </Link>
                        ) : task.lead ? (
                          <Link
                            href={`/leads/${task.lead.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>{task.lead.name}</span>
                          </Link>
                        ) : task.deal ? (
                          <Link
                            href={`/deals/${task.deal.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{task.deal.name}</span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-xs font-normal">
                            General
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`px-2.5 py-1 rounded-md border font-semibold ${getPriorityBadge(
                            task.priority,
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`px-2.5 py-1 rounded-md border font-semibold ${getStatusBadge(
                            task.status,
                          )}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>{task.assignedTo}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {task.dueDate ? (
                          <div
                            className={`flex items-center gap-1.5 ${
                              overdue ? "text-red-600 font-bold" : ""
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
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
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTask ? "Edit Task" : "Create New Task"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. Follow up with client regarding proposal"
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* CRM Entity Selection */}
          <div className="bg-accent/30 p-3 rounded-lg border border-border space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              Related CRM Entity (Optional)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Contact
                </label>
                <select
                  value={formData.contactId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactId: e.target.value,
                      companyId: "",
                      leadId: "",
                      dealId: "",
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- None --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Company
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyId: e.target.value,
                      contactId: "",
                      leadId: "",
                      dealId: "",
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- None --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Lead
                </label>
                <select
                  value={formData.leadId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      leadId: e.target.value,
                      contactId: "",
                      companyId: "",
                      dealId: "",
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- None --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Deal
                </label>
                <select
                  value={formData.dealId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dealId: e.target.value,
                      contactId: "",
                      companyId: "",
                      leadId: "",
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- None --</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
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
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TASK_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Assigned To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
                placeholder="e.g. Sales Rep Name"
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
