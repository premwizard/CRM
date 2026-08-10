"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
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
} from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalContacts: 0,
    totalCompanies: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalDealValue: 0,
  });
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

      if (dashData.success && dashData.data?.metrics) {
        setMetrics(dashData.data.metrics);
      }

      // Compute live stage pipeline chart
      if (dealsData.success && dealsData.data?.deals) {
        const stageMap: Record<string, number> = {};
        dealsData.data.deals.forEach((d: { stage: string; value: number }) => {
          stageMap[d.stage] = (stageMap[d.stage] || 0) + (d.value || 0);
        });
        const formattedPipeline = Object.entries(stageMap).map(
          ([stage, value]) => ({ stage, value }),
        );
        setPipelineChartData(formattedPipeline);
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

  const formattedDealValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(metrics.totalDealValue);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard Overview"
          description="Live CRM metrics and interactive sales analytics charts."
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          title="Pipeline Value"
          value={loading ? "..." : formattedDealValue}
          icon={DollarSign}
        />
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Pipeline Bar Chart */}
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

        {/* Lead Status Pie Chart */}
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
