-- Pause & Prove: the tables for risk cases, scam reports and freeze requests (server/records.js).
-- Owner: Jose
-- Supabase dashboard, SQL Editor, New query: paste ALL of this and press Run.
-- It is safe to run more than once: it never deletes a table or anything in it.
--
-- Row Level Security is turned ON with no policies, like the sign-in tables. That means only the
-- server's secret key can read or write these tables. The browser never talks to them directly:
-- it goes through the server's API (/api/risk, /api/reports, /api/freeze).

-- A High-risk transfer the risk scorer paused for a bank officer. Shown as "TR-0001".
create table if not exists public.risk_cases (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  payee_name text not null default '',
  amount numeric not null,
  score integer not null,
  band text not null,
  reasons jsonb not null default '[]'::jsonb
);

-- A "Report a scam" form. Shown as "SR-0001".
create table if not exists public.scam_reports (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  customer_id text not null default '',
  what text not null,          -- call, message, sent or other
  lost text not null,          -- yes, no or unsure
  amount numeric,              -- only when money was lost
  contact text not null default '',
  more text not null default ''
);

-- A "Freeze my accounts" request. Shown as "FR-0001".
create table if not exists public.freeze_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  customer_id text not null default '',
  mobile text not null default ''
);

alter table public.risk_cases enable row level security;
alter table public.scam_reports enable row level security;
alter table public.freeze_requests enable row level security;

-- Check it worked: three rows, all saying true
select relname, relrowsecurity from pg_class where relname in ('risk_cases', 'scam_reports', 'freeze_requests');
