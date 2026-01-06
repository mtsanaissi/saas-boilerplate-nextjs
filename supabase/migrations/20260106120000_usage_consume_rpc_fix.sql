-- Resolve variable/column name ambiguity in consume_usage.

create or replace function public.consume_usage(
  p_user_id uuid,
  p_feature text,
  p_amount integer,
  p_period_start date,
  p_period_end date,
  p_credits_total integer,
  p_metadata jsonb default null
)
returns table(
  period_start date,
  period_end date,
  credits_total integer,
  credits_used integer,
  credits_remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if p_amount is null or p_amount <= 0 then
    raise exception using message = 'invalid_usage_amount', errcode = 'P0002';
  end if;

  if p_credits_total is null or p_credits_total <= 0 then
    raise exception using message = 'invalid_usage_total', errcode = 'P0002';
  end if;

  if p_amount > p_credits_total then
    raise exception using message = 'usage_limit_exceeded', errcode = 'P0001';
  end if;

  insert into public.usage_balances (
    user_id,
    period_start,
    period_end,
    credits_total,
    credits_used
  )
  values (
    p_user_id,
    p_period_start,
    p_period_end,
    p_credits_total,
    p_amount
  )
  on conflict (user_id, period_start) do update
    set credits_total = excluded.credits_total,
        period_end = excluded.period_end,
        credits_used = public.usage_balances.credits_used + excluded.credits_used,
        updated_at = now()
  where public.usage_balances.credits_used + excluded.credits_used <= excluded.credits_total
  returning
    public.usage_balances.period_start,
    public.usage_balances.period_end,
    public.usage_balances.credits_total,
    public.usage_balances.credits_used
  into period_start, period_end, credits_total, credits_used;

  if not found then
    raise exception using message = 'usage_limit_exceeded', errcode = 'P0001';
  end if;

  insert into public.usage_events (
    user_id,
    feature,
    amount,
    period_start,
    metadata
  )
  values (
    p_user_id,
    p_feature,
    p_amount,
    p_period_start,
    p_metadata
  );

  credits_remaining := greatest(credits_total - credits_used, 0);
  return next;
end;
$$;
