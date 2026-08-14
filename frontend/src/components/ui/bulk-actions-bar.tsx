"use client";

import React, { useState } from "react";
import { Modal } from "./modal";
import { ConfirmModal } from "./confirm-modal";
import {
  CheckSquare,
  X,
  UserCheck,
  Tag,
  Trash2,
  Download,
  GitCommit,
  Activity,
} from "lucide-react";

export type EntityType = "contacts" | "leads" | "deals";

export interface TagItem {
  id: string;
  name: string;
  color?: string | null;
}

interface BulkActionsBarProps {
  selectedCount: number;
  entityType: EntityType;
  tags?: TagItem[];
  onClearSelection: () => void;
  onExecuteAction: (action: string, data?: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  entityType,
  tags = [],
  onClearSelection,
  onExecuteAction,
  loading = false,
}: BulkActionsBarProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Form Inputs
  const [ownerInput, setOwnerInput] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [selectedLeadStatus, setSelectedLeadStatus] = useState("NEW");
  const [selectedDealStage, setSelectedDealStage] = useState("NEW");

  const [submitting, setSubmitting] = useState(false);

  if (selectedCount === 0) return null;

  const handleCloseModal = () => {
    setActiveModal(null);
    setOwnerInput("");
    setSelectedTagId("");
    setNewTagName("");
  };

  const handleActionClick = async (action: string) => {
    if (action === "export") {
      await onExecuteAction("export");
      return;
    }
    setActiveModal(action);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (activeModal === "assign-owner") {
        await onExecuteAction("assign-owner", { owner: ownerInput.trim() || null });
      } else if (activeModal === "add-tag") {
        await onExecuteAction("add-tag", {
          tagId: selectedTagId || undefined,
          tagName: newTagName.trim() || undefined,
          color: newTagColor,
        });
      } else if (activeModal === "remove-tag") {
        await onExecuteAction("remove-tag", { tagId: selectedTagId });
      } else if (activeModal === "change-status") {
        await onExecuteAction("change-status", { status: selectedLeadStatus });
      } else if (activeModal === "change-stage") {
        await onExecuteAction("change-stage", { stage: selectedDealStage });
      }
      handleCloseModal();
    } catch {
      // Handled upstream
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      await onExecuteAction("delete");
      handleCloseModal();
    } catch {
      // Handled upstream
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border border-primary/30 shadow-2xl rounded-full px-5 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2 pr-3 border-r border-border font-medium text-xs text-foreground shrink-0">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span>
            <strong className="text-primary font-bold">{selectedCount}</strong> {selectedCount === 1 ? "record" : "records"} selected
          </span>
          <button
            onClick={onClearSelection}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors ml-1"
            title="Deselect all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons depending on Entity */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          {/* Contacts Actions */}
          {entityType === "contacts" && (
            <>
              <button
                disabled={loading}
                onClick={() => handleActionClick("assign-owner")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Assign owner
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("add-tag")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                Add tag
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("remove-tag")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-amber-500 opacity-60" />
                Remove tag
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("export")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                Export
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("delete")}
                className="px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}

          {/* Leads Actions */}
          {entityType === "leads" && (
            <>
              <button
                disabled={loading}
                onClick={() => handleActionClick("change-status")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                Change status
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("assign-owner")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Assign owner
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("add-tag")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                Add tag
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("export")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                Export
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("delete")}
                className="px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}

          {/* Deals Actions */}
          {entityType === "deals" && (
            <>
              <button
                disabled={loading}
                onClick={() => handleActionClick("change-stage")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <GitCommit className="w-3.5 h-3.5 text-purple-500" />
                Change stage
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("assign-owner")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Assign owner
              </button>
              <button
                disabled={loading}
                onClick={() => handleActionClick("add-tag")}
                className="px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                Add tag
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal 1: Assign Owner */}
      <Modal
        isOpen={activeModal === "assign-owner"}
        onClose={handleCloseModal}
        title={`Assign Owner (${selectedCount} selected)`}
      >
        <form onSubmit={handleSubmitModal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Select or Type Owner Name
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul, Arun, Priya..."
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90"
            >
              {submitting ? "Updating..." : "Assign Owner"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Tag */}
      <Modal
        isOpen={activeModal === "add-tag"}
        onClose={handleCloseModal}
        title={`Add Tag to ${selectedCount} Records`}
      >
        <form onSubmit={handleSubmitModal} className="space-y-4">
          {tags.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Choose Existing Tag
              </label>
              <select
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Or enter new tag below --</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!selectedTagId && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  New Tag Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP, High Priority..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Tag Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-9 h-9 border-0 p-0 rounded-md cursor-pointer bg-transparent"
                  />
                  <span className="text-xs text-muted-foreground">{newTagColor}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!selectedTagId && !newTagName.trim())}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Tag"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Remove Tag */}
      <Modal
        isOpen={activeModal === "remove-tag"}
        onClose={handleCloseModal}
        title={`Remove Tag from ${selectedCount} Records`}
      >
        <form onSubmit={handleSubmitModal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Select Tag to Remove
            </label>
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Select Tag --</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedTagId}
              className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-md text-xs hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? "Removing..." : "Remove Tag"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Change Lead Status */}
      <Modal
        isOpen={activeModal === "change-status"}
        onClose={handleCloseModal}
        title={`Change Status for ${selectedCount} Leads`}
      >
        <form onSubmit={handleSubmitModal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Target Lead Status
            </label>
            <select
              value={selectedLeadStatus}
              onChange={(e) => setSelectedLeadStatus(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="LOST">Lost</option>
              <option value="CONVERTED">Converted</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90"
            >
              {submitting ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: Change Deal Stage */}
      <Modal
        isOpen={activeModal === "change-stage"}
        onClose={handleCloseModal}
        title={`Change Stage for ${selectedCount} Deals`}
      >
        <form onSubmit={handleSubmitModal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Target Deal Stage
            </label>
            <select
              value={selectedDealStage}
              onChange={(e) => setSelectedDealStage(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NEW">New (10% Prob)</option>
              <option value="QUALIFIED">Qualified (30% Prob)</option>
              <option value="PROPOSAL">Proposal (60% Prob)</option>
              <option value="NEGOTIATION">Negotiation (80% Prob)</option>
              <option value="WON">Won (100% Prob)</option>
              <option value="LOST">Lost (0% Prob)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90"
            >
              {submitting ? "Updating..." : "Update Stage"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 6: Delete Confirmation */}
      <ConfirmModal
        isOpen={activeModal === "delete"}
        onClose={handleCloseModal}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${selectedCount} Records`}
        message={`Are you sure you want to permanently delete these ${selectedCount} selected records? This action cannot be undone.`}
        loading={submitting}
      />
    </>
  );
}
