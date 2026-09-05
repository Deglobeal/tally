-- Tally: per-user tasks + settings (offline-first, last-write-wins sync)

create table if not exists tasks (
  id           text not null,
  user_id      text not null,
  title        text not null,
  date         text,
  time         text,
  completed    boolean not null default false,
  priority     integer not null default 1,
  note         text not null default '',
  note_checked boolean not null default false,
  amount       double precision,
  currency     text not null default 'NGN',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  primary key (user_id, id)
);

create index if not exists tasks_user_updated_idx on tasks (user_id, updated_at desc);

create table if not exists user_settings (
  user_id            text primary key,
  default_currency   text not null default 'NGN',
  show_money_totals  boolean not null default true,
  updated_at         timestamptz not null default now()
);
