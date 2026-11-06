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
