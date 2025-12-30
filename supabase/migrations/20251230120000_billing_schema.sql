-- Minimal billing schema for single-user subscriptions.

create type public.plan_id as enum ('free', 'starter', 'pro');
create type public.plan_status as enum ('free', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  avatar_url text,
  locale text,
  plan_id public.plan_id not null default 'free',
  plan_status public.plan_status not null default 'free'
);

create table if not exists public.billing_customers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status public.plan_status not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  event_created_at timestamptz,
  processed_at timestamptz,
  user_id uuid references public.profiles(id) on delete set null,
  payload jsonb
);

create index if not exists stripe_events_user_id_idx
  on public.stripe_events (user_id);

alter table public.profiles enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.stripe_events enable row level security;

-- Keep updated_at fresh on writes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_billing_customers_updated_at on public.billing_customers;
create trigger set_billing_customers_updated_at
before update on public.billing_customers
for each row execute function public.set_updated_at();

drop trigger if exists set_billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger set_billing_subscriptions_updated_at
before update on public.billing_subscriptions
for each row execute function public.set_updated_at();

-- Users can read their own profile and update limited fields.
create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can read their own billing data. Writes are service-role only.
create policy "billing_customers_select_own" on public.billing_customers
  for select
  using (auth.uid() = user_id);

create policy "billing_subscriptions_select_own" on public.billing_subscriptions
  for select
  using (auth.uid() = user_id);

create policy "stripe_events_select_own" on public.stripe_events
  for select
  using (auth.uid() = user_id);

-- Tighten column-level update privileges for authenticated users.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, locale) on public.profiles to authenticated;

revoke insert, update, delete on public.billing_customers from authenticated;
revoke insert, update, delete on public.billing_subscriptions from authenticated;
revoke insert, update, delete on public.stripe_events from authenticated;

-- Grant read access to authenticated users (no anon reads).
revoke select on public.profiles from anon;
revoke select on public.billing_customers from anon;
revoke select on public.billing_subscriptions from anon;
revoke select on public.stripe_events from anon;

grant select on public.profiles to authenticated;
grant select on public.billing_customers to authenticated;
grant select on public.billing_subscriptions to authenticated;
grant select on public.stripe_events to authenticated;

create index if not exists billing_subscriptions_status_idx
  on public.billing_subscriptions (status);

create index if not exists billing_subscriptions_price_idx
  on public.billing_subscriptions (stripe_price_id);

-- Create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
