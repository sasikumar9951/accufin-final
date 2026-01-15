"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface IdleTimeoutProps {
  children: React.ReactNode;
}

// Global state to persist across component re-renders
const sessionState = {
  timeout: null as NodeJS.Timeout | null,
  warningTimeout: null as NodeJS.Timeout | null,
  idleTimeout: null as NodeJS.Timeout | null,
  sessionStartTime: null as number | null,
  isLoggingOut: false,
  extensionDialogOpen: false,
  isIdle: false,
  lastActivity: null as number | null,
  dialogCountdown: 0,
  dialogCountdownInterval: null as NodeJS.Timeout | null,
};

export function IdleTimeout({ children }: Readonly<IdleTimeoutProps>) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [dialogCountdown, setDialogCountdown] = useState(0);

  // Check if current route is a protected route that should have session timeout
  // Only mark authenticated areas as protected. Public routes (login/register/etc.) are excluded.
  const isProtectedRoute =
    Boolean(pathname) &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/forms") ||
      pathname.startsWith("/api/"));

  // Use environment variables for idle-based session management
  // Warning shows after X minutes of inactivity
  // Use env vars (minutes). Provide safe defaults when values are missing or invalid
  const defaultWarningMinutes = 5; // minutes before showing warning
  const defaultSessionMinutes = 30; // minutes before session expiry

  const warningMinutesRaw = Number(
    process.env.NEXT_PUBLIC_USER_SESSION_WARNING
  );
  const sessionMinutesRaw = Number(process.env.NEXT_PUBLIC_USER_SESSION_EXPIRY);

  const warningMinutes =
    Number.isFinite(warningMinutesRaw) && warningMinutesRaw > 0
      ? warningMinutesRaw
      : defaultWarningMinutes;

  const sessionMinutes =
    Number.isFinite(sessionMinutesRaw) && sessionMinutesRaw > 0
      ? sessionMinutesRaw
      : defaultSessionMinutes;

  const WARNING_TIME = warningMinutes * 60 * 1000;
  const SESSION_TIME = sessionMinutes * 60 * 1000;
  // Extension dialog shows 1 minute before session expires

  const logout = useCallback(async () => {
    if (sessionState.isLoggingOut) {
      return;
    }

    sessionState.isLoggingOut = true;

    // Clear all timers
    if (sessionState.timeout) {
      clearTimeout(sessionState.timeout);
      sessionState.timeout = null;
    }
    if (sessionState.warningTimeout) {
      clearTimeout(sessionState.warningTimeout);
      sessionState.warningTimeout = null;
    }
    if (sessionState.idleTimeout) {
      clearTimeout(sessionState.idleTimeout);
      sessionState.idleTimeout = null;
    }

    try {
      const expiredAt = Date.now();
      toast.error("Session expired.");
      await signOut({
        redirect: false,
        callbackUrl: "/login",
      });
      router.push(`/session-expired?at=${expiredAt}`);
    } catch (error) {
      console.error("SessionTimeout: Error during logout:", error);
      sessionState.isLoggingOut = false;
    }
  }, [router]);

  const showWarning = useCallback(() => {
    const warningTimeMinutes = Math.floor(WARNING_TIME / (60 * 1000));

    console.warn(
      `SessionTimeout: WARNING - Session will expire in ${warningTimeMinutes} minutes`
    );

    // Calculate remaining time until logout (difference between warning and session time)
    const remainingTime = SESSION_TIME - WARNING_TIME; // Time between warning and logout
    const computedRemainingSeconds = Number.isFinite(remainingTime)
      ? Math.floor(remainingTime / 1000)
      : Math.max(60, (sessionMinutes - warningMinutes) * 60);

    const remainingSeconds = Number.isFinite(computedRemainingSeconds)
      ? computedRemainingSeconds
      : 60; // fallback to 60s if something unexpected occurs

    setShowWarningDialog(true);
    sessionState.extensionDialogOpen = true;
    setDialogCountdown(remainingSeconds);

    // Start countdown for dialog
    sessionState.dialogCountdown = remainingSeconds;
    sessionState.dialogCountdownInterval = setInterval(() => {
      sessionState.dialogCountdown--;
      setDialogCountdown(sessionState.dialogCountdown);

      if (sessionState.dialogCountdown <= 0) {
        if (sessionState.dialogCountdownInterval) {
          clearInterval(sessionState.dialogCountdownInterval);
        }
        sessionState.dialogCountdownInterval = null;
        logout();
      }
    }, 1000);

    // Show appropriate time format in toast - show remaining time until logout
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecondsOnly = remainingSeconds % 60;

    const toastMessage =
      remainingMinutes > 0
        ? `Your session will expire in ${remainingMinutes} minutes ${remainingSecondsOnly} seconds.`
        : `Your session will expire in ${remainingSeconds} seconds.`;

    toast.error(toastMessage, {
      duration: 6000,
      position: "top-center",
    });
  }, [WARNING_TIME, SESSION_TIME, logout]);

  // Activity detection function
  const resetIdleTimer = useCallback(() => {
    // If warning dialog is open, close it and reset timers
    if (sessionState.extensionDialogOpen) {
      // Clear dialog countdown
      if (sessionState.dialogCountdownInterval) {
        clearInterval(sessionState.dialogCountdownInterval);
        sessionState.dialogCountdownInterval = null;
      }

      // Close dialog and reset state
      setShowWarningDialog(false);
      sessionState.extensionDialogOpen = false;
      setDialogCountdown(0);
    }

    const now = Date.now();
    sessionState.lastActivity = now;

    // Clear all existing timers
    if (sessionState.timeout) {
      clearTimeout(sessionState.timeout);
      sessionState.timeout = null;
    }
    if (sessionState.warningTimeout) {
      clearTimeout(sessionState.warningTimeout);
      sessionState.warningTimeout = null;
    }
    if (sessionState.idleTimeout) {
      clearTimeout(sessionState.idleTimeout);
      sessionState.idleTimeout = null;
    }

    // Reset idle state
    sessionState.isIdle = false;
    setShowWarningDialog(false);
    sessionState.extensionDialogOpen = false;

    // Start new idle-based timers

    // Ensure times are valid before starting timers
    if (
      !Number.isFinite(WARNING_TIME) ||
      !Number.isFinite(SESSION_TIME) ||
      SESSION_TIME <= 0
    ) {
      console.warn(
        "SessionTimeout: invalid WARNING_TIME or SESSION_TIME, skipping timers"
      );
      return;
    }

    // Set warning timer (after X minutes of inactivity)
    sessionState.warningTimeout = setTimeout(() => {
      showWarning();
    }, WARNING_TIME);

    // Set session expiry timer (after Y minutes of inactivity)
    sessionState.timeout = setTimeout(() => {
      logout();
    }, SESSION_TIME);
  }, [WARNING_TIME, SESSION_TIME, showWarning, logout]);

  useEffect(() => {
    // Only start session timeout monitoring on protected routes
    if (session && !sessionState.isLoggingOut && isProtectedRoute) {
      // Start idle-based timers when session starts on protected routes
      resetIdleTimer();
    } else {
      // Clear all timers when no session or on public routes
      if (sessionState.timeout) {
        clearTimeout(sessionState.timeout);
        sessionState.timeout = null;
      }
      if (sessionState.warningTimeout) {
        clearTimeout(sessionState.warningTimeout);
        sessionState.warningTimeout = null;
      }
      if (sessionState.idleTimeout) {
        clearTimeout(sessionState.idleTimeout);
        sessionState.idleTimeout = null;
      }
      if (sessionState.dialogCountdownInterval) {
        clearInterval(sessionState.dialogCountdownInterval);
        sessionState.dialogCountdownInterval = null;
      }
      sessionState.sessionStartTime = null;
      sessionState.lastActivity = null;
      sessionState.isIdle = false;
      sessionState.isLoggingOut = false;
      setShowWarningDialog(false);
      setDialogCountdown(0);
    }
  }, [session, resetIdleTimer, isProtectedRoute]);

  // Activity event listeners
  useEffect(() => {
    if (!session || !isProtectedRoute) return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Add event listeners
    for (const event of events) {
      document.addEventListener(event, handleActivity, true);
    }

    // Cleanup
    return () => {
      for (const event of events) {
        document.removeEventListener(event, handleActivity, true);
      }
    };
  }, [session, resetIdleTimer, isProtectedRoute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionState.timeout) {
        clearTimeout(sessionState.timeout);
        sessionState.timeout = null;
      }
      if (sessionState.warningTimeout) {
        clearTimeout(sessionState.warningTimeout);
        sessionState.warningTimeout = null;
      }
      if (sessionState.idleTimeout) {
        clearTimeout(sessionState.idleTimeout);
        sessionState.idleTimeout = null;
      }
      if (sessionState.dialogCountdownInterval) {
        clearInterval(sessionState.dialogCountdownInterval);
        sessionState.dialogCountdownInterval = null;
      }
    };
  }, []);

  return (
    <>
      {children}
      <Dialog open={showWarningDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Session Warning</DialogTitle>
            <DialogDescription>
              You've been idle for a long time. You will be automatically logged
              out in{" "}
              <span className="font-bold text-red-600">{dialogCountdown}</span>{" "}
              seconds.
              <br />
              <br />
              <span className="text-sm text-gray-600">
                Do any activity (click, move mouse, type) to keep your session
                active.
              </span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
