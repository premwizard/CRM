"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Building2,
  UserCheck,
  Calendar,
  User,
  Edit2,
  Trash2,
  Eye,
  Plus,
  Percent,
  TrendingUp,
  Layers,
} from "lucide-react";

export interface KanbanDeal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability?: number | null;
  forecastCategory?: string | null;
  owner?: string | null;
  expectedCloseDate?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  company?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
}

interface DealKanbanBoardProps {
  deals: KanbanDeal[];
  onStageChange: (dealId: string, newStage: string) => void;
  onEditDeal: (deal: KanbanDeal) => void;
  onDeleteDeal: (deal: KanbanDeal) => void;
  onCreateDealInStage?: (stage: string) => void;
}

const STAGES = [
  { id: "NEW", title: "New", color: "border-blue-500 text-blue-500 bg-blue-500/10" },
  { id: "QUALIFIED", title: "Qualified", color: "border-indigo-500 text-indigo-500 bg-indigo-500/10" },
  { id: "PROPOSAL", title: "Proposal", color: "border-amber-500 text-amber-500 bg-amber-500/10" },
  { id: "NEGOTIATION", title: "Negotiation", color: "border-purple-500 text-purple-500 bg-purple-500/10" },
  { id: "WON", title: "Won", color: "border-emerald-500 text-emerald-500 bg-emerald-500/10" },
  { id: "LOST", title: "Lost", color: "border-red-500 text-red-500 bg-red-500/10" },
];

export function DealKanbanBoard({
  deals,
  onStageChange,
  onEditDeal,
  onDeleteDeal,
  onCreateDealInStage,
}: DealKanbanBoardProps) {
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const totalPipelineValue = deals.reduce(
    (sum, deal) => sum + (deal.value || 0),
    0,
  );

  const weightedPipelineValue = deals.reduce((sum, deal) => {
    const val = deal.value || 0;
    const prob = deal.probability ?? 50;
    return sum + val * (prob / 100);
  }, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData("text/plain", dealId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData("text/plain") || draggedDealId;
    if (dealId) {
      onStageChange(dealId, targetStage);
    }
    setDraggedDealId(null);
  };

  const getCategoryBadgeClass = (category?: string | null) => {
    switch (category) {
      case "COMMIT":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold";
      case "BEST_CASE":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "CLOSED":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Total & Weighted Pipeline Header Card */}
      <div className="bg-card p-4 rounded-lg border border-border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Pipeline
              </div>
              <div className="text-xl font-extrabold text-foreground">
                {formatCurrency(totalPipelineValue)}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                Weighted Pipeline
              </div>
              <div className="text-xl font-extrabold text-amber-900">
                {formatCurrency(weightedPipelineValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
          <div>
            Total Opportunities:{" "}
            <span className="font-bold text-foreground">{deals.length}</span>
          </div>
          <div>
            Active Stages:{" "}
            <span className="font-bold text-foreground">6 Stages</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageTotal = stageDeals.reduce(
            (sum, d) => sum + (d.value || 0),
            0,
          );
          const stageWeighted = stageDeals.reduce((sum, d) => {
            const val = d.value || 0;
            const prob = d.probability ?? 50;
            return sum + val * (prob / 100);
          }, 0);

          const isOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`bg-card/70 border rounded-lg p-3 space-y-3 min-h-[500px] flex flex-col transition-all ${
                isOver
                  ? "border-primary ring-2 ring-primary/20 bg-accent/40"
                  : "border-border"
              }`}
            >
              {/* Stage Header */}
              <div className="border-b border-border/70 pb-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 text-xs font-extrabold uppercase rounded border ${stage.color}`}
                  >
                    {stage.title}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="text-xs font-bold text-foreground pt-1">
                  {formatCurrency(stageTotal)}
                </div>
                <div className="text-[11px] font-semibold text-amber-600">
                  W: {formatCurrency(stageWeighted)}
                </div>
              </div>

              {/* Deals Stream Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[700px] pr-1">
                {stageDeals.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-md">
                    No deals
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const isDragging = draggedDealId === deal.id;
                    const prob = deal.probability ?? 50;
                    const weightedVal = (deal.value || 0) * (prob / 100);

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className={`bg-background border border-border p-3.5 rounded-lg space-y-2.5 shadow-2xs hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group ${
                          isDragging ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Title & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/deals/${deal.id}`}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {deal.name}
                          </Link>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditDeal(deal)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded"
                              title="Edit Deal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteDeal(deal)}
                              className="p-1 text-muted-foreground hover:text-red-500 rounded"
                              title="Delete Deal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Value & Forecast Category */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-extrabold text-foreground">
                              {formatCurrency(deal.value || 0)}
                            </span>

                            {deal.forecastCategory && (
                              <span
                                className={`px-1.5 py-0.5 text-[10px] uppercase rounded border ${getCategoryBadgeClass(
                                  deal.forecastCategory,
                                )}`}
                              >
                                {deal.forecastCategory.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>

                          {/* Weighted Value Pill */}
                          <div className="flex items-center justify-between text-[11px] text-amber-700 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20 font-semibold">
                            <span>Weighted: {formatCurrency(weightedVal)}</span>
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <Percent className="w-2.5 h-2.5" />
                              {prob}%
                            </span>
                          </div>
                        </div>

                        {/* Relations info */}
                        <div className="space-y-1 text-xs text-muted-foreground border-t border-border/50 pt-2">
                          {deal.company && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{deal.company.name}</span>
                            </div>
                          )}

                          {deal.contact && (
                            <div className="flex items-center gap-1.5 truncate">
                              <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span className="truncate">
                                {deal.contact.firstName} {deal.contact.lastName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Footer: Date & Owner */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                          {deal.expectedCloseDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-primary" />
                              <span>
                                {new Date(deal.expectedCloseDate).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            </div>
                          ) : (
                            <span />
                          )}

                          {deal.owner && (
                            <div className="flex items-center gap-1 font-medium">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[80px]">
                                {deal.owner}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add deal to column button */}
              {onCreateDealInStage && (
                <button
                  onClick={() => onCreateDealInStage(stage.id)}
                  className="w-full py-1.5 border border-dashed border-border/80 hover:border-primary text-xs font-semibold text-muted-foreground hover:text-primary rounded-md transition-colors flex items-center justify-center gap-1 mt-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Deal
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
