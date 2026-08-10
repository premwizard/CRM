"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Activity,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Tag,
  User,
  DollarSign,
} from "lucide-react";

const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "NOTE", "OTHER"];

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface DealOption {
  id: string;
  name: string;
}

interface ActivityItem {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  contactId?: string | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  dealId?: string | null;
  deal?: { id: string; name: string } | null;
  performedBy?: string | null;
  createdAt: string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null,
  );

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "CALL",
    description: "",
    contactId: "",
    dealId: "",
    performedBy: "",
  });

  const [saving, setSaving] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let query = `/api/v1/activities?search=${encodeURIComponent(search)}`;
      if (selectedType) query += `&type=${selectedType}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data.activities || []);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [contRes, dealRes] = await Promise.all([
        fetch("/api/v1/contacts"),
        fetch("/api/v1/deals"),
      ]);
      const contData = await contRes.json();
      const dealData = await dealRes.json();

      if (contData.success) setContacts(contData.data.contacts || []);
      if (dealData.success) setDeals(dealData.data.deals || []);
    } catch {
      // Error handling
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedType]);

  const handleOpenCreate = () => {
    setSelectedActivity(null);
    setFormData({
      title: "",
      type: "CALL",
      description: "",
      contactId: "",
      dealId: "",
      performedBy: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: ActivityItem) => {
    setSelectedActivity(act);
    setFormData({
      title: act.title,
      type: act.type,
      description: act.description || "",
      contactId: act.contactId || "",
      dealId: act.dealId || "",
      performedBy: act.performedBy || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = selectedActivity
        ? `/api/v1/activities/${selectedActivity.id}`
        : "/api/v1/activities";
      const method = selectedActivity ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contactId: formData.contactId || null,
          dealId: formData.dealId || null,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchActivities();
      }
    } catch {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/activities/${selectedActivity.id}`, {
        method: "DELETE",
      });
      setSaving(false);
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedActivity(null);
        fetchActivities();
      }
    } catch {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CALL":
        return <Phone className="w-4 h-4 text-blue-500" />;
      case "EMAIL":
        return <Mail className="w-4 h-4 text-purple-500" />;
      case "MEETING":
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case "NOTE":
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      default:
        return <Tag className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities Log"
        description="Track and log customer interactions, calls, emails, meetings, and internal notes."
        actionText="Log Activity"
        onAction={handleOpenCreate}
        icon={Activity}
      />

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities by title or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Activity Types</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Activity Title</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Related Contact</th>
                <th className="px-6 py-3.5">Related Deal</th>
                <th className="px-6 py-3.5">Logged Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Loading activity timeline...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No activity logs recorded. Click "Log Activity" to record a
                    phone call, meeting, or note.
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
                  <tr
                    key={act.id}
                    className="hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(act.type)}
                        <span>{act.title}</span>
                      </div>
                      {act.description && (
                        <p className="text-xs text-muted-foreground font-normal mt-1 max-w-md truncate">
                          {act.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span className="px-2.5 py-1 bg-secondary rounded-md text-foreground border border-border">
                        {act.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {act.contact ? (
                        <div className="flex items-center gap-1.5 text-primary font-medium">
                          <User className="w-3.5 h-3.5" />
                          <span>
                            {act.contact.firstName} {act.contact.lastName}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {act.deal ? (
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{act.deal.name}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(act.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(act)}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Edit Activity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedActivity(act);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                        title="Delete Activity"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedActivity
            ? "Edit Activity Log"
            : "Log New Interaction Activity"
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Activity Summary Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. Discovery call regarding enterprise pricing"
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Activity Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Related Contact
              </label>
              <select
                value={formData.contactId}
                onChange={(e) =>
                  setFormData({ ...formData, contactId: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Unassigned --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Related Deal
              </label>
              <select
                value={formData.dealId}
                onChange={(e) =>
                  setFormData({ ...formData, dealId: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Unassigned --</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Detailed Notes
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Record call outcomes, meeting notes, or follow-up points..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md text-sm hover:bg-primary/90 transition-colors shadow-xs"
            >
              {saving ? "Logging..." : "Save Activity"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Activity Log"
        message={`Are you sure you want to delete activity log "${selectedActivity?.title}"?`}
        loading={saving}
      />
    </div>
  );
}
