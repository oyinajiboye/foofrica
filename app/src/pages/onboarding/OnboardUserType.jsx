import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../../styles/auth.css'

// Step indicator component
export function StepBar({ current, total }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="step-indicator">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`step-bar ${i < current - 1 ? 'active' : i === current - 1 ? 'current' : ''}`}
          />
        ))}
        <span className="step-label">Step {current} of {total}</span>
      </div>
    </div>
  )
}

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const USER_TYPES = [
  {
    value: 'player',
    name: 'Player',
    icon: '⚽',
    desc: 'Showcase your skills, upload highlights, get discovered',
  },
  {
    value: 'scout',
    name: 'Scout / Agent',
    icon: '🔍',
    desc: 'Discover talent, track players, build your network',
  },
  {
    value: 'coach',
    name: 'Coach',
    icon: '📋',
    desc: 'Share tactics, find players, grow your team',
  },
  {
    value: 'club',
    name: 'Club',
    icon: '🏟️',
    desc: 'Represent your club, post updates, recruit talent',
  },
  {
    value: 'fan',
    name: 'Fan',
    icon: '🎉',
    desc: 'Follow the game, join discussions, support your team',
  },
]

export default function OnboardUserTypePage() {
  const navigate = useNavigate()
  const { saveSession, user, accessToken } = useAuth()
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!selected || loading) return
    // Store selection in sessionStorage for next steps
    sessionStorage.setItem('ff_onboard_type', selected)
    navigate('/onboard/identity')
  }

  return (
    <div className="auth-layout">
      <div className="auth-topbar">
        <button className="auth-back-btn" onClick={() => navigate('/register')} id="user-type-back">
          <BackIcon /> Back
        </button>
      </div>

      <div className="auth-form-screen">
        <div className="auth-form-card">
          <StepBar current={1} total={5} />

          <h1 className="auth-form-title">Who are you on the pitch?</h1>
          <p className="auth-form-subtitle">
            This helps us personalise your experience.
          </p>

          <div className="user-type-grid">
            {USER_TYPES.map(type => (
              <div
                key={type.value}
                className={`user-type-card ${selected === type.value ? 'selected' : ''}`}
                onClick={() => setSelected(type.value)}
                id={`user-type-${type.value}`}
                role="radio"
                aria-checked={selected === type.value}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelected(type.value)}
              >
                <div className="user-type-icon">{type.icon}</div>
                <div className="user-type-text">
                  <div className="user-type-name">{type.name}</div>
                  <div className="user-type-desc">{type.desc}</div>
                </div>
                <div className="user-type-radio" />
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary"
            disabled={!selected || loading}
            onClick={handleContinue}
            id="user-type-continue"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
