"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  PhoneCall,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Bookmark,
  Plus,
  Trash2,
  Clock,
  User,
  Activity as ActivityIcon,
  MessageSquare,
} from "lucide-react";

export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "TASK"
  | "OTHER";

export interface ActivityItem {
  id: string;
  title: string;
  type: ActivityType;
  description?: string | null;
  performedBy?: string | null;
  createdAt: string;
  contactId?: string | null;
  companyId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  company?: { id: string; name: string } | null;
  lead?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
}

interface ActivityTimelineProps {
  entityType: "contact" | "company" | "lead" | "deal";
  entityId: string;
  entityName?: string;
}

export function ActivityTimeline({
  entityType,
  entityId,
  entityName,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType>("CALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete Modal
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/activities?${entityType}Id=${entityId}`;
      if (filterType) {
        url += `&type=${filterType}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data?.activities || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchActivities();
    }
  }, [entityId, entityType, filterType]);

  const handleOpenModal = (defaultType: ActivityType = "CALL") => {
    setSelectedType(defaultType);
    setTitle("");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        type: selectedType,
        description: description.trim() || null,
        performedBy: "Current User",
      };

      if (entityType === "contact") payload.contactId = entityId;
      if (entityType === "company") payload.companyId = entityId;
      if (entityType === "lead") payload.leadId = entityId;
      if (entityType === "deal") payload.dealId = entityId;

      const res = await fetch("/api/v1/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchActivities();
      }
    } catch {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/activities/${deletingId}`, {
        method: "DELETE",
      });
      setDeleting(false);
      if (res.ok) {
        setDeletingId(null);
        fetchActivities();
      }
    } catch {
      setDeleting(false);
    }
  };

  // Group activities chronologically by date
  const groupActivitiesByDate = (items: ActivityItem[]) => {
    const groups: { [key: string]: ActivityItem[] } = {};

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    items.forEach((item) => {
      const itemDate = new Date(item.createdAt);
      const itemDateStr = itemDate.toDateString();

      let groupLabel = "";
      if (itemDateStr === todayStr) {
        groupLabel = "Today";
      } else if (itemDateStr === yesterdayStr) {
        groupLabel = "Yesterday";
      } else {
        groupLabel = itemDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }

      if (!groups[groupLabel]) {
        groups[groupLabel] = [];
      }
      groups[groupLabel].push(item);
    });

    return groups;
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "CALL":
        return <PhoneCall className="w-4 h-4 text-blue-500" />;
      case "EMAIL":
        return <Mail className="w-4 h-4 text-purple-500" />;
      case "MEETING":
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case "NOTE":
        return <FileText className="w-4 h-4 text-amber-500" />;
      case "TASK":
        return <CheckSquare className="w-4 h-4 text-rose-500" />;
      case "OTHER":
        return <Bookmark className="w-4 h-4 text-indigo-500" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityBadgeClass = (type: ActivityType) => {
    switch (type) {
      case "CALL":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "EMAIL":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "MEETING":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "NOTE":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "TASK":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "OTHER":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const grouped = groupActivitiesByDate(activities);

  return (
    <div className="bg-card p-6 rounded-lg border border-border space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-primary" />
            Activity Timeline
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete interaction history with {entityName || entityType}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Action Buttons */}
          <button
            onClick={() => handleOpenModal("CALL")}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call
          </button>
          <button
            onClick={() => handleOpenModal("EMAIL")}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button
            onClick={() => handleOpenModal("MEETING")}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" /> Meeting
          </button>
          <button
            onClick={() => handleOpenModal("NOTE")}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" /> Note
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground font-medium">
          Filter timeline:
        </span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-2 py-1 bg-background border border-input rounded text-xs focus:ring-1 focus:ring-primary"
        >
          <option value="">All Activity Types</option>
          <option value="CALL">Calls 📞</option>
          <option value="EMAIL">Emails 📧</option>
          <option value="MEETING">Meetings 📅</option>
          <option value="NOTE">Notes 📝</option>
          <option value="TASK">Tasks 📋</option>
          <option value="OTHER">Other 📌</option>
        </select>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground text-xs animate-pulse">
          Loading interaction timeline...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-lg">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
          <p className="text-sm font-medium">No activity recorded yet.</p>
          <p className="text-xs">
            Use the buttons above to log calls, emails, meetings, or notes.
          </p>
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border">
          {Object.entries(grouped).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-4 relative">
              {/* Group Date Header */}
              <div className="flex items-center gap-2">
                <span className="relative z-10 px-2.5 py-1 text-xs font-bold bg-secondary text-secondary-foreground rounded-full border border-border shadow-2xs">
                  {dateGroup}
                </span>
                <div className="h-px bg-border flex-1" />
              </div>

              {/* Items in this Date Group */}
              <div className="space-y-4 pl-8">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-background border border-border p-4 rounded-lg space-y-2 hover:border-primary/50 transition-colors shadow-2xs group"
                  >
                    {/* Node Circle on Timeline */}
                    <div className="absolute -left-[35px] top-4 z-10 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center shadow-2xs">
                      {getActivityIcon(item.type)}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {item.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${getActivityBadgeClass(
                              item.type,
                            )}`}
                          >
                            {item.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {item.performedBy && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-primary" />
                              {item.performedBy}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Action */}
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Description Body */}
                    {item.description && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap pt-1 border-t border-border/60">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Activity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Log Activity — ${entityName || entityType}`}
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Activity Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  "CALL",
                  "EMAIL",
                  "MEETING",
                  "NOTE",
                  "TASK",
                  "OTHER",
                ] as ActivityType[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-md border flex items-center justify-center gap-2 transition-colors ${
                    selectedType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-accent"
                  }`}
                >
                  {getActivityIcon(t)}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Title / Summary *
            </label>
            <input
              type="text"
              required
              placeholder={`e.g. Called ${entityName || entityType} regarding proposal`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Details & Notes
            </label>
            <textarea
              rows={4}
              placeholder="Add interaction notes, key takeaways, or next steps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
              {saving ? "Saving..." : "Log Activity"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteActivity}
        title="Delete Activity Log"
        message="Are you sure you want to delete this activity log from the timeline?"
        loading={deleting}
      />
    </div>
  );
}
