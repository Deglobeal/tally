import { formatMoney } from "./currency";
import { formatTaskDate } from "./dates";
import type { Task } from "./types";

export function notificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function showTaskBanner(task: Pick<Task, "id" | "title" | "amount" | "currency" | "date" | "time">, silent: boolean): void {
  if (!notificationSupported()) return;
  if (Notification.permission !== "granted") return;
  const when = formatTaskDate(task.date, task.time);
  const money = task.amount != null ? formatMoney(task.amount, task.currency) : null;
  const body = [when, money].filter(Boolean).join(" · ") || "Reminder from Tally";
  try {
    const note = new Notification(task.title, {
      body,
      tag: `tally-${task.id}`,
      requireInteraction: true,
      silent,
    });
    note.onclick = () => {
      window.focus();
      note.close();
    };
  } catch {
    // Some WebViews reject Notification construction.
  }
}
