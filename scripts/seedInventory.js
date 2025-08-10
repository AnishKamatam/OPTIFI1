import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Full seed list: (stock_name, par_level, unit, supplier)
const BASE_ITEMS = [
  ['Tapioca pearls (black)', 40, 'kg', 'BobaCo Distributors'],
  ['Black tea leaves (Assam)', 18, 'kg', 'Taiwan Tea Imports'],
  ['Jasmine green tea leaves', 15, 'kg', 'Taiwan Tea Imports'],
  ['Oolong tea leaves', 12, 'kg', 'Taiwan Tea Imports'],
  ['Matcha powder (ceremonial blend)', 6, 'kg', 'Kyoto Matcha Supply'],
  ['Taro powder mix', 20, 'kg', 'PowderMix Global'],
  ['Thai tea mix', 12, 'kg', 'PowderMix Global'],
  ['Brown sugar syrup', 48, 'bottles (2L)', 'Sweet Syrups Inc.'],
  ['Fructose syrup', 30, 'bottles (2L)', 'Sweet Syrups Inc.'],
  ['Honey', 18, 'jugs (3kg)', 'Golden Hive Foods'],
  ['Condensed milk', 24, 'cans (395g)', 'Pacific Dairy Supply'],
  ['UHT whole milk', 20, 'cases (12x1L)', 'Pacific Dairy Supply'],
  ['Non‑dairy creamer', 16, 'kg', 'DairyFree Provisions'],
  ['Lychee jelly', 18, 'tubs (3.2kg)', 'JellyWorks Ltd.'],
  ['Grass jelly', 16, 'tubs (3.2kg)', 'JellyWorks Ltd.'],
  ['Coconut jelly', 14, 'tubs (3.2kg)', 'JellyWorks Ltd.'],
  ['Popping boba – strawberry', 10, 'tubs (3.2kg)', 'JellyWorks Ltd.'],
  ['Popping boba – mango', 10, 'tubs (3.2kg)', 'JellyWorks Ltd.'],
  ['Aloe vera cubes', 8, 'tubs (3.2kg)', 'JellyWorks Ltd.'],
  ['Cheese foam powder', 6, 'kg', 'PowderMix Global'],
  ['Mango purée', 20, 'tubs (3kg)', 'FreshPuree Co.'],
  ['Strawberry purée', 18, 'tubs (3kg)', 'FreshPuree Co.'],
  ['Passionfruit purée', 16, 'tubs (3kg)', 'FreshPuree Co.'],
  ['Durian essence', 2, 'bottles (1L)', 'AromaHouse'],
  ['Vanilla syrup', 24, 'bottles (750ml)', 'Sweet Syrups Inc.'],
  ['Caramel syrup', 24, 'bottles (750ml)', 'Sweet Syrups Inc.'],
  ['Sealing film rolls', 12, 'rolls', 'EcoCup Supply'],
  ['Cups – 500 ml', 60, 'sleeves (50/ea)', 'EcoCup Supply'],
  ['Cups – 700 ml', 60, 'sleeves (50/ea)', 'EcoCup Supply'],
  ['Dome lids – 98mm', 40, 'sleeves (50/ea)', 'EcoCup Supply'],
  ['Flat lids – 98mm', 40, 'sleeves (50/ea)', 'EcoCup Supply'],
  ['Paper straws – 12 mm', 80, 'boxes (200/ea)', 'EcoCup Supply'],
  ['Napkins', 30, 'cases (24 packs)', 'EcoCup Supply'],
  ['Plastic gloves', 24, 'boxes (100/ea)', 'Sanitex'],
  ['Food‑safe sanitizer', 8, 'jugs (1 gal)', 'Sanitex'],
  ['Label rolls (ingredients/date)', 16, 'rolls', 'OfficeSupply Plus'],
  ['Ice bags', 20, 'bundles (20/ea)', 'ColdChain Partners'],
  ['Sugar (white)', 50, 'kg', 'Golden Hive Foods'],
  ['Brown sugar (for pearls)', 40, 'kg', 'Golden Hive Foods'],
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

function statusForLevel(actual, par) {
  const ratio = par === 0 ? 1 : actual / par
  if (ratio >= 0.6) return 'Optimal'
  if (ratio >= 0.35) return 'Good'
  return 'Low Stock'
}

function turnoverForCategory(category) {
  const ranges = {
    'Tea Leaves & Powder': [10, 16],
    'Milk & Dairy': [14, 20],
    'Tapioca Pearls & Toppings': [18, 28],
    'Cups, Straws & Supplies': [12, 20],
  }
  const [a, b] = ranges[category] || [10, 20]
  return Number((a + Math.random() * (b - a)).toFixed(1))
}

async function main() {
  const rows = BASE_ITEMS.map(([category, par_level, unit, supplier]) => {
    // unit cost heuristic by item name
    const nameL = category.toLowerCase()
    let unit_cost = 1.5
    if (/(tea|matcha|taro|thai)/.test(nameL)) unit_cost = 4 + Math.random() * 5
    else if (/(syrup|honey|fructose|essence)/.test(nameL)) unit_cost = 4 + Math.random() * 6
    else if (/(jelly|popping|aloe|foam)/.test(nameL)) unit_cost = 2 + Math.random() * 4
    else if (/(cups|lids|straws|napkins|gloves|film|label|bags)/.test(nameL)) unit_cost = 0.05 + Math.random() * 0.35
    else if (/(milk|creamer|condensed)/.test(nameL)) unit_cost = 1.2 + Math.random() * 1.8
    unit_cost = Number(unit_cost.toFixed(2))

    const down = randInt(0, Math.floor(par_level / 2))
    const up = randInt(0, 3)
    const actual_level = clamp(par_level - down + up, 0, par_level + 10)
    const turnover = turnoverForCategory(category)
    const status = statusForLevel(actual_level, par_level)
    const value = Number((actual_level * unit_cost).toFixed(2))

    return { category, par_level, actual_level, unit, supplier, unit_cost, value, turnover, status }
  })

  // Upsert by category to allow re-running
  const { error } = await supabase.from('inventory').upsert(rows, { onConflict: 'category' })
  if (error) {
    console.error('Inventory upsert failed:', error.message)
    process.exit(1)
  }
  console.log(`Seeded ${rows.length} inventory rows.`)
}

main().catch((e) => { console.error(e); process.exit(1) })


