"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Award,
  XCircle,
  BarChart2,
  Users,
  Calendar,
  Layers,
  Percent,
} from "lucide-react";

export interface ForecastMetrics {
  totalPipeline: number;
  weightedPipeline: number;
  wonRevenue: number;
  lostRevenue: number;
}

export interface BreakdownItem {
  stage?: string;
  category?: string;
  owner?: string;
  month?: string;
  count: number;
  totalValue: number;
  weightedValue: number;
}

export interface ForecastData {
  metrics: ForecastMetrics;
  breakdowns: {
    byStage: BreakdownItem[];
    byCategory: BreakdownItem[];
    byOwner: BreakdownItem[];
    byMonth: BreakdownItem[];
  };
}

export function SalesForecastAnalytics() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "stage" | "category" | "owner" | "month"
  >("category");

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/deals/forecast");
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground animate-pulse border border-border rounded-lg bg-card">
        Loading sales forecast analytics & weighted pipeline calculations...
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalPipeline: 0,
    weightedPipeline: 0,
    wonRevenue: 0,
    lostRevenue: 0,
  };

  const getActiveBreakdownList = () => {
    if (!data?.breakdowns) return [];
    switch (activeTab) {
      case "stage":
        return data.breakdowns.byStage.map((i) => ({
          label: i.stage || "Unknown",
          ...i,
        }));
      case "category":
        return data.breakdowns.byCategory.map((i) => ({
          label: i.category || "Unknown",
          ...i,
        }));
      case "owner":
        return data.breakdowns.byOwner.map((i) => ({
          label: i.owner || "Unassigned",
          ...i,
        }));
      case "month":
        return data.breakdowns.byMonth.map((i) => ({
          label: i.month || "Unscheduled",
          ...i,
        }));
    }
  };

  const activeList = getActiveBreakdownList();

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <div className="bg-card p-5 rounded-lg border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Pipeline
            </span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {formatCurrency(metrics.totalPipeline)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Gross unweighted opportunity value
          </p>
        </div>

        {/* Weighted Pipeline */}
        <div className="bg-card p-5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Weighted Pipeline 🎯
            </span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">
            {formatCurrency(metrics.weightedPipeline)}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            Probability-adjusted expected revenue (Value × Prob %)
          </p>
        </div>

        {/* Won Revenue */}
        <div className="bg-card p-5 rounded-lg border border-green-500/30 bg-green-500/5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-green-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Won Revenue ✅
            </span>
            <Award className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-extrabold text-green-900">
            {formatCurrency(metrics.wonRevenue)}
          </div>
          <p className="text-[11px] text-green-700 font-medium">
            Closed-won deal financial total
          </p>
        </div>

        {/* Lost Revenue */}
        <div className="bg-card p-5 rounded-lg border border-red-500/30 bg-red-500/5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Lost Revenue ❌
            </span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-900">
            {formatCurrency(metrics.lostRevenue)}
          </div>
          <p className="text-[11px] text-red-700 font-medium">
            Closed-lost deal financial volume
          </p>
        </div>
      </div>

      {/* Breakdown Analytics Matrix */}
      <div className="bg-card p-6 rounded-lg border border-border space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-foreground text-base">
                Pipeline Analytics & Forecast Matrix
              </h3>
              <p className="text-xs text-muted-foreground">
                Server-calculated breakdown comparing gross value against probability-weighted value.
              </p>
            </div>
          </div>

          {/* Breakdown Tabs */}
          <div className="flex items-center bg-muted p-1 rounded-md border border-border text-xs font-semibold">
            <button
              onClick={() => setActiveTab("category")}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                activeTab === "category"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Category
            </button>
            <button
              onClick={() => setActiveTab("stage")}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                activeTab === "stage"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Stage
            </button>
            <button
              onClick={() => setActiveTab("owner")}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                activeTab === "owner"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Owner
            </button>
            <button
              onClick={() => setActiveTab("month")}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                activeTab === "month"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Month
            </button>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Group Name</th>
                <th className="px-4 py-3">Deals Count</th>
                <th className="px-4 py-3">Total Value</th>
                <th className="px-4 py-3">Weighted Value (Value × Prob %)</th>
                <th className="px-4 py-3">% of Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeList.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No breakdown data recorded yet.
                  </td>
                </tr>
              ) : (
                activeList.map((row, idx) => {
                  const pct =
                    metrics.totalPipeline > 0
                      ? Math.round(
                          (row.totalValue / metrics.totalPipeline) * 100,
                        )
                      : 0;

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-bold text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {row.label}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-muted-foreground">
                        {row.count} deals
                      </td>
                      <td className="px-4 py-3.5 font-bold text-foreground">
                        {formatCurrency(row.totalValue)}
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-amber-600 bg-amber-500/5">
                        {formatCurrency(row.weightedValue)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted h-2 rounded-full overflow-hidden border border-border">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
