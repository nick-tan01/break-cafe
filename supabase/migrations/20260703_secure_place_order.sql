-- ============================================================
-- Migration: secure order creation (server-side repricing)
-- Apply to the LIVE Supabase project (xjopwpmwljhihtyjvxxy).
--
-- Fixes a Critical finding: order subtotal/tip/total and per-item
-- unit_price were trusted from the client, and RLS allowed a signed-in
-- user to POST /rest/v1/orders (and /order_items) directly with any
-- prices — e.g. a $0 order for real menu items.
--
-- After this migration:
--   * place_order() is SECURITY DEFINER and reprices every line from
--     menu_items; client-supplied money is ignored.
--   * Direct INSERT on orders/order_items is revoked, so place_order()
--     is the ONLY creation path.
--   * Owners can no longer UPDATE the financial/ownership columns of an
--     order (least privilege).
--
-- Idempotent: safe to run more than once. No app rebuild required — the
-- place_order() call signature is unchanged.
-- ============================================================

-- 1) Reprice server-side. Same signature as before (kept for app compat);
--    subtotal/total are ignored and tip is only used to recover the percent.
create or replace function public.place_order(
  cafe_id bigint,
  notes text,
  subtotal numeric,
  tip numeric,
  total numeric,
  items jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id bigint;
  v_subtotal   numeric(8,2) := 0;
  v_tip        numeric(8,2) := 0;
  v_tip_pct    int          := 0;
  v_count      int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if items is null or jsonb_typeof(items) <> 'array'
     or jsonb_array_length(items) = 0 or jsonb_array_length(items) > 50 then
    raise exception 'order must contain between 1 and 50 items';
  end if;

  if exists (
    select 1 from jsonb_array_elements(place_order.items) as it
    where coalesce((it ->> 'quantity')::int, 0) < 1
       or coalesce((it ->> 'quantity')::int, 0) > 99
  ) then
    raise exception 'each item quantity must be between 1 and 99';
  end if;

  select coalesce(sum(mi.price * (it ->> 'quantity')::int), 0),
         count(distinct mi.menu_item_id)
    into v_subtotal, v_count
  from jsonb_array_elements(place_order.items) as it
  join public.menu_items mi
    on mi.menu_item_id = (it ->> 'menu_item_id')::bigint
   and mi.cafe_id = place_order.cafe_id
   and mi.is_available;

  if v_count is null or v_count < (
    select count(distinct (it ->> 'menu_item_id')::bigint)
    from jsonb_array_elements(place_order.items) as it
  ) then
    raise exception 'order contains items that are not available at this cafe';
  end if;

  if v_subtotal <= 0 then
    raise exception 'order subtotal must be positive';
  end if;

  v_tip_pct := round((coalesce(place_order.tip, 0) / v_subtotal) * 100);
  if v_tip_pct not in (0, 10, 15, 20) then
    v_tip_pct := 0;
  end if;
  v_tip := round(v_subtotal * v_tip_pct / 100.0, 2);

  insert into public.orders (user_id, cafe_id, status, notes, subtotal, tip, total)
  values (auth.uid(), place_order.cafe_id, 'pending', place_order.notes,
          v_subtotal, v_tip, v_subtotal + v_tip)
  returning order_id into new_order_id;

  insert into public.order_items (order_id, menu_item_id, quantity, unit_price, customizations)
  select new_order_id,
         mi.menu_item_id,
         (it ->> 'quantity')::int,
         mi.price,
         nullif(it -> 'customizations', 'null'::jsonb)
  from jsonb_array_elements(place_order.items) as it
  join public.menu_items mi
    on mi.menu_item_id = (it ->> 'menu_item_id')::bigint
   and mi.cafe_id = place_order.cafe_id;

  return new_order_id;
end;
$$;

-- 2) Remove the direct-insert doors so place_order() is the only path.
drop policy if exists "customers create own orders" on public.orders;
drop policy if exists "insert items on own order"   on public.order_items;
revoke insert on public.orders      from anon, authenticated;
revoke insert on public.order_items from anon, authenticated;

-- 3) Least privilege on order updates (owners): no financial/ownership columns.
revoke update (subtotal, tip, total, user_id, cafe_id) on public.orders from authenticated;

-- 4) Re-assert execute grants on the function.
revoke execute on function public.place_order(bigint, text, numeric, numeric, numeric, jsonb) from public, anon;
grant  execute on function public.place_order(bigint, text, numeric, numeric, numeric, jsonb) to authenticated;

-- 5) Reviews require a verified purchase — block drive-by rating manipulation.
drop policy if exists "create own review" on public.reviews;
create policy "create own review" on public.reviews
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.user_id = auth.uid()
        and o.cafe_id = reviews.cafe_id
        and o.status = 'completed'
    )
  );
