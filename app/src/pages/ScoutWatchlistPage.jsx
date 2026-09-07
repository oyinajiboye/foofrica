import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/watchlist.css'

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

export default function ScoutWatchlistPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()
  const [filterStatus, setFilterStatus] = useState('All')
  const [toastMessage, setToastMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const [watchlist, setWatchlist] = useState([])

  // ── Fetch shortlists from API ───────────────────────────────────────
  useEffect(() => {
    const loadShortlists = async () => {
      try {
        const res = await apiFetch('/api/scouts/shortlists')
        const items = res.data?.data || res.data || []
        setWatchlist(items.map((p, i) => ({
          id: p.id || i,
          name: p.player?.display_name || p.display_name || 'Unknown',
          pos: p.player?.primary_position || p.position || '??',
          cat: 'fw',
          age: p.player?.age || '-',
          foot: p.player?.dominant_foot || '-',
          club: p.player?.current_club_name || '-',
          score: p.scout_rating || '-',
          status: p.status || 'In Review',
          note: p.notes || '',
        })))
      } catch (e) {
        console.error('Failed to load shortlists:', e)
      } finally {
        setLoading(false)
      }
    }
    loadShortlists()
  }, [apiFetch])

  return (
    <div className="wtc-shell">
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

      {/* Header Banner */}
      <div className="stg-header">
        <div className="stg-header__inner">
          <h1 className="stg-title">Scout Watchlist & Talent Shortlist</h1>
          <p className="stg-subtitle">Private talent tracking, player evaluation notes, and recruitment status for verified scouts.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="wtc-stats-grid">
        <div className="wtc-stat-card">
          <span className="wtc-stat-num">14</span>
          <span className="wtc-stat-lbl">Shortlisted Players</span>
        </div>
        <div className="wtc-stat-card">
          <span className="wtc-stat-num">8</span>
          <span className="wtc-stat-lbl">Evaluations Completed</span>
        </div>
        <div className="wtc-stat-card">
          <span className="wtc-stat-num">3</span>
          <span className="wtc-stat-lbl">Trial Invites Sent</span>
        </div>
        <div className="wtc-stat-card">
          <span className="wtc-stat-num">1</span>
          <span className="wtc-stat-lbl">Signed / Placed</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="clb-grid" style={{ paddingTop: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'In Review', 'Trial Offered', 'Contacted'].map((st) => (
                <button
                  key={st}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: 'none',
                    background: filterStatus === st ? '#166534' : '#E5E7EB',
                    color: filterStatus === st ? '#ffffff' : '#374151',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilterStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
            <button className="clb-btn-primary" onClick={() => showToast('Invite modal opened')}>
              + Send New Trial Invite
            </button>
          </div>

          {/* Table */}
          <table className="clb-squad-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos</th>
                <th>Age</th>
                <th>Club</th>
                <th>Scout Rating</th>
                <th>Evaluation Notes</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {watchlist
                .filter(p => filterStatus === 'All' || p.status === filterStatus)
                .map((player) => (
                  <tr key={player.id}>
                    <td>
                      <div className="clb-player-cell">
                        <div className="clb-player-avatar">{player.name.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{player.name}</div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>Foot: {player.foot}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`clb-pos-pill ${player.cat}`}>{player.pos}</span></td>
                    <td>{player.age}</td>
                    <td>{player.club}</td>
                    <td style={{ fontWeight: 800, color: '#166534' }}>★ {player.score}</td>
                    <td>
                      <input
                        type="text"
                        className="wtc-notes-input"
                        defaultValue={player.note}
                        onBlur={() => showToast('Scout note saved!')}
                      />
                    </td>
                    <td>
                      <span className={`wtc-status-badge ${player.status === 'Trial Offered' ? 'trial' : 'review'}`}>
                        {player.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="stg-layer-btn" onClick={() => navigate('/messages')}>Msg</button>
                        <button className="stg-layer-btn" style={{ borderColor: '#FECACA', color: '#DC2626' }} onClick={() => { setWatchlist(watchlist.filter(w => w.id !== player.id)); showToast('Removed from watchlist'); }}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="stg-card">
            <h4 className="stg-card__title" style={{ fontSize: 14 }}>Scouting Target Regions</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <span className="srch-quick-tag active" style={{ fontSize: 11 }}>Lagos State</span>
              <span className="srch-quick-tag active" style={{ fontSize: 11 }}>Kano Youth League</span>
              <span className="srch-quick-tag active" style={{ fontSize: 11 }}>Accra Grassroots</span>
            </div>
          </div>
        </aside>
      </main>

      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111827', color: '#fff', padding: '10px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}
