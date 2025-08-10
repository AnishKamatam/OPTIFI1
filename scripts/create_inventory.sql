-- Inventory table for Boba Bliss
create table if not exists public.inventory (
  id bigint generated always as identity primary key,
  category text not null,
  par_level integer not null,
  actual_level integer not null,
  unit text not null,
  supplier text not null,
  unit_cost numeric(8,2) not null,
  value numeric(12,2) not null,
  turnover numeric(6,2) not null,
  status text not null,
  updated_at timestamptz not null default now()
);

-- Ensure unique category to allow upserts
create unique index if not exists inventory_category_uidx on public.inventory (category);

-- Safe alters for existing databases
alter table if exists public.inventory
  add column if not exists unit text,
  add column if not exists supplier text;


