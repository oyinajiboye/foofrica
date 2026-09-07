import { useState, useRef, useCallback, useEffect } from 'react'
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
const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
const PersonIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const XCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
  </svg>
)
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>
)

const AFRICAN_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Senegal', 'Côte d\'Ivoire',
  'Cameroon', 'Morocco', 'Algeria', 'Tanzania', 'Ethiopia', 'Uganda', 'Rwanda',
  'Zambia', 'Zimbabwe', 'Mozambique', 'Angola', 'DR Congo', 'Sudan', 'Tunisia',
  'Libya', 'Mali', 'Burkina Faso', 'Guinea', 'Sierra Leone', 'Liberia', 'Togo',
  'Benin', 'Niger', 'Chad', 'Gabon', 'Congo', 'Equatorial Guinea', 'Eritrea',
  'Djibouti', 'Somalia', 'South Sudan', 'Central African Republic', 'Malawi',
  'Botswana', 'Namibia', 'Lesotho', 'Eswatini', 'Mauritius', 'Seychelles',
  'Comoros', 'Cape Verde', 'São Tomé and Príncipe', 'Madagascar',
  // Also allow non-African
  'United Kingdom', 'United States', 'Germany', 'France', 'Spain', 'Italy',
  'Portugal', 'Netherlands', 'Belgium', 'Brazil', 'Argentina',
]

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function OnboardIdentityPage() {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const fileRef = useRef()

  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [form, setForm] = useState({ full_name: '', username: '', country: '' })
  const [usernameState, setUsernameState] = useState('idle') // idle | checking | available | taken | error
  const [usernameSuggestion, setUsernameSuggestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const debouncedUsername = useDebounce(form.username, 500)

  // Check username availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameState('idle')
      return
    }
    setUsernameState('checking')
    const ctrl = new AbortController()

    fetch(`${API_BASE}/api/auth/check-username?username=${encodeURIComponent(debouncedUsername)}`, {
      signal: ctrl.signal,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.data?.available) {
          setUsernameState('available')
          setUsernameSuggestion('')
        } else {
          setUsernameState('taken')
          setUsernameSuggestion(data.data?.suggestion || `${debouncedUsername}22`)
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') setUsernameState('error')
      })

    return () => ctrl.abort()
  }, [debouncedUsername, accessToken])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setError('')
    if (name === 'username') {
      // Sanitise: lowercase, alphanumeric + underscore only
      const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
      setForm(f => ({ ...f, username: clean }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const isValid =
    form.full_name.trim().length >= 2 &&
    form.username.length >= 3 &&
    usernameState === 'available' &&
    form.country

  const handleContinue = async () => {
    if (!isValid || loading) return
    setLoading(true)
    setError('')

    try {
      // Store for next steps
      sessionStorage.setItem('ff_onboard_identity', JSON.stringify({
        full_name: form.full_name,
        username: form.username,
        country: form.country,
      }))
      if (avatarFile) {
        // We'll upload avatar in the final submit step
        const reader = new FileReader()
        reader.readAsDataURL(avatarFile)
        reader.onload = () => {
          sessionStorage.setItem('ff_onboard_avatar_data', reader.result)
        }
      }
      navigate('/onboard/interests')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-topbar">
        <button className="auth-back-btn" onClick={() => navigate('/onboard/user-type')} id="identity-back">
          <BackIcon /> Back
        </button>
      </div>

      <div className="auth-form-screen">
        <div className="auth-form-card">
          <StepBar current={2} total={5} />
          <h1 className="auth-form-title">Set up your football identity</h1>

          {error && (
            <div className="error-banner">
              <AlertIcon /> {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="avatar-upload">
            <div className="avatar-upload-inner">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="avatar-preview"
                  style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div className="avatar-preview-placeholder">
                  <PersonIcon />
                </div>
              )}
              <button
                type="button"
                className="avatar-camera-btn"
                onClick={() => fileRef.current?.click()}
                id="identity-upload-avatar"
                aria-label="Upload profile photo"
              >
                <CameraIcon />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="avatar-file-input"
                onChange={handleAvatarChange}
                id="identity-avatar-file"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="field-group">
            <label className="field-label" htmlFor="identity-fullname">Full name</label>
            <input
              id="identity-fullname"
              name="full_name"
              type="text"
              className="field-input"
              placeholder="Enter your full name"
              value={form.full_name}
              onChange={handleChange}
              autoFocus
            />
          </div>

          {/* Username */}
          <div className="field-group">
            <label className="field-label" htmlFor="identity-username">Username</label>
            <div className="field-wrapper">
              <span className="field-prefix">@</span>
              <input
                id="identity-username"
                name="username"
                type="text"
                className={`field-input has-prefix ${
                  usernameState === 'taken' ? 'error' :
                  usernameState === 'available' ? 'success' : ''
                }`}
                style={{ paddingRight: 48 }}
                placeholder="username"
                value={form.username}
                onChange={handleChange}
              />
              {usernameState === 'checking' && (
                <div className="field-suffix">
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                </div>
              )}
              {usernameState === 'taken' && (
                <div className="field-suffix">
                  <button type="button" className="error"><XCircleIcon /></button>
                </div>
              )}
              {usernameState === 'available' && (
                <div className="field-suffix">
                  <button type="button" className="success"><CheckIcon /></button>
                </div>
              )}
            </div>
            {usernameState === 'taken' && (
              <div className="field-error">
                Username is already taken. Try{' '}
                <span
                  style={{ color: '#1A7A2E', cursor: 'pointer', marginLeft: 4, fontWeight: 600 }}
                  onClick={() => setForm(f => ({ ...f, username: usernameSuggestion }))}
                >
                  @{usernameSuggestion}
                </span>
              </div>
            )}
            {usernameState === 'available' && (
              <div className="field-success-text">
                <CheckIcon /> @{form.username} is available
              </div>
            )}
          </div>

          {/* Country */}
          <div className="field-group">
            <label className="field-label" htmlFor="identity-country">Country</label>
            <div className="field-select-wrapper">
              <select
                id="identity-country"
                name="country"
                className="field-select"
                value={form.country}
                onChange={handleChange}
              >
                <option value="">Select Country</option>
                {AFRICAN_COUNTRIES.sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            disabled={!isValid || loading}
            onClick={handleContinue}
            id="identity-continue"
          >
            {loading ? <><span className="spinner" /> Saving…</> : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
