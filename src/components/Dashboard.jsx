import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  DollarSign,
  UserCheck,
  Bell,
  LogOut,
  TrendingUp
} from 'lucide-react'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [dailyRevenue, setDailyRevenue] = useState(null)
  const [yesterdayRevenue, setYesterdayRevenue] = useState(null)
  const [avgTransaction, setAvgTransaction] = useState(null)
  const [yesterdayAvgTransaction, setYesterdayAvgTransaction] = useState(null)

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
        { label: 'Dashboard', icon: LayoutDashboard, active: true },
        { label: 'Analytics', icon: BarChart3 }
      ]
    },
    {
      header: 'Financial Reports',
      items: [
        { label: 'Finances', icon: DollarSign }
      ]
    },
    {
      header: 'Sales Allocation',
      items: [
        { label: 'Staff', icon: UserCheck }
      ]
    },
    {
      header: 'Inventory Management',
      items: [
        { label: 'Inventory', icon: Package },
        { label: 'CRM', icon: Users }
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
    { title: 'Staff On Hand', value: '6', delta: { text: '+1 vs Yesterday', positive: true } },
    { title: 'Avg Transaction', value: avgTransaction === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avgTransaction), delta: avgDelta }
  ]

  const [topProducts, setTopProducts] = useState([])

  // operations card replaced by inventory table

  const inventory = [
    { category: 'Tea Leaves & Powder', stock: 45, value: 2840, turnover: '12.3x', status: 'Optimal' },
    { category: 'Milk & Dairy', stock: 28, value: 1230, turnover: '18.7x', status: 'Good' },
    { category: 'Tapioca Pearls & Toppings', stock: 67, value: 890, turnover: '24.2x', status: 'Optimal' },
    { category: 'Cups, Straws & Supplies', stock: 312, value: 645, turnover: '15.8x', status: 'Low Stock' }
  ]

  const recentCustomers = [
    { initials: 'SJ', name: 'Sarah Johnson', spent: '$2,450' },
    { initials: 'AR', name: 'Alex Rodriguez', spent: '$1,980' },
    { initials: 'MB', name: 'Mia Brown', spent: '$1,430' }
  ]

  const staffPerformance = [
    { name: 'Alex Rodriguez', percent: 94 },
    { name: 'Sarah Chen', percent: 91 },
    { name: 'Jordan Lee', percent: 88 }
  ]

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
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="dashboard-main">
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

        {/* content header removed per request */}

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
              <h3>Inventory</h3>
            </div>
            <div className="inventory-table">
              <div className="inventory-header">
                <div className="inventory-cell">Category</div>
                <div className="inventory-cell">Stock Level</div>
                <div className="inventory-cell">Value</div>
                <div className="inventory-cell">Turnover</div>
                <div className="inventory-cell">Status</div>
              </div>
              {inventory.map((row) => (
                <div key={row.category} className="inventory-row">
                  <div className="inventory-cell inventory-category">{row.category}</div>
                  <div className="inventory-cell">{row.stock} units</div>
                  <div className="inventory-cell">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.value)}</div>
                  <div className="inventory-cell">{row.turnover}</div>
                  <div className="inventory-cell">
                    <span className={`chip ${row.status === 'Optimal' ? 'green' : row.status === 'Good' ? 'gray' : 'red'}`}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bottom-row">
          <div className="analytics-card">
            <div className="card-header">
              <h3>Recent Customers</h3>
            </div>
            <div className="list-card">
              {recentCustomers.map((c) => (
                <div key={c.name} className="list-item">
                  <div className="list-left" style={{ alignItems: 'center', gap: 12, display: 'flex' }}>
                    <div className="member-avatar">{c.initials}</div>
                    <div>
                      <div className="list-title">{c.name}</div>
                    </div>
                  </div>
                  <div className="list-right">
                    <div className="list-value">{c.spent}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>Staff Performance</h3>
            </div>
            <div className="list-card">
              {staffPerformance.map((s) => (
                <div key={s.name} className="list-item ops-item">
                  <div className="list-left">
                    <div className="list-title">{s.name}</div>
                    <div className="progress-bar thin">
                      <div className="progress-fill" style={{ width: `${s.percent}%` }}></div>
                    </div>
                  </div>
                  <div className="list-right">
                    <div className="list-value">{s.percent}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
