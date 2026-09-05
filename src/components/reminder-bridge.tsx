import { useEffect, useRef, useState } from "react";
import { showTaskBanner } from "@/lib/tasks/notifications";
import { nextFireAt, shouldFire } from "@/lib/tasks/reminder";
import { startAlarmLoop, stopAlarmLoop, unlockAlarmAudio } from "@/lib/tasks/sound";
import { useTaskStore } from "@/lib/tasks/store";

const MAX_DELAY = 2_147_000_000;

export function ReminderBridge() {
  const hydrated = useTaskStore((s) => s.hydrated);
  const revision = useTaskStore((s) => s.revision);
  const remindersEnabled = useTaskStore((s) => s.settings.remindersEnabled);
  const alarmSoundEnabled = useTaskStore((s) => s.settings.alarmSoundEnabled);
  const ringingCount = useTaskStore((s) => s.ringing.length);
  const [tick, setTick] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const unlock = () => unlockAlarmAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    document.addEventListener("visibilitychange", bump);
    window.addEventListener("focus", bump);
    return () => {
      document.removeEventListener("visibilitychange", bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  useEffect(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    if (!hydrated || !remindersEnabled) return;

    const { tasks, settings, enqueueAlarm, markFired } = useTaskStore.getState();
    const now = Date.now();

    for (const task of tasks) {
      if (shouldFire(task, now)) {
        markFired(task.id);
        enqueueAlarm(task);
        if (settings.bannerNotifications) {
          showTaskBanner(task, settings.alarmSoundEnabled);
        }
        continue;
      }
      const at = nextFireAt(task);
      if (at == null || at <= now) continue;
      const delay = Math.min(at - now, MAX_DELAY);
      const handle = window.setTimeout(() => {
        const latest = useTaskStore.getState().tasks.find((t) => t.id === task.id);
        if (!latest || !shouldFire(latest)) return;
        const snap = useTaskStore.getState();
        snap.markFired(latest.id);
        snap.enqueueAlarm(latest);
        if (snap.settings.bannerNotifications) {
          showTaskBanner(latest, snap.settings.alarmSoundEnabled);
        }
      }, delay);
      timers.current.push(handle);
    }

    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [hydrated, revision, remindersEnabled, tick]);

  useEffect(() => {
    if (ringingCount > 0 && alarmSoundEnabled) startAlarmLoop();
    else stopAlarmLoop();
    return () => stopAlarmLoop();
  }, [ringingCount, alarmSoundEnabled]);

  return null;
}
