"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User as UserIcon,
  Eye,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowRight,
} from "lucide-react";

export interface AuditLogRecord {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const { user, isViewer } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selected Log Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const role = user?.role?.toUpperCase() || "USER";
  const isAuthorized = role === "ADMIN" || role === "OWNER" || role === "MANAGER";

  const fetchAuditLogs = async () => {
    if (!isAuthorized) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let url = `http://localhost:5000/api/v1/audit-logs?page=${page}&pageSize=15`;
      if (selectedAction) url += `&action=${selectedAction}`;
      if (selectedEntityType) url += `&entityType=${selectedEntityType}`;

      const res = await fetch(url, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setAuditLogs(json.data.auditLogs || []);
        if (json.data.pagination) {
          setTotalPages(json.data.pagination.totalPages || 1);
          setTotalItems(json.data.pagination.totalItems || 0);
        }
      } else {
        setError(json.error || "Failed to load audit logs");
      }
    } catch {
      setError("Network error loading audit trail");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, selectedAction, selectedEntityType]);

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">CREATE</span>;
      case "UPDATE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">UPDATE</span>;
      case "DELETE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">DELETE</span>;
      case "STAGE_CHANGE":
      case "STATUS_CHANGE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">{action}</span>;
      case "CONVERT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">CONVERT</span>;
      case "LOGIN":
      case "LOGOUT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">{action}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-600 border border-gray-500/20">{action}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center border border-red-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Audit logs are restricted to Organization Owners, Administrators, and Managers. Please contact your administrator if you require access.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete immutable audit trail of system events, field changes, and administrative actions.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-accent flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Log
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="STAGE_CHANGE">STAGE_CHANGE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="CONVERT">CONVERT</option>
            <option value="ASSIGN">ASSIGN</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="FILE_UPLOAD">FILE_UPLOAD</option>
            <option value="FILE_DELETE">FILE_DELETE</option>
            <option value="COMMENT_CREATE">COMMENT_CREATE</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={selectedEntityType}
            onChange={(e) => {
              setSelectedEntityType(e.target.value);
              setPage(1);
            }}
            className="text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Entity Types</option>
            <option value="Lead">Lead</option>
            <option value="Deal">Deal</option>
            <option value="Contact">Contact</option>
            <option value="Company">Company</option>
            <option value="Task">Task</option>
            <option value="Activity">Activity</option>
            <option value="Note">Note</option>
            <option value="User">User</option>
            <option value="Role">Role</option>
            <option value="Attachment">Attachment</option>
          </select>
        </div>

        <span className="text-xs text-muted-foreground font-medium">
          Showing {auditLogs.length} of {totalItems} total logs
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading audit log trail...
                    </div>
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No audit records match the current filter selection.
                  </td>
                </tr>
              ) : (
                auditLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {item.user?.firstName?.[0] || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-none">
                            {item.user ? `${item.user.firstName} ${item.user.lastName}` : "System User"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(item.action)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted text-[11px]">
                        {item.entityType} #{item.entityId.substring(0, 8)}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-md truncate text-muted-foreground">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(item)}
                        className="px-2.5 py-1 text-xs border border-border rounded-md hover:bg-accent text-primary font-medium inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20 text-xs">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 border border-border rounded-md hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 border border-border rounded-md hover:bg-accent disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Audit Record Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/20 rounded-lg border border-border">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">User</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : "System"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{selectedLog.user?.email}</p>
                </div>

                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">Timestamp</p>
                  <p className="font-mono text-foreground mt-0.5">{formatDate(selectedLog.createdAt)}</p>
                </div>

                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">Action</p>
                  <div className="mt-0.5">{getActionBadge(selectedLog.action)}</div>
                </div>

                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">Entity</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedLog.entityType} ({selectedLog.entityId})
                  </p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">Description</p>
                <p className="p-2.5 bg-muted/30 rounded-lg border border-border text-muted-foreground">
                  {selectedLog.description}
                </p>
              </div>

              {/* Old vs New Values Diff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-rose-500 mb-1 flex items-center gap-1">
                    Previous Values (Before)
                  </p>
                  <pre className="p-3 bg-muted/40 rounded-lg border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-48">
                    {selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : "None"}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-emerald-500 mb-1 flex items-center gap-1">
                    New Values (After)
                  </p>
                  <pre className="p-3 bg-muted/40 rounded-lg border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-48">
                    {selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : "None"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
