import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SERVICE_ROLE_KEY).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function getArg(name, fallback) {
  const match = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (!match) return fallback
  return match.split('=')[1]
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function avoidPointFive(price) {
  const cents = Math.round(price * 100) % 100
  if (cents === 50) {
    return round2(price + 0.01)
  }
  return round2(price)
}

function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function main() {
  const weeksArg = getArg('weeks', null)
  const days = weeksArg ? Number(weeksArg) * 7 : Number(getArg('days', 7))
  const startOffset = Number(getArg('startOffset', days - 1)) // how many days ago to start
  const minPerDay = Number(getArg('min', 80))
  const maxPerDay = Number(getArg('max', 160))
  const table = getArg('table', 'boba_transactions')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - startOffset)

  const menuItems = [
    'Classic Milk Tea',
    'Brown Sugar Boba',
    'Matcha Latte',
    'Taro Milk Tea',
    'Thai Tea',
    'Oolong Milk Tea',
    'Jasmine Green Tea',
    'Mango Green Tea'
  ]

  const sizes = ['Regular', 'Large']
  const addOns = ['None', 'Boba', 'Grass Jelly', 'Pudding', 'Aloe']
  const paymentMethods = ['Card', 'Cash', 'Apple Pay', 'Google Pay']

  let transactionId = 1
  const allRows = []

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + dayIndex)

    const numTxns = Math.floor(Math.random() * (maxPerDay - minPerDay + 1)) + minPerDay
    for (let i = 0; i < numTxns; i++) {
      const item = randomChoice(menuItems)
      const size = randomChoice(sizes)
      const addon = randomChoice(addOns)

      let basePrice = size === 'Regular' ? (4.2 + Math.random() * 1.0) : (5.3 + Math.random() * 1.0)

      if (item === 'Brown Sugar Boba' || item === 'Matcha Latte') {
        basePrice += 0.3 + Math.random() * 0.4
      }
      if (addon !== 'None') {
        basePrice += 0.3 + Math.random() * 0.4
      }

      let price = avoidPointFive(basePrice)

      // approximate cost model
      let costBase = size === 'Regular' ? 2.1 + Math.random() * 0.4 : 2.6 + Math.random() * 0.5
      if (item === 'Brown Sugar Boba' || item === 'Matcha Latte') {
        costBase += 0.15 + Math.random() * 0.15
      }
      if (addon !== 'None') {
        costBase += 0.18 + Math.random() * 0.18
      }
      const cost = avoidPointFive(costBase)
      const margin = avoidPointFive(price - cost)

      // Occasionally nudge off .00 for realism
      const cents = Math.round(price * 100) % 100
      if (cents === 0) price = avoidPointFive(price + 0.03)

      const row = {
        transaction_id: `T${String(transactionId).padStart(5, '0')}`,
        date: formatDate(date),
        item,
        size,
        add_on: addon,
        price,
        payment_method: randomChoice(paymentMethods),
        cost,
        margin
      }
      allRows.push(row)
      transactionId += 1
    }
  }

  console.log(`Generated ${allRows.length} transactions across ${days} day(s). Inserting into '${table}'...`)

  // Insert in batches to avoid payload limits
  const batchSize = 500
  for (let i = 0; i < allRows.length; i += batchSize) {
    const batch = allRows.slice(i, i + batchSize)
    const { error } = await supabase.from(table).insert(batch)
    if (error) {
      console.error(`Insert failed at batch starting index ${i}:`, error.message)
      process.exit(1)
    }
    console.log(`Inserted ${Math.min(batchSize, allRows.length - i)} rows...`)
  }

  console.log('Done!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


