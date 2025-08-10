import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Code, 
  FileText, 
  User, 
  Clock, 
  Bell, 
  DollarSign, 
  Target, 
  Activity,
  Database,
  CheckCircle,
  Calendar,
  LogOut
} from 'lucide-react'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Get user initials from email
  const getUserInitials = (email) => {
    if (!email) return 'U'
    const parts = email.split('@')[0]
    return parts.substring(0, 2).toUpperCase()
  }

  return (
    <div className="dashboard">
      {/* Left Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-title">
              <ArrowLeft className="logo-arrow" size={18} />
              <div>
                <h1>OPTIFI</h1>
                <span className="subtitle">Executive Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className="nav-item active">
              <BarChart3 className="nav-icon" size={18} />
              <span className="nav-label">Company Overview</span>
            </li>
            <li className="nav-item">
              <TrendingUp className="nav-icon" size={18} />
              <span className="nav-label">Product Analytics</span>
              <span className="live-tag">Live</span>
            </li>
            <li className="nav-item">
              <Users className="nav-icon" size={18} />
              <span className="nav-label">Customer Management</span>
              <span className="count">2.4K</span>
            </li>
            <li className="nav-item">
              <Code className="nav-icon" size={18} />
              <span className="nav-label">Product Development</span>
              <span className="count">12</span>
            </li>
            <li className="nav-item">
              <FileText className="nav-icon" size={18} />
              <span className="nav-label">Business Operations</span>
              <span className="count">5</span>
            </li>
            <li className="nav-item">
              <User className="nav-icon" size={18} />
              <span className="nav-label">Team Management</span>
              <span className="count">47</span>
            </li>
            <li className="nav-item">
              <Clock className="nav-icon" size={18} />
              <span className="nav-label">Resource Allocation</span>
              <span className="count">24</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{getUserInitials(user?.email)}</div>
            <div className="user-info">
              <div className="user-name">{user?.email?.split('@')[0] || 'User'}</div>
              <div className="user-role">Dashboard User</div>
            </div>
            <Bell className="notification-icon" size={16} />
          </div>
          <div className="system-status">
            <span className="status-dot green"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Executive Dashboard</h1>
            <span className="live-tag">Live Data</span>
          </div>
          <div className="header-right">
            <div className="status-indicator">
              <span className="status-dot green"></span>
              <span>All Systems Operational</span>
            </div>
            <div className="date">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
            <div className="user-avatar">{getUserInitials(user?.email)}</div>
            <button 
              onClick={handleSignOut}
              className="button button--ghost button--small"
              style={{ marginLeft: '16px' }}
            >
              <LogOut size={16} style={{ marginRight: '6px' }} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          <div className="content-header">
            <h2>SaaS Company Overview</h2>
            <p>Real-time insights across all business operations</p>
          </div>

          {/* Key Metrics Row */}
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-icon">
                <DollarSign size={24} />
              </div>
              <div className="metric-content">
                <h3>Monthly Recurring Revenue</h3>
                <div className="metric-value">$284K</div>
                <div className="metric-trend positive">
                  <TrendingUp size={12} />
                  +22.4% vs Last Month
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <Users size={24} />
              </div>
              <div className="metric-content">
                <h3>Active Users</h3>
                <div className="metric-value">12.4K</div>
                <div className="metric-trend positive">
                  <TrendingUp size={12} />
                  +18.2% This Month
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <Activity size={24} />
              </div>
              <div className="metric-content">
                <h3>Customer Churn</h3>
                <div className="metric-value">2.8%</div>
                <div className="metric-trend negative">
                  <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />
                  -0.5% Monthly Rate
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <Target size={24} />
              </div>
              <div className="metric-content">
                <h3>Feature Adoption</h3>
                <div className="metric-value">87.5%</div>
                <div className="metric-trend positive">
                  <TrendingUp size={12} />
                  +5.1% Key Features
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Row */}
          <div className="analytics-row">
            {/* Product Analytics */}
            <div className="analytics-card">
              <div className="card-header">
                <h3>
                  <TrendingUp size={18} />
                  Product Analytics
                </h3>
              </div>
              <div className="analytics-metrics">
                <div className="analytics-item">
                  <span className="metric-label">Daily Active Users</span>
                  <span className="metric-value">8.2K</span>
                  <span className="metric-trend positive">+12.4%</span>
                </div>
                <div className="analytics-item">
                  <span className="metric-label">Session Duration</span>
                  <span className="metric-value">14m 32s</span>
                  <span className="metric-trend positive">+2.1m</span>
                </div>
                <div className="analytics-item">
                  <span className="metric-label">Feature Usage Rate</span>
                  <span className="metric-value">67.8%</span>
                  <span className="metric-trend positive">+4.2%</span>
                </div>
                <div className="analytics-item">
                  <span className="metric-label">API Calls</span>
                  <span className="metric-value">2.1M</span>
                  <span className="metric-trend positive">+18.7%</span>
                </div>
              </div>
            </div>

            {/* Team Utilization */}
            <div className="analytics-card">
              <div className="card-header">
                <h3>
                  <Users size={18} />
                  Team Utilization
                </h3>
              </div>
              <div className="team-list">
                <div className="team-member">
                  <div className="member-avatar">SC</div>
                  <div className="member-info">
                    <div className="member-name">Sarah Chen</div>
                    <div className="member-role">Engineering</div>
                  </div>
                  <div className="member-utilization">
                    <span className="utilization-percent">100%</span>
                    <span className="utilization-location">Remote</span>
                  </div>
                </div>
                <div className="team-member">
                  <div className="member-avatar">MR</div>
                  <div className="member-info">
                    <div className="member-name">Marcus Rodriguez</div>
                    <div className="member-role">Product</div>
                  </div>
                  <div className="member-utilization">
                    <span className="utilization-percent">85%</span>
                    <span className="utilization-location">Canada</span>
                  </div>
                </div>
                <div className="team-member">
                  <div className="member-avatar">EW</div>
                  <div className="member-info">
                    <div className="member-name">Emily Watson</div>
                    <div className="member-role">DevOps</div>
                  </div>
                  <div className="member-utilization">
                    <span className="utilization-percent">95%</span>
                    <span className="utilization-location">Remote</span>
                  </div>
                </div>
                <div className="team-member">
                  <div className="member-avatar">DK</div>
                  <div className="member-info">
                    <div className="member-name">David Kim</div>
                    <div className="member-role">Engineering</div>
                  </div>
                  <div className="member-utilization">
                    <span className="utilization-percent">90%</span>
                    <span className="utilization-location">Remote</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects and Customers Row */}
          <div className="bottom-row">
            {/* Active Projects */}
            <div className="analytics-card">
              <div className="card-header">
                <h3>
                  <Code size={18} />
                  Active Projects
                </h3>
              </div>
              <div className="project-item">
                <div className="project-header">
                  <h4>Core API Rebuild</h4>
                  <span className="project-code">CORE-API</span>
                </div>
                <div className="project-status">
                  <span className="status-badge success">
                    <CheckCircle size={12} style={{ marginRight: '4px' }} />
                    On Track
                  </span>
                </div>
                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '65%' }}></div>
                  </div>
                  <span className="progress-text">65%</span>
                </div>
                <div className="project-details">
                  <div className="project-budget">$89K / $145K</div>
                  <div className="project-team">Team: 8 members</div>
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div className="analytics-card">
              <div className="card-header">
                <h3>
                  <FileText size={18} />
                  Top Customers
                </h3>
              </div>
              <div className="customer-list">
                <div className="customer-item">
                  <div className="customer-info">
                    <div className="customer-name">TechFlow Inc</div>
                    <div className="customer-plan">
                      <span className="plan-badge enterprise">Enterprise</span>
                      <span className="status-badge success">
                        <CheckCircle size={12} style={{ marginRight: '4px' }} />
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="customer-metrics">
                    <div className="customer-value">$2,400</div>
                    <div className="customer-usage">89% usage</div>
                  </div>
                </div>
                <div className="customer-item">
                  <div className="customer-info">
                    <div className="customer-name">StartupLab</div>
                    <div className="customer-plan">
                      <span className="plan-badge pro">Pro</span>
                      <span className="status-badge success">
                        <CheckCircle size={12} style={{ marginRight: '4px' }} />
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="customer-metrics">
                    <div className="customer-value">$890</div>
                    <div className="customer-usage">76% usage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
