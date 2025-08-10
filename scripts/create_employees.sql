-- Employees master table
create table if not exists public.employees (
  id bigint generated always as identity primary key,
  employee_id integer not null,
  full_name text not null,
  role text not null,
  base_pay_rate numeric(8,2) not null,
  hire_date date not null,
  employment_status text not null,
  manager_id integer,
  location text not null,
  preferred_shift text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists employees_employee_id_uidx on public.employees (employee_id);


