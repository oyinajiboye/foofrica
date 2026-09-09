import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { StepBar } from './OnboardUserType'
import '../../styles/auth.css'


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
  const { accessToken, saveSession, apiFetch } = useAuth()

  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) { started.current = true; submitOnboarding() }
  }, [])

  const submitOnboarding = async () => {
    setStatus('loading')
    try {
      // Gather all sessionStorage data
      const userType = sessionStorage.getItem('ff_onboard_type')
      const identity = JSON.parse(sessionStorage.getItem('ff_onboard_identity') || '{}')
      const interests = JSON.parse(sessionStorage.getItem('ff_onboard_interests') || '[]')

      if (!userType || !identity.username) {
        navigate(!userType ? '/onboard/user-type' : '/onboard/identity')
        return
      }

      // Step 1: Complete profile
      const profileData = await apiFetch('/api/auth/complete-profile', {
        method: 'POST',
        body: JSON.stringify({ user_type: userType, full_name: identity.full_name, username: identity.username, country: identity.country, interests }),
      })
      const profile = profileData.data

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
          fd.append('file', blob, 'avatar.jpg')

          const uploaded = await apiFetch('/api/uploads/avatar', { method: 'POST', body: fd })
          profile.avatar_url = uploaded.data.avatar_url
        } catch (e) {
          // Avatar upload fail is non-fatal
          saveSession(localStorage.getItem('ff_token') || accessToken, profile)
          throw new Error('Your profile was saved, but the photo upload failed. Please try again. ' + e.message)
        }
      }

      // Update auth context with new profile
      saveSession(localStorage.getItem('ff_token') || accessToken, profile)

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
