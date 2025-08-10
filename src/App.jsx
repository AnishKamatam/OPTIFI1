import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState('monthly');
  const [countedValues, setCountedValues] = useState({
    starter: 49,
    growth: 199,
    enterprise: 499
  });

  const pricingData = {
    monthly: {
      starter: 49,
      growth: 199,
      enterprise: 499
    },
    yearly: {
      starter: 490,
      growth: 1990,
      enterprise: 4990
    }
  };

  useEffect(() => {
    const animateCount = () => {
      const currentValues = pricingData[pricingPeriod];
      const duration = 1000; // 1 second animation
      const steps = 60;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setCountedValues({
          starter: Math.floor(currentValues.starter * progress),
          growth: Math.floor(currentValues.growth * progress),
          enterprise: Math.floor(currentValues.enterprise * progress)
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setCountedValues(currentValues);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    };
    
    animateCount();
  }, [pricingPeriod]);

  const handlePricingToggle = (period) => {
    setPricingPeriod(period);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If user is logged in, show dashboard
  if (user) {
    return <Dashboard />;
  }

  // If user is not logged in, show landing page
  return (
    <div>
      <header className="navbar">
        <div className="container navbar-inner">
          <div className="logo">OPTIFI</div>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="nav-actions">
            <button 
              className="button button--ghost" 
              onClick={() => setShowAuthModal(true)}
            >
              Login
            </button>
            <a className="button" href="#request-demo">Request Demo</a>
          </div>
        </div>
      </header>

      <main className="hero">
        <div className="container hero-grid">
          <section>
            <h1 className="hero-title">
              An ERP That Works for You, Not the Other Way Around
            </h1>
            <p className="hero-subtitle">
              Replace dozens of tools and manual processes with one autonomous
              system that works like a full-time team.
            </p>
            <div className="hero-cta">
              <button 
                className="button" 
                onClick={() => setShowAuthModal(true)}
              >
                Get Started
              </button>
            </div>
          </section>

          <div className="hero-art" aria-hidden="true" />
        </div>
      </main>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-header">
            <div className="features-content">
              <div className="features-left">
                <span className="features-label">Features</span>
                <h2 className="features-title">The agentic ERP that transforms your business</h2>
              </div>
              <div className="features-right">
                <p className="features-subtitle">
                  Intelligent automation that understands your business, streamlines every department, and evolves as your needs change.
                </p>
              </div>
            </div>
          </div>
          
          <div className="features-grid">
            <div className="feature-card feature-card--finance">
              <div className="feature-card-header"></div>
              <h3 className="feature-card-title">Stay ahead of the numbers.</h3>
              <ul className="feature-list">
                <li>Automated reconciliations</li>
                <li>Real-time cashflow & forecasting</li>
                <li>AI-driven expense categorization</li>
              </ul>
            </div>
            
            <div className="feature-card feature-card--operations">
              <div className="feature-card-header"></div>
              <h3 className="feature-card-title">Run smoother, faster, smarter.</h3>
              <ul className="feature-list">
                <li>Supply chain monitoring & alerts</li>
                <li>Predictive maintenance</li>
                <li>Smart task assignments</li>
              </ul>
            </div>
            
            <div className="feature-card feature-card--hr">
              <div className="feature-card-header"></div>
              <h3 className="feature-card-title">Empower your people and processes.</h3>
              <ul className="feature-list">
                <li>Automated onboarding</li>
                <li>Time-off tracking</li>
                <li>Performance insights</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="container">
          <div className="pricing-header">
            <h2 className="pricing-title">Predictable pricing scalable plans</h2>
            <p className="pricing-subtitle">Designed for every stage of your journey.</p>
            
            <div className="pricing-toggle">
              <button 
                className={`toggle-option ${pricingPeriod === 'monthly' ? 'toggle-option--active' : ''}`}
                onClick={() => handlePricingToggle('monthly')}
              >
                Monthly
              </button>
              <button 
                className={`toggle-option ${pricingPeriod === 'yearly' ? 'toggle-option--active' : ''}`}
                onClick={() => handlePricingToggle('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Free</h3>
              <div className="pricing-amount">$0</div>
              <div className="pricing-period">per {pricingPeriod === 'monthly' ? 'month' : 'year'}</div>
              <button className="button button--full">Get Started</button>
              <ul className="pricing-features">
                <li>Access to 1 ERP module (Finance OR Operations)</li>
                <li>Up to 3 seats</li>
                <li>Basic AI automations (10/month)</li>
                <li>1 GB data storage</li>
                <li>Standard reports</li>
                <li>Community support</li>
              </ul>
            </div>
            
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="pricing-amount">${countedValues.starter}</div>
              <div className="pricing-period">per {pricingPeriod === 'monthly' ? 'month' : 'year'}</div>
              <button className="button button--full">Subscribe</button>
              <ul className="pricing-features">
                <li>Everything in Free +</li>
                <li>Access to 3 ERP modules (Finance, Operations, HR)</li>
                <li>Up to 10 seats</li>
                <li>Unlimited basic AI automations</li>
                <li>5 advanced automations/month</li>
                <li>10 GB data storage</li>
                <li>Automated weekly reports</li>
              </ul>
            </div>
            
            <div className="pricing-card pricing-card--popular">
              <div className="popular-badge">Popular</div>
              <h3>Growth</h3>
              <div className="pricing-amount">${countedValues.growth}</div>
              <div className="pricing-period">per {pricingPeriod === 'monthly' ? 'month' : 'year'}</div>
              <button className="button button--full">Subscribe</button>
              <ul className="pricing-features">
                <li>Everything in Starter +</li>
                <li>All ERP modules included</li>
                <li>Up to 25 seats</li>
                <li>Unlimited advanced automations</li>
                <li>Predictive forecasting & analytics dashboard</li>
                <li>50 GB data storage</li>
                <li>Automated custom workflows</li>
              </ul>
            </div>
            
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="pricing-amount">${countedValues.enterprise}</div>
              <div className="pricing-period">per {pricingPeriod === 'monthly' ? 'month' : 'year'}</div>
              <button className="button button--full">Contact Sales</button>
              <ul className="pricing-features">
                <li>Everything in Growth +</li>
                <li>Unlimited seats</li>
                <li>Custom AI model fine-tuning</li>
                <li>Dedicated account manager</li>
                <li>API & custom integrations (Salesforce, SAP, NetSuite, etc.)</li>
                <li>On-premise or private cloud deployment</li>
                <li>SLA-backed uptime</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}

export default App;
