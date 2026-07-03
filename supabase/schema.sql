-- ============================================================
-- BREAK — Supabase (Postgres) schema
-- Deployed to project xjopwpmwljhihtyjvxxy (org: Break) on 2026-06-11
-- via four migrations: break_initial_schema +
-- lock_down_function_rpc_exposure (MCP) + place_order_rpc
-- (dashboard SQL editor) + add_expo_push_token (MCP).
-- This file is the consolidated
-- equivalent for reference / disaster recovery: running it on a
-- fresh project reproduces the deployed state.
-- Column names match what the app queries (lowercase snake_case).
-- ============================================================

-- ---------- profiles (extends auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  expo_push_token text, -- where this user's phone receives push notifications
  created_at timestamptz not null default now()
);

-- auto-create a profile row whenever someone signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- only the auth system may call this (not exposed via REST RPC)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- ---------- cafes ----------
create table public.cafes (
  cafe_id bigint generated always as identity primary key,
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  avg_rating numeric(2,1) not null default 0,
  profile_image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- day_of_week: 1 = Monday … 7 = Sunday (matches the app's getDay() mapping)
create table public.cafe_hours (
  cafe_hour_id bigint generated always as identity primary key,
  cafe_id bigint not null references public.cafes (cafe_id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  opening_time time not null,
  closing_time time not null,
  is_closed boolean not null default false,
  unique (cafe_id, day_of_week)
);

create table public.cafe_owners (
  owner_id bigint generated always as identity primary key,
  cafe_id bigint not null references public.cafes (cafe_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner',
  added_at timestamptz not null default now(),
  unique (cafe_id, user_id)
);

-- ---------- menu ----------
create table public.menu_items (
  menu_item_id bigint generated always as identity primary key,
  cafe_id bigint not null references public.cafes (cafe_id) on delete cascade,
  name text not null,
  description text,
  price numeric(8,2) not null check (price >= 0),
  category text,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- orders ----------
create table public.orders (
  order_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id),
  cafe_id bigint not null references public.cafes (cafe_id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  pickup_time timestamptz,
  notes text,
  subtotal numeric(8,2) not null default 0,
  tip numeric(8,2) not null default 0,
  total numeric(8,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_items (
  order_item_id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (order_id) on delete cascade,
  menu_item_id bigint not null references public.menu_items (menu_item_id),
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(8,2) not null,
  customizations jsonb
);

-- ---------- favorites & reviews ----------
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  cafe_id bigint not null references public.cafes (cafe_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, cafe_id)
);

create table public.reviews (
  review_id bigint generated always as identity primary key,
  cafe_id bigint not null references public.cafes (cafe_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (cafe_id, user_id)
);

-- ---------- indexes ----------
create index idx_cafe_hours_cafe on public.cafe_hours (cafe_id);
create index idx_cafe_owners_user on public.cafe_owners (user_id);
create index idx_menu_items_cafe on public.menu_items (cafe_id);
create index idx_orders_user on public.orders (user_id);
create index idx_orders_cafe on public.orders (cafe_id, status);
create index idx_order_items_order on public.order_items (order_id);
create index idx_reviews_cafe on public.reviews (cafe_id);

-- ============================================================
-- Row Level Security
-- Anon key ships in the app bundle, so RLS is the actual security
-- boundary. Deny-by-default; policies below are the only doors.
-- Owner policies are scoped `to authenticated` so the anon role
-- never evaluates (and cannot call) is_cafe_owner.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.cafes enable row level security;
alter table public.cafe_hours enable row level security;
alter table public.cafe_owners enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

-- helper: is the current user an owner of the given cafe?
-- (SECURITY DEFINER avoids RLS recursion on cafe_owners; callable
-- by authenticated only — harmless anyway, returns a boolean about
-- the caller themselves)
create function public.is_cafe_owner(target_cafe bigint)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.cafe_owners
    where cafe_id = target_cafe and user_id = auth.uid()
  );
$$;
revoke execute on function public.is_cafe_owner(bigint) from public, anon;

-- profiles: each user manages their own row
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid());

-- cafes: public read of active cafes; owners can read/update theirs
-- (inserting cafes stays dashboard/service-role only for now)
create policy "public read active cafes" on public.cafes
  for select using (is_active);
create policy "owners read their cafe" on public.cafes
  for select to authenticated using (public.is_cafe_owner(cafe_id));
create policy "owners update their cafe" on public.cafes
  for update to authenticated using (public.is_cafe_owner(cafe_id));

-- cafe_hours: public read; owners manage theirs
create policy "public read hours" on public.cafe_hours
  for select using (true);
create policy "owners manage hours" on public.cafe_hours
  for all to authenticated using (public.is_cafe_owner(cafe_id));

-- cafe_owners: users can see their own ownership rows
-- (the admin login check reads this; granting ownership stays dashboard-only)
create policy "read own ownership" on public.cafe_owners
  for select to authenticated using (user_id = auth.uid());

-- menu_items: public read; owners manage theirs
create policy "public read menu" on public.menu_items
  for select using (true);
create policy "owners manage menu" on public.menu_items
  for all to authenticated using (public.is_cafe_owner(cafe_id));

-- orders: creation is ONLY through the place_order() RPC (SECURITY DEFINER),
-- which reprices every line from menu_items server-side. Direct client INSERT
-- is revoked below (see "revoke insert" near place_order) so a tampered client
-- can never write arbitrary prices/totals or forge a $0 order.
create policy "customers read own orders" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_cafe_owner(cafe_id));
create policy "owners update order status" on public.orders
  for update to authenticated using (public.is_cafe_owner(cafe_id));
-- Least privilege: owners may change workflow columns (status, pickup_time,
-- notes) but never the financial columns or ownership. Column-level REVOKE
-- makes any UPDATE that touches these columns fail, independent of the policy.
revoke update (subtotal, tip, total, user_id, cafe_id) on public.orders from authenticated;

-- order_items: created only by place_order() (direct client INSERT revoked
-- below). Reads follow the parent order's visibility.
create policy "read items of visible orders" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.order_id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_cafe_owner(o.cafe_id))
    )
  );

-- favorites: strictly per-user
create policy "manage own favorites" on public.favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reviews: public read; signed-in users write/edit their own
create policy "public read reviews" on public.reviews
  for select using (true);
-- Only a customer who has actually completed an order at this cafe may review
-- it — blocks drive-by rating manipulation by bots/competitors.
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
create policy "edit own review" on public.reviews
  for update to authenticated using (user_id = auth.uid());
create policy "delete own review" on public.reviews
  for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- RPC: place_order — insert an order and its items atomically.
-- Replaces the app's old two-step insert, which could strand an
-- empty 'pending' order if the items insert failed.
--
-- SECURITY DEFINER: this function is the ONLY way to create an
-- order (direct client INSERT on orders/order_items is revoked
-- below). It NEVER trusts client-supplied money. It reprices every
-- line from menu_items and derives the tip from an allowed percent,
-- so a tampered client cannot forge a $0 order or change what it owes.
-- The `subtotal`/`tip`/`total` params are kept only for call-signature
-- compatibility with existing app builds; subtotal/total are ignored
-- and `tip` is used solely to recover the intended tip PERCENT, which
-- is re-validated against the server-computed subtotal.
--
-- items: jsonb array of { menu_item_id, quantity, customizations }
-- (any client-supplied unit_price is ignored — priced from the DB).
-- ============================================================
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

  -- Reject bad quantities up front (1..99 per line).
  if exists (
    select 1 from jsonb_array_elements(place_order.items) as it
    where coalesce((it ->> 'quantity')::int, 0) < 1
       or coalesce((it ->> 'quantity')::int, 0) > 99
  ) then
    raise exception 'each item quantity must be between 1 and 99';
  end if;

  -- Authoritative subtotal: sum(menu price * quantity) for AVAILABLE items
  -- that actually belong to this cafe. Client prices are never read.
  select coalesce(sum(mi.price * (it ->> 'quantity')::int), 0),
         count(distinct mi.menu_item_id)
    into v_subtotal, v_count
  from jsonb_array_elements(place_order.items) as it
  join public.menu_items mi
    on mi.menu_item_id = (it ->> 'menu_item_id')::bigint
   and mi.cafe_id = place_order.cafe_id
   and mi.is_available;

  -- Every requested item must resolve to a real, available menu row.
  if v_count is null or v_count < (
    select count(distinct (it ->> 'menu_item_id')::bigint)
    from jsonb_array_elements(place_order.items) as it
  ) then
    raise exception 'order contains items that are not available at this cafe';
  end if;

  if v_subtotal <= 0 then
    raise exception 'order subtotal must be positive';
  end if;

  -- Recover the tip PERCENT from the client's requested tip amount, then
  -- recompute the tip from the server subtotal. Only 0/10/15/20% are allowed;
  -- anything else (including a negative tip) falls back to no tip.
  v_tip_pct := round((coalesce(place_order.tip, 0) / v_subtotal) * 100);
  if v_tip_pct not in (0, 10, 15, 20) then
    v_tip_pct := 0;
  end if;
  v_tip := round(v_subtotal * v_tip_pct / 100.0, 2);

  insert into public.orders (user_id, cafe_id, status, notes, subtotal, tip, total)
  values (auth.uid(), place_order.cafe_id, 'pending', place_order.notes,
          v_subtotal, v_tip, v_subtotal + v_tip)
  returning order_id into new_order_id;

  -- unit_price comes from menu_items, NOT the client.
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

-- Lock down order creation: the SECURITY DEFINER place_order() above is the
-- single creation path. No role may INSERT into orders/order_items directly,
-- which closes the "POST /rest/v1/orders with unit_price:0" bypass.
revoke insert on public.orders      from anon, authenticated;
revoke insert on public.order_items from anon, authenticated;

-- signed-in customers only; anon never places orders
revoke execute on function public.place_order(bigint, text, numeric, numeric, numeric, jsonb) from public, anon;
grant execute on function public.place_order(bigint, text, numeric, numeric, numeric, jsonb) to authenticated;

-- ============================================================
-- Seed data — 3 demo LA cafes with hours and a starter menu
-- ============================================================
insert into public.cafes (name, address, latitude, longitude, avg_rating, profile_image_url) values
  ('Sunset Brew', '7901 Sunset Blvd, Los Angeles, CA 90046', 34.0978, -118.3617, 4.6,
   'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'),
  ('Highland Roasters', '5715 N Figueroa St, Los Angeles, CA 90042', 34.1117, -118.1924, 4.4,
   'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800'),
  ('Venice Bean', '1400 Abbot Kinney Blvd, Venice, CA 90291', 33.9897, -118.4633, 4.8,
   'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800');

-- Mon–Fri 7:00–19:00, Sat–Sun 8:00–18:00 for every cafe
insert into public.cafe_hours (cafe_id, day_of_week, opening_time, closing_time)
select c.cafe_id, d,
       case when d <= 5 then time '07:00' else time '08:00' end,
       case when d <= 5 then time '19:00' else time '18:00' end
from public.cafes c, generate_series(1, 7) as d;

insert into public.menu_items (cafe_id, name, description, price, category)
select c.cafe_id, m.name, m.description, m.price, m.category
from (values
  ('Sunset Brew', 'Espresso', 'Double shot, single-origin', 3.50, 'Coffee'),
  ('Sunset Brew', 'Oat Milk Latte', 'House espresso with oat milk', 5.75, 'Coffee'),
  ('Sunset Brew', 'Almond Croissant', 'Baked daily', 4.95, 'Pastries'),
  ('Highland Roasters', 'Pour Over', 'Rotating single-origin, 12oz', 5.50, 'Coffee'),
  ('Highland Roasters', 'Cold Brew', '18-hour steep, 16oz', 5.25, 'Coffee'),
  ('Highland Roasters', 'Breakfast Burrito', 'Egg, cheese, potato, salsa verde', 9.50, 'Food'),
  ('Venice Bean', 'Matcha Latte', 'Ceremonial grade, choice of milk', 6.25, 'Tea'),
  ('Venice Bean', 'Cortado', 'Equal parts espresso and steamed milk', 4.75, 'Coffee'),
  ('Venice Bean', 'Avocado Toast', 'Sourdough, chili flake, lemon', 8.95, 'Food')
) as m(cafe_name, name, description, price, category)
join public.cafes c on c.name = m.cafe_name;

-- ============================================================
-- FINAL STEP (manual): make yourself the owner of a cafe so the
-- BREAK admin portal lets you in.
--   1. Sign up in the app (or Authentication → Users → Add user).
--   2. Copy your user's UUID from Authentication → Users.
--   3. Run, e.g.:
--      insert into public.cafe_owners (cafe_id, user_id, role)
--      values (1, 'PASTE-YOUR-USER-UUID-HERE', 'owner');
-- ============================================================
