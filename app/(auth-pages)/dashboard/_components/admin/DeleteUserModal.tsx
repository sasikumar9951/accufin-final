"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { Trash2, Upload, Download, FormInput } from "lucide-react";

interface DeleteUserModalProps {
  readonly showDeleteConfirmation: boolean;
  readonly setShowDeleteConfirmation: (show: boolean) => void;
  readonly userToDelete: {
    id: string;
    name: string;
    email: string;
    uploadedFiles: number;
    filesReceivedFromAdmin: number;
    formResponses: number;
  } | null;
  readonly setUserToDelete: (user: any) => void;
  readonly deleteConfirmationText: string;
  readonly setDeleteConfirmationText: (text: string) => void;
  readonly isDeleting: boolean;
  readonly handleDeleteUser: () => Promise<void>;
}

export function DeleteUserModal({
  showDeleteConfirmation,
  setShowDeleteConfirmation,
  userToDelete,
  setUserToDelete,
  deleteConfirmationText,
  setDeleteConfirmationText,
  isDeleting,
  handleDeleteUser,
}: DeleteUserModalProps) {
  return (
    <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            <span>Schedule User Deletion</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {userToDelete && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">
                  Warning: This will schedule permanent deletion in 24 hours.
                </h4>
                <p className="text-red-700 text-sm">
                  <strong>{userToDelete.name}</strong> ({userToDelete.email}) will be deactivated immediately
                  and permanently deleted after 24 hours unless restored before the deadline.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">User Activity Summary:</h4>
                <div className="space-y-2 text-sm">
                  {userToDelete.uploadedFiles > 0 && (
                    <div className="flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span className="text-amber-700">
                        <strong>{userToDelete.uploadedFiles}</strong> file
                        {userToDelete.uploadedFiles === 1 ? "" : "s"} uploaded by user
                      </span>
                    </div>
                  )}
                  {userToDelete.filesReceivedFromAdmin > 0 && (
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4 text-emerald-500" />
                      <span className="text-amber-700">
                        <strong>{userToDelete.filesReceivedFromAdmin}</strong> file
                        {userToDelete.filesReceivedFromAdmin === 1 ? "" : "s"} sent by admin
                      </span>
                    </div>
                  )}
                  {userToDelete.formResponses > 0 && (
                    <div className="flex items-center space-x-2">
                      <FormInput className="w-4 h-4 text-purple-500" />
                      <span className="text-amber-700">
                        <strong>{userToDelete.formResponses}</strong> form
                        {userToDelete.formResponses === 1 ? "" : "s"} submitted
                      </span>
                    </div>
                  )}
                  {userToDelete.uploadedFiles === 0 &&
                    userToDelete.filesReceivedFromAdmin === 0 &&
                    userToDelete.formResponses === 0 && (
                      <span className="text-amber-600">No activity recorded</span>
                    )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">What will be deleted:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• User account and profile information</li>
                  <li>• All uploaded files and folders</li>
                  <li>• All form responses and submissions</li>
                  <li>• All notifications and activity logs</li>
                  <li>• All admin-sent files and communications</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label htmlFor="delete-confirm" className="text-sm font-medium text-gray-700">
                  To confirm deletion, type <strong>"CONFIRM"</strong> in the box below:
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type CONFIRM to proceed"
                  className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:border-red-500 focus:ring-red-200"
                  disabled={isDeleting}
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="destructive"
            disabled={isDeleting || deleteConfirmationText !== "CONFIRM"}
            onClick={handleDeleteUser}
          >
            {isDeleting ? (
              <>
                <Loader size={16} className="mr-2" />
                Scheduling...
              </>
            ) : (
              "Schedule Deletion"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteConfirmation(false);
              setUserToDelete(null);
              setDeleteConfirmationText("");
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
