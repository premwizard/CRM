"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Layers,
  Filter,
  Users,
  Building2,
  Target,
  Briefcase,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  DollarSign,
  Tag as TagIcon,
  ArrowRight,
  Eye,
} from "lucide-react";

export interface Segment {
  id: string;
  name: string;
  description?: string | null;
  entityType: "CONTACT" | "COMPANY" | "LEAD" | "DEAL";
  filterConfig: Record<string, any>;
  createdAt: string;
}

interface TagOption {
  id: string;
  name: string;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Segment Execution Result State
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
  const [executionRecords, setExecutionRecords] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingSegmentId, setDeletingSegmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState<"CONTACT" | "COMPANY" | "LEAD" | "DEAL">("LEAD");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [minVal, setMinVal] = useState("");

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/segments");
      const data = await res.json();
      if (data.success) {
        setSegments(data.data.segments || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/v1/tags");
      const data = await res.json();
      if (data.success) {
        setTags(data.data.tags || []);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchSegments();
    fetchTags();
  }, []);

  const handleOpenCreateModal = () => {
    setName("");
    setDescription("");
    setEntityType("LEAD");
    setSelectedTagId("");
    setSelectedStatus("");
    setSelectedStage("");
    setMinVal("");
    setIsCreateModalOpen(true);
  };

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const filterConfig: Record<string, any> = {};
      if (selectedTagId) filterConfig.tagId = selectedTagId;
      if (selectedStatus) filterConfig.status = selectedStatus;
      if (selectedStage) filterConfig.stage = selectedStage;
      if (minVal) filterConfig.minVal = Number(minVal);

      const res = await fetch("/api/v1/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          entityType,
          filterConfig,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        fetchSegments();
      }
    } catch {
      setSaving(false);
    }
  };

  const handleRunSegment = async (segment: Segment) => {
    setActiveSegment(segment);
    setExecuting(true);
    try {
      const res = await fetch(`/api/v1/segments/${segment.id}/results`);
      const data = await res.json();
      if (data.success) {
        setExecutionRecords(data.data.records || []);
      }
    } catch {
      setExecutionRecords([]);
    } finally {
      setExecuting(false);
    }
  };

  const handleDeleteSegment = async () => {
    if (!deletingSegmentId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/segments/${deletingSegmentId}`, {
        method: "DELETE",
      });
      setSaving(false);
      if (res.ok) {
        if (activeSegment?.id === deletingSegmentId) {
          setActiveSegment(null);
          setExecutionRecords([]);
        }
        setDeletingSegmentId(null);
        fetchSegments();
      }
    } catch {
      setSaving(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "CONTACT":
        return <Users className="w-4 h-4 text-purple-500" />;
      case "COMPANY":
        return <Building2 className="w-4 h-4 text-emerald-500" />;
      case "LEAD":
        return <Target className="w-4 h-4 text-blue-500" />;
      case "DEAL":
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      default:
        return <Layers className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Customer Segments"
        description="Create dynamic target segments, store filter configurations, and reopen saved rules to evaluate live PostgreSQL records."
        actionText="Create Segment"
        onAction={handleOpenCreateModal}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Segments Sidebar List */}
        <div className="bg-card p-5 rounded-lg border border-border space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Saved Segments
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">
              {segments.length} Saved
            </span>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
              Loading saved segments...
            </div>
          ) : segments.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg space-y-1">
              <Layers className="w-6 h-6 text-muted-foreground mx-auto opacity-30" />
              <p className="font-medium text-foreground">No segments saved yet.</p>
              <p>Click "Create Segment" to configure target rule sets.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {segments.map((seg) => {
                const isActive = activeSegment?.id === seg.id;
                return (
                  <div
                    key={seg.id}
                    className={`p-3.5 rounded-lg border transition-all space-y-2 cursor-pointer group ${
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40 bg-background"
                    }`}
                    onClick={() => handleRunSegment(seg)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                        {getEntityIcon(seg.entityType)}
                        <span className="group-hover:text-primary transition-colors">
                          {seg.name}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSegmentId(seg.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 rounded transition-opacity"
                        title="Delete segment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {seg.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {seg.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                      <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded font-bold uppercase text-[10px]">
                        {seg.entityType}
                      </span>
                      <span className="flex items-center gap-1 text-primary font-semibold">
                        <Play className="w-3 h-3" /> Run Segment
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Segment Results Main Panel */}
        <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border space-y-4 shadow-xs min-h-[500px]">
          {!activeSegment ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Select or Run a Customer Segment
              </h3>
              <p className="text-xs max-w-md">
                Click on any saved segment rule on the left panel to execute real-time PostgreSQL queries and view live matching records.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Segment Execution Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getEntityIcon(activeSegment.entityType)}
                    <h2 className="text-lg font-extrabold text-foreground">
                      {activeSegment.name}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-bold uppercase">
                      {activeSegment.entityType}
                    </span>
                  </div>
                  {activeSegment.description && (
                    <p className="text-xs text-muted-foreground">
                      {activeSegment.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRunSegment(activeSegment)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Re-evaluate Records
                  </button>
                </div>
              </div>

              {/* Matching Live Records Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>
                    Matching Records Found:{" "}
                    <strong className="text-foreground">
                      {executionRecords.length}
                    </strong>
                  </span>
                  <span>Evaluated Live from Database</span>
                </div>

                {executing ? (
                  <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                    Evaluating PostgreSQL segment rules...
                  </div>
                ) : executionRecords.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                    No matching records found for this segment configuration.
                  </div>
                ) : (
                  <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                    {executionRecords.map((rec) => {
                      let title = "";
                      let subtitle = "";
                      let linkUrl = "";

                      if (activeSegment.entityType === "CONTACT") {
                        title = `${rec.firstName} ${rec.lastName}`;
                        subtitle = rec.email || rec.company?.name || "Contact";
                        linkUrl = `/contacts/${rec.id}`;
                      } else if (activeSegment.entityType === "COMPANY") {
                        title = rec.name;
                        subtitle = rec.industry || rec.website || "Company Account";
                        linkUrl = `/companies/${rec.id}`;
                      } else if (activeSegment.entityType === "LEAD") {
                        title = rec.name;
                        subtitle = `Status: ${rec.status} | Value: $${rec.value ? rec.value.toLocaleString() : "0"}`;
                        linkUrl = `/leads/${rec.id}`;
                      } else if (activeSegment.entityType === "DEAL") {
                        title = rec.name;
                        subtitle = `Stage: ${rec.stage} | Value: $${rec.value ? rec.value.toLocaleString() : "0"}`;
                        linkUrl = `/deals/${rec.id}`;
                      }

                      return (
                        <div
                          key={rec.id}
                          className="p-3.5 bg-background hover:bg-accent/40 transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <Link
                              href={linkUrl}
                              className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                            >
                              <span>{title}</span>
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {subtitle}
                            </p>

                            {/* Tag badges */}
                            {rec.tags && rec.tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                {rec.tags.map((t: any) => (
                                  <span
                                    key={t.tag.id}
                                    style={{
                                      backgroundColor: `${t.tag.color || "#3B82F6"}15`,
                                      color: t.tag.color || "#3B82F6",
                                      borderColor: `${t.tag.color || "#3B82F6"}30`,
                                    }}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                  >
                                    {t.tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <Link
                            href={linkUrl}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Segment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Saved Customer Segment"
      >
        <form onSubmit={handleSaveSegment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Segment Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. High Value Leads / Enterprise Customers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Target rule intent or description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Target Entity Type *
            </label>
            <select
              value={entityType}
              onChange={(e) =>
                setEntityType(
                  e.target.value as "CONTACT" | "COMPANY" | "LEAD" | "DEAL",
                )
              }
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="LEAD">Leads</option>
              <option value="DEAL">Deals</option>
              <option value="CONTACT">Contacts</option>
              <option value="COMPANY">Companies</option>
            </select>
          </div>

          {/* Filter Rule Builders */}
          <div className="bg-muted/40 p-3.5 rounded-lg border border-border space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Filter Rules Configuration
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Tag Filter
                </label>
                <select
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">-- Any Tag --</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {entityType === "LEAD" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Lead Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">-- Any Status --</option>
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="LOST">LOST</option>
                    <option value="CONVERTED">CONVERTED</option>
                  </select>
                </div>
              )}

              {entityType === "DEAL" && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">-- Any Stage --</option>
                    <option value="NEW">NEW</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="PROPOSAL">PROPOSAL</option>
                    <option value="NEGOTIATION">NEGOTIATION</option>
                    <option value="WON">WON</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>
              )}

              {(entityType === "LEAD" || entityType === "DEAL") && (
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Minimum Value ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={minVal}
                    onChange={(e) => setMinVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-background border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-sm hover:bg-primary/90 transition-colors shadow-xs"
            >
              {saving ? "Saving..." : "Save Segment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deletingSegmentId)}
        onClose={() => setDeletingSegmentId(null)}
        onConfirm={handleDeleteSegment}
        title="Delete Customer Segment"
        message="Are you sure you want to delete this saved segment configuration?"
        loading={saving}
      />
    </div>
  );
}
