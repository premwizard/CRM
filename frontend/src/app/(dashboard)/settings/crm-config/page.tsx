"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Sliders,
  ShieldAlert,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Tag as TagIcon,
  Globe,
  DollarSign,
  Briefcase,
  Layers,
  Calendar,
} from "lucide-react";

export default function CrmConfigPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "leads" | "sources" | "deals" | "activities" | "tasks" | "general"
  >("leads");

  const role = user?.role?.toUpperCase() || "USER";
  const isAuthorized = role === "ADMIN" || role === "OWNER";

  const [config, setConfig] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form input states
  const [newLeadStatus, setNewLeadStatus] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("");
  const [newDealStage, setNewDealStage] = useState("");
  const [newDealProb, setNewDealProb] = useState("50");
  const [newActivityType, setNewActivityType] = useState("");

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:5000/api/v1/crm-config", { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setConfig(json.data.config || {});
        setTags(json.data.tags || []);
      } else {
        setError(json.error || "Failed to load CRM configuration");
      }
    } catch {
      setError("Network error loading CRM configuration");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async (updatedFields: any) => {
    if (!isAuthorized) return;
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:5000/api/v1/crm-config", {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedFields),
      });

      const json = await res.json();
      if (json.success && json.data?.config) {
        setConfig(json.data.config);
        setSuccessMessage("CRM Configuration saved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(json.error || "Failed to save configuration");
      }
    } catch {
      setError("Error saving CRM configuration");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for Lead Statuses
  const handleAddLeadStatus = () => {
    if (!newLeadStatus.trim() || !config) return;
    const cleanName = newLeadStatus.trim().toUpperCase();
    const existingList = config.leadStatuses || [];
    const newItem = {
      id: cleanName.toLowerCase().replace(/\s+/g, "_"),
      name: cleanName,
      order: existingList.length + 1,
      isActive: true,
    };
    const updated = [...existingList, newItem];
    setConfig({ ...config, leadStatuses: updated });
    setNewLeadStatus("");
    handleSaveConfig({ leadStatuses: updated });
  };

  const handleToggleLeadStatus = (index: number) => {
    const list = [...(config.leadStatuses || [])];
    list[index].isActive = !list[index].isActive;
    setConfig({ ...config, leadStatuses: list });
    handleSaveConfig({ leadStatuses: list });
  };

  // Handlers for Lead Sources
  const handleAddLeadSource = () => {
    if (!newLeadSource.trim() || !config) return;
    const cleanName = newLeadSource.trim().toUpperCase();
    const existingList = config.leadSources || [];
    const newItem = {
      id: cleanName.toLowerCase().replace(/\s+/g, "_"),
      name: cleanName,
      order: existingList.length + 1,
      isActive: true,
    };
    const updated = [...existingList, newItem];
    setConfig({ ...config, leadSources: updated });
    setNewLeadSource("");
    handleSaveConfig({ leadSources: updated });
  };

  // Handlers for Deal Stages
  const handleAddDealStage = () => {
    if (!newDealStage.trim() || !config) return;
    const cleanName = newDealStage.trim().toUpperCase();
    const existingList = config.dealStages || [];
    const newItem = {
      id: cleanName.toLowerCase().replace(/\s+/g, "_"),
      name: cleanName,
      order: existingList.length + 1,
      probability: parseInt(newDealProb, 10) || 50,
      isActive: true,
    };
    const updated = [...existingList, newItem];
    setConfig({ ...config, dealStages: updated });
    setNewDealStage("");
    handleSaveConfig({ dealStages: updated });
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center border border-red-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Organization CRM Configuration is restricted to Organization Owners and Administrators. Please contact your administrator to request changes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="w-6 h-6 text-primary" />
            CRM Configuration & Terminology
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize pipeline stages, lead statuses, sources, activity types, and general settings for your organization.
          </p>
        </div>

        <button
          onClick={fetchConfig}
          className="px-3.5 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Settings
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-b border-border text-xs font-semibold gap-2">
        <button
          onClick={() => setActiveTab("leads")}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === "leads" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          1. Lead Statuses
        </button>
        <button
          onClick={() => setActiveTab("sources")}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === "sources" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          2. Lead Sources
        </button>
        <button
          onClick={() => setActiveTab("deals")}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === "deals" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          3. Deal Pipeline Stages
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === "activities" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          4. Activity Types
        </button>
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === "general" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          5. General & Currency
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading organization configuration...
        </div>
      ) : config ? (
        <div className="space-y-6">
          {/* SECTION 1: LEAD STATUSES */}
          {activeTab === "leads" && (
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-sm text-foreground">Custom Lead Status Flow</h3>
                <span className="text-xs text-muted-foreground">Order & toggle status availability</span>
              </div>

              {/* Add New Status */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newLeadStatus}
                  onChange={(e) => setNewLeadStatus(e.target.value)}
                  placeholder="e.g. IN_REVIEW"
                  className="flex-1 text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 font-medium"
                />
                <button
                  onClick={handleAddLeadStatus}
                  className="px-3.5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Status
                </button>
              </div>

              {/* List */}
              <div className="space-y-2">
                {config.leadStatuses?.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-muted/20 border border-border rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground text-[11px]">#{idx + 1}</span>
                      <span className="font-bold text-foreground">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleLeadStatus(idx)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          item.isActive
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                        }`}
                      >
                        {item.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: LEAD SOURCES */}
          {activeTab === "sources" && (
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-sm text-foreground">Custom Lead Sources</h3>
                <span className="text-xs text-muted-foreground">Manage lead acquisition channels</span>
              </div>

              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newLeadSource}
                  onChange={(e) => setNewLeadSource(e.target.value)}
                  placeholder="e.g. WEBINAR"
                  className="flex-1 text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 font-medium"
                />
                <button
                  onClick={handleAddLeadSource}
                  className="px-3.5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Source
                </button>
              </div>

              <div className="space-y-2">
                {config.leadSources?.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-muted/20 border border-border rounded-lg flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-foreground">{item.name}</span>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {item.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: DEAL PIPELINE STAGES */}
          {activeTab === "deals" && (
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-sm text-foreground">Deal Pipeline Stages & Probabilities</h3>
                <span className="text-xs text-muted-foreground">Configure pipeline progression & win probabilities</span>
              </div>

              <div className="grid grid-cols-3 gap-2 max-w-lg">
                <input
                  type="text"
                  value={newDealStage}
                  onChange={(e) => setNewDealStage(e.target.value)}
                  placeholder="Stage Name (e.g. DEMO)"
                  className="col-span-2 text-xs p-2.5 rounded-lg border border-border bg-background font-medium"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newDealProb}
                    onChange={(e) => setNewDealProb(e.target.value)}
                    placeholder="Prob %"
                    className="w-20 text-xs p-2.5 rounded-lg border border-border bg-background"
                  />
                  <button
                    onClick={handleAddDealStage}
                    className="px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shrink-0"
                  >
                    Add Stage
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {config.dealStages?.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-muted/20 border border-border rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground text-[11px]">#{idx + 1}</span>
                      <span className="font-bold text-foreground">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">{item.probability}% Probability</span>
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {item.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-5 max-w-xl">
              <h3 className="font-semibold text-sm text-foreground border-b border-border pb-3">
                General Organization Settings
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Company / Business Name</label>
                  <input
                    type="text"
                    value={config.companyName || ""}
                    onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-border bg-background font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Default Currency</label>
                    <select
                      value={config.currency || "INR"}
                      onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-border bg-background"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Timezone</label>
                    <select
                      value={config.timezone || "Asia/Kolkata"}
                      onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-border bg-background"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleSaveConfig(config)}
                  disabled={isSaving}
                  className="px-4 py-2 font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save General Settings"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
