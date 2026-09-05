import {
  getRemoteSettings,
  listRemoteTasks,
  saveRemoteSettings,
  upsertRemoteTasks,
} from "./server";
import { useTaskStore } from "./store";
import { mergeTasks } from "./types";

const SYNC_TIMEOUT_MS = 30_000;

let inFlight: Promise<void> | null = null;

function isUnauthorized(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const e = err as { status?: number; message?: string };

  return e.status === 401 || e.message === "Unauthorized";
}

export async function syncWithCloud(): Promise<void> {
  if (inFlight) return inFlight;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    useTaskStore.getState().setSyncStatus("offline");
    return;
  }

  inFlight = (async () => {
    const store = useTaskStore.getState();
    store.setSyncStatus("syncing");

    let timedOut = false;

    const timeoutHandle = window.setTimeout(() => {
      timedOut = true;

      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        useTaskStore.getState().setSyncStatus("offline");
        return;
      }

      console.warn("[tally] sync exceeded 30 seconds");
      useTaskStore.getState().setSyncStatus("error");
    }, SYNC_TIMEOUT_MS);

    try {
      const [remoteTasks, remoteSettings] = await Promise.all([
        listRemoteTasks(),
        getRemoteSettings(),
      ]);

      const merged = mergeTasks(store.tasks, remoteTasks);

      const settings = remoteSettings
        ? {
            defaultCurrency: remoteSettings.defaultCurrency,
            showMoneyTotals: remoteSettings.showMoneyTotals,
            remindersEnabled: remoteSettings.remindersEnabled,
            alarmSoundEnabled: remoteSettings.alarmSoundEnabled,
            bannerNotifications: remoteSettings.bannerNotifications,
          }
        : store.settings;

      useTaskStore.getState().replaceAll(merged, settings);

      await upsertRemoteTasks({ data: merged });

      await saveRemoteSettings({
        data: {
          ...useTaskStore.getState().settings,
          updatedAt: new Date().toISOString(),
        },
      });

      // Don't overwrite the timeout/error state if the sync took
      // longer than the allowed UI wait time.
      if (!timedOut) {
        useTaskStore.getState().markSynced();
      }
    } catch (err) {
      if (isUnauthorized(err)) {
        useTaskStore.getState().setSyncStatus("local");
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        useTaskStore.getState().setSyncStatus("offline");
        return;
      }

      console.warn("[tally] sync failed", err);
      useTaskStore.getState().setSyncStatus("error");
    } finally {
      window.clearTimeout(timeoutHandle);
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}