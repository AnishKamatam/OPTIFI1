-- Bank transactions table for reconciliation
-- Safe to run multiple times
create table if not exists public.bank_transactions (
  id bigint generated always as identity primary key,
  date date not null,
  type text not null, -- Deposit | Withdrawal
  description text not null,
  amount numeric(12,2) not null, -- positive for deposits, negative for withdrawals
  source text not null default 'system',
  created_at timestamptz not null default now()
);

-- Ensure idempotent upserts by natural key
create unique index if not exists bank_txn_unique_idx
  on public.bank_transactions (date, description, amount);

-- Ensure default is set if table existed already
alter table if exists public.bank_transactions alter column source set default 'system';


