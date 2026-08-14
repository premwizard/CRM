"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings as SettingsIcon,
  User,
  Key,
} from "lucide-react";

const TEAM_ROLES = ["OWNER", "ADMIN", "MANAGER", "SALES_REP", "VIEWER"];

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  systemRole: string;
  isActive: boolean;
  status: "ACTIVE" | "DEACTIVATED" | "PENDING";
  joinedDate: string;
  createdAt: string;
  isPending: boolean;
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Invite Form State
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "SALES_REP",
  });

  const [inviteResult, setInviteResult] = useState<{
    email: string;
    tempPassword?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/team/members");
      const data = await res.json();
      if (data.success) {
        setMembers(data.data.members || []);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Handle Invite Member
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    setInviteResult(null);

    try {
      const token = localStorage.getItem("ic_crm_token");
      const res = await fetch("/api/v1/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setInviteResult({
          email: inviteForm.email,
          tempPassword: data.data?.user?.tempPassword,
        });
        setInviteForm({ email: "", firstName: "", lastName: "", role: "SALES_REP" });
        fetchTeamMembers();
      } else {
        setStatusMsg({
          type: "error",
          message: data.error || "Failed to send team invitation",
        });
      }
    } catch {
      setSaving(false);
      setStatusMsg({ type: "error", message: "Network error occurred" });
    }
  };

  // Handle Role Change
  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("ic_crm_token");
      const res = await fetch(`/api/v1/team/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: "success", message: "Member role updated successfully" });
        fetchTeamMembers();
      } else {
        setStatusMsg({ type: "error", message: data.error || "Failed to update role" });
      }
    } catch {
      setStatusMsg({ type: "error", message: "Network error occurred" });
    }
  };

  // Handle Status Toggle (Active / Deactive)
  const handleStatusToggle = async (member: TeamMember) => {
    try {
      const token = localStorage.getItem("ic_crm_token");
      const nextStatus = !member.isActive;

      const res = await fetch(`/api/v1/team/members/${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: "success",
          message: `Member ${member.email} ${nextStatus ? "activated" : "deactivated"}`,
        });
        fetchTeamMembers();
      } else {
        setStatusMsg({ type: "error", message: data.error || "Failed to update status" });
      }
    } catch {
      setStatusMsg({ type: "error", message: "Network error occurred" });
    }
  };

  // Handle Member Delete / Invite Revoke
  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("ic_crm_token");
      const res = await fetch(`/api/v1/team/members/${selectedMember.id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setIsDeleteModalOpen(false);
        setSelectedMember(null);
        setStatusMsg({ type: "success", message: "Team member removed" });
        fetchTeamMembers();
      } else {
        setStatusMsg({ type: "error", message: data.error || "Failed to remove member" });
      }
    } catch {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "ADMIN":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "MANAGER":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "SALES_REP":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "VIEWER":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? m.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const totalActive = members.filter((m) => m.isActive && !m.isPending).length;
  const totalPending = members.filter((m) => m.isPending).length;
  const totalAdmins = members.filter(
    (m) => (m.role === "ADMIN" || m.role === "OWNER") && !m.isPending
  ).length;

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      <PageHeader
        title="Settings & Organization"
        description="Manage team memberships, roles, system permissions, and account invitations."
        actionText="Invite Member"
        onAction={() => {
          setInviteResult(null);
          setStatusMsg(null);
          setIsInviteModalOpen(true);
        }}
        icon={Users}
      />

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Link
          href="/settings"
          className="px-4 py-2 text-xs font-semibold rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <User className="w-3.5 h-3.5" />
          Profile Settings
        </Link>
        <Link
          href="/settings/team"
          className="px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground shadow-xs flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5" />
          Team Management
        </Link>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-md text-xs border flex items-center gap-2 ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.message}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Total Members</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase text-emerald-600">Active Accounts</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalActive}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase text-amber-600">Pending Invites</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase text-purple-600">Admins & Owners</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalAdmins}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card p-4 rounded-lg border border-border flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search member by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Roles</option>
          {TEAM_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Team Member Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground animate-pulse text-xs"
                  >
                    Loading team members directory...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground space-y-1"
                  >
                    <Users className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
                    <p className="font-semibold text-foreground text-sm">
                      No team members found
                    </p>
                    <p className="text-xs">
                      Try clearing search query or invite a new colleague.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">
                          {member.name}
                        </p>
                        {member.isPending && (
                          <span className="text-[10px] text-amber-500 font-bold">
                            Pending Invite
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{member.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {!member.isPending ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className={`px-2.5 py-1 text-[11px] font-bold border rounded-full bg-background cursor-pointer ${getRoleBadge(
                            member.role
                          )}`}
                        >
                          {TEAM_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold border rounded-full ${getRoleBadge(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {member.status === "ACTIVE" ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold border rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20 inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          Active
                        </span>
                      ) : member.status === "DEACTIVATED" ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold border rounded-full bg-red-500/10 text-red-500 border-red-500/20 inline-flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          Deactivated
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-bold border rounded-full bg-amber-500/10 text-amber-600 border-amber-500/20 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Invite
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      {!member.isPending && (
                        <button
                          onClick={() => handleStatusToggle(member)}
                          className={`p-1.5 rounded-md text-xs font-semibold transition-colors ${
                            member.isActive
                              ? "hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600"
                              : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600"
                          }`}
                          title={member.isActive ? "Deactivate Account" : "Activate Account"}
                        >
                          {member.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                        title={member.isPending ? "Revoke Invite" : "Remove Member"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Team Member"
      >
        {!inviteResult ? (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul"
                  value={inviteForm.firstName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={inviteForm.lastName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="colleague@iccrm.io"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Assign Role *
              </label>
              <select
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, role: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="OWNER">OWNER - Full system & admin access</option>
                <option value="ADMIN">ADMIN - Full administrative access</option>
                <option value="MANAGER">MANAGER - Team management & pipeline lead</option>
                <option value="SALES_REP">SALES_REP - Standard CRM representative</option>
                <option value="VIEWER">VIEWER - Read-only dashboard access</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {saving ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-4 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-foreground">
                Invitation Sent Successfully!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                An invitation was issued to <strong>{inviteResult.email}</strong>.
              </p>
            </div>

            {inviteResult.tempPassword && (
              <div className="p-3 bg-secondary/80 border border-border rounded-md text-xs space-y-1 text-left">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  Temporary Sign-In Credentials
                </p>
                <p className="text-muted-foreground font-mono">
                  Password: <strong>{inviteResult.tempPassword}</strong>
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-border flex justify-center">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-xs hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete / Revoke Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleRemoveMember}
        title={selectedMember?.isPending ? "Revoke Invitation" : "Remove Team Member"}
        message={`Are you sure you want to ${
          selectedMember?.isPending ? "revoke invitation for" : "remove"
        } "${selectedMember?.name}" (${selectedMember?.email})?`}
        loading={saving}
      />
    </div>
  );
}
