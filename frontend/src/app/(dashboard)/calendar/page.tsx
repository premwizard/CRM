"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Video,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  User as UserIcon,
  X,
  Check,
  Trash2,
} from "lucide-react";

export interface MeetingItem {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingUrl?: string | null;
  organizerId: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  outcome?: string | null;
  notes?: string | null;
  nextAction?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function CalendarPage() {
  const { user, isViewer } = useAuth();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);

  // Form Fields for Schedule Meeting
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTimeStr, setStartTimeStr] = useState("10:00");
  const [endTimeStr, setEndTimeStr] = useState("11:00");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outcome / Completion Form Fields
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:5000/api/v1/meetings", { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setMeetings(json.data.meetings || []);
      } else {
        setError(json.error || "Failed to load calendar meetings");
      }
    } catch {
      setError("Network error fetching calendar meetings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Check Conflict dynamically when time changes in modal
  useEffect(() => {
    if (!meetingDate || !startTimeStr || !endTimeStr) return;
    const start = new Date(`${meetingDate}T${startTimeStr}:00`);
    const end = new Date(`${meetingDate}T${endTimeStr}:00`);

    if (end <= start) {
      setConflictWarning(null);
      return;
    }

    const conflict = meetings.find((m) => {
      if (m.status === "CANCELLED") return false;
      const mStart = new Date(m.startTime);
      const mEnd = new Date(m.endTime);
      return mStart < end && mEnd > start;
    });

    if (conflict) {
      setConflictWarning(`Conflict Warning: You already have another meeting ("${conflict.title}") scheduled during this time slot.`);
    } else {
      setConflictWarning(null);
    }
  }, [meetingDate, startTimeStr, endTimeStr, meetings]);

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isViewer) return;

    const startISO = new Date(`${meetingDate}T${startTimeStr}:00`).toISOString();
    const endISO = new Date(`${meetingDate}T${endTimeStr}:00`).toISOString();

    try {
      setIsSubmitting(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: startISO,
        endTime: endISO,
        location: location.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
      };

      const res = await fetch("http://localhost:5000/api/v1/meetings", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data?.meeting) {
        setMeetings((prev) => [...prev, json.data.meeting]);
        setIsScheduleOpen(false);
        setTitle("");
        setDescription("");
        setLocation("");
        setMeetingUrl("");
      } else {
        setError(json.error || "Failed to schedule meeting");
      }
    } catch {
      setError("Error submitting meeting request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "COMPLETED" | "CANCELLED" | "NO_SHOW") => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload: any = { status: newStatus };
      if (newStatus === "COMPLETED") {
        if (outcome) payload.outcome = outcome;
        if (notes) payload.notes = notes;
        if (nextAction) payload.nextAction = nextAction;
      }

      const res = await fetch(`http://localhost:5000/api/v1/meetings/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data?.meeting) {
        setMeetings((prev) =>
          prev.map((m) => (m.id === id ? json.data.meeting : m))
        );
        if (selectedMeeting?.id === id) {
          setSelectedMeeting(json.data.meeting);
        }
      }
    } catch {
      setError("Error updating meeting status");
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/v1/meetings/${id}`, {
        method: "DELETE",
        headers,
      });

      const json = await res.json();
      if (json.success) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
        setSelectedMeeting(null);
      }
    } catch {
      setError("Error deleting meeting");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">COMPLETED</span>;
      case "CANCELLED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">CANCELLED</span>;
      case "NO_SHOW":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">NO SHOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">SCHEDULED</span>;
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateTitle = () => {
    return currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Calendar & Customer Meetings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule, manage, and record outcome notes for customer meetings directly in IC CRM.
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        )}
      </div>

      {/* Calendar Toolbar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/20">
            <button
              onClick={() => {
                const prev = new Date(currentDate);
                if (viewMode === "month") prev.setMonth(prev.getMonth() - 1);
                else if (viewMode === "week") prev.setDate(prev.getDate() - 7);
                else prev.setDate(prev.getDate() - 1);
                setCurrentDate(prev);
              }}
              className="p-1 hover:bg-accent rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold hover:bg-accent rounded-md"
            >
              Today
            </button>
            <button
              onClick={() => {
                const next = new Date(currentDate);
                if (viewMode === "month") next.setMonth(next.getMonth() + 1);
                else if (viewMode === "week") next.setDate(next.getDate() + 7);
                else next.setDate(next.getDate() + 1);
                setCurrentDate(next);
              }}
              className="p-1 hover:bg-accent rounded-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-foreground ml-2">{formatDateTitle()}</h2>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border border-border rounded-lg p-0.5 bg-muted/20 text-xs font-medium">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === "month" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === "week" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === "day" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {/* Calendar List View Container */}
      <div className="rounded-xl border border-border bg-card shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Scheduled Meetings ({meetings.length})
          </h3>
          <span className="text-xs text-muted-foreground">Showing upcoming & past events</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading calendar events...
          </div>
        ) : meetings.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg p-6">
            <CalendarIcon className="w-8 h-8 opacity-20 mx-auto mb-2" />
            No meetings scheduled yet. Click "Schedule Meeting" to create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedMeeting(item);
                  setOutcome(item.outcome || "");
                  setNotes(item.notes || "");
                  setNextAction(item.nextAction || "");
                }}
                className={`p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-accent/40 transition-all cursor-pointer space-y-3 group ${
                  item.status === "CANCELLED" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  {getStatusBadge(item.status)}
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {new Date(item.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </span>
                  </div>

                  {item.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}

                  {item.meetingUrl && (
                    <div className="flex items-center gap-1.5 text-primary">
                      <Video className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate hover:underline">{item.meetingUrl}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-muted-foreground" />
                    {item.organizer ? `${item.organizer.firstName} ${item.organizer.lastName}` : "Organizer"}
                  </span>
                  <span className="text-primary hover:underline font-medium">View details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Meeting Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Schedule Customer Meeting
              </h3>
              <button onClick={() => setIsScheduleOpen(false)} className="p-1 rounded hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleMeeting} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Conflict Warning Banner */}
              {conflictWarning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-lg flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span className="leading-relaxed font-medium">{conflictWarning}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-medium text-foreground">Meeting Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Contract Discussion & Product Demo"
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Date *</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">End Time *</label>
                  <input
                    type="time"
                    required
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Conference Room B"
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Meeting URL</label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/xyz"
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Description & Agenda</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agenda items, preparation notes..."
                  className="w-full p-2.5 rounded-lg border border-border bg-background resize-none min-h-[70px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Detail & Completion Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{selectedMeeting.title}</h3>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="p-1 rounded hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedMeeting.status)}</div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Time</p>
                  <p className="font-mono text-foreground font-medium mt-0.5">
                    {formatTime(selectedMeeting.startTime)} - {formatTime(selectedMeeting.endTime)}
                  </p>
                </div>
              </div>

              {/* Status Update Quick Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleUpdateStatus(selectedMeeting.id, "COMPLETED")}
                  className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold hover:bg-emerald-500/20"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMeeting.id, "CANCELLED")}
                  className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 font-semibold hover:bg-rose-500/20"
                >
                  Mark Cancelled
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMeeting.id, "NO_SHOW")}
                  className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold hover:bg-amber-500/20"
                >
                  Mark No Show
                </button>
              </div>

              {/* Outcome Notes Form */}
              <div className="space-y-3 pt-3 border-t border-border">
                <h4 className="font-semibold text-foreground">Record Meeting Completion Notes</h4>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Meeting Outcome</label>
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="e.g. Customer agreed to proposal terms"
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Meeting Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Key discussion points, pricing questions..."
                    className="w-full p-2.5 rounded-lg border border-border bg-background resize-none min-h-[60px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Next Action</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="e.g. Send final contract by Friday"
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                </div>

                <button
                  onClick={() => handleUpdateStatus(selectedMeeting.id, "COMPLETED")}
                  className="w-full py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Save Completion Notes
                </button>
              </div>

              {/* Delete Action */}
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <button
                  onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Cancel & Delete Meeting
                </button>

                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
