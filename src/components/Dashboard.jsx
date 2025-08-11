import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
//
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  DollarSign,
  UserCheck,
  Clock,
  Bell,
  LogOut,
  TrendingUp
} from 'lucide-react'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  // single page dashboard, no local routing
  const [dailyRevenue, setDailyRevenue] = useState(null)
  const [yesterdayRevenue, setYesterdayRevenue] = useState(null)
  const [avgTransaction, setAvgTransaction] = useState(null)
  const [yesterdayAvgTransaction, setYesterdayAvgTransaction] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [upcomingShifts, setUpcomingShifts] = useState([])
  const [staffOnHand, setStaffOnHand] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getUserInitials = (email) => {
    if (!email) return 'U'
    const parts = email.split('@')[0]
    return parts.substring(0, 2).toUpperCase()
  }

  const navSections = [
    {
      header: 'Business Insights',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, active: true, path: '/dashboard' },
        { label: 'Analytics', icon: BarChart3, active: false, path: '/analytics' }
      ]
    },
    {
      header: 'Financial Reports',
      items: [
        { label: 'Finances', icon: DollarSign, active: false, path: '/finances' }
      ]
    },
    {
      header: 'Sales Allocation',
      items: [
        { label: 'Staff', icon: UserCheck, active: false, path: '/staff' }
      ]
    },
    {
      header: 'Inventory Management',
      items: [
        { label: 'Inventory', icon: Package, active: false, path: '/inventory' },
        { label: 'CRM', icon: Users, active: false, path: '/crm' }
      ]
    }
  ]

  // Compute avg transaction delta vs yesterday
  const avgDelta = (() => {
    if (avgTransaction === null || yesterdayAvgTransaction === null) return null
    if (!yesterdayAvgTransaction) return { text: 'n/a vs Yesterday', positive: true }
    const pct = ((avgTransaction - yesterdayAvgTransaction) / yesterdayAvgTransaction) * 100
    return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs Yesterday`, positive: pct >= 0 }
  })()

  const topMetrics = [
    { title: 'Foot Traffic', value: '1,247', delta: { text: '+8.2% Today', positive: true } },
    { title: 'Staff On Hand', value: staffOnHand === null ? '—' : String(staffOnHand) },
    { title: 'Avg Transaction', value: avgTransaction === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avgTransaction), delta: avgDelta }
  ]

  // operations card replaced by inventory table
  const [atRiskInventory, setAtRiskInventory] = useState([])

  // Format helpers
  // Helpers for shifts formatting
  const toLocalTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  
  const diffToNow = (iso) => {
    const ms = new Date(iso) - new Date()
    if (ms <= 0) return 'Now'
    const mins = Math.round(ms / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }
  
  const initialsFromName = (name) => (name ? name : '??')
    .split(' ')
    .filter(Boolean)
    .map(s => s[0])
    .slice(0,2)
    .join('')
    .toUpperCase()

  // Fetch today's and yesterday's revenue from Supabase and compute top products
  useEffect(() => {
    async function fetchRevenue() {
      const today = new Date()
      const yest = new Date()
      yest.setDate(today.getDate() - 1)

      const toStr = (d) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }

      const todayStr = toStr(today)
      const yestStr = toStr(yest)

      const { data, error } = await supabase
        .from('boba_transactions')
        .select('date, item, price, margin')
        .in('date', [todayStr, yestStr])

      if (error) {
        console.error('Failed to fetch revenue:', error)
        setDailyRevenue(0)
        setYesterdayRevenue(0)
        return
      }

      let todayTotal = 0
      let yestTotal = 0
      let todayCount = 0
      let yestCount = 0
      const agg = new Map() // item -> { units, revenue, margin }
      for (const row of data || []) {
        if (row.date === todayStr) {
          const priceNum = Number(row.price || 0)
          const marginNum = Number(row.margin || 0)
          todayTotal += priceNum
          todayCount += 1
          const key = row.item || 'Unknown'
          const current = agg.get(key) || { item: key, units: 0, revenue: 0, margin: 0 }
          current.units += 1
          current.revenue += priceNum
          current.margin += marginNum
          agg.set(key, current)
        }
        if (row.date === yestStr) { yestTotal += Number(row.price || 0); yestCount += 1 }
      }
      setDailyRevenue(todayTotal)
      setYesterdayRevenue(yestTotal)
      setAvgTransaction(todayCount > 0 ? todayTotal / todayCount : 0)
      setYesterdayAvgTransaction(yestCount > 0 ? yestTotal / yestCount : 0)

      // Convert to display-ready top products (top 4 by revenue)
      const top = Array.from(agg.values())
        .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
        .slice(0, 4)
        .map((p) => ({
          name: p.item,
          meta: `${p.units} units • ${(p.margin / Math.max(1, p.revenue) * 100).toFixed(0)}% margin`,
          value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.revenue),
          trend: `+${Math.round((p.margin / Math.max(1, p.revenue)) * 100)}% profit`
        }))
      setTopProducts(top)
    }
    fetchRevenue()
  }, [])

  // Fetch recent transactions (latest 8)
  useEffect(() => {
    async function fetchTransactions() {
      const { data, error } = await supabase
        .from('transactions')
        .select('date, category, supplier, description, amount, payment_method')
        .order('date', { ascending: false })
        .limit(8)
      if (error) {
        console.error('Failed to fetch transactions:', error)
        return
      }
      const formatted = (data || []).map((t) => ({
        supplier: t.supplier,
        description: t.description,
        category: t.category,
        dateStr: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        amountStr: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(t.amount || 0)),
        method: t.payment_method || '—'
      }))
      setRecentTransactions(formatted)
    }
    fetchTransactions()
  }, [])

  // Fetch upcoming shifts (next 24h) and current staff on hand
  useEffect(() => {
    async function fetchShifts() {
      const { data: employees, error: empErr } = await supabase
        .from('employees')
        .select('employee_id, full_name, role')
      if (empErr) {
        console.error('Failed to fetch employees:', empErr)
        return
      }
      const idToEmployee = new Map(employees.map(e => [e.employee_id, e]))

      const now = new Date()
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const nowIso = now.toISOString()
      const in24Iso = in24h.toISOString()

      const { data: shifts, error: shErr } = await supabase
        .from('timesheets')
        .select('employee_id, role, scheduled_start, scheduled_end, status')
        .gte('scheduled_start', nowIso)
        .lte('scheduled_start', in24Iso)
        .order('scheduled_start', { ascending: true })
      if (!shErr) {
        const mapped = (shifts || []).map(s => {
          const emp = idToEmployee.get(s.employee_id)
          const name = emp?.full_name || `Emp ${s.employee_id}`
          const role = emp?.role || s.role
          const time = `${toLocalTime(s.scheduled_start)} – ${toLocalTime(s.scheduled_end)}`
          let status = 'Upcoming'
          const minsUntil = Math.round((new Date(s.scheduled_start) - now) / 60000)
          if (minsUntil <= 30) status = 'Starting Soon'
          else if (minsUntil > 240) status = 'Later Today'
          return { employeeId: s.employee_id, start: s.scheduled_start, initials: initialsFromName(name), name, role, time, eta: diffToNow(s.scheduled_start), status }
        })
        const dedup = []
        const seen = new Set()
        for (const item of mapped) {
          const k = item.employeeId || item.name
          if (seen.has(k)) continue
          seen.add(k)
          dedup.push(item)
        }
        setUpcomingShifts(dedup.slice(0, 8))
      } else {
        console.error('Failed to fetch upcoming shifts:', shErr)
      }

      const { count, error: cntErr } = await supabase
        .from('timesheets')
        .select('*', { count: 'exact', head: true })
        .lte('scheduled_start', nowIso)
        .gte('scheduled_end', nowIso)
        .neq('status', 'No Show')
      if (!cntErr) setStaffOnHand(count ?? 0)
      else console.error('Failed to count staff on hand:', cntErr)
    }
    fetchShifts()
    const id = setInterval(fetchShifts, 60000)
    return () => clearInterval(id)
  }, [])

  // Fetch most at-risk inventory (lowest actual/par ratio)
  useEffect(() => {
    async function fetchInventory() {
      const { data, error } = await supabase
        .from('inventory')
        .select('category, actual_level, par_level, unit, unit_cost, value, turnover, status')

      if (error) {
        console.error('Failed to fetch inventory:', error)
        return
      }

      const scored = (data || []).map((row) => {
        const par = Number(row.par_level || 0)
        const actual = Number(row.actual_level || 0)
        const ratio = par === 0 ? 1 : actual / par
        return {
          category: row.category,
          stock: actual,
          unit: row.unit || 'units',
          par,
          value: Number(row.value || actual * Number(row.unit_cost || 0)),
          status: row.status || (ratio >= 0.6 ? 'Optimal' : ratio >= 0.35 ? 'Good' : 'Low Stock'),
          ratio
        }
      })

      scored.sort((a, b) => a.ratio - b.ratio)
      setAtRiskInventory(scored.slice(0, 4))
    }
    fetchInventory()
  }, [])

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-title">
            <LayoutDashboard className="logo-arrow" size={18} />
            <div>
              <h1>Boba Bliss</h1>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.header} className="sidebar-section">
              <div className="sidebar-section-title">{section.header}</div>
              <ul>
                {section.items.map((item) => (
                  <li key={item.label} className={`nav-item${item.active ? ' active' : ''}`}>
                    <item.icon className="nav-icon" size={18} />
                    <span className="nav-label">{item.label}</span>
                    {item.label === 'Finances' && (
                      <a href="/financials" style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>Open</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="dashboard-main">
        <>
            <header className="dashboard-header">
              <div className="header-left">
                <span className="live-tag">Live Data</span>
              </div>
              <div className="header-right">
                <div className="status-indicator">
                  <span className="status-dot green"></span>
                  <span>Store Open</span>
                </div>
                <div className="date">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="user-avatar">{getUserInitials(user?.email)}</div>
                <button onClick={handleSignOut} className="button button--ghost button--small" style={{ marginLeft: '16px' }}>
                  <LogOut size={16} style={{ marginRight: '6px' }} />
                  Sign Out
                </button>
              </div>
            </header>

            <div className="metrics-row">
              {/* Daily Revenue with delta vs yesterday */}
              <div className="metric-card">
                <div className="metric-content" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Daily Revenue</h3>
                  </div>
                  <div className="metric-value">
                    {dailyRevenue === null
                      ? '—'
                      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dailyRevenue)}
                  </div>
                  {dailyRevenue !== null && yesterdayRevenue !== null && (
                    (() => {
                      const base = Number(yesterdayRevenue || 0)
                      if (base === 0) {
                        return (
                          <div className="metric-trend positive">
                            <TrendingUp size={12} /> n/a vs Yesterday
                          </div>
                        )
                      }
                      const pct = ((dailyRevenue - base) / base) * 100
                      const isPositive = pct >= 0
                      return (
                        <div className={`metric-trend ${isPositive ? 'positive' : 'negative'}`}>
                          <TrendingUp size={12} style={!isPositive ? { transform: 'rotate(180deg)' } : undefined} />
                          {`${isPositive ? '+' : ''}${pct.toFixed(1)}% vs Yesterday`}
                        </div>
                      )
                    })()
                  )}
                </div>
              </div>

              {topMetrics.map(({ title, value, delta }) => (
                <div key={title} className="metric-card">
                  <div className="metric-content" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>{title}</h3>
                    </div>
                    <div className="metric-value">{value}</div>
                    {delta && (
                      <div className={`metric-trend ${delta.positive === false ? 'negative' : 'positive'}`}>
                        <TrendingUp size={12} style={delta.positive === false ? { transform: 'rotate(180deg)' } : undefined} />
                        {typeof delta === 'string' ? delta : delta.text}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="analytics-row">
              <div className="analytics-card">
                <div className="card-header">
                  <h3>Top Selling Products</h3>
                </div>
                <div className="list-card">
                  {topProducts.map((p) => (
                    <div key={p.name} className="list-item">
                      <div className="list-left">
                        <div className="list-title">{p.name}</div>
                        <div className="list-sub">{p.meta}</div>
                      </div>
                      <div className="list-right">
                        <div className="list-value">{p.value}</div>
                        <div className="trend-positive">{p.trend}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header">
                  <h3>At-Risk Inventory</h3>
                </div>
                <div className="inventory-table">
                  <div className="inventory-header">
                    <div className="inventory-cell">Category</div>
                    <div className="inventory-cell">Stock Level</div>
                    <div className="inventory-cell">Par Level</div>
                    <div className="inventory-cell">Value</div>
                    <div className="inventory-cell">Status</div>
                  </div>
                  {atRiskInventory.map((row) => (
                    <div key={row.category} className="inventory-row">
                      <div className="inventory-cell inventory-category">{row.category}</div>
                      <div className="inventory-cell">{row.stock} {row.unit}</div>
                      <div className="inventory-cell">{row.par}</div>
                      <div className="inventory-cell">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.value)}</div>
                      <div className="inventory-cell">
                        <span className={`chip ${row.status === 'Optimal' ? 'green' : row.status === 'Good' ? 'gray' : 'red'}`}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header">
                  <h3>Recent Transactions</h3>
                </div>
                <div className="list-card">
                  {recentTransactions.map((t) => (
                    <div key={`${t.supplier}-${t.dateStr}`} className="list-item">
                      <div className="list-left">
                        <div className="list-title">{t.supplier}</div>
                        <div className="list-sub">{t.description} • {t.category}</div>
                      </div>
                      <div className="list-right">
                        <div className="list-value">{t.amountStr}</div>
                        <div className="list-sub">{t.dateStr}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <div className="card-header">
                  <h3>Upcoming Shifts</h3>
                </div>
                <div className="shift-list">
                  {upcomingShifts.map((s) => (
                    <div key={`${s.employeeId}-${s.start}`} className="shift-item">
                      <div className="shift-left">
                        <div className="shift-avatar">{s.initials}</div>
                        <div>
                          <div className="shift-name">{s.name}</div>
                          <div className="shift-meta">{s.role} • {s.time}</div>
                        </div>
                      </div>
                      <div className="shift-right">
                        <div className="shift-eta">{s.eta}</div>
                        <span className={`badge ${s.status === 'Starting Soon' ? 'badge--orange' : s.status === 'Upcoming' ? 'badge--gray' : 'badge--outline'}`}>{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
      </main>
    </div>
  )
}
