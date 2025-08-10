import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CATEGORIES = {
  'Inventory Purchase': [
    ['BobaCo Distributors', 'Tapioca pearls'],
    ['Taiwan Tea Imports', 'Tea leaves'],
    ['Kyoto Matcha Supply', 'Matcha powder'],
    ['PowderMix Global', 'Taro & Thai tea mix'],
    ['Sweet Syrups Inc.', 'Syrups & sweeteners'],
    ['Golden Hive Foods', 'Honey & sugar'],
    ['JellyWorks Ltd.', 'Jelly & popping boba'],
    ['EcoCup Supply', 'Cups, lids, straws'],
    ['Sanitex', 'Cleaning supplies']
  ],
  Utilities: [
    ['Pacific Gas & Electric', 'Electricity'],
    ['SF Water Dept.', 'Water & sewage'],
    ['Comcast Business', 'Internet & phone']
  ],
  Maintenance: [
    ['FixIt Co.', 'Espresso machine repair'],
    ['CoolTech Services', 'Refrigerator maintenance'],
    ['CleanPro', 'Deep cleaning service']
  ],
  Rent: [
    ['Main St Properties LLC', 'Monthly rent']
  ],
  Marketing: [
    ['PrintWorks', 'Flyers & posters'],
    ['SocialBuzz Agency', 'Social media ads']
  ],
  'Sales Revenue': [
    ['POS Settlement', 'Daily sales settlement']
  ]
}

function rand(min, max) { return Math.random() * (max - min) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function amountFor(category) {
  if (category === 'Inventory Purchase') return Number(rand(50, 600).toFixed(2))
  if (category === 'Utilities') return Number(rand(80, 300).toFixed(2))
  if (category === 'Maintenance') return Number(rand(100, 500).toFixed(2))
  if (category === 'Rent') return 2500.0
  if (category === 'Marketing') return Number(rand(50, 250).toFixed(2))
  return Number(rand(20, 200).toFixed(2))
}

function getArg(name, fallback) {
  const a = process.argv.find(v => v.startsWith(`--${name}=`))
  if (!a) return fallback
  const [, value] = a.split('=')
  return value
}

async function main() {
  const days = Number(getArg('days', 30))
  const minPerDay = Number(getArg('min', 2))
  const maxPerDay = Number(getArg('max', 8))
  const startDaysAgo = Number(getArg('startDaysAgo', days - 1))

  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - startDaysAgo)

  const rows = []
  let expenseId = 8000
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Optionally add one revenue record for the day (70% chance)
    if (Math.random() < 0.7) {
      const [supplier, description] = CATEGORIES['Sales Revenue'][0]
      rows.push({
        expense_id: expenseId++,
        date: d.toISOString().slice(0, 10),
        category: 'Sales Revenue',
        supplier,
        description,
        amount: Number(rand(800, 3000).toFixed(2)),
        payment_method: pick(['Bank Deposit', 'Card Settlement'])
      })
    }

    const num = Math.floor(Math.random() * (maxPerDay - minPerDay + 1)) + minPerDay
    for (let i = 0; i < num; i++) {
      const category = pick(Object.keys(CATEGORIES))
      const [supplier, description] = pick(CATEGORIES[category])
      if (category === 'Rent' && Math.random() < 0.8) continue
      if (category === 'Sales Revenue') continue // already added above to avoid multiples
      rows.push({
        expense_id: expenseId++,
        date: d.toISOString().slice(0, 10),
        category,
        supplier,
        description,
        amount: amountFor(category),
        payment_method: pick(['Bank Transfer', 'Credit Card', 'Check'])
      })
    }
  }

  const batchSize = 500
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from('transactions').upsert(batch, { onConflict: 'expense_id' })
    if (error) { console.error('Transactions upsert failed:', error.message); process.exit(1) }
  }
  console.log(`Seeded ${rows.length} transactions over ~${days} day(s)`) 
}

main().catch((e) => { console.error(e); process.exit(1) })


