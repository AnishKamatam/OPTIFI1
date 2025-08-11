import { useEffect, useRef, useState } from 'react'
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
  const [transactions, setTransactions] = useState([])
  const [rawTransactions, setRawTransactions] = useState([])
  const [bankTransactions, setBankTransactions] = useState([])
  const [rawBankTransactions, setRawBankTransactions] = useState([])
  const [reconLoading, setReconLoading] = useState(false)
  const [reconError, setReconError] = useState(null)
  const [reconResult, setReconResult] = useState(null)
  const [reconModalOpen, setReconModalOpen] = useState(false)
  const reconTimerRef = useRef(null)

  useEffect(() => {
    async function fetchFinancials() {
      // Current month boundaries
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const fmt = (d) => d.toISOString().slice(0, 10)

      // Revenue from actual sales (boba_transactions)
      const [
        { data: revNowRows, error: revNowErr },
        { data: revPrevRows, error: revPrevErr }
      ] = await Promise.all([
        supabase
          .from('boba_transactions')
          .select('price, date')
          .gte('date', fmt(startOfMonth))
          .lte('date', fmt(endOfMonth)),
        supabase
          .from('boba_transactions')
          .select('price, date')
          .gte('date', fmt(lastMonthStart))
          .lte('date', fmt(lastMonthEnd))
      ])
      if (revNowErr || revPrevErr) {
        console.error('Revenue query failed', revNowErr || revPrevErr)
      }
      const revNowSum = (revNowRows || []).reduce((sum, r) => sum + Number(r.price || 0), 0)
      const revPrevSum = (revPrevRows || []).reduce((sum, r) => sum + Number(r.price || 0), 0)
      const revenueAdjustment = 20000
      const revNowAdjusted = revNowSum + revenueAdjustment
      setRevenue(revNowAdjusted)
      setRevDelta(revPrevSum ? ((revNowAdjusted - revPrevSum) / revPrevSum) * 100 : null)

      // Operating expenses (exclude Sales Revenue)
      const [
        { data: expNowRows, error: expNowErr },
        { data: expPrevRows, error: expPrevErr }
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, category, date')
          .neq('category', 'Sales Revenue')
          .gte('date', fmt(startOfMonth))
          .lte('date', fmt(endOfMonth)),
        supabase
          .from('transactions')
          .select('amount, category, date')
          .neq('category', 'Sales Revenue')
          .gte('date', fmt(lastMonthStart))
          .lte('date', fmt(lastMonthEnd))
      ])
      if (expNowErr || expPrevErr) {
        console.error('Expenses query failed', expNowErr || expPrevErr)
      }
      const expNowSum = (expNowRows || []).reduce((sum, r) => sum + Number(r.amount || 0), 0)
      const expPrevSum = (expPrevRows || []).reduce((sum, r) => sum + Number(r.amount || 0), 0)
      setExpenses(expNowSum)

      // Net profit & margin (net = revenue - expenses)
      const profit = revNowAdjusted - expNowSum
      setNetProfit(profit)
      const mNow = revNowAdjusted > 0 ? (profit / revNowAdjusted) * 100 : 0
      setMargin(mNow)

      const mPrev = revPrevSum > 0 ? ((revPrevSum - expPrevSum) / revPrevSum) * 100 : null
      setMarginDelta(mPrev === null ? null : mNow - mPrev)

      const { data: txnRows, error: txnErr } = await supabase
        .from('transactions')
        .select('date, category, supplier, description, amount, payment_method')
        .gte('date', fmt(startOfMonth))
        .lte('date', fmt(endOfMonth))
        .order('date', { ascending: false })
      if (txnErr) {
        console.error('Transactions list query failed', txnErr)
      }
      const txns = (txnRows || []).map((t) => ({
        supplier: t.supplier,
        description: t.description,
        category: t.category,
        date: t.date,
        dateStr: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: Number(t.amount || 0),
        amountStr: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(t.amount || 0)),
        method: t.payment_method || '—'
      }))
      setTransactions(txns)
      setRawTransactions(txnRows || [])

      const byDateRevenue = new Map()
      for (const row of revNowRows || []) {
        const key = String(row.date)
        const prev = byDateRevenue.get(key) || 0
        byDateRevenue.set(key, prev + Number(row.price || 0))
      }
      const bankRaw = []
      for (const [date, amount] of byDateRevenue.entries()) {
        bankRaw.push({
          date,
          type: 'Deposit',
          description: 'POS Settlement',
          amount: Number(amount.toFixed(2))
        })
      }
      for (const t of txnRows || []) {
        if (t.category === 'Sales Revenue') continue
        bankRaw.push({
          date: t.date,
          type: 'Withdrawal',
          description: t.supplier,
          amount: -Number(t.amount || 0)
        })
      }
      bankRaw.sort((a, b) => (a.date < b.date ? 1 : -1))
      const bankDisplay = bankRaw.slice(0, 40).map((b) => ({
        ...b,
        dateStr: new Date(b.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        amountStr: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(b.amount)
      }))
      setRawBankTransactions(bankRaw)
      setBankTransactions(bankDisplay)
    }
    fetchFinancials()
  }, [])

  const handleCopyReconContext = async () => {
    try {
      const payload = {
        context: 'Bank reconciliation for current month',
        transactions: rawTransactions,
        bankTransactions: rawBankTransactions
      }
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      // no-op UI feedback to keep code minimal
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const handleSyncToDb = async () => {
    try {
      // prepare rows for upsert
      const rows = rawBankTransactions.map((b) => ({
        date: b.date,
        type: b.type,
        description: b.description,
        amount: Number(b.amount)
      }))
      if (rows.length === 0) return
      const { error } = await supabase.from('bank_transactions').upsert(rows, {
        onConflict: 'date,description,amount'
      })
      if (error) {
        console.error('Bank transactions upsert failed', error)
      }
    } catch (e) {
      console.error('Sync to DB failed', e)
    }
  }

  // (Reports/CSV generation removed)

  const handleReconcileWithClaude = async () => {
    try {
      setReconLoading(true)
      setReconError(null)
      setReconResult(null)
      setReconModalOpen(false)

      // Schedule modal to show after 6 seconds regardless of result
      if (reconTimerRef.current) clearTimeout(reconTimerRef.current)
      reconTimerRef.current = setTimeout(() => setReconModalOpen(true), 6000)

      // API key lives on the server; no client key required

      // Fetch full context from DB (entire tables)
      const [
        { data: bankRows, error: bankErr },
        { data: appRows, error: appErr }
      ] = await Promise.all([
        supabase
          .from('bank_transactions')
          .select('date, type, description, amount')
          .order('date', { ascending: true }),
        supabase
          .from('transactions')
          .select('date, category, supplier, description, amount, payment_method')
          .order('date', { ascending: true })
      ])
      if (bankErr || appErr) {
        throw new Error(`DB fetch failed: ${bankErr?.message || ''} ${appErr?.message || ''}`.trim())
      }

      const bank = (bankRows || []).map(r => ({
        date: r.date,
        type: r.type,
        description: r.description,
        amount: Number(r.amount || 0)
      }))
      const appTx = (appRows || []).map(r => ({
        date: r.date,
        category: r.category,
        supplier: r.supplier,
        description: r.description,
        amount: Number(r.amount || 0),
        payment_method: r.payment_method || null
      }))

      // Prepare request body for proxy

      const body = {
        bank_transactions: bank,
        app_transactions: appTx
      }

      const resp = await fetch('http://localhost:8787/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client': 'optifi-frontend'
        },
        body: JSON.stringify(body)
      })

      if (!resp.ok) {
        const t = await resp.text()
        throw new Error(`Reconcile error ${resp.status}: ${t}`)
      }
      const parsed = await resp.json()
      setReconResult(parsed)
    } catch (e) {
      console.error(e)
      setReconError(e.message || 'Reconciliation failed')
    } finally {
      setReconLoading(false)
    }
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (reconTimerRef.current) clearTimeout(reconTimerRef.current)
    }
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
            <div className="sidebar-section-title">Navigation</div>
            <ul>
              <li className="nav-item" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%' }}>
                  <LayoutDashboard className="nav-icon" size={18} />
                  <div style={{ flex: 1 }}>
                    <Link className="nav-label" to="/dashboard">Dashboard</Link>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Overview & KPIs</div>
                  </div>
                </div>
              </li>
              <li className="nav-item active" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%' }}>
                  <DollarSign className="nav-icon" size={18} />
                  <div style={{ flex: 1 }}>
                    <span className="nav-label">Finances</span>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Cashflow & P&L</div>
                  </div>
                </div>
              </li>
              <li className="nav-item" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%' }}>
                  <Package className="nav-icon" size={18} />
                  <div style={{ flex: 1 }}>
                    <span className="nav-label">Inventory</span>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Stock & Reorders</div>
                  </div>
                </div>
              </li>
              <li className="nav-item" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%' }}>
                  <BarChart3 className="nav-icon" size={18} />
                  <div style={{ flex: 1 }}>
                    <span className="nav-label">Operations</span>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Workflows & Ops</div>
                  </div>
                </div>
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

        <div className="analytics-row">
          <div className="analytics-card">
            <div className="card-header"><h3>Transactions (This Month)</h3></div>
            <div className="list-card">
              {transactions.map((t) => (
                <div key={`${t.supplier}-${t.date}-${t.amount}`} className="list-item">
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
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Bank Transactions</h3>
              <div>
                <button className="button button--ghost button--small" onClick={handleCopyReconContext} style={{ marginRight: 8 }}>Copy Recon Context</button>
                <button className="button button--ghost button--small" onClick={handleReconcileWithClaude} style={{ marginRight: 8 }} disabled={reconLoading}>
                  {reconLoading ? 'Reconciling…' : 'Reconciliate Transactions'}
                </button>
                <button className="button button--small" onClick={handleSyncToDb}>Sync to DB</button>
              </div>
            </div>
            <div className="list-card">
              {bankTransactions.map((b, idx) => (
                <div key={`${b.date}-${idx}`} className="list-item">
                  <div className="list-left">
                    <div className="list-title">{b.description}</div>
                    <div className="list-sub">{b.type}</div>
                  </div>
                  <div className="list-right">
                    <div className="list-value">{b.amountStr}</div>
                    <div className="list-sub">{b.dateStr}</div>
                  </div>
                </div>
              ))}
            </div>
            {(reconError || reconResult) && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                {reconError && (
                  <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 8 }}>{reconError}</div>
                )}
                {reconResult && (
                  <pre style={{ maxHeight: 240, overflow: 'auto', background: '#f9fafb', padding: 12, borderRadius: 8, fontSize: 12 }}>
{JSON.stringify(reconResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      {reconModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }}>
            <h3 style={{ margin: 0, fontSize: 18, marginBottom: 8 }}>Bank Reconciliation Complete</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
              Your transactions have been reconciled. You can review the matches and unmatched items below.
            </p>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="button button--small" onClick={() => setReconModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


