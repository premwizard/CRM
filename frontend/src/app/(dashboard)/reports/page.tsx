"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  PipelineBarChart,
  LeadStatusPieChart,
} from "@/components/charts/crm-charts";
import {
  BarChart3,
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Users,
  Building2,
  Target,
  DollarSign,
  BarChart2,
  PieChart as PieIcon,
} from "lucide-react";

interface ReportData {
  reportId: string;
  title: string;
  generatedAt: string;
  summary: {
    totalContacts: number;
    totalCompanies: number;
    totalLeads: number;
    totalDeals: number;
    totalDealValue: number;
    averageDealValue: number;
  };
  leadBreakdown: Record<string, number>;
  dealBreakdown: Record<string, number>;
  insights: string[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/v1/reports/generate");
      const data = await res.json();
      if (data.success && data.data?.report) {
        setReport(data.data.report);
      }
    } catch {
      // Error handling
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Generate executive CRM summaries, pipeline reports, and database metrics with interactive charts."
        actionText={generating ? "Generating..." : "Generate Sample Report"}
        onAction={handleGenerateReport}
        icon={BarChart3}
      />

      {!report ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg bg-card text-center my-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Interactive Sample Report Generator
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            Click "Generate Sample Report" to run a live database analysis with
            visual bar charts and breakdown diagrams.
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-primary/90 transition-colors shadow-xs"
          >
            <RefreshCw
              className={`w-4 h-4 ${generating ? "animate-spin" : ""}`}
            />
            <span>
              {generating ? "Compiling Analytics..." : "Generate Sample Report"}
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="bg-card border border-border rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Live Report Generated · {report.reportId}</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {report.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Timestamp: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4" />
              Print / Export Report
            </button>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Contacts"
              value={report.summary.totalContacts}
              icon={Users}
            />
            <StatCard
              title="Registered Companies"
              value={report.summary.totalCompanies}
              icon={Building2}
            />
            <StatCard
              title="Total Leads"
              value={report.summary.totalLeads}
              icon={Target}
            />
            <StatCard
              title="Pipeline Value"
              value={`$${report.summary.totalDealValue.toLocaleString()}`}
              icon={DollarSign}
            />
          </div>

          {/* Interactive Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-lg border border-border bg-card shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <BarChart2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">
                  Pipeline Stage Financial Breakdown
                </h3>
              </div>
              <PipelineBarChart
                data={Object.entries(report.dealBreakdown).map(
                  ([stage, count]) => ({
                    stage,
                    value: count * 15000,
                  }),
                )}
              />
            </div>

            <div className="p-6 rounded-lg border border-border bg-card shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <PieIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">
                  Lead Status Ratio
                </h3>
              </div>
              <LeadStatusPieChart
                data={Object.entries(report.leadBreakdown).map(
                  ([status, count]) => ({
                    status,
                    count,
                  }),
                )}
              />
            </div>
          </div>

          {/* Executive Takeaways */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-base">
                Key Executive Takeaways
              </h3>
            </div>
            <ul className="space-y-3">
              {report.insights.map((insight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-foreground bg-secondary/30 p-3 rounded-md border border-border/40"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
