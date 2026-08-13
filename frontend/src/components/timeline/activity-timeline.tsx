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
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from "lucide-react";

export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "TASK"
  | "OTHER";

export type ActivityOutcome =
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "FOLLOW_UP_REQUIRED"
  | "MEETING_SCHEDULED"
  | "PROPOSAL_REQUESTED"
  | "COMPLETED"
  | "OTHER";

export interface ActivityItem {
  id: string;
  title: string;
  type: ActivityType;
  description?: string | null;
  outcome?: ActivityOutcome | null;
  duration?: number | null;
  nextAction?: string | null;
  followUpDate?: string | null;
  taskId?: string | null;
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
  task?: { id: string; title: string; dueDate?: string; status: string } | null;
}

interface ActivityTimelineProps {
  entityType: "contact" | "company" | "lead" | "deal";
  entityId: string;
  entityName?: string;
}

const OUTCOME_OPTIONS: { value: ActivityOutcome; label: string }[] = [
  { value: "INTERESTED", label: "Interested 👍" },
  { value: "FOLLOW_UP_REQUIRED", label: "Follow-up Required 🚨" },
  { value: "MEETING_SCHEDULED", label: "Meeting Scheduled 📅" },
  { value: "PROPOSAL_REQUESTED", label: "Proposal Requested 📝" },
  { value: "COMPLETED", label: "Completed ✅" },
  { value: "NOT_INTERESTED", label: "Not Interested ❌" },
  { value: "OTHER", label: "Other 📌" },
];

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
  const [outcome, setOutcome] = useState<ActivityOutcome | "">("");
  const [duration, setDuration] = useState<string>("");
  const [nextAction, setNextAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);
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
    setOutcome("");
    setDuration("");
    setNextAction("");
    setFollowUpDate("");
    setCreateFollowUpTask(false);
    setIsModalOpen(true);
  };

  // Auto toggle follow-up task checkbox when outcome is FOLLOW_UP_REQUIRED
  const handleOutcomeChange = (newOutcome: ActivityOutcome | "") => {
    setOutcome(newOutcome);
    if (newOutcome === "FOLLOW_UP_REQUIRED") {
      setCreateFollowUpTask(true);
    }
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
        outcome: outcome || null,
        duration: duration ? parseInt(duration, 10) : null,
        nextAction: nextAction.trim() || null,
        followUpDate: followUpDate || null,
        createFollowUpTask:
          createFollowUpTask || outcome === "FOLLOW_UP_REQUIRED",
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
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getOutcomeBadgeClass = (outcome: ActivityOutcome) => {
    switch (outcome) {
      case "INTERESTED":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "FOLLOW_UP_REQUIRED":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold";
      case "PROPOSAL_REQUESTED":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "MEETING_SCHEDULED":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "NOT_INTERESTED":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className="bg-card p-6 rounded-lg border border-border space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-primary" />
            Activity Timeline
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete interaction history with customer follow-up tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenModal("CALL")}
            className="px-2.5 py-1.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            + Call
          </button>
          <button
            onClick={() => handleOpenModal("EMAIL")}
            className="px-2.5 py-1.5 bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            + Email
          </button>
          <button
            onClick={() => handleOpenModal("MEETING")}
            className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            + Meeting
          </button>
          <button
            onClick={() => handleOpenModal("NOTE")}
            className="px-2.5 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            + Note
          </button>
        </div>
      </div>

      {/* Filter Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Filter by type:
        </span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-2.5 py-1 text-xs bg-background border border-input rounded-md font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Interaction Types</option>
          <option value="CALL">Calls</option>
          <option value="EMAIL">Emails</option>
          <option value="MEETING">Meetings</option>
          <option value="NOTE">Notes</option>
          <option value="TASK">Tasks</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground text-xs animate-pulse">
          Loading timeline activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-lg">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto opacity-30" />
          <p className="text-sm font-medium">No activity history found.</p>
          <p className="text-xs">
            Log an interaction or meeting note to populate this timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-border/60">
          {Object.entries(groupedActivities).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-4 relative">
              {/* Date Group Stamp Header */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-accent text-accent-foreground rounded-full border border-border">
                  {dateGroup}
                </span>
                <div className="h-px bg-border flex-1" />
              </div>

              {/* Group Items */}
              <div className="space-y-4 pl-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 group relative"
                  >
                    {/* Icon Node Badge */}
                    <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0 shadow-xs z-10">
                      {getActivityIcon(item.type)}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 bg-background border border-border p-4 rounded-lg space-y-2.5 hover:border-primary/40 transition-colors shadow-2xs">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {item.title}
                            </span>

                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase ${getActivityBadgeClass(
                                item.type,
                              )}`}
                            >
                              {item.type}
                            </span>

                            {item.outcome && (
                              <span
                                className={`px-2 py-0.5 text-[10px] border rounded-md uppercase ${getOutcomeBadgeClass(
                                  item.outcome,
                                )}`}
                              >
                                {item.outcome.replace(/_/g, " ")}
                              </span>
                            )}

                            {item.duration && (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-500/10 text-slate-600 border border-slate-500/20 rounded-md flex items-center gap-1">
                                <Clock3 className="w-3 h-3" />
                                {item.duration}m
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {item.performedBy && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-primary" />
                                {item.performedBy}
                              </span>
                            )}

                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Delete Action */}
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                          title="Delete activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed border-t border-border/50 pt-2">
                          {item.description}
                        </p>
                      )}

                      {/* Next Action & Follow-up Details */}
                      {(item.nextAction || item.followUpDate || item.task) && (
                        <div className="mt-2 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                          {item.nextAction && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Next Action: {item.nextAction}</span>
                            </div>
                          )}

                          {item.followUpDate && (
                            <div className="flex items-center gap-2 text-[11px] text-amber-600 font-medium">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Follow-up Date:{" "}
                                {new Date(item.followUpDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>

                              {item.task && (
                                <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded text-[10px] font-bold border border-green-500/20">
                                  Task Auto-Created ✅
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
        title={`Log Customer ${selectedType}`}
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Discovery Call / Sent Sales Proposal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) =>
                  setSelectedType(e.target.value as ActivityType)
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="CALL">Call 📞</option>
                <option value="EMAIL">Email 📧</option>
                <option value="MEETING">Meeting 📅</option>
                <option value="NOTE">Note 📝</option>
                <option value="TASK">Task 📋</option>
                <option value="OTHER">Other 📌</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 15, 30, 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Interaction Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) =>
                handleOutcomeChange(e.target.value as ActivityOutcome)
              }
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">-- Select Outcome --</option>
              {OUTCOME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Follow-up Workflow Section */}
          <div className="bg-amber-500/5 p-3.5 rounded-lg border border-amber-500/20 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Follow-Up Next Action
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Next Action Title
              </label>
              <input
                type="text"
                placeholder="e.g. Send custom pricing proposal"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={createFollowUpTask}
                onChange={(e) => setCreateFollowUpTask(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span>Create follow-up task automatically in system</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Record details of conversation, key takeaways..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
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
              {saving ? "Logging..." : "Log Activity"}
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
        message="Are you sure you want to remove this activity log from the timeline?"
        loading={deleting}
      />
    </div>
  );
}
