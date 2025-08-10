-- Operating expenses / transactions table for Boba Bliss
create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  expense_id integer not null,
  date date not null,
  category text not null,
  supplier text not null,
  description text not null,
  amount numeric(12,2) not null,
  payment_method text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists transactions_expense_id_uidx on public.transactions (expense_id);
create index if not exists transactions_date_idx on public.transactions (date);
create index if not exists transactions_category_idx on public.transactions (category);


