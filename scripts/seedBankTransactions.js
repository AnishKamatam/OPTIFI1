import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function getArg(name, fallback) {
  const a = process.argv.find(v => v.startsWith(`--${name}=`))
  if (!a) return fallback
  const [, value] = a.split('=')
  return value
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10)
}

async function main() {
  const days = Number(getArg('days', 60))
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (Number(getArg('startDaysAgo', days - 1))))

  const startStr = fmtDate(start)
  const endStr = fmtDate(end)

  // 1) Aggregate deposits per date from boba_transactions (sum of price)
  const { data: salesRows, error: salesErr } = await supabase
    .from('boba_transactions')
    .select('date, price')
    .gte('date', startStr)
    .lte('date', endStr)
  if (salesErr) {
    console.error('Failed to fetch boba_transactions:', salesErr)
    process.exit(1)
  }
  const revenueByDate = new Map()
  for (const row of salesRows || []) {
    const key = String(row.date)
    const prev = revenueByDate.get(key) || 0
    revenueByDate.set(key, prev + Number(row.price || 0))
  }

  // 2) Pull expenses (exclude Sales Revenue) from transactions
  const { data: expenseRows, error: expenseErr } = await supabase
    .from('transactions')
    .select('date, category, supplier, amount')
    .neq('category', 'Sales Revenue')
    .gte('date', startStr)
    .lte('date', endStr)
  if (expenseErr) {
    console.error('Failed to fetch transactions:', expenseErr)
    process.exit(1)
  }

  // 3) Build bank transaction rows
  const bankRows = []
  for (const [date, amount] of revenueByDate.entries()) {
    bankRows.push({
      date,
      type: 'Deposit',
      description: 'POS Settlement',
      amount: Number(amount.toFixed(2)),
      source: 'system'
    })
  }
  for (const t of expenseRows || []) {
    bankRows.push({
      date: t.date,
      type: 'Withdrawal',
      description: t.supplier,
      amount: -Number(t.amount || 0),
      source: 'system'
    })
  }

  // 4) De-duplicate rows that would violate unique constraint (date, description, amount)
  const seen = new Set()
  const deduped = []
  for (const r of bankRows) {
    const key = `${r.date}|${r.description}|${Number(r.amount).toFixed(2)}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(r)
  }

  // 5) Upsert one-by-one to avoid multi-row ON CONFLICT double-hit
  for (const row of deduped) {
    const { error } = await supabase
      .from('bank_transactions')
      .upsert(row, { onConflict: 'date,description,amount' })
    if (error) {
      console.error('Bank transactions upsert failed:', error)
      process.exit(1)
    }
  }

  console.log(`Seeded ${deduped.length} bank transactions from ${startStr} to ${endStr}`)
}

main().catch((e) => { console.error(e); process.exit(1) })


