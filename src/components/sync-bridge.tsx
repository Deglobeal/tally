import { useEffect } from "react";

import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useTaskStore } from "@/lib/tasks/store";
import { syncWithCloud } from "@/lib/tasks/sync";

const SYNC_INTERVAL_MS = 60 * 60 * 1000;

export function SyncBridge() {
  const { user, isPending } = useCurrentUserState();

  const hydrated = useTaskStore((s) => s.hydrated);

  const signedIn = Boolean(user) && !user?.isDevFallback;

  useEffect(() => {
    if (!hydrated || isPending || !signedIn) {
      if (!isPending && !signedIn) {
        useTaskStore.getState().setSyncStatus("local");
      }

      return;
    }

    if (
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      useTaskStore.getState().setSyncStatus("offline");
      return;
    }

    // Initial sync shortly after hydration/authentication.
    const initialHandle = window.setTimeout(() => {
      void syncWithCloud();
    }, 500);

    // Automatic background sync every hour.
    const intervalHandle = window.setInterval(() => {
      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        useTaskStore.getState().setSyncStatus("offline");
        return;
      }

      void syncWithCloud();
    }, SYNC_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialHandle);
      window.clearInterval(intervalHandle);
    };
  }, [hydrated, isPending, signedIn]);

  useEffect(() => {
    const onOnline = () => {
      if (signedIn) {
        void syncWithCloud();
      }
    };

    const onOffline = () => {
      if (signedIn) {
        useTaskStore.getState().setSyncStatus("offline");
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [signedIn]);

  return null;
}