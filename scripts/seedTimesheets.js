import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function toIso(date, hour, min) {
  const d = new Date(date)
  d.setHours(hour, min, 0, 0)
  return d.toISOString()
}

function addMinutes(iso, minutes) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString()
}

async function main() {
  // load employees
  const { data: employees, error: empErr } = await supabase.from('employees').select('employee_id, role, base_pay_rate')
  if (empErr) { console.error(empErr.message); process.exit(1) }

  const today = new Date()
  // Generate 14 days centered around today: 7 days past, 7 days future
  const start = new Date(today)
  start.setDate(start.getDate() - 7)
  const end = new Date(today)
  end.setDate(end.getDate() + 6)

  const dates = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d)
  }

  const byRole = employees.reduce((acc, e) => {
    (acc[e.role] ||= []).push(e)
    return acc
  }, {})
  const roleIndex = Object.fromEntries(Object.keys(byRole).map((r) => [r, 0]))
  const nextEmp = (role) => {
    const list = byRole[role] || byRole['Barista'] || []
    if (list.length === 0) return null
    const idx = roleIndex[role] % list.length
    roleIndex[role]++
    return list[idx]
  }

  const staffing = {
    Open: { 'Shift Lead': 1, Barista: 2, Cashier: 1, Prep: 0 },
    Mid: { 'Shift Lead': 1, Barista: 2, Cashier: 1, Prep: 1 },
    Close: { 'Shift Lead': 1, Barista: 2, Cashier: 1, Prep: 0 }
  }

  let shiftId = 1000
  const rows = []
  for (const d of dates) {
    for (const shiftType of ['Open', 'Mid', 'Close']) {
      const cfg = staffing[shiftType]
      for (const [role, count] of Object.entries(cfg)) {
        for (let i = 0; i < count; i++) {
          const emp = nextEmp(role)
          if (!emp) continue
          let startHour, duration
          if (shiftType === 'Open') { startHour = 8; duration = pick([6, 7, 8, 9]) }
          else if (shiftType === 'Mid') { startHour = pick([11, 12, 13]); duration = pick([5, 6, 7, 8]) }
          else { startHour = pick([15, 16, 17]); duration = pick([5, 6, 7, 8]) }

          const startIso = toIso(d, startHour, pick([0, 15, 30, 45]))
          let endIso = addMinutes(startIso, duration * 60)
          const breakMinutes = duration >= 6 ? 30 : pick([0, 15])

          // day rollover
          if (new Date(endIso) <= new Date(startIso)) endIso = addMinutes(endIso, 60 * 5)

          let status, clockIn, clockOut, hours, late
          if (Math.random() < 0.05) {
            status = 'No Show'; clockIn = null; clockOut = null; hours = 0; late = false
          } else {
            status = 'Completed'
            clockIn = addMinutes(startIso, pick([-10, -6, -3, 0, 2, 5, 8, 10]))
            clockOut = addMinutes(endIso, pick([-10, -5, 0, 4, 9]))
            if (new Date(clockOut) <= new Date(clockIn)) clockOut = addMinutes(clockIn, 5 * 60)
            const totalMin = (new Date(clockOut) - new Date(clockIn)) / 60000 - breakMinutes
            hours = Math.max(0, Math.round((totalMin / 60) * 100) / 100)
            late = new Date(clockIn) - new Date(startIso) > 5 * 60 * 1000
          }

          const dailyOt = Math.max(0, Math.round((hours - 8) * 100) / 100)

          rows.push({
            shift_id: shiftId++,
            shift_date: d.toISOString().slice(0, 10),
            shift_type: shiftType,
            employee_id: emp.employee_id,
            role: emp.role,
            scheduled_start: startIso,
            scheduled_end: endIso,
            break_minutes: breakMinutes,
            clock_in: clockIn,
            clock_out: clockOut,
            hours_worked: hours,
            daily_overtime_hours: dailyOt,
            status,
            late,
            pay_rate: emp.base_pay_rate,
            tips_declared: role === 'Barista' || role === 'Cashier' ? Math.round((5 + Math.random() * 15) * 100) / 100 : 0,
            location: 'Main St'
          })
        }
      }
    }
  }

  const batchSize = 500
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from('timesheets').insert(batch)
    if (error) { console.error('Timesheets insert failed:', error.message); process.exit(1) }
  }
  console.log(`Seeded ${rows.length} timesheet rows`)
}

main().catch((e) => { console.error(e); process.exit(1) })


