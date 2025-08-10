import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  DollarSign,
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

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Finances', icon: DollarSign },
    { label: 'Inventory', icon: Package },
    { label: 'CRM', icon: Users },
    { label: 'Analytics', icon: BarChart3 }
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
    { title: 'Conversion Rate', value: '3.8%', delta: { text: '+0.3% This Week', positive: true } },
    { title: 'Avg Transaction', value: avgTransaction === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avgTransaction), delta: avgDelta }
  ]

  const products = [
    { name: 'Winter Jackets', meta: '67 units • 45% margin', value: '$8,420', trend: '+45% profit' },
    { name: 'Running Shoes', meta: '89 units • 38% margin', value: '$6,890', trend: '+38% profit' },
    { name: 'Jeans Collection', meta: '124 units • 52% margin', value: '$5,240', trend: '+52% profit' },
    { name: 'Accessories', meta: '156 units • 62% margin', value: '$3,180', trend: '+62% profit' }
  ]

  const operations = [
    { title: 'Store Cleanliness', target: 'Target: 90%', score: 92, status: 'Excellent' },
    { title: 'Customer Service', target: 'Target: 85%', score: 88, status: 'Good' },
    { title: 'Inventory Accuracy', target: 'Target: 95%', score: 96, status: 'Excellent' },
    { title: 'Staff Productivity', target: 'Target: 80%', score: 84, status: 'Good' }
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

  // Fetch today's and yesterday's revenue from Supabase
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
        .select('date, price')
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
      for (const row of data || []) {
        if (row.date === todayStr) { todayTotal += Number(row.price || 0); todayCount += 1 }
        if (row.date === yestStr) { yestTotal += Number(row.price || 0); yestCount += 1 }
      }
      setDailyRevenue(todayTotal)
      setYesterdayRevenue(yestTotal)
      setAvgTransaction(todayCount > 0 ? todayTotal / todayCount : 0)
      setYesterdayAvgTransaction(yestCount > 0 ? yestTotal / yestCount : 0)
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
              <h1>Store Dashboard</h1>
              <span className="subtitle">Store Management</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.label} className={`nav-item${item.active ? ' active' : ''}`}>
                <item.icon className="nav-icon" size={18} />
                <span className="nav-label">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{getUserInitials(user?.email)}</div>
            <div className="user-info">
              <div className="user-name">{user?.email?.split('@')[0] || 'User'}</div>
              <div className="user-role">Store Manager</div>
            </div>
            <Bell className="notification-icon" size={16} />
          </div>
          <div className="system-status">
            <span className="status-dot green"></span>
            <span>Store Open</span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Store Overview</h1>
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
              {products.map((p) => (
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
              <h3>Store Operations</h3>
            </div>
            <div className="list-card">
              {operations.map((op) => (
                <div key={op.title} className="list-item ops-item">
                  <div className="list-left">
                    <div className="list-title">{op.title}</div>
                    <div className="list-sub">{op.target}</div>
                    <div className="progress-bar thin">
                      <div className="progress-fill" style={{ width: `${op.score}%` }}></div>
                    </div>
                    <div className="list-sub">Score</div>
                  </div>
                  <div className="list-right">
                    <span className={`status-chip ${op.status === 'Excellent' ? 'green' : 'gray'}`}>{op.status}</span>
                    <div className="list-value">{op.score}%</div>
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
