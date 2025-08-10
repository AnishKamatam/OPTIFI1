import { useAuth } from '../contexts/AuthContext'

export default function UserProfile() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        <span className="user-email">{user?.email}</span>
        <button 
          onClick={handleSignOut}
          className="button button--ghost button--small"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
