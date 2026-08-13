"use client";

import React, { useState, useEffect } from "react";
import { Tag as TagIcon, Plus, X, Check } from "lucide-react";

export interface TagItem {
  id: string;
  name: string;
  color?: string | null;
}

interface EntityTagsProps {
  entityType: "contact" | "company" | "lead" | "deal";
  entityId: string;
  initialTags?: TagItem[];
  onTagsUpdated?: () => void;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#64748B", // Slate
];

export function EntityTags({
  entityType,
  entityId,
  initialTags = [],
  onTagsUpdated,
}: EntityTagsProps) {
  const [assignedTags, setAssignedTags] = useState<TagItem[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);

  const fetchAvailableTags = async () => {
    try {
      const res = await fetch("/api/v1/tags");
      const data = await res.json();
      if (data.success) {
        setAvailableTags(data.data.tags || []);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    setAssignedTags(initialTags);
  }, [initialTags]);

  useEffect(() => {
    if (isPopoverOpen) {
      fetchAvailableTags();
    }
  }, [isPopoverOpen]);

  const handleAssignTag = async (tag: TagItem) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/tags/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId: tag.id,
          entityType,
          entityId,
        }),
      });
      if (res.ok) {
        if (!assignedTags.some((t) => t.id === tag.id)) {
          setAssignedTags([...assignedTags, tag]);
        }
        if (onTagsUpdated) onTagsUpdated();
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAssignTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/tags/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagName: newTagName.trim(),
          color: selectedColor,
          entityType,
          entityId,
        }),
      });
      if (res.ok) {
        setNewTagName("");
        setIsPopoverOpen(false);
        if (onTagsUpdated) onTagsUpdated();
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch("/api/v1/tags/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId,
          entityType,
          entityId,
        }),
      });
      if (res.ok) {
        setAssignedTags(assignedTags.filter((t) => t.id !== tagId));
        if (onTagsUpdated) onTagsUpdated();
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Assigned Tags List */}
      {assignedTags.map((tag) => {
        const color = tag.color || "#3B82F6";
        return (
          <span
            key={tag.id}
            style={{
              backgroundColor: `${color}15`,
              borderColor: `${color}40`,
              color,
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors group shadow-2xs"
          >
            <TagIcon className="w-3 h-3" />
            <span>{tag.name}</span>
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="p-0.5 rounded-full hover:bg-black/10 transition-colors opacity-70 hover:opacity-100"
              title="Remove tag"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}

      {/* Add Tag Popover Trigger */}
      <div className="relative">
        <button
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-accent border border-border transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>

        {isPopoverOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg p-3 z-50 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Manage Tags
              </span>
              <button
                onClick={() => setIsPopoverOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select Existing Tag */}
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Existing Tags:
              </span>
              {availableTags.length === 0 ? (
                <span className="text-xs text-muted-foreground italic block">
                  No existing tags found
                </span>
              ) : (
                availableTags.map((tag) => {
                  const isAssigned = assignedTags.some((t) => t.id === tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (!isAssigned) handleAssignTag(tag);
                      }}
                      disabled={isAssigned}
                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                        isAssigned
                          ? "opacity-50 cursor-not-allowed bg-accent/30"
                          : "hover:bg-accent cursor-pointer"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tag.color || "#3B82F6" }}
                        />
                        {tag.name}
                      </span>
                      {isAssigned && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Create New Tag Inline */}
            <form
              onSubmit={handleCreateAndAssignTag}
              className="border-t border-border pt-2.5 space-y-2"
            >
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Create New Tag:
              </span>
              <input
                type="text"
                placeholder="Tag name (e.g. Enterprise)"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />

              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      selectedColor === c
                        ? "ring-2 ring-primary ring-offset-1 scale-110"
                        : "opacity-80"
                    }`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || !newTagName.trim()}
                className="w-full py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-2xs"
              >
                {loading ? "Adding..." : "+ Create & Assign Tag"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
