import type { Period, SortKey, StatusFilter, Task } from "./types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inPeriod(date: string | null, period: Period, now = new Date()): boolean {
  if (period === "all") return true;
  if (!date) return false;
  const taskDay = startOfDay(new Date(`${date}T00:00:00`));
  const today = startOfDay(now);
  if (period === "day") return taskDay.getTime() === today.getTime();
  if (period === "week") {
    const start = new Date(today);
    const weekday = start.getDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    start.setDate(start.getDate() + mondayOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return taskDay >= start && taskDay < end;
  }
  return (
    taskDay.getFullYear() === today.getFullYear() &&
    taskDay.getMonth() === today.getMonth()
  );
}

export function activeTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.deletedAt);
}

export function filterTasks(
  tasks: Task[],
  status: StatusFilter,
  period: Period,
): Task[] {
  return activeTasks(tasks).filter((t) => {
    if (status === "pending" && t.completed) return false;
    if (status === "done" && !t.completed) return false;
    if (period !== "all" && !inPeriod(t.date, period)) return false;
    return true;
  });
}

export function sortTasks(tasks: Task[], key: SortKey): Task[] {
  const copy = [...tasks];
  copy.sort((a, b) => {
    if (key === "priority") return b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt);
    if (key === "amount") {
      const aa = a.amount ?? -Infinity;
      const bb = b.amount ?? -Infinity;
      return bb - aa;
    }
    if (key === "date") {
      if (a.date && b.date) {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        return (a.time ?? "").localeCompare(b.time ?? "");
      }
      if (a.date) return -1;
      if (b.date) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
  return copy;
}

export function sumAmounts(tasks: Task[]): { pending: number; spent: number } {
  let pending = 0;
  let spent = 0;
  for (const t of tasks) {
    if (t.amount == null) continue;
    if (t.completed) spent += t.amount;
    else pending += t.amount;
  }
  return { pending, spent };
}

export function periodTasks(tasks: Task[], period: Period): Task[] {
  return activeTasks(tasks).filter((t) => inPeriod(t.date, period));
}
