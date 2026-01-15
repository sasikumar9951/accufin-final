import * as React from "react";

export function PermanentDeletionAdminEmail({
  userName,
  userEmail,
}: {
  readonly userName?: string;
  readonly userEmail?: string;
}) {
  return (
    <div>
      <h2>User Permanently Deleted</h2>
      <p>
        The following account has been permanently deleted and all data is now
        unrecoverable:
      </p>
      <ul>
        <li>Name: {userName || "(unknown)"}</li>
        <li>Email: {userEmail || "(unknown)"}</li>
      </ul>
      <p>— AccuFin System</p>
    </div>
  );
}
