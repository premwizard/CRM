"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { MessageSquare, Send, Edit2, Trash2, AtSign, Check, X, User as UserIcon } from "lucide-react";

export interface CommentItem {
  id: string;
  organizationId: string;
  authorId: string;
  content: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CommentsSectionProps {
  entityType: "LEAD" | "DEAL" | "CONTACT" | "COMPANY" | "TASK" | "ACTIVITY";
  entityId: string;
  entityName?: string;
}

export function CommentsSection({ entityType, entityId, entityName }: CommentsSectionProps) {
  const { user, isViewer } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mention Autocomplete State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursorIndex, setMentionCursorIndex] = useState<number>(-1);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/v1/comments?entityType=${entityType}&entityId=${entityId}`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setComments(json.data.comments || []);
      } else {
        setError(json.error || "Failed to load comments");
      }
    } catch {
      setError("Network error fetching comments");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:5000/api/v1/team/members", { headers });
      const json = await res.json();
      if (json.success && json.data?.members) {
        const formatted = json.data.members.map((m: any) => ({
          id: m.userId || m.id,
          name: `${m.user?.firstName || m.firstName || ""} ${m.user?.lastName || m.lastName || ""}`.trim() || m.email,
          email: m.user?.email || m.email,
          role: m.role,
        }));
        setTeamMembers(formatted);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchComments();
      fetchTeamMembers();
    }
  }, [entityType, entityId]);

  // Handle Mention Autocomplete Detection
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");

    if (lastAtPos !== -1 && (lastAtPos === 0 || /\s/.test(val[lastAtPos - 1]))) {
      const query = textBeforeCursor.substring(lastAtPos + 1);
      if (!/\s/.test(query)) {
        setMentionQuery(query.toLowerCase());
        setMentionCursorIndex(lastAtPos);
        setShowMentionMenu(true);
        return;
      }
    }

    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  const handleSelectMention = (member: TeamMemberItem) => {
    if (mentionCursorIndex === -1) return;
    const firstName = member.name.split(" ")[0] || member.email.split("@")[0];

    const before = newComment.substring(0, mentionCursorIndex);
    const after = newComment.substring(textareaRef.current?.selectionStart || newComment.length);
    const inserted = `${before}@${firstName} ${after}`;

    setNewComment(inserted);
    setShowMentionMenu(false);
    setMentionQuery(null);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isViewer) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:5000/api/v1/comments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          entityType,
          entityId,
          content: newComment.trim(),
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.comment) {
        setComments((prev) => [...prev, json.data.comment]);
        setNewComment("");
        setShowMentionMenu(false);
      } else {
        setError(json.error || "Failed to post comment");
      }
    } catch {
      setError("Error submitting comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/v1/comments/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ content: editContent.trim() }),
      });

      const json = await res.json();
      if (json.success && json.data?.comment) {
        setComments((prev) =>
          prev.map((c) => (c.id === id ? json.data.comment : c))
        );
        setEditingCommentId(null);
      } else {
        setError(json.error || "Failed to update comment");
      }
    } catch {
      setError("Error updating comment");
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/v1/comments/${id}`, {
        method: "DELETE",
        headers,
      });

      const json = await res.json();
      if (json.success) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      } else {
        setError(json.error || "Failed to delete comment");
      }
    } catch {
      setError("Error deleting comment");
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@[\w.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-primary font-semibold bg-primary/10 px-1 py-0.5 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const filteredMembers = teamMembers.filter((m) =>
    mentionQuery === null || mentionQuery === ""
      ? true
      : m.name.toLowerCase().includes(mentionQuery) || m.email.toLowerCase().includes(mentionQuery)
  );

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Comments & Discussion</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading discussion...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg p-4">
            No comments yet. Start the discussion by typing a comment below!
          </div>
        ) : (
          comments.map((item) => {
            const isOwner = user?.id === item.authorId;
            const isEditing = editingCommentId === item.id;

            return (
              <div key={item.id} className="p-3.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
                      {item.author.firstName[0]}
                      {item.author.lastName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-none">
                        {item.author.firstName} {item.author.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {isOwner && !isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCommentId(item.id);
                          setEditContent(item.content);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent"
                        title="Edit comment"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(item.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-accent"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content or Edit Form */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none min-h-[60px]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-2.5 py-1 text-xs border border-border rounded-md hover:bg-accent"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateComment(item.id)}
                        className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pl-9">
                    {renderContentWithMentions(item.content)}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Comment Composer */}
      {!isViewer && (
        <form onSubmit={handleCreateComment} className="relative space-y-2 pt-2 border-t border-border">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextareaChange}
              placeholder="Write a comment... (Type @ to mention team members)"
              className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none min-h-[75px]"
            />

            {/* Mention Autocomplete Dropdown */}
            {showMentionMenu && filteredMembers.length > 0 && (
              <div className="absolute left-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg z-50 divide-y divide-border">
                <div className="p-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 flex items-center gap-1">
                  <AtSign className="w-3 h-3" /> Mention Team Member
                </div>
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMention(member)}
                    className="p-2 text-xs hover:bg-accent/60 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                        <UserIcon className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-semibold leading-none text-foreground">{member.name}</p>
                        <p className="text-[10px] text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AtSign className="w-3 h-3 text-primary" /> Type @ to mention colleagues
            </p>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3 h-3" />
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
