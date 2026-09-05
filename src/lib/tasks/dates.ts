import { format, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";

export function formatTaskDate(date: string | null, time: string | null): string | null {
  if (!date) return time ? formatTime(time) : null;
  let label: string;
  try {
    const d = parseISO(`${date}T00:00:00`);
    if (isToday(d)) label = "Today";
    else if (isTomorrow(d)) label = "Tomorrow";
    else if (isYesterday(d)) label = "Yesterday";
    else label = format(d, "EEE d MMM");
  } catch {
    label = date;
  }
  return time ? `${label} · ${formatTime(time)}` : label;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  if (!Number.isFinite(hour)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m ?? "00"} ${suffix}`;
}
