"use client";

import { Bell, Clock, Check, Eye, EyeOff, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { NotificationRecord } from "@/hooks/use-notifications";

export function StatusBadge({ isRead }: { isRead: boolean }) {
  return isRead ? (
    <Badge variant="secondary">Read</Badge>
  ) : (
    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Unread</Badge>
  );
}

export function ReadToggleButton({
  id,
  isRead,
  onToggleRead,
}: {
  id: string;
  isRead: boolean;
  onToggleRead: (id: string, toRead: boolean) => void;
}) {
  return isRead ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onToggleRead(id, false)}
      className="bg-blue-50 text-blue-500 hover:text-blue-700"
    >
      <EyeOff className="w-4 h-4 mr-1 text-blue-600" />
      Unread
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onToggleRead(id, true)}
      className="bg-blue-50 text-blue-500 hover:text-blue-700"
    >
      <Eye className="w-4 h-4 mr-1 text-blue-600" />
      Read
    </Button>
  );
}

type Props = {
  title: string;
  unreadCount: number;
  isLoading: boolean;
  notifications: NotificationRecord[];
  paginatedNotifications: NotificationRecord[];
  startIndex: number;
  pageSize: number;
  totalPages: number;
  currentPage: number;
  onRefresh?: () => void;
  onDeleteAll: () => void;
  onDelete: (id: string) => void;
  onToggleRead: (id: string, toRead: boolean) => void;
  onPageChange: (page: number) => void;
  setShowDeleteAllDialog: (open: boolean) => void;
  showDeleteAllDialog: boolean;
  formatTime: (dateString: string) => string;
  actions?: React.ReactNode;
};

export default function NotificationsTable(props: Readonly<Props>) {
  const {
    title,
    unreadCount,
    isLoading,
    notifications,
    paginatedNotifications,
    startIndex,
    pageSize,
    totalPages,
    currentPage,
    onRefresh,
    onDeleteAll,
    onDelete,
    onToggleRead,
    onPageChange,
    setShowDeleteAllDialog,
    showDeleteAllDialog,
    formatTime,
    actions,
  } = props;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread messages` : "You're all caught up"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-2"
              title="Refresh notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 sm:mr-1 ${isLoading ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-3.51-7.07" />
                <polyline points="22 3 21 7 17 6" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          {actions}
          {notifications.length > 0 && (
            <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-2">
                  <Trash2 className="w-4 h-4 sm:mr-1 text-white" />
                  <span className="hidden sm:inline">Delete all</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete all notifications? This action cannot be undone. You will lose all {notifications.length} notification{notifications.length === 1 ? "" : "s"}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteAll} className="bg-red-600 hover:bg-red-700">
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="w-full h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-gray-600">
            <Loader size={48} className="mb-2 text-blue-600" />
            Loading notifications...
          </div>
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-500">We'll notify you when something important happens.</p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white">
            <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
              <table className="w-full table-auto min-w-[800px]">
                <thead className="sticky top-0 z-20 bg-white border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">Title</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">Message</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Created</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[110px]">Status</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {paginatedNotifications.map((n) => (
                      <tr key={n.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 w-8">
                          {n.isRead ? (
                            <Check className="w-4 h-4 text-gray-400" />
                          ) : (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </td>
                        <td className={`py-3 px-4 ${n.isRead ? "text-gray-700" : "font-medium"}`}>{n.title}</td>
                        <td className="py-3 px-4 whitespace-normal break-words" title={n.message}>{n.message}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(n.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge isRead={n.isRead} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <ReadToggleButton id={n.id} isRead={n.isRead} onToggleRead={onToggleRead} />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDelete(n.id)}
                              title="Delete Notification"
                              className="border-red-200 bg-red-50 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {startIndex + 1}–{Math.min(startIndex + pageSize, notifications.length)} of {notifications.length}
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>
                Previous
              </Button>
              <span className="mx-1">Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


