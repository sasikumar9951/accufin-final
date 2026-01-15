"use client";

import React from "react";
import toast from "react-hot-toast";

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

type UseNotificationsOptions = {
  scope: "admin" | "user";
  basePath: "/api/admin/notification" | "/api/user/notification";
};

export function useNotifications({ scope, basePath }: UseNotificationsOptions) {
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [markingAsRead, setMarkingAsRead] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = React.useState(false);

  const pageSize = 10;
  const getUnreadCount = (list: NotificationRecord[]) => list.filter((n) => !n.isRead).length;
  const unreadCount = getUnreadCount(notifications);

  const broadcastUnreadCount = (count: number) => {
    if (typeof globalThis === "undefined") return;
    const event = new CustomEvent("notifications:updated", {
      detail: { scope, unreadCount: count },
    });
    globalThis.dispatchEvent(event);
    try {
      const bc = new BroadcastChannel("notifications");
      bc.postMessage({ scope, unreadCount: count });
      bc.close();
    } catch (error) {
      console.log("BroadcastChannel not supported", error);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(basePath);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      const next = Array.isArray(data) ? data : [];
      setNotifications(next);
      broadcastUnreadCount(getUnreadCount(next));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
      broadcastUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
  }, [basePath]);

  const totalPages = Math.max(1, Math.ceil(notifications.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedNotifications = notifications.slice(startIndex, startIndex + pageSize);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleToggleRead = async (id: string, toRead: boolean) => {
    const original = [...notifications];
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: toRead } : n));
    setNotifications(updated);
    broadcastUnreadCount(getUnreadCount(updated));
    try {
      const res = await fetch(`${basePath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: toRead }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(toRead ? "Marked as read" : "Marked as unread");
    } catch (e) {
      console.error("Error updating notification:", e);
      setNotifications(original);
      broadcastUnreadCount(getUnreadCount(original));
      toast.error("Failed to update notification");
    }
  };

  const handleDelete = async (id: string) => {
    const original = [...notifications];
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    const newTotalPages = Math.max(1, Math.ceil(updated.length / pageSize));
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
    broadcastUnreadCount(getUnreadCount(updated));
    try {
      const res = await fetch(`${basePath}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      setNotifications(original);
      broadcastUnreadCount(getUnreadCount(original));
      toast.error("Failed to delete notification");
    }
  };

  const handleDeleteAll = async () => {
    const original = [...notifications];
    setNotifications([]);
    setCurrentPage(1);
    setShowDeleteAllDialog(false);
    broadcastUnreadCount(0);
    try {
      const res = await fetch(basePath, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete all");
      toast.success("All notifications deleted");
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      setNotifications(original);
      broadcastUnreadCount(getUnreadCount(original));
      toast.error("Failed to delete all notifications");
    }
  };

  const handleMarkAllAsRead = async () => {
    const originalNotifications = [...notifications];
    setMarkingAsRead(true);
    const optimistic = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(optimistic);
    broadcastUnreadCount(0);
    try {
      const res = await fetch(`${basePath}/read`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark as read");
      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      setNotifications(originalNotifications);
      broadcastUnreadCount(getUnreadCount(originalNotifications));
      toast.error("Failed to mark notifications as read");
    } finally {
      setMarkingAsRead(false);
    }
  };

  return {
    notifications,
    isLoading,
    markingAsRead,
    currentPage,
    showDeleteAllDialog,
    pageSize,
    startIndex,
    totalPages,
    paginatedNotifications,
    unreadCount,
    setCurrentPage,
    setShowDeleteAllDialog,
    fetchNotifications,
    handleToggleRead,
    handleDelete,
    handleDeleteAll,
    handleMarkAllAsRead,
    formatTime,
  };
}


