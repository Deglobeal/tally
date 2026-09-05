export type Priority = 0 | 1 | 2;
export type StatusFilter = "all" | "pending" | "done";
export type SortKey = "created" | "date" | "priority" | "amount";
export type Period = "all" | "day" | "week" | "month";
export type SyncStatus = "local" | "syncing" | "synced" | "offline" | "error";

export type Task = {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  completed: boolean;
  priority: Priority;
  note: string;
  noteChecked: boolean;
  amount: number | null;
  currency: string;
  remind: boolean;
  snoozeUntil: string | null;
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AlarmItem = {
  taskId: string;
  title: string;
  amount: number | null;
  currency: string;
  whenLabel: string;
  test?: boolean;
};

export type AppSettings = {
  defaultCurrency: string;
  showMoneyTotals: boolean;
  remindersEnabled: boolean;
  alarmSoundEnabled: boolean;
  bannerNotifications: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: "NGN",
  showMoneyTotals: true,
  remindersEnabled: true,
  alarmSoundEnabled: true,
  bannerNotifications: true,
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  0: "Low",
  1: "Medium",
  2: "High",
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function normalizeTask(task: Task): Task {
  return {
    ...task,
    remind: task.remind === true,
    snoozeUntil: task.snoozeUntil ?? null,
    lastFiredAt: task.lastFiredAt ?? null,
  };
}

export function normalizeSettings(settings: Partial<AppSettings> | undefined): AppSettings {
  return { ...DEFAULT_SETTINGS, ...settings };
}

export function createTask(
  partial: Partial<Task> & { title: string },
  currency: string,
): Task {
  const ts = nowIso();
  return {
    id: crypto.randomUUID(),
    title: partial.title,
    date: partial.date ?? null,
    time: partial.time ?? null,
    completed: partial.completed ?? false,
    priority: partial.priority ?? 1,
    note: partial.note ?? "",
    noteChecked: partial.noteChecked ?? false,
    amount: partial.amount ?? null,
    currency: partial.currency ?? currency,
    remind: partial.remind === true,
    snoozeUntil: partial.snoozeUntil ?? null,
    lastFiredAt: partial.lastFiredAt ?? null,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

export function makeSeedTasks(currency: string): Task[] {
  const ts = nowIso();
  return [
    {
      id: crypto.randomUUID(),
      title: "Buy groceries",
      date: todayIsoDate(),
      time: "17:30",
      completed: false,
      priority: 2,
      note: "Milk, eggs, bread",
      noteChecked: false,
      amount: 4500,
      currency,
      remind: true,
      snoozeUntil: null,
      lastFiredAt: ts,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    },
    {
      id: crypto.randomUUID(),
      title: "Pay electricity bill",
      date: addDaysIso(-2),
      time: null,
      completed: true,
      priority: 1,
      note: "Prepaid meter top-up",
      noteChecked: true,
      amount: 8200,
      currency,
      remind: false,
      snoozeUntil: null,
      lastFiredAt: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    },
    {
      id: crypto.randomUUID(),
      title: "Call the plumber",
      date: addDaysIso(1),
      time: "10:00",
      completed: false,
      priority: 0,
      note: "Kitchen sink is leaking",
      noteChecked: false,
      amount: null,
      currency,
      remind: true,
      snoozeUntil: null,
      lastFiredAt: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    },
  ];
}

export function mergeTasks(local: Task[], remote: Task[]): Task[] {
  const map = new Map<string, Task>();
  for (const t of local) map.set(t.id, t);
  for (const t of remote) {
    const existing = map.get(t.id);
    if (!existing || t.updatedAt > existing.updatedAt) {
      map.set(t.id, t);
    }
  }
  return [...map.values()];
}

export function isPriority(n: number): n is Priority {
  return n === 0 || n === 1 || n === 2;
}
