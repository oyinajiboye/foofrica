import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL' // Same URL as waitlist

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    position: '',
    nationality: '',
    era: '',
    clubs: '',
    achievements: '',
    quote: '',
    bio: '',
    imageUrl: '',
    goals: '',
    caps: '',
    trophies: ''
  })

  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')

  // Simple password gate — change this to your desired password
  const ADMIN_PASSWORD = 'footfrica2026'

  const handleAuth = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setAuthError('')
      fetchCurrentSpotlight()
    } else {
      setAuthError('Incorrect password')
    }
  }

  const fetchCurrentSpotlight = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getSpotlight`)
      const data = await res.json()
      if (data && data.name) {
        setForm({
          name: data.name || '',
          nickname: data.nickname || '',
          position: data.position || '',
          nationality: data.nationality || '',
          era: data.era || '',
          clubs: data.clubs || '',
          achievements: data.achievements || '',
          quote: data.quote || '',
          bio: data.bio || '',
          imageUrl: data.imageUrl || '',
          goals: data.stats?.goals || '',
          caps: data.stats?.caps || '',
          trophies: data.stats?.trophies || ''
        })
        setImagePreview(data.imageUrl || '')
      }
    } catch (err) {
      console.log('Could not fetch current spotlight:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'imageUrl') {
      setImagePreview(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveStatus(null)

    try {
      const payload = {
        action: 'updateSpotlight',
        name: form.name,
        nickname: form.nickname,
        position: form.position,
        nationality: form.nationality,
        era: form.era,
        clubs: form.clubs,
        achievements: form.achievements,
        quote: form.quote,
        bio: form.bio,
        imageUrl: form.imageUrl,
        goals: form.goals,
        caps: form.caps,
        trophies: form.trophies
      }

      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.result === 'success') {
        setSaveStatus({ type: 'success', message: '✅ Spotlight updated successfully! Changes are live.' })
      } else {
        setSaveStatus({ type: 'error', message: data.error || 'Something went wrong' })
      }
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Network error. Check your connection and try again.' })
    } finally {
      setSaving(false)
    }
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="admin">
        <div className="admin__login">
          <div className="admin__login-card">
            <img src="/logo-landscape.png" alt="Footfrica" className="admin__logo" />
            <h1 className="admin__login-title">Spotlight Admin</h1>
            <p className="admin__login-subtitle">Enter your password to manage the weekly player spotlight.</p>

            <form onSubmit={handleAuth} className="admin__login-form">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="admin__input"
                autoFocus
              />
              {authError && <p className="admin__error">{authError}</p>}
              <button type="submit" className="admin__btn admin__btn--primary">
                Login →
              </button>
            </form>

            <Link to="/" className="admin__back-link">← Back to website</Link>
          </div>
        </div>
      </div>
    )
  }

  // Admin panel
  return (
    <div className="admin">
      <header className="admin__header">
        <div className="admin__header-inner">
          <div className="admin__header-left">
            <img src="/logo-landscape.png" alt="Footfrica" className="admin__logo" />
            <span className="admin__header-divider" />
            <h1 className="admin__title">Spotlight Admin</h1>
          </div>
          <Link to="/" className="admin__btn admin__btn--outline">
            ← Back to Site
          </Link>
        </div>
      </header>

      <main className="admin__main">
        {loading ? (
          <div className="admin__loading">
            <div className="spinner" />
            <p>Loading current spotlight...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin__form">
            <div className="admin__form-grid">
              {/* Left column — Player details */}
              <div className="admin__form-col">
                <div className="admin__section-card">
                  <h2 className="admin__section-title">📋 Player Information</h2>

                  <div className="admin__field">
                    <label className="admin__label" htmlFor="name">Full Name *</label>
                    <input
                      id="name" name="name" type="text" required
                      className="admin__input" placeholder="e.g. Rashidi Yekini"
                      value={form.name} onChange={handleChange}
                    />
                  </div>

                  <div className="admin__field-row">
                    <div className="admin__field">
                      <label className="admin__label" htmlFor="nickname">Nickname</label>
                      <input
                        id="nickname" name="nickname" type="text"
                        className="admin__input" placeholder="e.g. The Goalsfather"
                        value={form.nickname} onChange={handleChange}
                      />
                    </div>
                    <div className="admin__field">
                      <label className="admin__label" htmlFor="position">Position *</label>
                      <select
                        id="position" name="position" required
                        className="admin__input admin__select"
                        value={form.position} onChange={handleChange}
                      >
                        <option value="">Select position</option>
                        <option value="Goalkeeper">Goalkeeper</option>
                        <option value="Defender">Defender</option>
                        <option value="Midfielder">Midfielder</option>
                        <option value="Striker">Striker</option>
                        <option value="Forward">Forward</option>
                        <option value="Winger">Winger</option>
                        <option value="Coach">Coach</option>
                        <option value="Manager">Manager</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin__field-row">
                    <div className="admin__field">
                      <label className="admin__label" htmlFor="nationality">Nationality *</label>
                      <input
                        id="nationality" name="nationality" type="text" required
                        className="admin__input" placeholder="e.g. Nigeria"
                        value={form.nationality} onChange={handleChange}
                      />
                    </div>
                    <div className="admin__field">
                      <label className="admin__label" htmlFor="era">Era / Years Active</label>
                      <input
                        id="era" name="era" type="text"
                        className="admin__input" placeholder="e.g. 1984–2004"
                        value={form.era} onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="admin__field">
                    <label className="admin__label" htmlFor="clubs">Notable Clubs</label>
                    <input
                      id="clubs" name="clubs" type="text"
                      className="admin__input" placeholder="e.g. Shooting Stars, Olympiacos"
                      value={form.clubs} onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Stats section */}
                <div className="admin__section-card">
                  <h2 className="admin__section-title">📊 Career Stats</h2>
                  <div className="admin__field-row admin__field-row--3">
                    <div className="admin__field">
                      <label className="admin__label" htmlFor="goals">Goals</label>
                      <input
                        id="goals" name="goals" type="text"
                        className="admin__input" placeholder="37"
                        value={form.goals} onChange={handleChange}
                      />
                    </div>
                    <div className="admin__field">
                      <label className="admin__label" htmlFor="caps">Int'l Caps</label>
                      <input
                        id="caps" name="caps" type="text"
                        className="admin__input" placeholder="58"
                        value={form.caps} onChange={handleChange}
                      />
                    </div>
                    <div className="admin__field">
                      <label className="admin__label" htmlFor="trophies">Trophies</label>
                      <input
                        id="trophies" name="trophies" type="text"
                        className="admin__input" placeholder="12"
                        value={form.trophies} onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column — Content & image */}
              <div className="admin__form-col">
                <div className="admin__section-card">
                  <h2 className="admin__section-title">🖼️ Player Image</h2>

                  <div className="admin__field">
                    <label className="admin__label" htmlFor="imageUrl">Image URL *</label>
                    <input
                      id="imageUrl" name="imageUrl" type="url" required
                      className="admin__input" placeholder="https://example.com/player-photo.jpg"
                      value={form.imageUrl} onChange={handleChange}
                    />
                    <span className="admin__field-hint">
                      Paste a direct link to the player's photo. Use Unsplash, Imgur, or any image host.
                    </span>
                  </div>

                  {imagePreview && (
                    <div className="admin__image-preview">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        onError={(e) => { e.target.style.display = 'none' }}
                        onLoad={(e) => { e.target.style.display = 'block' }}
                      />
                    </div>
                  )}
                </div>

                <div className="admin__section-card">
                  <h2 className="admin__section-title">✍️ Content</h2>

                  <div className="admin__field">
                    <label className="admin__label" htmlFor="achievements">Key Achievements</label>
                    <textarea
                      id="achievements" name="achievements" rows={3}
                      className="admin__input admin__textarea"
                      placeholder="Awards, records, milestones..."
                      value={form.achievements} onChange={handleChange}
                    />
                  </div>

                  <div className="admin__field">
                    <label className="admin__label" htmlFor="bio">Biography / Writeup *</label>
                    <textarea
                      id="bio" name="bio" rows={5} required
                      className="admin__input admin__textarea"
                      placeholder="Tell the story of this legendary player..."
                      value={form.bio} onChange={handleChange}
                    />
                  </div>

                  <div className="admin__field">
                    <label className="admin__label" htmlFor="quote">Famous Quote</label>
                    <textarea
                      id="quote" name="quote" rows={2}
                      className="admin__input admin__textarea"
                      placeholder='"Football gave me everything..."'
                      value={form.quote} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save status */}
            {saveStatus && (
              <div className={`admin__status admin__status--${saveStatus.type}`}>
                {saveStatus.message}
              </div>
            )}

            {/* Submit button */}
            <div className="admin__actions">
              <button
                type="submit"
                className="admin__btn admin__btn--primary admin__btn--lg"
                disabled={saving}
              >
                {saving ? 'Publishing...' : '🚀 Publish Spotlight'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
