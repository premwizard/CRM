"use client";

import React, { useState, useEffect } from "react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Modal } from "@/components/ui/modal";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Clock,
  User,
  ArrowUpDown,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export interface NoteItem {
  id: string;
  content: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  contactId?: string | null;
  companyId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
}

interface EntityNotesProps {
  entityType: "contact" | "company" | "lead" | "deal";
  entityId: string;
  entityName?: string;
}

export function EntityNotes({
  entityType,
  entityId,
  entityName,
}: EntityNotesProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Create Form State
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/notes?${entityType}Id=${entityId}&sort=${sortOrder}`,
      );
      const data = await res.json();
      if (data.success) {
        setNotes(data.data?.notes || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchNotes();
    }
  }, [entityId, entityType, sortOrder]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        content: newContent.trim(),
        createdBy: "Current User",
      };

      if (entityType === "contact") payload.contactId = entityId;
      if (entityType === "company") payload.companyId = entityId;
      if (entityType === "lead") payload.leadId = entityId;
      if (entityType === "deal") payload.dealId = entityId;

      const res = await fetch("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setCreating(false);

      if (res.ok && data.success) {
        setNewContent("");
        fetchNotes();
      }
    } catch {
      setCreating(false);
    }
  };

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNote(note);
    setEditContent(note.content);
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editContent.trim()) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/notes/${editingNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      const data = await res.json();
      setUpdating(false);

      if (res.ok && data.success) {
        setEditingNote(null);
        fetchNotes();
      }
    } catch {
      setUpdating(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/notes/${deletingId}`, {
        method: "DELETE",
      });
      setDeleting(false);
      if (res.ok) {
        setDeletingId(null);
        fetchNotes();
      }
    } catch {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Notes
          </h2>
          <p className="text-xs text-muted-foreground">
            Internal notes and customer records for {entityName || entityType}.
          </p>
        </div>

        {/* Sort Order Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "newest" | "oldest")
            }
            className="px-2.5 py-1 text-xs bg-background border border-input rounded-md font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* New Note Composer */}
      <form
        onSubmit={handleCreateNote}
        className="bg-accent/40 p-4 rounded-lg border border-border space-y-3"
      >
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Add Note
        </label>
        <textarea
          rows={3}
          required
          placeholder={`Record an important note regarding ${entityName || entityType}...`}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creating || !newContent.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Saving..." : "Save Note"}
          </button>
        </div>
      </form>

      {/* Notes Stream */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground text-xs animate-pulse">
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground space-y-2 border border-dashed border-border rounded-lg">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto opacity-30" />
          <p className="text-sm font-medium">No notes recorded yet.</p>
          <p className="text-xs">
            Write your first note in the text area above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-background border border-border p-4 rounded-lg space-y-3 hover:border-amber-500/40 transition-colors shadow-2xs group"
            >
              {/* Note Header */}
              <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-[11px] border border-amber-500/20">
                    {(note.createdBy || "U")[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-foreground">
                    {note.createdBy || "User"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <span
                    className="flex items-center gap-1"
                    title={formatFullDate(note.createdAt)}
                  >
                    <Clock className="w-3 h-3 text-amber-500" />
                    {formatDate(note.createdAt)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(note)}
                      className="px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                      title="Edit Note"
                    >
                      [Edit]
                    </button>
                    <button
                      onClick={() => setDeletingId(note.id)}
                      className="px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete Note"
                    >
                      [Delete]
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Body Content */}
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Edit Note Modal */}
      <Modal
        isOpen={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        title="Edit Note"
      >
        <form onSubmit={handleUpdateNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Note Content *
            </label>
            <textarea
              rows={5}
              required
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setEditingNote(null)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md text-sm transition-colors shadow-xs"
            >
              {updating ? "Updating..." : "Update Note"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
