"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SalesForecastAnalytics } from "@/components/deals/sales-forecast-analytics";
import {
  PipelineBarChart,
  LeadStatusPieChart,
} from "@/components/charts/crm-charts";
import {
  Users,
  Building2,
  Target,
  DollarSign,
  Activity,
  RefreshCw,
  BarChart2,
  PieChart as PieIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Briefcase,
  Calendar,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface FollowUpItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: string;
  status: string;
  contact?: { id: string; firstName: string; lastName: string } | null;
  company?: { id: string; name: string } | null;
  lead?: { id: string; name: string } | null;
  deal?: { id: string; name: string; value?: number } | null;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalContacts: 0,
    totalCompanies: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalDealValue: 0,
    weightedDealValue: 0,
  });
  const [todaysFollowUps, setTodaysFollowUps] = useState<FollowUpItem[]>([]);
  const [pipelineChartData, setPipelineChartData] = useState<
    { stage: string; value: number }[]
  >([]);
  const [leadChartData, setLeadChartData] = useState<
    { status: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [dashRes, dealsRes, leadsRes] = await Promise.all([
        fetch("/api/v1/dashboard"),
        fetch("/api/v1/deals"),
        fetch("/api/v1/leads"),
      ]);

      const dashData = await dashRes.json();
      const dealsData = await dealsRes.json();
      const leadsData = await leadsRes.json();

      let weightedSum = 0;

      // Compute live stage pipeline chart and weighted pipeline
      if (dealsData.success && dealsData.data?.deals) {
        const stageMap: Record<string, number> = {};
        dealsData.data.deals.forEach(
          (d: { stage: string; value: number; probability?: number }) => {
            stageMap[d.stage] = (stageMap[d.stage] || 0) + (d.value || 0);
            const prob = d.probability ?? 50;
            weightedSum += (d.value || 0) * (prob / 100);
          },
        );
        const formattedPipeline = Object.entries(stageMap).map(
          ([stage, value]) => ({ stage, value }),
        );
        setPipelineChartData(formattedPipeline);
      }

      if (dashData.success && dashData.data?.metrics) {
        setMetrics({
          ...dashData.data.metrics,
          weightedDealValue: weightedSum,
        });
        setTodaysFollowUps(dashData.data.todaysFollowUps || []);
      }

      // Compute live lead status pie chart
      if (leadsData.success && leadsData.data?.leads) {
        const statusMap: Record<string, number> = {};
        leadsData.data.leads.forEach((l: { status: string }) => {
          statusMap[l.status] = (statusMap[l.status] || 0) + 1;
        });
        const formattedLeads = Object.entries(statusMap).map(
          ([status, count]) => ({ status, count }),
        );
        setLeadChartData(formattedLeads);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        fetchMetrics();
      }
    } catch {
      // Fallback
    }
  };

  const formattedDealValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(metrics.totalDealValue);

  const formattedWeightedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(metrics.weightedDealValue);

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "HIGH":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold";
      case "MEDIUM":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Executive Dashboard & Sales Forecast"
          description="Live CRM metrics, weighted pipeline forecasting, follow-up schedule, and analytics."
        />
        <button
          onClick={fetchMetrics}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-semibold hover:bg-accent transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Analytics
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Contacts"
          value={loading ? "..." : metrics.totalContacts}
          icon={Users}
        />
        <StatCard
          title="Companies"
          value={loading ? "..." : metrics.totalCompanies}
          icon={Building2}
        />
        <StatCard
          title="Total Leads"
          value={loading ? "..." : metrics.totalLeads}
          icon={Target}
        />
        <StatCard
          title="Total Deals"
          value={loading ? "..." : metrics.totalDeals}
          icon={Activity}
        />
        <StatCard
          title="Total Pipeline"
          value={loading ? "..." : formattedDealValue}
          icon={DollarSign}
        />
        <StatCard
          title="Weighted Pipeline 🎯"
          value={loading ? "..." : formattedWeightedValue}
          icon={TrendingUp}
        />
      </div>

      {/* Sales Forecast Matrix Component */}
      <SalesForecastAnalytics />

      {/* Today's Follow-ups Section Widget */}
      <div className="bg-card p-6 rounded-lg border border-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-foreground text-base">
                Today's Follow-ups & Action Items
              </h3>
              <p className="text-xs text-muted-foreground">
                Scheduled follow-ups and active tasks requiring immediate sales action.
              </p>
            </div>
          </div>
          <Link
            href="/tasks"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View All Tasks
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
            Loading follow-up schedule...
          </div>
        ) : todaysFollowUps.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground space-y-1 border border-dashed border-border rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
            <p className="text-sm font-medium text-foreground">
              All caught up! No pending follow-ups for today.
            </p>
            <p className="text-xs">
              Log an interaction with outcome "Follow-up Required" to schedule next actions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {todaysFollowUps.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-background hover:bg-accent/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {item.title}
                    </span>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase ${getPriorityBadgeClass(
                        item.priority,
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-4 text-xs text-muted-foreground">
                    {item.contact ? (
                      <Link
                        href={`/contacts/${item.contact.id}`}
                        className="inline-flex items-center gap-1 text-purple-600 font-semibold hover:underline"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {item.contact.firstName} {item.contact.lastName}
                      </Link>
                    ) : item.company ? (
                      <Link
                        href={`/companies/${item.company.id}`}
                        className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {item.company.name}
                      </Link>
                    ) : item.lead ? (
                      <Link
                        href={`/leads/${item.lead.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                      >
                        <Target className="w-3.5 h-3.5" />
                        {item.lead.name}
                      </Link>
                    ) : null}

                    {item.deal && (
                      <Link
                        href={`/deals/${item.deal.id}`}
                        className="inline-flex items-center gap-1 text-amber-600 font-semibold hover:underline"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        {item.deal.name}
                        {item.deal.value ? ` ($${item.deal.value.toLocaleString()})` : ""}
                      </Link>
                    )}

                    {item.dueDate && (
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>
                          Due:{" "}
                          {new Date(item.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleCompleteTask(item.id)}
                  className="px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 text-xs font-semibold rounded-md transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Done
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-lg border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-base">
                Pipeline Stage Value Distribution
              </h3>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
              Live Data
            </span>
          </div>
          <PipelineBarChart data={pipelineChartData} />
        </div>

        <div className="p-6 rounded-lg border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-base">
                Lead Conversion Status
              </h3>
            </div>
          </div>
          <LeadStatusPieChart data={leadChartData} />
        </div>
      </div>
    </div>
  );
}
