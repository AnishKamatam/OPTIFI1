-- boba_transactions table schema
-- Safe to run multiple times
create table if not exists public.boba_transactions (
  id bigint generated always as identity primary key,
  transaction_id text not null,
  date date not null,
  item text not null,
  size text not null,
  add_on text not null,
  price numeric(6,2) not null,
  payment_method text not null,
  created_at timestamptz not null default now()
);

-- New columns for cost and margin (safe to run repeatedly)
alter table if exists public.boba_transactions
  add column if not exists cost numeric(6,2),
  add column if not exists margin numeric(6,2);

-- Helpful indexes
create index if not exists boba_txn_date_idx on public.boba_transactions(date);
create index if not exists boba_txn_item_idx on public.boba_transactions(item);
create index if not exists boba_txn_payment_idx on public.boba_transactions(payment_method);


