import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/settings.css'

// ─── SVG Line Icons ──────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const HighlightsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>
)
const MessagesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)
const BellIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)
const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

/* Sidebar Menu SVGs */
const AccountIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const BellOutlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
)
const SearchOutlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const PlayOutlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
const UserXIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="18" y1="8" x2="23" y2="13" />
    <line x1="23" y1="8" x2="18" y2="13" />
  </svg>
)
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const CreditCardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const HelpCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const AlertTriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const defaultTab = searchParams.get('tab') || 'Profile'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [toastMessage, setToastMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  // Account Form State
  const [accountForm, setAccountForm] = useState({
    fullName: user?.display_name || '',
    username: user?.username ? `@${user.username}` : '',
    email: user?.email || '',
    phone: '',
    country: '',
    city: '',
    language: 'English',
    timezone: '',
  })

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    bio: '',
    website: '',
    favClub: '',
  })

  // Settings state (from /api/settings)
  const [settings, setSettings] = useState({})

  // ── Fetch settings on mount ───────────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settingsRes, profileRes] = await Promise.allSettled([
          apiFetch('/api/settings'),
          apiFetch(`/api/profiles/${user?.username || user?.id}`),
        ])
        if (settingsRes.status === 'fulfilled') {
          setSettings(settingsRes.value?.data || {})
        }
        if (profileRes.status === 'fulfilled') {
          const p = profileRes.value?.data
          if (p) {
            setAccountForm(prev => ({
              ...prev,
              fullName: p.display_name || prev.fullName,
              username: `@${p.username}`,
              email: p.email || prev.email,
              country: p.location?.split(',').pop()?.trim() || '',
              city: p.location?.split(',')[0]?.trim() || '',
            }))
            setProfileForm({
              bio: p.bio || '',
              website: p.website_url || '',
              favClub: p.player_profile?.current_club_name || '',
            })
          }
        }
      } catch (e) {
        console.error('Settings load error:', e)
      }
    }
    loadSettings()
  }, [apiFetch, user])

  // ── Save handler ────────────────────────────────────────────────────
  const handleSaveSettings = async (updates) => {
    setSaving(true)
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setSettings(prev => ({ ...prev, ...updates }))
      showToast('Settings saved!')
    } catch (e) {
      showToast(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Sidebar Items Config with SVG Icon components
  const menuItems = [
    { id: 'Account', icon: <AccountIcon />, label: 'Account' },
    { id: 'Profile', icon: <ProfileIcon />, label: 'Profile' },
    { id: 'Privacy & Visibility', icon: <EyeIcon />, label: 'Privacy & Visibility' },
    { id: 'Messaging', icon: <ChatIcon />, label: 'Messaging' },
    { id: 'Notifications', icon: <BellOutlineIcon />, label: 'Notifications' },
    { id: 'Verification', icon: <ShieldCheckIcon />, label: 'Verification' },
    { id: 'Discovery Preferences', icon: <SearchOutlineIcon />, label: 'Discovery Preferences' },
    { id: 'Content Preferences', icon: <PlayOutlineIcon />, label: 'Content Preferences' },
    { id: 'Security', icon: <LockIcon />, label: 'Security' },
    { id: 'Blocked & Muted', icon: <UserXIcon />, label: 'Blocked & Muted' },
    { id: 'Data & Downloads', icon: <DownloadIcon />, label: 'Data & Downloads' },
    { id: 'Billing & Premium', icon: <CreditCardIcon />, label: 'Billing & Premium' },
    { id: 'divider-1', isDivider: true },
    { id: 'Help & Support', icon: <HelpCircleIcon />, label: 'Help & Support' },
    { id: 'divider-2', isDivider: true },
    { id: 'Deactivate Account', icon: <AlertTriangleIcon />, label: 'Deactivate Account', danger: true },
  ]

  return (
    <div className="stg-shell">
      {/* ── Top Navbar ────────────────────────────────────────────────────── */}
      <header className="msg-navbar">
        <a href="/feed" className="msg-navbar__logo">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#166534"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">F</text>
          </svg>
          <span>footfrica</span>
        </a>

        <div className="msg-navbar__search" onClick={() => navigate('/search')}>
          <span className="msg-navbar__search-icon"><SearchIcon /></span>
          <input type="text" placeholder="Search players, clubs, topics…" readOnly />
        </div>

        <nav className="msg-navbar__nav">
          <button className="msg-navbar__nav-link" onClick={() => navigate('/feed')}>
            <HomeIcon /> Home
          </button>
          <button className="msg-navbar__nav-link" onClick={() => navigate('/highlights')}>
            <HighlightsIcon /> Highlights
          </button>
          <button className="msg-navbar__nav-link" onClick={() => navigate('/messages')}>
            <MessagesIcon /> Messages
          </button>
        </nav>

        <button className="msg-navbar__notif-btn" aria-label="Notifications" onClick={() => navigate('/notifications')}>
          <BellIcon />
          <span className="msg-navbar__notif-badge">4</span>
        </button>

        <div className="msg-navbar__avatar" title={accountForm.fullName} onClick={() => navigate('/profile')}>
          {accountForm.fullName.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* ── Page Header Section ───────────────────────────────────────────── */}
      <div className="stg-header">
        <div className="stg-header__inner">
          <div className="stg-title-row">
            <button className="stg-back-btn" onClick={() => navigate(-1)} aria-label="Back">
              <ChevronLeftIcon />
            </button>
            <h1 className="stg-title">Settings</h1>
          </div>
          <p className="stg-subtitle">
            Manage your Footfrica account, privacy, notifications, and football visibility.
          </p>
        </div>
      </div>

      {/* ── Main 2-Column Layout ─────────────────────────────────────────── */}
      <main className="stg-grid">
        
        {/* ── Left Sidebar Menu ────────────────────────────────────────────── */}
        <aside className="stg-sidebar">
          <div className="stg-menu-card">
            {menuItems.map((item) => {
              if (item.isDivider) {
                return <div key={item.id} className="stg-menu-divider" />
              }
              return (
                <button
                  key={item.id}
                  className={`stg-menu-item ${activeTab === item.id ? 'active' : ''} ${item.danger ? 'danger' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id)
                    setSearchParams({ tab: item.id })
                  }}
                >
                  <div className="stg-menu-left">
                    <span className="stg-menu-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="stg-menu-dot" />
                </button>
              )
            })}
          </div>

          {/* User Profile Progress Widget */}
          <div className="stg-user-widget">
            <div className="stg-user-info">
              <div className="stg-user-avatar">TA</div>
              <div>
                <div className="stg-user-name">{accountForm.fullName}</div>
                <div className="stg-user-handle">{accountForm.username}</div>
              </div>
            </div>
            <div className="stg-widget-divider" />
            <div className="stg-user-status">● Verification pending</div>
            
            <div className="stg-progress-row">
              <div className="stg-progress-bar">
                <div className="stg-progress-fill" style={{ width: '65%' }} />
              </div>
              <span className="stg-progress-pct">65%</span>
            </div>
            <div className="stg-progress-sub">Profile completion</div>

            <button className="stg-btn-view-profile" onClick={() => navigate('/profile')}>
              View profile
            </button>
          </div>
        </aside>

        {/* ── Right Content Column ────────────────────────────────────────── */}
        <div className="stg-content-col">
          
          {/* ── TAB 1: ACCOUNT ────────────────────────────────────────────── */}
          {activeTab === 'Account' && (
            <>
              <div className="stg-card">
                <h2 className="stg-card__title">Account</h2>
                <p className="stg-card__subtitle">Update your basic account information.</p>

                <div className="stg-form-grid">
                  <div className="stg-form-group">
                    <label>Full name</label>
                    <input
                      type="text"
                      value={accountForm.fullName}
                      onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="stg-form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={accountForm.username}
                      onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    />
                  </div>
                  <div className="stg-form-group">
                    <label>Email address</label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    />
                  </div>
                  <div className="stg-form-group">
                    <label>Phone number</label>
                    <input
                      type="text"
                      value={accountForm.phone}
                      onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="stg-form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={accountForm.country}
                      onChange={(e) => setAccountForm({ ...accountForm, country: e.target.value })}
                    />
                  </div>
                  <div className="stg-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={accountForm.city}
                      onChange={(e) => setAccountForm({ ...accountForm, city: e.target.value })}
                    />
                  </div>
                  <div className="stg-form-group">
                    <label>Language</label>
                    <input
                      type="text"
                      value={accountForm.language}
                      onChange={(e) => setAccountForm({ ...accountForm, language: e.target.value })}
                    />
                  </div>
                  <div className="stg-form-group">
                    <label>Time zone</label>
                    <input
                      type="text"
                      placeholder=""
                      value={accountForm.timezone}
                      onChange={(e) => setAccountForm({ ...accountForm, timezone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="stg-info-box">
                  Your Footfrica account supports multiple football roles over time. You do not need to choose one fixed account type — manage your profile layers in the <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Profile'); }}>Profile</a> section.
                </div>

                <div className="stg-btn-group">
                  <button className="stg-btn-save" onClick={() => showToast('Account details saved!')}>
                    Save changes
                  </button>
                  <button className="stg-btn-cancel">Cancel</button>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Connected Accounts</h3>
                <div className="stg-toggle-row">
                  <div>
                    <div className="stg-toggle-label">Google</div>
                  </div>
                  <button className="stg-filter-clear" style={{ color: '#DC2626', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => showToast('Google account disconnected')}>
                    Disconnect
                  </button>
                </div>
                <div className="stg-toggle-row">
                  <div>
                    <div className="stg-toggle-label">Apple</div>
                  </div>
                  <button className="stg-layer-btn" onClick={() => showToast('Apple account connected')}>
                    Connect
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 2: PROFILE ────────────────────────────────────────────── */}
          {activeTab === 'Profile' && (
            <>
              <div className="stg-card">
                <h2 className="stg-card__title">Profile</h2>
                <p className="stg-card__subtitle">Manage your public football identity and profile layers.</p>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, display: 'block' }}>
                    Profile Photo & Cover
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="stg-user-avatar" style={{ width: 64, height: 64, fontSize: 24, position: 'relative' }}>
                      TA
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#166534', border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✏</div>
                    </div>
                    <div style={{ flex: 1, height: 64, background: '#166534', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 16 }}>
                      <button className="stg-layer-btn" style={{ background: 'rgba(255,255,255,0.9)', border: 'none', fontSize: 12 }} onClick={() => showToast('Cover upload opened')}>
                        ✏ Edit cover
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 20, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px 0' }}>Public Info</h4>
                  <div className="stg-form-group" style={{ marginBottom: 16 }}>
                    <label>Bio</label>
                    <span style={{ fontSize: 11.5, color: '#6B7280', marginTop: -4 }}>Write a short football introduction visible on your profile.</span>
                    <textarea
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    />
                  </div>

                  <div className="stg-form-grid">
                    <div className="stg-form-group">
                      <label>Website or portfolio link (optional)</label>
                      <input
                        type="text"
                        placeholder="https://your-portfolio.com"
                        value={profileForm.website}
                        onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      />
                    </div>
                    <div className="stg-form-group">
                      <label>Favourite club (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. FC Lagos United"
                        value={profileForm.favClub}
                        onChange={(e) => setProfileForm({ ...profileForm, favClub: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="stg-btn-group">
                    <button className="stg-btn-save" onClick={() => showToast('Profile info updated!')}>
                      Save changes
                    </button>
                    <button className="stg-btn-cancel">Cancel</button>
                  </div>
                </div>
              </div>

              {/* Profile Layers Section */}
              <div className="stg-card">
                <h3 className="stg-card__title">Profile Layers</h3>
                <p className="stg-card__subtitle">
                  Add or manage the different football roles that appear on your Footfrica profile. You can have multiple active layers.
                </p>

                <div className="stg-layer-item">
                  <div className="stg-layer-info">
                    <div className="stg-layer-icon"><AccountIcon /></div>
                    <div>
                      <div className="stg-layer-title-row">
                        <span className="stg-layer-title">Player Profile</span>
                        <span className="stg-layer-status" style={{ background: '#DCFCE7', color: '#15803D' }}>● Active</span>
                      </div>
                      <div className="stg-layer-desc">Add position, club history, stats, and highlights.</div>
                    </div>
                  </div>
                  <button className="stg-layer-btn" onClick={() => navigate('/profile')}>Edit player profile</button>
                </div>

                <div className="stg-layer-item">
                  <div className="stg-layer-info">
                    <div className="stg-layer-icon"><ProfileIcon /></div>
                    <div>
                      <div className="stg-layer-title-row">
                        <span className="stg-layer-title">Coach Profile</span>
                        <span className="stg-layer-status" style={{ background: '#F3F4F6', color: '#6B7280' }}>● Not set up</span>
                      </div>
                      <div className="stg-layer-desc">Add coaching credentials, certifications, and mentored players.</div>
                    </div>
                  </div>
                  <button className="stg-layer-btn" onClick={() => showToast('Coach setup initiated')}>Set up coach profile</button>
                </div>

                <div className="stg-layer-item">
                  <div className="stg-layer-info">
                    <div className="stg-layer-icon"><SearchOutlineIcon /></div>
                    <div>
                      <div className="stg-layer-title-row">
                        <span className="stg-layer-title">Scout / Agent Profile</span>
                        <span className="stg-layer-status" style={{ background: '#F3F4F6', color: '#6B7280' }}>● Not set up</span>
                      </div>
                      <div className="stg-layer-desc">Add scouting regions, positions of interest, and organization.</div>
                    </div>
                  </div>
                  <button className="stg-layer-btn" onClick={() => showToast('Scout setup initiated')}>Set up scout profile</button>
                </div>

                <div className="stg-layer-item">
                  <div className="stg-layer-info">
                    <div className="stg-layer-icon"><ShieldCheckIcon /></div>
                    <div>
                      <div className="stg-layer-title-row">
                        <span className="stg-layer-title">Club / Academy Admin</span>
                        <span className="stg-layer-status" style={{ background: '#FEF3C7', color: '#B45309' }}>● Pending verification</span>
                      </div>
                      <div className="stg-layer-desc">Manage an official club or academy page on Footfrica.</div>
                    </div>
                  </div>
                  <button className="stg-layer-btn" style={{ borderColor: '#FCD34D', color: '#D97706', background: '#FFFBEB' }} onClick={() => showToast('Continuing setup')}>Continue setup</button>
                </div>

                <div className="stg-layer-item">
                  <div className="stg-layer-info">
                    <div className="stg-layer-icon"><AccountIcon /></div>
                    <div>
                      <div className="stg-layer-title-row">
                        <span className="stg-layer-title">Fan Profile</span>
                        <span className="stg-layer-status" style={{ background: '#F3F4F6', color: '#6B7280' }}>● Not set up</span>
                      </div>
                      <div className="stg-layer-desc">Customize your supporter identity and football interests.</div>
                    </div>
                  </div>
                  <button className="stg-layer-btn" onClick={() => showToast('Fan profile setup initiated')}>Set up fan profile</button>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 3: PRIVACY & VISIBILITY ───────────────────────────────── */}
          {activeTab === 'Privacy & Visibility' && (
            <>
              <div className="stg-card">
                <h2 className="stg-card__title">Privacy & Visibility</h2>
                <p className="stg-card__subtitle">Control who can see your profile and football activity.</p>

                <div style={{ marginBottom: 24 }}>
                  <label className="stg-form-group" style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>Profile Visibility</label>
                  <div className="stg-radio-cards-row">
                    <label className="stg-radio-card active">
                      <input type="radio" name="pvis" defaultChecked />
                      <div>
                        <strong style={{ fontSize: 13, display: 'block', color: '#111827' }}>Public</strong>
                      </div>
                    </label>
                    <label className="stg-radio-card">
                      <input type="radio" name="pvis" />
                      <div>
                        <strong style={{ fontSize: 13, display: 'block', color: '#111827' }}>Footfrica members only</strong>
                      </div>
                    </label>
                    <label className="stg-radio-card">
                      <input type="radio" name="pvis" />
                      <div>
                        <strong style={{ fontSize: 13, display: 'block', color: '#111827' }}>Private</strong>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Player Discovery Visibility</h3>
                <p className="stg-card__subtitle">Control how scouts, clubs, and coaches can discover your player profile.</p>

                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show my profile in player search</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div>
                    <div className="stg-toggle-label">Show my profile to scouts and clubs</div>
                    <div className="stg-toggle-sub">Scouts and clubs can find you in talent discovery</div>
                  </div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show my profile in Highlights discovery</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show my location on profile</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show my age</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show my height and weight</div></div>
                  <label className="stg-switch"><input type="checkbox" /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show my stats</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show my club history</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Activity Visibility</h3>
                <p className="stg-card__subtitle">Choose what social actions are visible to others.</p>

                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show when I follow someone</div></div>
                  <label className="stg-switch"><input type="checkbox" /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show when I like posts</div></div>
                  <label className="stg-switch"><input type="checkbox" /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show my reposts</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div>
                    <div className="stg-toggle-label">Show my saved highlights</div>
                    <div className="stg-toggle-sub">Keep your saved content private</div>
                  </div>
                  <label className="stg-switch"><input type="checkbox" /><span className="stg-slider" /></label>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 4: MESSAGING ─────────────────────────────────────────── */}
          {activeTab === 'Messaging' && (
            <>
              <div className="stg-card">
                <h2 className="stg-card__title">Messaging</h2>
                <p className="stg-card__subtitle">Control who can message you and how conversations start.</p>

                <div style={{ marginBottom: 20 }}>
                  <label className="stg-form-group" style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>Who can message me</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label className="stg-radio-card">
                      <input type="radio" name="mmsg" />
                      <div><strong style={{ fontSize: 13, color: '#111827' }}>Everyone</strong></div>
                    </label>
                    <label className="stg-radio-card">
                      <input type="radio" name="mmsg" />
                      <div><strong style={{ fontSize: 13, color: '#111827' }}>People I follow</strong></div>
                    </label>
                    <label className="stg-radio-card active" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="radio" name="mmsg" defaultChecked />
                        <strong style={{ fontSize: 13, color: '#111827' }}>Verified scouts, coaches, and clubs only</strong>
                      </div>
                      <span style={{ fontSize: 10, background: '#FEF08A', color: '#854D0E', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>Recommended</span>
                    </label>
                    <label className="stg-radio-card">
                      <input type="radio" name="mmsg" />
                      <div><strong style={{ fontSize: 13, color: '#111827' }}>No one</strong></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Message Request Settings</h3>
                <p className="stg-card__subtitle">Control football-specific conversation types.</p>

                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Allow message requests</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Require approval before new conversations</div></div>
                  <label className="stg-switch"><input type="checkbox" /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div>
                    <div className="stg-toggle-label">Allow clubs to send trial invitations</div>
                    <div className="stg-toggle-sub">Clubs can send you structured trial invite cards</div>
                  </div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Allow scouts to request highlights</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Allow coaches to send feedback</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Safety Controls</h3>
                <p className="stg-card__subtitle">Protect yourself from suspicious or unsafe messages.</p>

                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Filter suspicious messages</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Hide messages with unsafe links</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Auto-move unknown senders to requests</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>

                <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F3F4F6', fontSize: 13, fontWeight: 700 }}>
                  <a href="#" style={{ color: '#166534', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setActiveTab('Blocked & Muted'); }}>Blocked users ›</a>
                  <a href="#" style={{ color: '#166534', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('/messages'); }}>Message requests ›</a>
                  <a href="#" style={{ color: '#166534', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); showToast('Report opened'); }}>Report a conversation ›</a>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 5: NOTIFICATIONS ──────────────────────────────────────── */}
          {activeTab === 'Notifications' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <h2 className="stg-card__title">Notifications</h2>
                <p className="stg-card__subtitle">Choose which football updates you want to receive.</p>
              </div>

              {[
                {
                  title: 'Social Activity',
                  items: ['Likes', 'Comments', 'Reposts', 'Mentions', 'New followers']
                },
                {
                  title: 'Highlights',
                  items: ['Highlight likes', 'Highlight comments', 'View milestones', 'Saved highlights']
                },
                {
                  title: 'Scout & Club Activity',
                  items: ['Scout viewed my profile', 'Added to shortlist', 'Club viewed my profile', 'Trial invitation']
                },
                {
                  title: 'Messages',
                  items: ['New messages', 'Message requests', 'Trial invitation replies']
                },
                {
                  title: 'Communities',
                  items: ['Match threads', 'Poll results', 'Trending discussions']
                },
                {
                  title: 'Verification & Security',
                  items: ['Verification updates', 'Login alerts', 'Account changes']
                }
              ].map((section) => (
                <div key={section.title} className="stg-card" style={{ padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px 0' }}>{section.title}</h4>
                  <table className="stg-notif-table">
                    <thead>
                      <tr>
                        <th>Notification</th>
                        <th>In-app</th>
                        <th>Email</th>
                        <th>Push</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item, idx) => (
                        <tr key={item}>
                          <td>{item}</td>
                          <td><label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label></td>
                          <td><label className="stg-switch"><input type="checkbox" defaultChecked={idx % 2 === 0} /><span className="stg-slider" /></label></td>
                          <td><label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          {/* ── TAB 6: VERIFICATION ───────────────────────────────────────── */}
          {activeTab === 'Verification' && (
            <>
              <div>
                <h2 className="stg-card__title">Verification</h2>
                <p className="stg-card__subtitle">Manage your identity and football credibility on Footfrica.</p>
              </div>

              {/* Pending Review Top Card */}
              <div className="stg-verif-top-card">
                <div className="stg-verif-top-left">
                  <div className="stg-verif-top-icon">⏳</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Player Verification</h3>
                      <span className="stg-layer-status" style={{ background: '#FEF3C7', color: '#B45309' }}>● Pending Review</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 4 }}>Submitted to Mainland Football Academy for verification.</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Last updated: 8 June 2026</div>
                  </div>
                </div>
                <div className="stg-ring-graphic">Pending</div>
              </div>

              {/* 2x2 Cards Grid */}
              <div className="stg-verif-grid">
                <div className="stg-verif-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, color: '#166534' }}><ShieldCheckIcon /></span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Player Verification</h4>
                      <span style={{ fontSize: 10, background: '#FEF08A', color: '#854D0E', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Pending review</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Get verified by a recognised club, academy, or verified coach.</p>
                  <button className="stg-verif-btn-gold" onClick={() => showToast('Verification details opened')}>Continue verification</button>
                </div>

                <div className="stg-verif-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, color: '#4B5563' }}><ShieldCheckIcon /></span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Coach Verification</h4>
                      <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Not started</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Verify your coaching credentials and professional role.</p>
                  <button className="stg-verif-btn-green" onClick={() => showToast('Coach verification started')}>Start verification</button>
                </div>

                <div className="stg-verif-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, color: '#4B5563' }}><ShieldCheckIcon /></span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Scout / Agent Verification</h4>
                      <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Not started</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Confirm your scouting or agency credentials.</p>
                  <button className="stg-verif-btn-green" onClick={() => showToast('Scout verification started')}>Start verification</button>
                </div>

                <div className="stg-verif-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, color: '#4B5563' }}><ShieldCheckIcon /></span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Club / Academy Verification</h4>
                      <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Not started</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Confirm your organisation identity and unlock official club tools.</p>
                  <button className="stg-verif-btn-green" onClick={() => showToast('Club verification started')}>Verify organisation</button>
                </div>
              </div>

              {/* Requirements Card */}
              <div className="stg-card">
                <h3 className="stg-card__title">Verification Requirements</h3>
                <p className="stg-card__subtitle">To get your Player Verification badge, you need at least one of:</p>

                <div className="stg-checklist-item">
                  <div className="stg-check-icon-green">✓</div>
                  <span>Confirmation from a verified club or academy</span>
                </div>
                <div className="stg-checklist-item">
                  <div className="stg-check-icon-green">✓</div>
                  <span>Endorsement from a verified coach</span>
                </div>
                <div className="stg-checklist-item">
                  <div className="stg-check-icon-gray" />
                  <span style={{ color: '#6B7280' }}>Uploaded ID document (reviewed privately)</span>
                </div>
                <div className="stg-checklist-item">
                  <div className="stg-check-icon-gray" />
                  <span style={{ color: '#6B7280' }}>At least 3 uploaded highlights</span>
                </div>

                <a href="#" style={{ color: '#166534', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block', marginTop: 14 }} onClick={(e) => { e.preventDefault(); showToast('Verification help opened'); }}>
                  Learn about verification ›
                </a>
              </div>
            </>
          )}

          {/* ── TAB 7: DISCOVERY PREFERENCES ───────────────────────────────── */}
          {activeTab === 'Discovery Preferences' && (
            <>
              <div>
                <h2 className="stg-card__title">Discovery Preferences</h2>
                <p className="stg-card__subtitle">Personalise what you see and how you are discovered.</p>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Feed Interests</h3>
                <p className="stg-card__subtitle">Select topics to personalise your home feed and highlights discovery.</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { name: 'Grassroots football', active: false },
                    { name: 'Nigerian football', active: true },
                    { name: 'African talent', active: true },
                    { name: 'Tactical analysis', active: false },
                    { name: 'Match debates', active: false },
                    { name: 'Trials & opportunities', active: true },
                    { name: 'Player highlights', active: true },
                    { name: 'Club updates', active: false },
                    { name: 'Scouting reports', active: false },
                  ].map((topic) => (
                    <button
                      key={topic.name}
                      className={`srch-quick-tag ${topic.active ? 'active' : ''}`}
                      style={{
                        background: topic.active ? '#166534' : '#F3F4F6',
                        color: topic.active ? '#ffffff' : '#374151',
                        padding: '6px 14px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        borderRadius: 20,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => showToast(`Toggled topic "${topic.name}"`)}
                    >
                      {topic.active ? '✓ ' : ''}{topic.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Location Preferences</h3>
                <p className="stg-card__subtitle">Choose which geographic football content to prioritise.</p>

                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Prioritise local football content</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show content from my country</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show content from across Africa</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show global football content</div></div>
                  <label className="stg-switch"><input type="checkbox" /><span className="stg-slider" /></label>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Player Discovery Filters</h3>
                <p className="stg-card__subtitle">For scouts, coaches, and clubs discovering talent. Shape your Discover results.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div className="stg-form-group">
                    <label>Positions of interest</label>
                    <input type="text" placeholder="" />
                  </div>
                  <div className="stg-form-group">
                    <label>Age range</label>
                    <input type="text" placeholder="" />
                  </div>
                  <div className="stg-form-group">
                    <label>Location</label>
                    <input type="text" placeholder="" />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="srch-checkbox-row"><input type="checkbox" /> Verified players only</label>
                  <label className="srch-checkbox-row"><input type="checkbox" /> Active players only (posted in last 30 days)</label>
                  <label className="srch-checkbox-row"><input type="checkbox" /> Players with highlights only</label>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 8: CONTENT PREFERENCES ─────────────────────────────────── */}
          {activeTab === 'Content Preferences' && (
            <>
              <div>
                <h2 className="stg-card__title">Content Preferences</h2>
                <p className="stg-card__subtitle">Control the type of football content you see.</p>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Video Settings</h3>
                <p className="stg-card__subtitle">Manage video playback and data usage.</p>

                <div className="stg-toggle-row">
                  <div>
                    <div className="stg-toggle-label">Autoplay videos</div>
                    <div className="stg-toggle-sub">Videos play automatically as you scroll</div>
                  </div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div>
                    <div className="stg-toggle-label">Low data mode</div>
                    <div className="stg-toggle-sub">Reduces video quality to save mobile data</div>
                  </div>
                  <label className="stg-switch"><input type="checkbox" /><span className="stg-slider" /></label>
                </div>

                <div className="stg-form-group" style={{ marginTop: 14 }}>
                  <label>Default video quality</label>
                  <select style={{ width: '100%' }}>
                    <option>Auto (Recommended)</option>
                    <option>High Definition (1080p)</option>
                    <option>Standard (720p)</option>
                    <option>Data Saver (480p)</option>
                  </select>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Content Types</h3>
                <p className="stg-card__subtitle">Choose what types of football content appear in your feed.</p>

                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show tactical analysis content</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show match debates</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Show fan polls</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div>
                    <div className="stg-toggle-label">Show trial opportunities</div>
                    <div className="stg-toggle-sub">See club trial announcements and invitations</div>
                  </div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
                <div className="stg-toggle-row">
                  <div><div className="stg-toggle-label">Hide sensitive or reported content</div></div>
                  <label className="stg-switch"><input type="checkbox" defaultChecked /><span className="stg-slider" /></label>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Muted Words & Hashtags</h3>
                <p className="stg-card__subtitle">Content containing these words or hashtags will be hidden from your feed.</p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <span className="srch-filter-badge">#clickbait <span className="srch-filter-badge__close" onClick={() => showToast('Unmuted #clickbait')}>×</span></span>
                  <span className="srch-filter-badge">transfer rumours <span className="srch-filter-badge__close" onClick={() => showToast('Unmuted transfer rumours')}>×</span></span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="text" className="stg-form-group" style={{ flex: 1, padding: '9px 14px', border: '1px solid #E5E7EB', borderRadius: 10 }} placeholder="Add word or #hashtag..." />
                  <button className="stg-btn-save" style={{ borderRadius: 10 }} onClick={() => showToast('Word muted')}>Add</button>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 9: SECURITY ────────────────────────────────────────────── */}
          {activeTab === 'Security' && (
            <>
              <div>
                <h2 className="stg-card__title">Security</h2>
                <p className="stg-card__subtitle">Keep your Footfrica account safe.</p>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Password</h3>

                <div className="stg-form-group" style={{ marginBottom: 16 }}>
                  <label>Current password</label>
                  <input type="password" defaultValue="password123" />
                </div>

                <div className="stg-form-grid">
                  <div className="stg-form-group">
                    <label>New password</label>
                    <input type="password" defaultValue="password123" />
                  </div>
                  <div className="stg-form-group">
                    <label>Confirm new password</label>
                    <input type="password" defaultValue="password123" />
                  </div>
                </div>

                <button className="stg-btn-save" onClick={() => showToast('Password updated!')}>Update password</button>
              </div>

              <div className="stg-card">
                <div className="stg-toggle-row">
                  <div>
                    <h3 className="stg-card__title" style={{ margin: 0 }}>Two-Factor Authentication</h3>
                    <div className="stg-toggle-sub">Add an extra layer of security to your account login.</div>
                  </div>
                  <label className="stg-switch"><input type="checkbox" /><span className="stg-slider" /></label>
                </div>
              </div>

              <div className="stg-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 className="stg-card__title" style={{ margin: 0 }}>Login Activity</h3>
                  <a href="#" style={{ color: '#166534', fontWeight: 700, fontSize: 12.5, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); showToast('Reviewing all activity'); }}>Review all activity</a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="stg-layer-item" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
                    <div className="stg-layer-info">
                      <span style={{ fontSize: 20, color: '#166534' }}>💻</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Chrome · Lagos, Nigeria</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>Now · Current session</div>
                      </div>
                    </div>
                    <span className="stg-layer-status" style={{ background: '#DCFCE7', color: '#15803D' }}>Active now</span>
                  </div>

                  <div className="stg-layer-item">
                    <div className="stg-layer-info">
                      <span style={{ fontSize: 20, color: '#4B5563' }}>💻</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Firefox · Abuja, Nigeria</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>2 days ago</div>
                      </div>
                    </div>
                    <button style={{ color: '#DC2626', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }} onClick={() => showToast('Session removed')}>Remove</button>
                  </div>

                  <div className="stg-layer-item">
                    <div className="stg-layer-info">
                      <span style={{ fontSize: 20, color: '#4B5563' }}>📱</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Mobile Safari · Lagos</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>5 days ago</div>
                      </div>
                    </div>
                    <button style={{ color: '#DC2626', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }} onClick={() => showToast('Session removed')}>Remove</button>
                  </div>
                </div>
              </div>

              {/* Alert Banner Box */}
              <div className="stg-alert-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D97706', fontWeight: 800, fontSize: 13.5 }}>
                  <AlertTriangleIcon />
                  <span>Security Alert</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#92400E' }}>
                  A new login was detected from Lagos, Nigeria on 10 June 2026. If this wasn't you, change your password immediately.
                </div>
                <button className="stg-btn-cancel" style={{ width: 'fit-content', background: '#ffffff', borderColor: '#FCD34D', color: '#D97706', fontWeight: 700 }} onClick={() => showToast('Review activity opened')}>
                  Review activity
                </button>
              </div>
            </>
          )}

          {/* ── TAB 10: BLOCKED & MUTED ────────────────────────────────────── */}
          {activeTab === 'Blocked & Muted' && (
            <>
              <div>
                <h2 className="stg-card__title">Blocked & Muted</h2>
                <p className="stg-card__subtitle">Manage people, clubs, and topics you do not want to interact with.</p>
              </div>

              <div className="stg-card">
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
                  {['Blocked users', 'Muted users', 'Muted words', 'Muted hashtags'].map((bTab, idx) => (
                    <button
                      key={bTab}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: 'none',
                        background: idx === 0 ? '#166534' : 'transparent',
                        color: idx === 0 ? '#ffffff' : '#4B5563',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {bTab}
                    </button>
                  ))}
                </div>

                <div className="stg-layer-item">
                  <div className="stg-layer-info">
                    <div className="stg-user-avatar" style={{ background: '#9CA3AF' }}>UU</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5 }}>Unknown User 1</div>
                      <span className="msg-role-tag msg-role-tag--fan" style={{ fontSize: 10 }}>Fan</span>
                    </div>
                  </div>
                  <button className="stg-layer-btn" onClick={() => showToast('Unblocked Unknown User 1')}>Unblock</button>
                </div>

                <div className="stg-layer-item">
                  <div className="stg-layer-info">
                    <div className="stg-user-avatar" style={{ background: '#9CA3AF' }}>SA</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5 }}>Spam Account</div>
                      <span className="msg-role-tag msg-role-tag--fan" style={{ fontSize: 10 }}>Fan</span>
                    </div>
                  </div>
                  <button className="stg-layer-btn" onClick={() => showToast('Unblocked Spam Account')}>Unblock</button>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 11: DATA & DOWNLOADS ───────────────────────────────────── */}
          {activeTab === 'Data & Downloads' && (
            <>
              <div>
                <h2 className="stg-card__title">Data & Downloads</h2>
                <p className="stg-card__subtitle">Control your data and download your Footfrica information.</p>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Download Your Data</h3>

                {[
                  { title: 'Download my full data archive', desc: 'Includes profile, posts, messages, and activity' },
                  { title: 'Download profile CV', desc: 'Export as a shareable football CV PDF' },
                  { title: 'Export my highlights metadata', desc: 'Title, views, engagement data' },
                  { title: 'Export my posts', desc: 'All your posts in JSON format' },
                  { title: 'Request account data report', desc: 'Detailed data usage report' },
                ].map((d) => (
                  <div key={d.title} className="stg-layer-item">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{d.title}</div>
                      <div style={{ fontSize: 11.5, color: '#6B7280' }}>{d.desc}</div>
                    </div>
                    <button className="stg-layer-btn" onClick={() => showToast(`Requested: ${d.title}`)}>↓ Request</button>
                  </div>
                ))}
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Clear History</h3>

                {[
                  'Clear search history',
                  'Clear watch history',
                  'Clear saved interests',
                ].map((c) => (
                  <div key={c} className="stg-layer-item">
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c}</div>
                    <button className="stg-layer-btn" onClick={() => showToast(`${c} executed`)}>Clear</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TAB 12: BILLING & PREMIUM ──────────────────────────────────── */}
          {activeTab === 'Billing & Premium' && (
            <>
              <div>
                <h2 className="stg-card__title">Billing & Premium</h2>
                <p className="stg-card__subtitle">Manage your subscription and payment details.</p>
              </div>

              <div className="stg-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Current Plan: Free</h3>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Premium features coming soon to Footfrica.</div>
                  </div>
                </div>

                <div className="stg-billing-grid">
                  <div className="stg-billing-card">
                    <span style={{ fontSize: 20 }}>🚀</span>
                    <strong style={{ fontSize: 14 }}>Player Boost</strong>
                    <span style={{ fontSize: 11.5, color: '#6B7280' }}>Increase visibility to scouts and clubs</span>
                    <div className="stg-billing-btn-soon">Coming soon</div>
                  </div>

                  <div className="stg-billing-card">
                    <span style={{ fontSize: 20 }}>🔍</span>
                    <strong style={{ fontSize: 14 }}>Scout Pro</strong>
                    <span style={{ fontSize: 11.5, color: '#6B7280' }}>Advanced search and shortlist tools</span>
                    <div className="stg-billing-btn-soon">Coming soon</div>
                  </div>

                  <div className="stg-billing-card">
                    <span style={{ fontSize: 20 }}>🏟</span>
                    <strong style={{ fontSize: 14 }}>Club Pro</strong>
                    <span style={{ fontSize: 11.5, color: '#6B7280' }}>Club management and trial tools</span>
                    <div className="stg-billing-btn-soon">Coming soon</div>
                  </div>

                  <div className="stg-billing-card">
                    <span style={{ fontSize: 20 }}>⭐</span>
                    <strong style={{ fontSize: 14 }}>Fan Premium</strong>
                    <span style={{ fontSize: 11.5, color: '#6B7280' }}>Exclusive community and analysis content</span>
                    <div className="stg-billing-btn-soon">Coming soon</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 13: HELP & SUPPORT ────────────────────────────────────── */}
          {activeTab === 'Help & Support' && (
            <>
              <div>
                <h2 className="stg-card__title">Help & Support</h2>
                <p className="stg-card__subtitle">Get help, report problems, and read our community guidelines.</p>
              </div>

              <div className="stg-card" style={{ padding: 8 }}>
                {[
                  { icon: <HelpCircleIcon />, title: 'Help Center', desc: 'Browse guides and FAQs' },
                  { icon: <ChatIcon />, title: 'Contact support', desc: 'Get help from the Footfrica team' },
                  { icon: <AlertTriangleIcon />, title: 'Report a problem', desc: 'Flag bugs or platform issues' },
                  { icon: <AccountIcon />, title: 'Community guidelines', desc: 'Read our football community standards' },
                  { icon: <ShieldCheckIcon />, title: 'Safety center', desc: 'Tools and resources for safe use' },
                  { icon: <ShieldCheckIcon />, title: 'Verification help', desc: 'How to get verified on Footfrica' },
                  { icon: <LockIcon />, title: 'Terms & Privacy Policy', desc: 'Read our terms of service and privacy policy' },
                ].map((item) => (
                  <div key={item.title} className="stg-help-item" onClick={() => showToast(`Opened: ${item.title}`)}>
                    <div className="stg-help-left">
                      <div className="stg-help-icon">{item.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{item.desc}</div>
                      </div>
                    </div>
                    <span style={{ color: '#9CA3AF', fontSize: 16 }}>›</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TAB 14: DEACTIVATE ACCOUNT ────────────────────────────────── */}
          {activeTab === 'Deactivate Account' && (
            <>
              <div>
                <h2 className="stg-card__title">Deactivate or Delete Account</h2>
                <p className="stg-card__subtitle">Temporarily deactivate your profile or permanently delete your account.</p>
              </div>

              {/* Warning Alert Banner */}
              <div className="stg-alert-banner" style={{ background: '#FFFBEB', borderColor: '#FCD34D', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D97706', fontWeight: 800 }}>
                  <AlertTriangleIcon />
                  <span>Deactivating pauses your profile and hides it from search. You can reactivate at any time by logging back in.</span>
                </div>
              </div>

              <div className="stg-card">
                <h3 className="stg-card__title">Deactivate account</h3>
                <p className="stg-card__subtitle" style={{ marginBottom: 16 }}>
                  Your profile will be hidden but your data and highlights will be saved. You can come back any time.
                </p>
                <button className="stg-btn-cancel" style={{ borderColor: '#FCD34D', color: '#D97706', fontWeight: 700 }} onClick={() => showToast('Account deactivated')}>
                  Deactivate account
                </button>
              </div>

              <div className="stg-danger-box">
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#DC2626', margin: '0 0 6px 0' }}>Delete account</h3>
                <p style={{ fontSize: 12.5, color: '#991B1B', margin: '0 0 16px 0' }}>
                  Permanently deletes your profile, highlights, posts, messages, and all account data. This cannot be undone.
                </p>
                <button className="stg-btn-danger" onClick={() => showToast('Permanent account deletion initiated')}>
                  🗑 Delete account permanently
                </button>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#111827',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}
