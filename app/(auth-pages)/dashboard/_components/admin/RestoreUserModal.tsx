"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { Shield } from "lucide-react";

interface RestoreUserModalProps {
  readonly showRestoreConfirmation: boolean;
  readonly setShowRestoreConfirmation: (show: boolean) => void;
  readonly userToRestore: { id: string; name: string | null; email: string | null } | null;
  readonly setUserToRestore: (user: any) => void;
  readonly restoreConfirmationText: string;
  readonly setRestoreConfirmationText: (text: string) => void;
  readonly restoringUserId: string | null;
  readonly handleRestoreUser: () => Promise<void>;
}

export function RestoreUserModal({
  showRestoreConfirmation,
  setShowRestoreConfirmation,
  userToRestore,
  setUserToRestore,
  restoreConfirmationText,
  setRestoreConfirmationText,
  restoringUserId,
  handleRestoreUser,
}: RestoreUserModalProps) {
  return (
    <Dialog open={showRestoreConfirmation} onOpenChange={setShowRestoreConfirmation}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span>Confirm Restore</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-700 mb-4">
            Restore <span className="font-semibold">{userToRestore?.name || userToRestore?.email}</span> and
            re-activate their account?
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <p className="text-emerald-800 text-sm">
              This will cancel the scheduled deletion and set the user back to active.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="restore-confirm" className="text-sm font-medium text-gray-700">
              To confirm this action, type <strong>"CONFIRM"</strong> in the box below:
            </label>
            <input
              id="restore-confirm"
              type="text"
              value={restoreConfirmationText}
              onChange={(e) => setRestoreConfirmationText(e.target.value)}
              placeholder="Type CONFIRM to proceed"
              className="w-full border border-emerald-300 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-200"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            onClick={handleRestoreUser}
            disabled={restoreConfirmationText !== "CONFIRM" || !userToRestore}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {restoringUserId === userToRestore?.id ? (
              <>
                <Loader size={16} className="mr-2" /> Restoring...
              </>
            ) : (
              "Restore User"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowRestoreConfirmation(false);
              setUserToRestore(null);
              setRestoreConfirmationText("");
            }}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
