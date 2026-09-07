import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/club.css'

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

function getCat(pos) {
  if (!pos) return 'fw'
  const p = pos.toUpperCase()
  if (['GK'].includes(p)) return 'gk'
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'df'
  if (['CM', 'CDM', 'CAM', 'RM', 'LM', 'DM', 'AM'].includes(p)) return 'mf'
  return 'fw'
}

export default function ClubPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, apiFetch } = useAuth()

  const [activeTab, setActiveTab] = useState('Squad')
  const [isFollowing, setIsFollowing] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [club, setClub] = useState(null)
  const [squadPlayers, setSquadPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Fetch club data ───────────────────────────────────────────────────
  useEffect(() => {
    const loadClub = async () => {
      try {
        const clubId = id || 'mainland-fa'
        const [clubRes, squadRes] = await Promise.allSettled([
          apiFetch(`/api/clubs/${clubId}`),
          apiFetch(`/api/clubs/${clubId}/squad`),
        ])
        if (clubRes.status === 'fulfilled') {
          setClub(clubRes.value?.data)
          setIsFollowing(clubRes.value?.data?.is_following || false)
        }
        if (squadRes.status === 'fulfilled') {
          const players = squadRes.value?.data || []
          setSquadPlayers(players.map((p, i) => ({
            id: p.id || i,
            name: p.display_name || 'Unknown',
            pos: p.player_profile?.primary_position || '??',
            cat: getCat(p.player_profile?.primary_position),
            jersey: p.player_profile?.jersey_number || '-',
            age: p.age || '-',
            height: p.player_profile?.height_cm ? `${(p.player_profile.height_cm / 100).toFixed(2)}m` : '-',
            foot: p.player_profile?.dominant_foot || '-',
            apps: p.stats?.appearances || 0,
            goals: p.stats?.goals || 0,
            assists: p.stats?.assists || 0,
          })))
        }
      } catch (e) {
        console.error('Club load failed:', e)
      } finally {
        setLoading(false)
      }
    }
    loadClub()
  }, [id, apiFetch])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await apiFetch(`/api/follows/${club?.id || id}`, { method: 'DELETE' })
        setIsFollowing(false)
        showToast('Unfollowed')
      } else {
        await apiFetch(`/api/follows/${club?.id || id}`, { method: 'POST' })
        setIsFollowing(true)
        showToast('Now following!')
      }
    } catch { showToast(isFollowing ? 'Unfollowed' : 'Now following!') }
  }

  return (
    <div className="clb-shell">
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

      {/* Banner & Hero Header */}
      <div className="clb-banner">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(22,101,52,0.9), rgba(6,78,59,0.95))' }} />
      </div>

      <div className="clb-header-card">
        <div className="clb-header-inner">
          <div className="clb-crest-group">
            <div className="clb-crest">MFA</div>
            <div className="clb-title-group">
              <div className="clb-name-row">
                <h1 className="clb-name">Mainland Football Academy</h1>
                <span className="clb-verified-badge">🛡 Verified Club</span>
              </div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>@mainlandfa · Professional Youth Football Academy</div>
              <div className="clb-meta-row">
                <span>📍 Lagos, Nigeria</span>
                <span>🏟 Onikan Stadium</span>
                <span>📅 Est. 2014</span>
                <span>⚽ 28 Squad Players</span>
              </div>
            </div>
          </div>

          <div className="clb-action-btns">
            <button className="clb-btn-primary" onClick={() => showToast('Trial application form opened')}>
              Apply for Trial
            </button>
            <button className="clb-btn-outline" onClick={() => navigate('/messages')}>
              Contact Club
            </button>
            <button
              className="clb-btn-outline"
              style={{ background: isFollowing ? '#DCFCE7' : '#ffffff', color: isFollowing ? '#15803D' : '#374151' }}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? '✓ Following' : '+ Follow'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="clb-grid">
        <div>
          {/* Tabs */}
          <div className="clb-tabs">
            {['Overview', 'Squad', 'Trials & Events', 'Highlights & Media', 'Staff & Coaches'].map((tab) => (
              <button
                key={tab}
                className={`clb-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Squad Tab View */}
          {activeTab === 'Squad' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Official Roster 2026</h3>
                <span style={{ fontSize: 12.5, color: '#6B7280' }}>Showing 7 registered squad members</span>
              </div>

              <table className="clb-squad-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>No.</th>
                    <th>Age</th>
                    <th>Height</th>
                    <th>Foot</th>
                    <th>Apps</th>
                    <th>Goals/Assists</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {squadPlayers.map((player) => (
                    <tr key={player.id}>
                      <td>
                        <div className="clb-player-cell">
                          <div className="clb-player-avatar">{player.name.split(' ').map(n => n[0]).join('')}</div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#111827' }}>{player.name}</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>Mainland FA</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`clb-pos-pill ${player.cat}`}>{player.pos}</span></td>
                      <td style={{ fontWeight: 800 }}>#{player.jersey}</td>
                      <td>{player.age}</td>
                      <td>{player.height}</td>
                      <td>{player.foot}</td>
                      <td>{player.apps}</td>
                      <td style={{ fontWeight: 700 }}>
                        {player.goals !== undefined ? `${player.goals}G / ${player.assists}A` : `${player.cleanSheets} CS (${player.saves} Saves)`}
                      </td>
                      <td>
                        <button
                          className="stg-layer-btn"
                          onClick={() => navigate(`/profile/${player.name.toLowerCase().replace(/\s+/g, '')}`)}
                        >
                          View profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <div className="stg-card">
              <h3 className="stg-card__title">About Mainland Football Academy</h3>
              <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>
                Mainland Football Academy is a premier talent development hub based in Lagos, Nigeria. Founded in 2014, the academy specializes in identifying, training, and placing top young African footballers into elite domestic leagues and European trials.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
                <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>14+</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Players Placed Abroad</div>
                </div>
                <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>3x</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Lagos Youth League Champions</div>
                </div>
                <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>98%</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Scout Verification Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* Trials Tab */}
          {activeTab === 'Trials & Events' && (
            <div>
              <div className="clb-trial-card">
                <div>
                  <span className="clb-trial-badge">Open Scouting Trial</span>
                  <h4 style={{ fontSize: 15, fontWeight: 800, margin: '6px 0 2px 0' }}>Lagos U19 Open Talent Showcase</h4>
                  <div style={{ fontSize: 12.5, color: '#6B7280' }}>📅 August 15, 2026 · Onikan Stadium, Lagos</div>
                  <div style={{ fontSize: 12, color: '#374151', marginTop: 6 }}>Open to all unattached players aged 16–19. European scouts present.</div>
                </div>
                <button className="clb-btn-primary" onClick={() => showToast('Applied for Lagos Showcase')}>
                  Register Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="stg-card">
            <h4 className="stg-card__title" style={{ fontSize: 14 }}>Club Information</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#374151', marginTop: 12 }}>
              <div><strong>Head Coach:</strong> Coach Babatunde Sanusi</div>
              <div><strong>Scouting Director:</strong> Emeka Okereke</div>
              <div><strong>Facility:</strong> Onikan Stadium & Training Pitch 2</div>
              <div><strong>Contact Email:</strong> trials@mainlandfa.org</div>
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
