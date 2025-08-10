import { useEffect, useState } from 'react'
import { LayoutDashboard, DollarSign, Package, Users, BarChart3, Receipt, TrendingUp, Percent } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Financials() {
  const [revenue, setRevenue] = useState(null)
  const [revDelta, setRevDelta] = useState(null)
  const [expenses, setExpenses] = useState(null)
  const [netProfit, setNetProfit] = useState(null)
  const [margin, setMargin] = useState(null)
  const [marginDelta, setMarginDelta] = useState(null)

  useEffect(() => {
    async function fetchFinancials() {
      // Current month boundaries
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const fmt = (d) => d.toISOString().slice(0, 10)

      // Revenue from transactions (Sales Revenue category)
      const [{ data: revNow, error: rErr }, { data: revPrev, error: rpErr }] = await Promise.all([
        supabase.from('transactions').select('amount, category').eq('category', 'Sales Revenue').gte('date', fmt(startOfMonth)).lte('date', fmt(endOfMonth)),
        supabase.from('transactions').select('amount, category').eq('category', 'Sales Revenue').gte('date', fmt(lastMonthStart)).lte('date', fmt(lastMonthEnd))
      ])
      if (rErr || rpErr) {
        console.error('Revenue query failed', rErr || rpErr)
      }
      const revNowSum = (revNow || []).reduce((s, r) => s + Number(r.amount || 0), 0)
      const revPrevSum = (revPrev || []).reduce((s, r) => s + Number(r.amount || 0), 0)
      setRevenue(revNowSum)
      setRevDelta(revPrevSum ? ((revNowSum - revPrevSum) / revPrevSum) * 100 : null)

      // Expenses (transactions)
      const { data: expNow, error: eErr } = await supabase
        .from('transactions')
        .select('amount')
        .gte('date', fmt(startOfMonth))
        .lte('date', fmt(endOfMonth))
      if (eErr) console.error('Expenses query failed', eErr)
      const expNowSum = (expNow || []).reduce((s, r) => s + Number(r.amount || 0), 0)
      setExpenses(expNowSum)

      // Net profit & margin
      const profit = revNowSum - expNowSum
      setNetProfit(profit)
      const mNow = revNowSum > 0 ? (profit / revNowSum) * 100 : 0
      setMargin(mNow)

      const { data: expPrev } = await supabase
        .from('transactions')
        .select('amount')
        .gte('date', fmt(lastMonthStart))
        .lte('date', fmt(lastMonthEnd))
      const expPrevSum = (expPrev || []).reduce((s, r) => s + Number(r.amount || 0), 0)
      const mPrev = revPrevSum > 0 ? ((revPrevSum - expPrevSum) / revPrevSum) * 100 : null
      setMarginDelta(mPrev === null ? null : mNow - mPrev)
    }
    fetchFinancials()
  }, [])

  return (
    <div className="dashboard" style={{ minHeight: '100vh' }}>
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
          <div className="sidebar-section">
            <div className="sidebar-section-title">Business Insights</div>
            <ul>
              <li className="nav-item">
                <BarChart3 className="nav-icon" size={18} />
                <Link className="nav-label" to="/dashboard">Dashboard</Link>
              </li>
            </ul>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Financial Reports</div>
            <ul>
              <li className="nav-item active">
                <DollarSign className="nav-icon" size={18} />
                <span className="nav-label">Financials</span>
              </li>
            </ul>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Inventory Management</div>
            <ul>
              <li className="nav-item">
                <Package className="nav-icon" size={18} />
                <span className="nav-label">Inventory</span>
              </li>
              <li className="nav-item">
                <Users className="nav-icon" size={18} />
                <span className="nav-label">CRM</span>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
      <main className="dashboard-main">
        {/* KPI Row */}
        <div className="metrics-row">
          <div className="metric-card">
            <div className="metric-content" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Monthly Revenue</h3>
                <div className="mini-icon"><DollarSign size={16} /></div>
              </div>
              <div className="metric-value">{revenue === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(revenue)}</div>
              {revDelta !== null && (
                <div className={`metric-trend ${revDelta >= 0 ? 'positive' : 'negative'}`}>
                  <TrendingUp size={12} style={revDelta < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                  {`${revDelta >= 0 ? '+' : ''}${revDelta.toFixed(1)}% vs Last Month`}
                </div>
              )}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-content" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Total Expenses</h3>
                <div className="mini-icon"><Receipt size={16} /></div>
              </div>
              <div className="metric-value">{expenses === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expenses)}</div>
              <div className="metric-trend positive">This Month</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-content" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Net Profit</h3>
                <div className="mini-icon"><TrendingUp size={16} /></div>
              </div>
              <div className="metric-value">{netProfit === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(netProfit)}</div>
              <div className="metric-trend positive">This Month</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-content" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Profit Margin</h3>
                <div className="mini-icon"><Percent size={16} /></div>
              </div>
              <div className="metric-value">{margin === null ? '—' : `${margin.toFixed(1)}%`}</div>
              {marginDelta !== null && (
                <div className={`metric-trend ${marginDelta >= 0 ? 'positive' : 'negative'}`}>
                  <TrendingUp size={12} style={marginDelta < 0 ? { transform: 'rotate(180deg)' } : undefined} />
                  {`${marginDelta >= 0 ? '+' : ''}${marginDelta.toFixed(1)}% Current Margin`}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header"><h3>Financials</h3></div>
          <div style={{ minHeight: 400 }} />
        </div>
      </main>
    </div>
  )
}


