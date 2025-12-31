-- Rate limiting support for auth and API requests.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

-- Keep updated_at fresh on writes.
drop trigger if exists set_rate_limits_updated_at on public.rate_limits;
create trigger set_rate_limits_updated_at
before update on public.rate_limits
for each row execute function public.set_updated_at();

-- Service-role only. No direct access for authenticated/anon.
revoke select, insert, update, delete on public.rate_limits from authenticated;
revoke select, insert, update, delete on public.rate_limits from anon;

-- Atomic rate limit check.
create or replace function public.rate_limit_check(
  p_key text,
  p_window_seconds integer,
  p_max integer
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
as $$
declare
  current_window_start timestamptz;
  current_count integer;
begin
  if p_window_seconds <= 0 or p_max <= 0 then
    allowed := false;
    remaining := 0;
    reset_at := now();
    return next;
  end if;

  current_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (key, window_start, count)
  values (p_key, current_window_start, 1)
  on conflict (key) do update
    set count = case
        when public.rate_limits.window_start = current_window_start
          then public.rate_limits.count + 1
        else 1
      end,
      window_start = case
        when public.rate_limits.window_start = current_window_start
          then public.rate_limits.window_start
        else current_window_start
      end,
      updated_at = now()
  returning public.rate_limits.count, public.rate_limits.window_start
  into current_count, current_window_start;

  allowed := current_count <= p_max;
  remaining := greatest(p_max - current_count, 0);
  reset_at := current_window_start + make_interval(secs => p_window_seconds);

  return next;
end;
$$;
