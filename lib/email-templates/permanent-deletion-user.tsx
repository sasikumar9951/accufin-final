import * as React from "react";

export function PermanentDeletionUserEmail({
  userName,
}: Readonly<{
  userName?: string;
}>) {
  return (
    <div>
      <h2>Account Permanently Deleted</h2>
      <p>{userName ? `Hi ${userName},` : "Hello,"}</p>
      <p>
        Your AccuFin account and all associated data have been permanently
        deleted. This action is irreversible and your data is no longer
        recoverable.
      </p>
      <p>
        If you believe this was a mistake, please contact support immediately.
      </p>
      <p>— AccuFin Team</p>
    </div>
  );
}
