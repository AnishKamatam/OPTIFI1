import { useState } from 'react'
import Login from './Login'
import SignUp from './SignUp'

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true)

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {isLogin ? (
          <Login 
            onSwitchToSignUp={() => setIsLogin(false)}
            onClose={onClose}
          />
        ) : (
          <SignUp 
            onSwitchToLogin={() => setIsLogin(true)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
