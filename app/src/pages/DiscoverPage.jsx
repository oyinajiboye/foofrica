import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/discover.css'

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

export default function DiscoverPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()
  const [selectedPos, setSelectedPos] = useState('All')
  const [toastMessage, setToastMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const [discoverItems, setDiscoverItems] = useState([])

  // ── Fetch discover feed from API ──────────────────────────────────────
  useEffect(() => {
    const loadDiscover = async () => {
      try {
        const res = await apiFetch('/api/feed/discover?limit=12')
        const items = res.data?.data || res.data || []
        setDiscoverItems(items.map((v, i) => ({
          id: v.id || i,
          title: v.title || v.caption || 'Highlight',
          player: v.author?.display_name || v.player_name || 'Unknown',
          pos: v.author?.primary_position || v.position || '??',
          cat: 'fw',
          age: v.author?.age || '-',
          views: v.view_count || 0,
          duration: v.duration || '0:00',
          club: v.author?.current_club_name || '-',
        })))
      } catch (e) {
        console.error('Discover load failed:', e)
      } finally {
        setLoading(false)
      }
    }
    loadDiscover()
  }, [apiFetch])

  return (
    <div className="dsc-shell">
      {/* Navbar */}
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
          <button className="msg-navbar__nav-link" onClick={() => navigate('/feed')}><HomeIcon /> Home</button>
          <button className="msg-navbar__nav-link" onClick={() => navigate('/highlights')}><HighlightsIcon /> Highlights</button>
          <button className="msg-navbar__nav-link" onClick={() => navigate('/messages')}><MessagesIcon /> Messages</button>
        </nav>

        <button className="msg-navbar__notif-btn" aria-label="Notifications" onClick={() => navigate('/notifications')}>
          <BellIcon /><span className="msg-navbar__notif-badge">4</span>
        </button>

        <div className="msg-navbar__avatar" onClick={() => navigate('/profile')}>TA</div>
      </header>

      {/* Header */}
      <div className="stg-header">
        <div className="stg-header__inner">
          <h1 className="stg-title">Talent Discovery Grid</h1>
          <p className="stg-subtitle">Video-first talent discovery for scouts, coaches, and football managers across Africa.</p>
        </div>
      </div>

      <div className="dsc-grid-layout">
        {/* Filter Sidebar */}
        <aside className="stg-card" style={{ height: 'fit-content' }}>
          <h3 className="stg-card__title">Discovery Filters</h3>
          <div className="stg-form-group" style={{ marginTop: 14 }}>
            <label>Position</label>
            <select value={selectedPos} onChange={(e) => setSelectedPos(e.target.value)} style={{ width: '100%' }}>
              <option value="All">All Positions</option>
              <option value="FW">Forwards & Wingers</option>
              <option value="MF">Midfielders</option>
              <option value="DF">Defenders</option>
              <option value="GK">Goalkeepers</option>
            </select>
          </div>

          <div className="stg-form-group">
            <label>Location</label>
            <input type="text" placeholder="e.g. Lagos, Nigeria" />
          </div>

          <div style={{ marginTop: 16 }}>
            <label className="srch-checkbox-row"><input type="checkbox" defaultChecked /> Verified scouts & clubs</label>
            <label className="srch-checkbox-row" style={{ marginTop: 8 }}><input type="checkbox" defaultChecked /> Has highlight reels</label>
          </div>
        </aside>

        {/* Video Grid */}
        <main className="dsc-video-grid">
          {discoverItems.map((item) => (
            <div key={item.id} className="dsc-video-card">
              <div className="dsc-thumb-wrapper">
                <button className="dsc-play-btn" onClick={() => navigate('/highlights')}>▶</button>
                <span className="dsc-duration-badge">{item.duration}</span>
              </div>
              <div className="dsc-card-body">
                <div className="dsc-player-row">
                  <div className="clb-player-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                    {item.player.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{item.player}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{item.club}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{item.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#6B7280' }}>
                  <span><span className={`clb-pos-pill ${item.cat}`}>{item.pos}</span> · {item.age} yrs</span>
                  <span>👁 {item.views}</span>
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111827', color: '#fff', padding: '10px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}
