"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  HelpCircle,
} from "lucide-react";

export interface TaskEntityItem {
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

interface EntityTasksProps {
  entityType: "contact" | "company" | "lead" | "deal";
  entityId: string;
  entityName?: string;
}

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function EntityTasks({
  entityType,
  entityId,
  entityName,
}: EntityTasksProps) {
  const [tasks, setTasks] = useState<TaskEntityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskEntityItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    status: "TODO",
    assignedTo: "",
  });

  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tasks?${entityType}Id=${entityId}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.tasks || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchTasks();
    }
  }, [entityId, entityType]);

  const handleOpenCreate = () => {
    setSelectedTask(null);
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      status: "TODO",
      assignedTo: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: TaskEntityItem) => {
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
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...formData,
      };

      if (entityType === "contact") payload.contactId = entityId;
      if (entityType === "company") payload.companyId = entityId;
      if (entityType === "lead") payload.leadId = entityId;
      if (entityType === "deal") payload.dealId = entityId;

      const url = selectedTask
        ? `/api/v1/tasks/${selectedTask.id}`
        : "/api/v1/tasks";
      const method = selectedTask ? "PUT" : "POST";

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

  const handleStatusChange = async (
    task: TaskEntityItem,
    newStatus: string,
  ) => {
    try {
      const res = await fetch(`/api/v1/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          status: newStatus,
        }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch {
      // Fallback
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/tasks/${deletingId}`, {
        method: "DELETE",
      });
      setDeleting(false);
      if (res.ok) {
        setDeletingId(null);
        fetchTasks();
      }
    } catch {
      setDeleting(false);
    }
  };

  const isOverdue = (task: TaskEntityItem) => {
    if (!task.dueDate) return false;
    if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getPriorityBadgeClass = (priority: string) => {
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

  const getStatusBadgeClass = (status: string) => {
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
    <div className="bg-card p-6 rounded-lg border border-border space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            Related Tasks
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage follow-ups and assigned action items for {entityName || entityType}.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground text-xs animate-pulse">
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-lg">
          <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto opacity-30" />
          <p className="text-sm font-medium">No tasks assigned yet.</p>
          <p className="text-xs">
            Click "+ Add Task" to schedule a follow-up action.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            return (
              <div
                key={task.id}
                className={`p-4 rounded-lg border transition-all ${
                  overdue
                    ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50"
                    : "bg-background border-border hover:border-blue-500/40"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    {/* Title & Badges */}
                    <div className="flex items-center flex-wrap gap-2">
                      {overdue && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-red-600 text-white rounded-md tracking-wider flex items-center gap-1 animate-pulse shadow-xs">
                          <AlertCircle className="w-3 h-3" />
                          OVERDUE
                        </span>
                      )}

                      <span
                        className={`text-sm font-bold ${
                          task.status === "COMPLETED"
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </span>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase ${getPriorityBadgeClass(
                          task.priority,
                        )}`}
                      >
                        {task.priority}
                      </span>

                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task, e.target.value)
                        }
                        className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase focus:outline-none cursor-pointer ${getStatusBadgeClass(
                          task.status,
                        )}`}
                      >
                        {TASK_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Meta info: Due date & Assigned User */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      {task.dueDate && (
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            overdue ? "text-red-600 font-bold" : ""
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Due:{" "}
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
                      )}

                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span>Assigned: {task.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleStatusChange(task, "COMPLETED")}
                        className="px-2 py-1 text-xs font-semibold text-green-600 hover:bg-green-500/10 rounded transition-colors flex items-center gap-1 border border-green-500/20"
                        title="Mark Complete"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingId(task.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTask ? "Edit Task" : "Create Task"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Follow up with client regarding proposal"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Additional task details..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Assigned To
              </label>
              <input
                type="text"
                placeholder="Team member name"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
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
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {TASK_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace("_", " ")}
                  </option>
                ))}
              </select>
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
              {saving
                ? "Saving..."
                : selectedTask
                ? "Update Task"
                : "Create Task"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
