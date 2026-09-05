import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { snoozeIso, toAlarmItem } from "./reminder";
import {
  createTask,
  DEFAULT_SETTINGS,
  makeSeedTasks,
  normalizeSettings,
  normalizeTask,
  nowIso,
  type AlarmItem,
  type AppSettings,
  type Period,
  type SortKey,
  type StatusFilter,
  type SyncStatus,
  type Task,
} from "./types";

type TaskState = {
  tasks: Task[];
  settings: AppSettings;
  hasSeeded: boolean;
  hydrated: boolean;
  revision: number;
  statusFilter: StatusFilter;
  sortKey: SortKey;
  period: Period;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  ringing: AlarmItem[];
  setHydrated: () => void;
  seedIfNeeded: () => void;
  replaceAll: (tasks: Task[], settings?: AppSettings) => void;
  addTask: (partial: Partial<Task> & { title: string }) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleComplete: (id: string) => void;
  toggleNoteChecked: (id: string) => void;
  removeTask: (id: string) => void;
  setSettings: (patch: Partial<AppSettings>) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setSortKey: (key: SortKey) => void;
  setPeriod: (period: Period) => void;
  setSyncStatus: (status: SyncStatus) => void;
  markSynced: () => void;
  enqueueAlarm: (task: Task) => void;
  enqueueTestAlarm: () => void;
  markFired: (id: string) => void;
  dismissAlarm: (taskId: string) => void;
  snoozeAlarm: (taskId: string, minutes?: number) => void;
  completeFromAlarm: (taskId: string) => void;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      settings: DEFAULT_SETTINGS,
      hasSeeded: false,
      hydrated: false,
      revision: 0,
      statusFilter: "all",
      sortKey: "created",
      period: "all",
      syncStatus: "local",
      lastSyncedAt: null,
      ringing: [],
      setHydrated: () => set({ hydrated: true }),
      seedIfNeeded: () => {
        const { hasSeeded, tasks } = get();
        if (hasSeeded || tasks.length > 0) {
          set({ hasSeeded: true });
          return;
        }
        const currency = get().settings.defaultCurrency;
        set({
          tasks: makeSeedTasks(currency),
          hasSeeded: true,
          revision: get().revision + 1,
        });
      },
      replaceAll: (tasks, settings) =>
        set((s) => ({
          tasks: tasks.map(normalizeTask),
          settings: settings ? normalizeSettings(settings) : s.settings,
          revision: s.revision + 1,
        })),
      addTask: (partial) => {
        const task = createTask(partial, get().settings.defaultCurrency);
        set((s) => ({
          tasks: [task, ...s.tasks],
          revision: s.revision + 1,
        }));
        return task.id;
      },
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? normalizeTask({ ...t, ...patch, id: t.id, updatedAt: nowIso() })
              : t,
          ),
          revision: s.revision + 1,
        })),
      toggleComplete: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, completed: !t.completed, updatedAt: nowIso() }
              : t,
          ),
          ringing: s.ringing.filter((a) => a.taskId !== id),
          revision: s.revision + 1,
        })),
      toggleNoteChecked: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, noteChecked: !t.noteChecked, updatedAt: nowIso() }
              : t,
          ),
          revision: s.revision + 1,
        })),
      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, deletedAt: nowIso(), updatedAt: nowIso() } : t,
          ),
          ringing: s.ringing.filter((a) => a.taskId !== id),
          revision: s.revision + 1,
        })),
      setSettings: (patch) =>
        set((s) => ({
          settings: normalizeSettings({ ...s.settings, ...patch }),
          revision: s.revision + 1,
        })),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSortKey: (sortKey) => set({ sortKey }),
      setPeriod: (period) => set({ period }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      markSynced: () =>
        set({ syncStatus: "synced", lastSyncedAt: nowIso() }),
      enqueueAlarm: (task) =>
        set((s) => {
          if (s.ringing.some((a) => a.taskId === task.id)) return s;
          return { ringing: [...s.ringing, toAlarmItem(task)] };
        }),
      enqueueTestAlarm: () =>
        set((s) => {
          if (s.ringing.some((a) => a.test)) return s;
          return {
            ringing: [
              ...s.ringing,
              {
                taskId: "__test__",
                title: "Test reminder",
                amount: null,
                currency: s.settings.defaultCurrency,
                whenLabel: "Now",
                test: true,
              },
            ],
          };
        }),
      markFired: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, lastFiredAt: nowIso(), updatedAt: nowIso() } : t,
          ),
          revision: s.revision + 1,
        })),
      dismissAlarm: (taskId) =>
        set((s) => ({
          ringing: s.ringing.filter((a) => a.taskId !== taskId),
        })),
      snoozeAlarm: (taskId, minutes = 10) =>
        set((s) => {
          if (taskId === "__test__") {
            return { ringing: s.ringing.filter((a) => a.taskId !== taskId) };
          }
          return {
            tasks: s.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    snoozeUntil: snoozeIso(minutes),
                    lastFiredAt: nowIso(),
                    updatedAt: nowIso(),
                  }
                : t,
            ),
            ringing: s.ringing.filter((a) => a.taskId !== taskId),
            revision: s.revision + 1,
          };
        }),
      completeFromAlarm: (taskId) =>
        set((s) => {
          if (taskId === "__test__") {
            return { ringing: s.ringing.filter((a) => a.taskId !== taskId) };
          }
          return {
            tasks: s.tasks.map((t) =>
              t.id === taskId
                ? { ...t, completed: true, updatedAt: nowIso() }
                : t,
            ),
            ringing: s.ringing.filter((a) => a.taskId !== taskId),
            revision: s.revision + 1,
          };
        }),
    }),
    {
      name: "tally-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TaskState>;
        return {
          ...current,
          ...p,
          settings: normalizeSettings(p.settings),
          tasks: (p.tasks ?? current.tasks).map(normalizeTask),
          ringing: [],
          hydrated: false,
        };
      },
      partialize: (s) => ({
        tasks: s.tasks,
        settings: s.settings,
        hasSeeded: s.hasSeeded,
        statusFilter: s.statusFilter,
        sortKey: s.sortKey,
        period: s.period,
      }),
    },
  ),
);
