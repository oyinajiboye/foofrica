import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { StepBar } from './OnboardUserType'
import '../../styles/auth.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

// Checkmark animation
const BigCheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1A7A2E" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function OnboardCompletePage() {
  const navigate = useNavigate()
  const { accessToken, saveSession, user } = useAuth()

  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState('')

  useEffect(() => {
    submitOnboarding()
  }, [])

  const submitOnboarding = async () => {
    setStatus('loading')
    try {
      // Gather all sessionStorage data
      const userType = sessionStorage.getItem('ff_onboard_type')
      const identity = JSON.parse(sessionStorage.getItem('ff_onboard_identity') || '{}')
      const interests = JSON.parse(sessionStorage.getItem('ff_onboard_interests') || '[]')

      if (!userType || !identity.username) {
        // If something's missing, just go to feed
        navigate('/feed')
        return
      }

      // Step 1: Complete profile
      const profileRes = await fetch(`${API_BASE}/api/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_type: userType,
          full_name: identity.full_name,
          username: identity.username,
          country: identity.country,
          interests,
        }),
      })
      const profileData = await profileRes.json()
      if (!profileRes.ok) throw new Error(profileData.message || 'Profile setup failed')

      // Step 2: Upload avatar if there is one
      const avatarData = sessionStorage.getItem('ff_onboard_avatar_data')
      if (avatarData) {
        try {
          // Convert base64 back to blob
          const arr = avatarData.split(',')
          const mime = arr[0].match(/:(.*?);/)[1]
          const bstr = atob(arr[1])
          const u8arr = new Uint8Array(bstr.length)
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i)
          const blob = new Blob([u8arr], { type: mime })

          const fd = new FormData()
          fd.append('avatar', blob, 'avatar.jpg')

          await fetch(`${API_BASE}/api/profiles/avatar`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: fd,
          })
        } catch (e) {
          // Avatar upload fail is non-fatal
          console.warn('Avatar upload failed:', e)
        }
      }

      // Update auth context with new profile
      saveSession(accessToken, {
        ...user,
        ...identity,
        user_type: userType,
        onboarding_complete: true,
      })

      // Clear sessionStorage
      sessionStorage.removeItem('ff_onboard_type')
      sessionStorage.removeItem('ff_onboard_identity')
      sessionStorage.removeItem('ff_onboard_interests')
      sessionStorage.removeItem('ff_onboard_avatar_data')

      setStatus('success')

      // Auto-navigate after short delay
      setTimeout(() => navigate('/feed'), 2000)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="auth-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 20px', borderWidth: 3 }} />
          <p style={{ color: '#6B7280', fontSize: 16 }}>Setting up your profile…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="auth-layout">
        <div className="auth-topbar">
          <button className="auth-back-btn" onClick={() => navigate('/onboard/interests')} id="complete-back">
            <BackIcon /> Back
          </button>
        </div>
        <div className="auth-form-screen">
          <div className="auth-form-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#6B7280', marginBottom: 24 }}>{error}</p>
            <button className="btn btn-primary" onClick={submitOnboarding} id="complete-retry">
              Try Again
            </button>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 14 }}
                onClick={() => navigate('/feed')}
                id="complete-skip"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success
  return (
    <div className="auth-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: '#E8F5EC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          animation: 'popIn 0.4s ease',
        }}>
          <BigCheckIcon />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          You're all set! ⚽
        </h2>
        <p style={{ color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>
          Welcome to Footfrica. Your football network is ready.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/feed')} id="complete-go-feed">
          Go to my feed
        </button>

        <style>{`
          @keyframes popIn {
            from { transform: scale(0.6); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}
