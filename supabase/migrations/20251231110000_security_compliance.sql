-- Security & compliance essentials: audit logs, consents, sessions.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_id text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_consents (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  analytics_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_sessions (
  session_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists audit_logs_user_id_idx
  on public.audit_logs (user_id);

create index if not exists user_sessions_user_id_idx
  on public.user_sessions (user_id);

alter table public.audit_logs enable row level security;
alter table public.user_consents enable row level security;
alter table public.user_sessions enable row level security;

-- Keep updated_at fresh on writes.
drop trigger if exists set_user_consents_updated_at on public.user_consents;
create trigger set_user_consents_updated_at
before update on public.user_consents
for each row execute function public.set_updated_at();

-- RLS policies
create policy "audit_logs_select_own" on public.audit_logs
  for select
  using (auth.uid() = user_id);

create policy "user_consents_select_own" on public.user_consents
  for select
  using (auth.uid() = user_id);

create policy "user_consents_update_own" on public.user_consents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_consents_insert_own" on public.user_consents
  for insert
  with check (auth.uid() = user_id);

create policy "user_sessions_select_own" on public.user_sessions
  for select
  using (auth.uid() = user_id);

create policy "user_sessions_insert_own" on public.user_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "user_sessions_update_own" on public.user_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_sessions_delete_own" on public.user_sessions
  for delete
  using (auth.uid() = user_id);

-- Restrict writes to audit logs (service-role only).
revoke insert, update, delete on public.audit_logs from authenticated;
revoke insert, update, delete on public.audit_logs from anon;

revoke select on public.audit_logs from anon;
revoke select on public.user_consents from anon;
revoke select on public.user_sessions from anon;

grant select on public.audit_logs to authenticated;
grant select, insert, update on public.user_consents to authenticated;
grant select, insert, update, delete on public.user_sessions to authenticated;
