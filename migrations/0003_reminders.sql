-- Reminder fields + extra settings (idempotent; 0002 already applied)

alter table tasks add column if not exists remind boolean not null default false;
alter table tasks add column if not exists snooze_until timestamptz;
alter table tasks add column if not exists last_fired_at timestamptz;

alter table user_settings add column if not exists reminders_enabled boolean not null default true;
alter table user_settings add column if not exists alarm_sound_enabled boolean not null default true;
alter table user_settings add column if not exists banner_notifications boolean not null default true;
