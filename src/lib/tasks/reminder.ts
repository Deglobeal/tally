import { formatTaskDate } from "./dates";
import type { AlarmItem, Task } from "./types";

const DEFAULT_TIME = "09:00";

export function dueTimestamp(task: Pick<Task, "date" | "time">): number | null {
  if (!task.date) return null;
  const time = task.time && /^\d{2}:\d{2}/.test(task.time) ? task.time : DEFAULT_TIME;
  const d = new Date(`${task.date}T${time}:00`);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function nextFireAt(task: Task): number | null {
  if (!task.remind || task.completed || task.deletedAt) return null;
  if (task.snoozeUntil) {
    const snooze = Date.parse(task.snoozeUntil);
    if (Number.isFinite(snooze)) return snooze;
  }
  return dueTimestamp(task);
}

export function shouldFire(task: Task, now = Date.now()): boolean {
  const at = nextFireAt(task);
  if (at == null || at > now) return false;
  if (task.lastFiredAt) {
    const last = Date.parse(task.lastFiredAt);
    if (Number.isFinite(last) && last >= at) return false;
  }
  return true;
}

export function toAlarmItem(task: Task): AlarmItem {
  return {
    taskId: task.id,
    title: task.title,
    amount: task.amount,
    currency: task.currency,
    whenLabel: formatTaskDate(task.date, task.time) ?? "Now",
  };
}

export function defaultRemindTime(date: string, now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${day}`;
  if (date !== today) return DEFAULT_TIME;
  const next = new Date(now.getTime() + 15 * 60 * 1000);
  let minutes = Math.ceil(next.getMinutes() / 15) * 15;
  if (minutes >= 60) {
    next.setHours(next.getHours() + 1);
    minutes = 0;
  }
  return `${String(next.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function snoozeIso(minutes: number, now = Date.now()): string {
  return new Date(now + minutes * 60 * 1000).toISOString();
}
