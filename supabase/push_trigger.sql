-- ============================================================
-- BREAK — order-status push trigger (REFERENCE ONLY, NOT APPLIED)
--
-- Do NOT run this yet. It activates once:
--   1. the admin order queue is updating real orders, and
--   2. the send-order-push edge function is deployed with its
--      ORDER_PUSH_WEBHOOK_SECRET secret set, and
--   3. '<SET-ME>' below is replaced with that same secret value.
-- See docs/NOTIFICATIONS.md for the step-by-step.
--
-- What it does: after a cafe owner changes an order's status, it
-- POSTs a database-webhook-shaped payload
--   { "type": "UPDATE", "record": <new row>, "old_record": <old row> }
-- to the send-order-push edge function, which pushes a notification
-- to the customer's phone. Uses pg_net (async — never blocks or
-- fails the order update itself).
-- ============================================================

-- pg_net ships with Supabase but must be enabled once per project.
create extension if not exists pg_net;

create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    -- project xjopwpmwljhihtyjvxxy / function send-order-push
    url := 'https://xjopwpmwljhihtyjvxxy.supabase.co/functions/v1/send-order-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      -- must match the function's ORDER_PUSH_WEBHOOK_SECRET secret
      'x-webhook-secret', '<SET-ME>'
    ),
    body := jsonb_build_object(
      'type', 'UPDATE',
      'record', to_jsonb(new),
      'old_record', to_jsonb(old)
    )
  );
  return new;
end;
$$;

-- the trigger machinery, not app users, calls this
revoke execute on function public.notify_order_status_change() from public, anon, authenticated;

drop trigger if exists order_status_push on public.orders;
create trigger order_status_push
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_order_status_change();
