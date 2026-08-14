"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Users,
  Target,
  Clock,
  Award,
  Filter,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdvancedAnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"sales" | "leads" | "deals" | "team">("sales");

  // Filter States
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");

  // Data States
  const [salesData, setSalesData] = useState<any>(null);
  const [leadData, setLeadData] = useState<any>(null);
  const [dealData, setDealData] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let query = `?datePreset=${dateRange}`;
      if (selectedOwner) query += `&ownerId=${encodeURIComponent(selectedOwner)}`;
      if (selectedSource) query += `&leadSource=${encodeURIComponent(selectedSource)}`;
      if (selectedStage) query += `&dealStage=${encodeURIComponent(selectedStage)}`;

      const [salesRes, leadsRes, dealsRes, teamRes] = await Promise.all([
        fetch(`http://localhost:5000/api/v1/analytics/sales${query}`, { headers }),
        fetch(`http://localhost:5000/api/v1/analytics/leads${query}`, { headers }),
        fetch(`http://localhost:5000/api/v1/analytics/deals${query}`, { headers }),
        fetch(`http://localhost:5000/api/v1/analytics/team${query}`, { headers }),
      ]);

      const [salesJson, leadsJson, dealsJson, teamJson] = await Promise.all([
        salesRes.json(),
        leadsRes.json(),
        dealsRes.json(),
        teamRes.json(),
      ]);

      if (salesJson.success) setSalesData(salesJson.data);
      if (leadsJson.success) setLeadData(leadsJson.data);
      if (dealsJson.success) setDealData(dealsJson.data);
      if (teamJson.success) setTeamData(teamJson.data);
    } catch {
      setError("Failed to compile BI analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedOwner, selectedSource, selectedStage]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Executive CRM Intelligence & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time sales performance metrics, funnel conversion rates, pipeline velocity, and team leaderboards.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-3.5 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Aggregations
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-semibold text-muted-foreground">Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="p-1.5 rounded-md border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>

          {/* Lead Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="p-1.5 rounded-md border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Lead Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="REFERRAL">Referral</option>
            <option value="EMAIL">Email</option>
            <option value="COLD_CALL">Cold Call</option>
          </select>

          {/* Deal Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="p-1.5 rounded-md border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Deal Stages</option>
            <option value="NEW">New</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </div>

        {/* Section Tabs */}
        <div className="flex border border-border rounded-lg p-0.5 bg-muted/20 text-xs font-medium">
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "sales" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            Sales Overview
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "leads" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            Lead Analytics
          </button>
          <button
            onClick={() => setActiveTab("deals")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "deals" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            Deal Analytics
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "team" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            Team Performance
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {/* TAB 1: SALES OVERVIEW */}
      {activeTab === "sales" && salesData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Total Pipeline</span>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(salesData.totalPipeline)}</p>
              <p className="text-[11px] text-muted-foreground">{salesData.openDealsCount} active open deals</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Weighted Pipeline</span>
              <p className="text-2xl font-bold text-primary">{formatCurrency(salesData.weightedPipeline)}</p>
              <p className="text-[11px] text-muted-foreground">Probability weighted forecast</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Won Revenue</span>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(salesData.wonRevenue)}</p>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Closed won contracts
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Win Rate</span>
              <p className="text-2xl font-bold text-foreground">{salesData.winRate}%</p>
              <p className="text-[11px] text-muted-foreground">Avg cycle: {salesData.avgSalesCycleDays} days</p>
            </div>
          </div>

          {/* Detailed Sales Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Deal Value Metrics
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-muted/20 rounded-lg">
                  <span className="text-muted-foreground font-medium">Average Deal Size:</span>
                  <span className="font-bold text-foreground">{formatCurrency(salesData.avgDealValue)}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-muted/20 rounded-lg">
                  <span className="text-muted-foreground font-medium">Lost Revenue:</span>
                  <span className="font-bold text-rose-500">{formatCurrency(salesData.lostRevenue)}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-muted/20 rounded-lg">
                  <span className="text-muted-foreground font-medium">Average Sales Cycle:</span>
                  <span className="font-bold text-foreground">{salesData.avgSalesCycleDays} days to close</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue Health Status
              </h3>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <p className="font-bold text-emerald-700">Healthy Sales Pipeline Velocity</p>
                <p className="text-muted-foreground leading-relaxed">
                  Your team has achieved a <strong className="text-foreground">{salesData.winRate}%</strong> win rate with a weighted forecast of <strong className="text-foreground">{formatCurrency(salesData.weightedPipeline)}</strong> across active opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAD ANALYTICS */}
      {activeTab === "leads" && leadData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Total Leads</span>
              <p className="text-2xl font-bold text-foreground">{leadData.totalLeads}</p>
              <p className="text-[11px] text-muted-foreground">{leadData.newLeads} new leads</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Qualified Leads</span>
              <p className="text-2xl font-bold text-blue-600">{leadData.qualifiedLeads}</p>
              <p className="text-[11px] text-muted-foreground">Sales ready leads</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Converted Leads</span>
              <p className="text-2xl font-bold text-emerald-600">{leadData.convertedLeads}</p>
              <p className="text-[11px] text-muted-foreground">Converted to Contact/Deal</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Conversion Rate</span>
              <p className="text-2xl font-bold text-foreground">{leadData.conversionRate}%</p>
              <p className="text-[11px] text-muted-foreground">{leadData.lostLeads} lost leads</p>
            </div>
          </div>

          {/* Lead Source & Status Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Leads by Source
              </h3>
              <div className="space-y-2 text-xs">
                {Object.entries(leadData.bySource || {}).map(([source, count]) => (
                  <div key={source} className="flex justify-between items-center p-2.5 bg-muted/20 rounded-lg">
                    <span className="font-medium text-foreground">{source}</span>
                    <span className="font-bold text-primary">{count as number} leads</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-500" /> Leads by Status
              </h3>
              <div className="space-y-2 text-xs">
                {Object.entries(leadData.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center p-2.5 bg-muted/20 rounded-lg">
                    <span className="font-medium text-foreground">{status}</span>
                    <span className="font-bold text-foreground">{count as number} leads</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEAL ANALYTICS */}
      {activeTab === "deals" && dealData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Total Deals</span>
              <p className="text-2xl font-bold text-foreground">{dealData.totalDeals}</p>
              <p className="text-[11px] text-muted-foreground">All stage opportunities</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Average Deal Size</span>
              <p className="text-2xl font-bold text-primary">{formatCurrency(dealData.avgDealSize)}</p>
              <p className="text-[11px] text-muted-foreground">Average opportunity value</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Closing This Month</span>
              <p className="text-2xl font-bold text-amber-600">{dealData.dealsClosingThisMonth}</p>
              <p className="text-[11px] text-muted-foreground">Expected close before month end</p>
            </div>
          </div>

          {/* Pipeline Stage Breakdown */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Pipeline Value & Count by Stage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {Object.entries(dealData.byStage || {}).map(([stage, item]: any) => (
                <div key={stage} className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1">
                  <span className="font-bold text-foreground text-xs uppercase">{stage}</span>
                  <p className="text-base font-extrabold text-primary">{formatCurrency(item.value)}</p>
                  <p className="text-[11px] text-muted-foreground">{item.count} deals</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SALES TEAM PERFORMANCE */}
      {activeTab === "team" && teamData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Sales Representative Performance Leaderboard
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Sales Rep</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Leads Assigned</th>
                    <th className="py-3 px-4">Leads Converted</th>
                    <th className="py-3 px-4">Deals Created</th>
                    <th className="py-3 px-4">Deals Won</th>
                    <th className="py-3 px-4">Revenue Won</th>
                    <th className="py-3 px-4">Pipeline Value</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Tasks Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teamData.teamPerformance?.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        No team member records found.
                      </td>
                    </tr>
                  ) : (
                    teamData.teamPerformance?.map((item: any) => (
                      <tr key={item.userId} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                              {item.name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground">
                          {item.role}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">{item.leadsAssigned}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">{item.leadsConverted}</td>
                        <td className="py-3 px-4 text-foreground">{item.dealsCreated}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">{item.dealsWon}</td>
                        <td className="py-3 px-4 font-extrabold text-emerald-600">{formatCurrency(item.revenueWon)}</td>
                        <td className="py-3 px-4 font-semibold text-primary">{formatCurrency(item.pipelineValue)}</td>
                        <td className="py-3 px-4 font-bold text-foreground">{item.winRate}%</td>
                        <td className="py-3 px-4 text-muted-foreground">{item.tasksCompleted}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
