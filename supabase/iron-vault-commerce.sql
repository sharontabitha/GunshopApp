-- Run once in Supabase SQL Editor after the public.products table exists.
-- Customer accounts are regular users. Promote the store owner using the
-- final UPDATE statement after creating that account in the storefront.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

insert into public.profiles (id, email, full_name)
select id, coalesce(email, ''), coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'cancelled')),
  total numeric(12,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  image_url text not null default ''
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;

-- Remove any broad starter-project product policies before applying the
-- public-read/admin-write rules below.
do $$
declare old_policy record;
begin
  for old_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'products'
  loop
    execute format('drop policy %I on public.products', old_policy.policyname);
  end loop;
end;
$$;

drop policy if exists "profiles: read self or admin" on public.profiles;
create policy "profiles: read self or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: update self without admin privilege" on public.profiles;
create policy "profiles: update self without admin privilege" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check ((id = auth.uid() and is_admin = false) or public.is_admin());

create policy "products: public read" on public.products
  for select to anon, authenticated using (true);
create policy "products: admin insert" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "products: admin update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products: admin delete" on public.products
  for delete to authenticated using (public.is_admin());

drop policy if exists "orders: customer or admin read" on public.orders;
create policy "orders: customer or admin read" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order items: customer or admin read" on public.order_items;
create policy "order items: customer or admin read" on public.order_items
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

create or replace function public.place_order(p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  item jsonb;
  product_row public.products%rowtype;
  item_quantity integer;
  order_total numeric(12,2) := 0;
  profile_row public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Please sign in before placing an order.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  select * into profile_row from public.profiles where id = auth.uid();
  if not found then raise exception 'Customer profile is missing.'; end if;

  insert into public.orders (user_id, customer_name, customer_email)
  values (auth.uid(), profile_row.full_name, profile_row.email)
  returning id into new_order_id;

  for item in select value from jsonb_array_elements(p_items)
  loop
    item_quantity := (item->>'quantity')::integer;
    if item_quantity is null or item_quantity < 1 or item_quantity > 50 then
      raise exception 'Quantity must be between 1 and 50.';
    end if;

    select * into product_row
    from public.products
    where id = (item->>'product_id')::uuid;
    if not found then raise exception 'A selected product is no longer available.'; end if;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, image_url)
    values (new_order_id, product_row.id, product_row.name, item_quantity, product_row.price, coalesce(product_row.image_url, ''));
    order_total := order_total + (product_row.price * item_quantity);
  end loop;

  update public.orders set total = order_total where id = new_order_id;
  return new_order_id;
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, update on public.profiles to authenticated;

-- After signing up at the site, replace the email below with the store owner's
-- account email and run this statement to grant access to the admin order desk.
-- update public.profiles set is_admin = true where email = 'owner@example.com';
