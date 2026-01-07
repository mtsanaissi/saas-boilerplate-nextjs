-- Account deletion request tracking for gated deletion flows.

create table if not exists public.account_deletion_requests (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  token uuid not null,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_deletion_requests_expires_idx
  on public.account_deletion_requests (expires_at);

alter table public.account_deletion_requests enable row level security;

-- Keep updated_at fresh on writes.
drop trigger if exists set_account_deletion_requests_updated_at on public.account_deletion_requests;
create trigger set_account_deletion_requests_updated_at
before update on public.account_deletion_requests
for each row execute function public.set_updated_at();

-- RLS policies
create policy "account_deletion_requests_select_own" on public.account_deletion_requests
  for select
  using (auth.uid() = user_id);

create policy "account_deletion_requests_insert_own" on public.account_deletion_requests
  for insert
  with check (auth.uid() = user_id);

create policy "account_deletion_requests_update_own" on public.account_deletion_requests
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke select on public.account_deletion_requests from anon;
revoke insert, update, delete on public.account_deletion_requests from anon;

grant select, insert, update on public.account_deletion_requests to authenticated;
