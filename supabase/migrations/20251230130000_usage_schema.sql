-- Usage tracking schema for credits/limits.

create table if not exists public.usage_balances (
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  credits_total integer not null,
  credits_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null,
  amount integer not null,
  period_start date not null,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists usage_events_user_id_idx
  on public.usage_events (user_id);

create index if not exists usage_events_period_idx
  on public.usage_events (period_start);

alter table public.usage_balances enable row level security;
alter table public.usage_events enable row level security;

-- Keep updated_at fresh on writes.
drop trigger if exists set_usage_balances_updated_at on public.usage_balances;
create trigger set_usage_balances_updated_at
before update on public.usage_balances
for each row execute function public.set_updated_at();

-- Users can read their own usage data. Writes are service-role only.
create policy "usage_balances_select_own" on public.usage_balances
  for select
  using (auth.uid() = user_id);

create policy "usage_events_select_own" on public.usage_events
  for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.usage_balances from authenticated;
revoke insert, update, delete on public.usage_events from authenticated;

revoke select on public.usage_balances from anon;
revoke select on public.usage_events from anon;

grant select on public.usage_balances to authenticated;
grant select on public.usage_events to authenticated;
