import React from "react";
import { Button } from "@/components/ui/button";
import NotificationsTable from "@/components/notification/NotificationsTable";
import { useNotifications } from "@/hooks/use-notifications";

export default function NotificationsTab() {
  const {
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
  } = useNotifications({ scope: "user", basePath: "/api/user/notification" });

  return (
    <NotificationsTable
      title="Notifications"
      unreadCount={unreadCount}
      isLoading={isLoading}
      notifications={notifications}
      paginatedNotifications={paginatedNotifications}
      startIndex={startIndex}
      pageSize={pageSize}
      totalPages={totalPages}
      currentPage={currentPage}
      onRefresh={fetchNotifications}
      onDeleteAll={handleDeleteAll}
      onDelete={handleDelete}
      onToggleRead={handleToggleRead}
      onPageChange={setCurrentPage}
      setShowDeleteAllDialog={setShowDeleteAllDialog}
      showDeleteAllDialog={showDeleteAllDialog}
      formatTime={formatTime}
      actions={
        unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            disabled={markingAsRead}
            onClick={handleMarkAllAsRead}
          >
            {markingAsRead ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Marking as read...</span>
              </div>
            ) : (
              "Mark all as read"
            )}
          </Button>
        ) : null
      }
    />
  );
}
