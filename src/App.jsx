import './App.css'
import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import AuthModal from './components/AuthModal'
import UserProfile from './components/UserProfile'

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

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
            {user ? (
              <UserProfile />
            ) : (
              <>
                <button 
                  className="button button--ghost" 
                  onClick={() => setShowAuthModal(true)}
                >
                  Login
                </button>
                <a className="button" href="#request-demo">Request Demo</a>
              </>
            )}
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
              {user ? (
                <a className="button" href="#dashboard">Go to Dashboard</a>
              ) : (
                <a className="button" href="#request-demo">Request Demo</a>
              )}
            </div>
          </section>

          <div className="hero-art" aria-hidden="true" />
        </div>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  )
}
