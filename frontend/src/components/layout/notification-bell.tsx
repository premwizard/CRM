"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  UserCheck,
  Briefcase,
  CheckSquare,
  MessageSquare,
  Trophy,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface NotificationItem {
  id: string;
  organizationId: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Call express backend or proxied Next.js API
      const res = await fetch("http://localhost:5000/api/v1/notifications", { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`http://localhost:5000/api/v1/notifications/${id}/read`, {
        method: "PATCH",
        headers,
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore error
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("http://localhost:5000/api/v1/notifications/read-all", {
        method: "PATCH",
        headers,
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore error
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`http://localhost:5000/api/v1/notifications/${id}`, {
        method: "DELETE",
        headers,
      });

      const deletedItem = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Ignore error
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);

    if (item.entityType && item.entityId) {
      const et = item.entityType.toUpperCase();
      if (et === "LEAD") router.push(`/leads/${item.entityId}`);
      else if (et === "DEAL") router.push(`/deals/${item.entityId}`);
      else if (et === "TASK") router.push(`/tasks`);
      else if (et === "CONTACT") router.push(`/contacts/${item.entityId}`);
      else if (et === "COMPANY") router.push(`/companies/${item.entityId}`);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LEAD_ASSIGNED":
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case "DEAL_ASSIGNED":
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      case "TASK_ASSIGNED":
      case "TASK_DUE":
        return <CheckSquare className="w-4 h-4 text-amber-500" />;
      case "DEAL_WON":
        return <Trophy className="w-4 h-4 text-emerald-500" />;
      case "DEAL_LOST":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case "COMMENT_MENTION":
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.isRead : true
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="min-w-[18px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center absolute -top-0.5 -right-0.5 ring-2 ring-card animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-card border border-border shadow-xl z-50 overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border px-3 pt-2 bg-card text-xs gap-4 font-medium">
            <button
              onClick={() => setFilter("all")}
              className={`pb-2 border-b-2 transition-colors ${
                filter === "all"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`pb-2 border-b-2 transition-colors ${
                filter === "unread"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-border">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-20" />
                <p className="font-medium text-foreground">No notifications</p>
                <p className="text-xs">
                  {filter === "unread" ? "You have read all notifications" : "No CRM notifications yet"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-accent/50 transition-colors cursor-pointer group relative ${
                    !item.isRead ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  <div className="p-2 rounded-lg bg-accent/80 shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-60" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {item.entityType && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-primary hover:underline">
                        View {item.entityType.toLowerCase()} <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Actions on Hover */}
                  <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {!item.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className="p-1 hover:bg-background rounded text-muted-foreground hover:text-primary transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(item.id, e)}
                      className="p-1 hover:bg-background rounded text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary absolute top-4 right-3 group-hover:hidden" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
