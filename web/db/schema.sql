-- GasanbuildsAI database (Neon Postgres). Safe to re-run.

create table if not exists chat_days (
  day date primary key,
  usd numeric(12, 6) not null default 0,
  messages integer not null default 0
);

create table if not exists chat_visitors (
  day date not null,
  visitor text not null,
  messages integer not null default 0,
  primary key (day, visitor)
);

create table if not exists interview_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text not null default '',
  role text not null default '',
  topics text not null,
  preferred text not null default '',
  visitor text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'done')),
  minutes integer,
  decided_at timestamptz
);

create index if not exists interview_requests_visitor_day on interview_requests (visitor, created_at);

-- 2026-11-06: calls with Gasan himself, and Jasmin's note on each request.
alter table interview_requests
  add column if not exists kind text not null default 'interview' check (kind in ('interview', 'call')),
  add column if not exists note text not null default '',
  add column if not exists source text not null default 'form';

-- 2026-11-06: saved chats (30 days, no IPs) and the nightly review.
create table if not exists chat_conversations (
  id uuid primary key,
  visitor text not null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  page text not null default '',
  messages jsonb not null default '[]'::jsonb,
  turns integer not null default 0,
  cost numeric(12, 6) not null default 0,
  request boolean not null default false,
  ended boolean not null default false,
  review jsonb,
  reviewed_at timestamptz
);
create index if not exists chat_conversations_updated on chat_conversations (updated_at);

create table if not exists job_runs (
  name text not null,
  day date not null,
  ran_at timestamptz not null default now(),
  result jsonb,
  primary key (name, day)
);
