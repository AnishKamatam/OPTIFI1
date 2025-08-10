-- Shifts / timesheets table (2 weeks generator compatible)
create table if not exists public.timesheets (
  id bigint generated always as identity primary key,
  shift_id integer not null,
  shift_date date not null,
  shift_type text not null,
  employee_id integer not null,
  role text not null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  break_minutes integer not null,
  clock_in timestamptz,
  clock_out timestamptz,
  hours_worked numeric(6,2) not null default 0,
  daily_overtime_hours numeric(6,2) not null default 0,
  status text not null,
  late boolean not null default false,
  pay_rate numeric(8,2) not null,
  tips_declared numeric(8,2) not null default 0,
  location text not null,
  created_at timestamptz not null default now()
);

create index if not exists timesheets_employee_date_idx on public.timesheets (employee_id, shift_date);


