import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const EMPLOYEES = [
  [101, 'Ava Chen', 'Store Manager', 24.00, '2024-03-12', 'FT', null],
  [102, 'Diego Martinez', 'Assistant Manager', 20.50, '2024-06-01', 'FT', 101],
  [103, 'Lena Park', 'Shift Lead', 18.00, '2024-11-20', 'FT', 102],
  [104, 'Noah Patel', 'Barista', 16.00, '2025-01-15', 'PT', 103],
  [105, 'Maya Singh', 'Barista', 16.25, '2025-02-05', 'PT', 103],
  [106, 'Ethan Nguyen', 'Barista', 16.00, '2025-02-20', 'PT', 103],
  [107, 'Sofia Rivera', 'Cashier', 15.75, '2025-03-02', 'PT', 103],
  [108, 'Jackson Lee', 'Prep', 16.50, '2025-03-15', 'PT', 103],
  [109, 'Priya Shah', 'Barista', 16.25, '2025-04-10', 'PT', 103],
  [110, 'Leo Kim', 'Barista', 16.00, '2025-04-28', 'PT', 103],
  [111, 'Nora Davis', 'Barista', 16.00, '2025-05-12', 'PT', 103],
  [112, 'Aria Johnson', 'Barista', 16.00, '2025-06-05', 'PT', 103]
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

async function main() {
  const rows = EMPLOYEES.map(([employee_id, full_name, role, base_pay_rate, hire_date, employment_status, manager_id]) => ({
    employee_id,
    full_name,
    role,
    base_pay_rate,
    hire_date,
    employment_status,
    manager_id,
    location: 'Main St',
    preferred_shift: pick(['Open', 'Mid', 'Close'])
  }))

  const { error } = await supabase.from('employees').upsert(rows, { onConflict: 'employee_id' })
  if (error) {
    console.error('Employees upsert failed:', error.message)
    process.exit(1)
  }
  console.log(`Seeded ${rows.length} employees`)
}

main().catch((e) => { console.error(e); process.exit(1) })


