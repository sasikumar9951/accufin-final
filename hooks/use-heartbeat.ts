import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const useHeartbeat = () => {
  const { data: session } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    const sendHeartbeat = async () => {
      if (!isActiveRef.current) return;

      try {
        // Use sendBeacon for reliability
        if (navigator.sendBeacon) {
          const data = JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
            timestamp: new Date().toISOString(),
            event: "heartbeat",
            page: globalThis.location.pathname,
            isOnline: true,
          });

          navigator.sendBeacon("/api/user/activity-log", data);
        } else {
          // Fallback to fetch
          await fetch("/api/user/activity-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              email: session.user.email,
              timestamp: new Date().toISOString(),
              event: "heartbeat",
              page: globalThis.location.pathname,
              isOnline: true,
            }),
          });
        }
      } catch (error) {
        console.error("Failed to send heartbeat:", error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for every 30 seconds
    intervalRef.current = setInterval(sendHeartbeat, 30000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
      } else {
        isActiveRef.current = true;
        // Send heartbeat immediately when tab becomes visible
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      isActiveRef.current = false;
      // Send final heartbeat
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          timestamp: new Date().toISOString(),
          event: "beforeunload",
          page: globalThis.location.pathname,
          isOnline: false,
        });
        navigator.sendBeacon("/api/user/activity-log", data);
      }
    };

    globalThis.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      globalThis.removeEventListener("beforeunload", handleBeforeUnload);
      isActiveRef.current = false;
    };
  }, [session?.user?.id, session?.user?.email]);

  return null; // This hook doesn't return anything
};

export default useHeartbeat;
