import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isPriority, type AppSettings, type Task } from "./types";

const taskSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().max(240),
  date: z.string().nullable(),
  time: z.string().nullable(),
  completed: z.boolean(),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  note: z.string().max(2000),
  noteChecked: z.boolean(),
  amount: z.number().finite().nullable(),
  currency: z.string().min(3).max(8),
  remind: z.boolean(),
  snoozeUntil: z.string().nullable(),
  lastFiredAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

const settingsSchema = z.object({
  defaultCurrency: z.string().min(3).max(8),
  showMoneyTotals: z.boolean(),
  remindersEnabled: z.boolean(),
  alarmSoundEnabled: z.boolean(),
  bannerNotifications: z.boolean(),
  updatedAt: z.string().optional(),
});

type TaskRow = {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  completed: boolean;
  priority: number;
  note: string;
  note_checked: boolean;
  amount: number | string | null;
  currency: string;
  remind: boolean;
  snooze_until: string | Date | null;
  last_fired_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
};

function toIso(value: string | Date | null): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function rowToTask(row: TaskRow): Task {
  const amount =
    row.amount == null || row.amount === ""
      ? null
      : typeof row.amount === "number"
        ? row.amount
        : Number(row.amount);
  const priority = isPriority(row.priority) ? row.priority : 1;
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    completed: Boolean(row.completed),
    priority,
    note: row.note ?? "",
    noteChecked: Boolean(row.note_checked),
    amount: amount != null && Number.isFinite(amount) ? amount : null,
    currency: row.currency,
    remind: Boolean(row.remind),
    snoozeUntil: toIso(row.snooze_until),
    lastFiredAt: toIso(row.last_fired_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
    deletedAt: toIso(row.deleted_at),
  };
}

export const listRemoteTasks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<TaskRow>`
      select id, title, date, time, completed, priority, note, note_checked,
             amount, currency, remind, snooze_until, last_fired_at,
             created_at, updated_at, deleted_at
      from tasks
      where user_id = ${context.userId}
    `;
    return rows.map(rowToTask);
  });

export const upsertRemoteTasks = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.array(taskSchema).max(500).parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    for (const t of data) {
      await sql`
        insert into tasks (
          id, user_id, title, date, time, completed, priority, note, note_checked,
          amount, currency, remind, snooze_until, last_fired_at,
          created_at, updated_at, deleted_at
        ) values (
          ${t.id}, ${context.userId}, ${t.title}, ${t.date}, ${t.time},
          ${t.completed}, ${t.priority}, ${t.note}, ${t.noteChecked},
          ${t.amount}, ${t.currency}, ${t.remind}, ${t.snoozeUntil}::timestamptz,
          ${t.lastFiredAt}::timestamptz, ${t.createdAt}::timestamptz,
          ${t.updatedAt}::timestamptz, ${t.deletedAt}::timestamptz
        )
        on conflict (user_id, id) do update set
          title = excluded.title,
          date = excluded.date,
          time = excluded.time,
          completed = excluded.completed,
          priority = excluded.priority,
          note = excluded.note,
          note_checked = excluded.note_checked,
          amount = excluded.amount,
          currency = excluded.currency,
          remind = excluded.remind,
          snooze_until = excluded.snooze_until,
          last_fired_at = excluded.last_fired_at,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at
        where excluded.updated_at >= tasks.updated_at
      `;
    }
    return { ok: true as const, count: data.length };
  });

export const getRemoteSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      default_currency: string;
      show_money_totals: boolean;
      reminders_enabled: boolean;
      alarm_sound_enabled: boolean;
      banner_notifications: boolean;
      updated_at: string | Date;
    }>`
      select default_currency, show_money_totals, reminders_enabled,
             alarm_sound_enabled, banner_notifications, updated_at
      from user_settings
      where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      defaultCurrency: row.default_currency,
      showMoneyTotals: Boolean(row.show_money_totals),
      remindersEnabled: Boolean(row.reminders_enabled),
      alarmSoundEnabled: Boolean(row.alarm_sound_enabled),
      bannerNotifications: Boolean(row.banner_notifications),
      updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
    };
  });

export const saveRemoteSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const updatedAt = data.updatedAt ?? new Date().toISOString();
    await sql`
      insert into user_settings (
        user_id, default_currency, show_money_totals,
        reminders_enabled, alarm_sound_enabled, banner_notifications, updated_at
      )
      values (
        ${context.userId}, ${data.defaultCurrency}, ${data.showMoneyTotals},
        ${data.remindersEnabled}, ${data.alarmSoundEnabled}, ${data.bannerNotifications},
        ${updatedAt}::timestamptz
      )
      on conflict (user_id) do update set
        default_currency = excluded.default_currency,
        show_money_totals = excluded.show_money_totals,
        reminders_enabled = excluded.reminders_enabled,
        alarm_sound_enabled = excluded.alarm_sound_enabled,
        banner_notifications = excluded.banner_notifications,
        updated_at = excluded.updated_at
      where excluded.updated_at >= user_settings.updated_at
    `;
    return { ok: true as const };
  });

export type RemoteSettings = AppSettings & { updatedAt: string };
