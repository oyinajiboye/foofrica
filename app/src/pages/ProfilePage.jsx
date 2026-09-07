import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/profile.css'

// ─── Icons ───────────────────────────────────────────────────────────────────

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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const VerifiedBadge = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="none">
    <circle cx="12" cy="12" r="10" fill="#1A7A2E"/>
    <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
)
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1A7A2E" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

// ─── Initial Mock Highlights Grid Data ───────────────────────────────────────

const PROFILE_HIGHLIGHTS = [
  { id: 'h1', title: 'Goal vs Rangers', category: 'Goal', duration: '0:42', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80', author: 'Tunde Adebayo', loc: 'LW · Lagos', views: '12.3k', likes: 234 },
  { id: 'h2', title: 'Wing Drill Training', category: 'Training', duration: '1:10', thumbnail: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600&q=80', author: 'Chiamaka Nwosu', loc: 'Forward · Lagos', views: '8.2k', likes: 187 },
  { id: 'h3', title: 'Key Assist Compilation', category: 'Assist', duration: '0:36', thumbnail: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80', author: 'Kwame Mensah', loc: 'Midfielder · Accra', views: '15.1k', likes: 301 },
  { id: 'h4', title: 'Tactical Movement', category: 'Tactical Breakdown', duration: '1:25', thumbnail: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&q=80', author: 'Ada Okonkwo', loc: 'Tactical · Abuja', views: '6.7k', likes: 142 },
  { id: 'h5', title: 'Clutch Goal Moment', category: 'Match Moment', duration: '0:54', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80', author: 'FC Lagos United', loc: 'Club · Lagos', views: '9.8k', likes: 203 },
  { id: 'h6', title: 'Penalty Save Heroics', category: 'Save', duration: '0:28', thumbnail: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600&q=80', author: 'Emeka Obi', loc: 'GK · Port Harcourt', views: '11.2k', likes: 245 },
  { id: 'h7', title: 'Midfield Vision Pass', category: 'Passing', duration: '1:02', thumbnail: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80', author: 'Fatima Ibrahim', loc: 'GK · Kano', views: '7.5k', likes: 156 },
  { id: 'h8', title: 'Curled Top Corner Finish', category: 'Finishing', duration: '0:48', thumbnail: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&q=80', author: 'Joseph Mensah', loc: 'ST · Kumasi', views: '13.6k', likes: 289 },
  { id: 'h9', title: '1v1 Dribble Skill Move', category: 'Dribble', duration: '0:52', thumbnail: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600&q=80', author: 'Chidinma Eze', loc: 'RW · Asaba', views: '10.4k', likes: 218 },
  { id: 'h10', title: 'Defensive Tackle Sweep', category: 'Defending', duration: '1:05', thumbnail: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80', author: 'Samuel Kofi', loc: 'CB · Accra', views: '8.9k', likes: 174 },
  { id: 'h11', title: 'Solo Sprint & Goal', category: 'Goal', duration: '0:38', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80', author: 'Blessing Okoro', loc: 'CAM · Enugu', views: '14.2k', likes: 312 },
  { id: 'h12', title: 'Explosive Pace Acceleration', category: 'Pace', duration: '0:44', thumbnail: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600&q=80', author: 'Mohammed Bello', loc: 'LB · Aba', views: '9.1k', likes: 195 },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()
  const { username } = useParams()

  // Active Tab state
  const [activeTab, setActiveTab] = useState('Overview')
  const [isFollowing, setIsFollowing] = useState(false)

  // API-driven data states
  const [profile, setProfile] = useState(null)
  const [playerProfile, setPlayerProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [highlights, setHighlights] = useState([])
  const [career, setCareer] = useState([])
  const [stats, setStats] = useState([])
  const [endorsements, setEndorsements] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddCareerOpen, setIsAddCareerOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Edit form state (populated from API data)
  const [profileData, setProfileData] = useState({
    display_name: '', username: '', role: '', position: '', secondaryPosition: '',
    club: '', location: '', status: '', bio: '', height: '', weight: '',
    dominantFoot: '', jersey: '', cover_url: '',
  })

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !username || username === user?.username
  const profileIdentifier = (username && username !== 'me' ? username : null) || user?.username || user?.id

  // ── Fetch profile data ──────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!profileIdentifier) return
    setLoading(true)
    try {
      const res = await apiFetch(`/api/profiles/${profileIdentifier}`)
      const p = res.data
      setProfile(p)
      setPlayerProfile(p.player_profile || null)
      setIsFollowing(p.is_following || false)

      // Populate edit form
      setProfileData({
        display_name: p.display_name || '',
        username: p.username || '',
        role: p.user_type || 'player',
        position: p.player_profile?.primary_position || '',
        secondaryPosition: (p.player_profile?.secondary_positions || []).join(', '),
        club: p.player_profile?.current_club_name || '',
        location: p.location || '',
        status: 'Open to trials',
        bio: p.bio || '',
        height: p.player_profile?.height_cm ? `${p.player_profile.height_cm} cm` : '',
        weight: p.player_profile?.weight_kg ? `${p.player_profile.weight_kg} kg` : '',
        dominantFoot: p.player_profile?.dominant_foot || '',
        jersey: p.player_profile?.jersey_number ? `#${p.player_profile.jersey_number}` : '',
        cover_url: p.cover_url || '',
      })

      // Fetch sub-data in parallel
      const [postsRes, videosRes, careerRes, statsRes, endorseRes, suggestRes] = await Promise.allSettled([
        apiFetch(`/api/profiles/${p.id}/posts?limit=5`),
        apiFetch(`/api/profiles/${p.id}/videos?limit=12`),
        apiFetch(`/api/profiles/${p.id}/career`),
        apiFetch(`/api/profiles/${p.id}/stats`),
        apiFetch(`/api/profiles/${p.id}/endorsements`),
        apiFetch('/api/feed/suggestions?limit=5'),
      ])

      if (postsRes.status === 'fulfilled') setPosts(postsRes.value?.data?.data || postsRes.value?.data || [])
      if (videosRes.status === 'fulfilled') setHighlights(videosRes.value?.data?.data || videosRes.value?.data || [])
      if (careerRes.status === 'fulfilled') setCareer(careerRes.value?.data || [])
      if (statsRes.status === 'fulfilled') setStats(statsRes.value?.data || [])
      if (endorseRes.status === 'fulfilled') setEndorsements(endorseRes.value?.data || [])
      if (suggestRes.status === 'fulfilled') setSuggestions(suggestRes.value?.data || [])
    } catch (e) {
      console.error('Profile fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [profileIdentifier, apiFetch])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // ── Follow / Unfollow ───────────────────────────────────────────────────
  const handleFollowToggle = async (targetId, targetName) => {
    if (!targetId) return
    try {
      if (isFollowing) {
        await apiFetch(`/api/follows/${targetId}`, { method: 'DELETE' })
        setIsFollowing(false)
        showToast(`Unfollowed ${targetName}`)
      } else {
        await apiFetch(`/api/follows/${targetId}`, { method: 'POST' })
        setIsFollowing(true)
        showToast(`Now following ${targetName}`)
      }
    } catch (e) {
      showToast(e.message)
    }
  }

  return (
    <div className="prf-shell">
      {/* ── Top Navbar ────────────────────────────────────────────────────── */}
      <header className="msg-navbar">
        <a href="/feed" className="msg-navbar__logo">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#1A7A2E"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">F</text>
          </svg>
          <span>footfrica</span>
        </a>

        <div className="msg-navbar__search">
          <span className="msg-navbar__search-icon"><SearchIcon /></span>
          <input type="text" placeholder="Search players, clubs, topics…" />
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

        <div className="msg-navbar__avatar" title={user?.display_name || 'Profile'} onClick={() => setActiveTab('Overview')}>
          {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'T'}
        </div>
      </header>

      {/* ── Hero Cover & Back Button ──────────────────────────────────────── */}
      <div className="prf-hero">
        <img src={profileData.cover_url} alt="" className="prf-hero__cover" />
        <button className="prf-hero__back-btn" onClick={() => navigate('/feed')} aria-label="Back">
          <ChevronLeftIcon />
        </button>
      </div>

      {/* ── Profile Header Card ───────────────────────────────────────────── */}
      <div className="prf-header-card">
        <div className="prf-header-card__inner">
          <div className="prf-avatar-wrap">
            <div className="prf-avatar">TA</div>
          </div>

          <button className="prf-header-card__more-btn" onClick={() => showToast('Profile actions menu')}>
            <MoreIcon />
          </button>

          <div className="prf-header-main">
            <div className="prf-user-info">
              <div className="prf-user-name-row">
                <h1 className="prf-user-name">{profileData.display_name}</h1>
                <span className="prf-verified-pill"><VerifiedBadge /> Verified Player</span>
              </div>
              <div className="prf-meta-row">
                <span className="prf-handle">@{profileData.username}</span>
                <span className="msg-role-tag msg-role-tag--player">{profileData.role}</span>
                <span>·</span>
                <span>LW · {profileData.club}</span>
                <span>·</span>
                <span>📍 {profileData.location}</span>
              </div>
              <div className="prf-status-pill">
                ● {profileData.status}
              </div>
            </div>

            {/* Stats Row */}
            <div className="prf-stats-row">
              <div className="prf-stat-item">
                <span className="prf-stat-item__val">1.2k</span>
                <span className="prf-stat-item__lbl">Followers</span>
              </div>
              <div className="prf-stat-item">
                <span className="prf-stat-item__val">284</span>
                <span className="prf-stat-item__lbl">Following</span>
              </div>
              <div className="prf-stat-item">
                <span className="prf-stat-item__val">18</span>
                <span className="prf-stat-item__lbl">Appearances</span>
              </div>
              <div className="prf-stat-item">
                <span className="prf-stat-item__val">7</span>
                <span className="prf-stat-item__lbl">Goals</span>
              </div>
              <div className="prf-stat-item">
                <span className="prf-stat-item__val">5</span>
                <span className="prf-stat-item__lbl">Assists</span>
              </div>
              <div className="prf-stat-item">
                <span className="prf-stat-item__val">12</span>
                <span className="prf-stat-item__lbl">Endorsements</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation Bar ───────────────────────────────────────────── */}
      <div className="prf-tabs-bar">
        <div className="prf-tabs-bar__inner">
          {['Overview', 'Highlights', 'Posts', 'Stats', 'Career', 'Endorsements', 'About'].map((tab) => (
            <button
              key={tab}
              className={`prf-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main 2-Column Grid ────────────────────────────────────────────── */}
      <main className="prf-grid">
        
        {/* ── Left Column: Main Tab Content ────────────────────────────────── */}
        <div className="prf-main-col">
          
          {/* Profile Completion Banner */}
          <div className="prf-completion-banner">
            <div className="prf-completion-banner__info">
              <h3 className="prf-completion-banner__title">Complete your player profile</h3>
              <p className="prf-completion-banner__desc">
                Add your position, height, club history, and stats so scouts and coaches can discover your talent.
              </p>
              <div className="prf-progress-wrap">
                <div className="prf-progress-bar">
                  <div className="prf-progress-fill" style={{ width: '65%' }} />
                </div>
                <span className="prf-progress-text">65% complete</span>
              </div>
            </div>

            <button className="prf-completion-btn" onClick={() => setIsEditModalOpen(true)}>
              Add missing details
            </button>
          </div>

          {/* ── TAB 1: OVERVIEW ───────────────────────────────────────────── */}
          {activeTab === 'Overview' && (
            <>
              {/* About Card */}
              <div className="prf-card">
                <div className="prf-card__header">
                  <h3 className="prf-card__title">About</h3>
                  <button className="prf-card__link" onClick={() => setIsEditModalOpen(true)}>
                    <EditIcon /> Edit
                  </button>
                </div>

                <p className="prf-about-bio">{profileData.bio}</p>

                <div className="prf-about-grid">
                  <div className="prf-about-item">
                    <span className="prf-about-lbl">Primary Position</span>
                    <span className="prf-about-val">Left Winger (LW)</span>
                  </div>
                  <div className="prf-about-item">
                    <span className="prf-about-lbl">Secondary Position</span>
                    <span className="prf-about-val">Right Winger (RW)</span>
                  </div>
                  <div className="prf-about-item">
                    <span className="prf-about-lbl">Dominant Foot</span>
                    <span className="prf-about-val">Right</span>
                  </div>
                  <div className="prf-about-item">
                    <span className="prf-about-lbl">Jersey Number</span>
                    <span className="prf-about-val">#11</span>
                  </div>
                  <div className="prf-about-item">
                    <span className="prf-about-lbl">Playing Style</span>
                    <span className="prf-about-val">Pace · Direct winger · 1v1 dribbler</span>
                  </div>
                  <div className="prf-about-item">
                    <span className="prf-about-lbl">Availability</span>
                    <span className="prf-about-val" style={{ color: '#16A34A' }}>● Open to trials</span>
                  </div>
                </div>
              </div>

              {/* Split Row: Career & Recent Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Career Left Card */}
                <div className="prf-card">
                  <div className="prf-card__header">
                    <h3 className="prf-card__title">Career</h3>
                    <span className="prf-card__link" onClick={() => setActiveTab('Career')}>
                      View all ›
                    </span>
                  </div>

                  <div className="prf-timeline">
                    <div className="prf-timeline-item">
                      <div className="prf-timeline-avatar" style={{ background: '#166534' }}>MFA</div>
                      <div className="prf-timeline-info">
                        <div className="prf-timeline-title-row">
                          <span className="prf-timeline-club">Mainland Football Academy</span>
                          <span className="prf-timeline-tag msg-role-tag--academy">Current</span>
                        </div>
                        <span className="prf-timeline-sub">Winger · 2024 — Present</span>
                      </div>
                    </div>

                    <div className="prf-timeline-item">
                      <div className="prf-timeline-avatar" style={{ background: '#1D4ED8' }}>FS</div>
                      <div className="prf-timeline-info">
                        <span className="prf-timeline-club">Future Stars FC</span>
                        <span className="prf-timeline-sub">Winger · 2022 — 2024</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="notif-btn-ghost"
                    style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
                    onClick={() => setIsAddCareerOpen(true)}
                  >
                    + Add club history
                  </button>
                </div>

                {/* Recent Activity Right Card */}
                <div className="prf-card">
                  <div className="prf-card__header">
                    <h3 className="prf-card__title">Recent Activity</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ fontSize: 13, borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                        <span className="notif-tag">Post</span> 2h ago
                      </div>
                      <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>
                        Big win today for the Academy side. Three goals and a clean sheet. 🔥
                      </p>
                    </div>

                    <div style={{ fontSize: 13, borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                        <span className="notif-tag">Highlight</span> 1d ago
                      </div>
                      <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>
                        New training clip uploaded — working on my weak foot finishing this week.
                      </p>
                    </div>

                    <div style={{ fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                        <span className="notif-tag">Match Debate</span> 3d ago
                      </div>
                      <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>
                        Is Osimhen the best African striker right now? Drop your thoughts below.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 2: HIGHLIGHTS ─────────────────────────────────────────── */}
          {activeTab === 'Highlights' && (
            <div className="prf-highlights-grid">
              {PROFILE_HIGHLIGHTS.map((hl) => (
                <div key={hl.id} className="prf-hl-card" onClick={() => navigate('/highlights')}>
                  <img src={hl.thumbnail} alt="" className="prf-hl-img" />
                  <span className="prf-hl-duration">{hl.duration}</span>

                  <div className="prf-hl-bottom">
                    <div className="prf-hl-author-row">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" alt="" className="prf-hl-avatar" />
                      <span className="prf-hl-author-name">{hl.author}</span>
                    </div>
                    <span className="prf-hl-tag">{hl.category}</span>
                    <div className="prf-hl-stats">
                      <span>👁 {hl.views}</span>
                      <span>♡ {hl.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB 3: POSTS ─────────────────────────────────────────────── */}
          {activeTab === 'Posts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="prf-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="prf-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>TA</div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Tunde Adebayo</span>
                    <span className="msg-role-tag msg-role-tag--player" style={{ marginLeft: 6 }}>Player</span>
                    <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>· 3h</span>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: '#111827', margin: '0 0 12px 0' }}>
                  Quick highlights from today's match. Feeling grateful for the opportunity to showcase my skills!
                </p>
                <div style={{ color: '#1A7A2E', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
                  #LW #Lagos #Goal
                </div>
                <div style={{ height: 260, borderRadius: 12, overflow: 'hidden', background: '#111827', position: 'relative' }}>
                  <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: STATS ─────────────────────────────────────────────── */}
          {activeTab === 'Stats' && (
            <>
              <div className="prf-stats-summary-grid">
                <div className="prf-stat-card">
                  <div className="prf-stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>⚽</div>
                  <div>
                    <div className="prf-stat-val">20</div>
                    <div className="prf-stat-lbl">Goals (Across all seasons)</div>
                  </div>
                </div>

                <div className="prf-stat-card">
                  <div className="prf-stat-icon" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>⚡</div>
                  <div>
                    <div className="prf-stat-val">14</div>
                    <div className="prf-stat-lbl">Assists (Across all seasons)</div>
                  </div>
                </div>

                <div className="prf-stat-card">
                  <div className="prf-stat-icon" style={{ background: '#F3E8FF', color: '#7E22CE' }}>📈</div>
                  <div>
                    <div className="prf-stat-val">55</div>
                    <div className="prf-stat-lbl">Appearances (Across all seasons)</div>
                  </div>
                </div>
              </div>

              {/* Season Stats Table */}
              <div className="prf-card">
                <h3 className="prf-card__title" style={{ marginBottom: 16 }}>Season Stats</h3>
                <table className="prf-table">
                  <thead>
                    <tr>
                      <th>SEASON</th>
                      <th>CLUB</th>
                      <th>APPS</th>
                      <th>GOALS</th>
                      <th>ASSISTS</th>
                      <th>CARDS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2024/25</td>
                      <td>Mainland FA</td>
                      <td>18</td>
                      <td style={{ color: '#166534' }}>7</td>
                      <td style={{ color: '#1D4ED8' }}>5</td>
                      <td style={{ color: '#D97706' }}>1</td>
                    </tr>
                    <tr>
                      <td>2023/24</td>
                      <td>Future Stars FC</td>
                      <td>22</td>
                      <td style={{ color: '#166534' }}>9</td>
                      <td style={{ color: '#1D4ED8' }}>6</td>
                      <td style={{ color: '#D97706' }}>2</td>
                    </tr>
                    <tr>
                      <td>2022/23</td>
                      <td>Future Stars FC</td>
                      <td>15</td>
                      <td style={{ color: '#166534' }}>4</td>
                      <td style={{ color: '#1D4ED8' }}>3</td>
                      <td>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── TAB 5: CAREER ────────────────────────────────────────────── */}
          {activeTab === 'Career' && (
            <div className="prf-card">
              <div className="prf-card__header">
                <h3 className="prf-card__title">Career History</h3>
                <button className="notif-btn-outline" onClick={() => setIsAddCareerOpen(true)}>
                  + Add entry
                </button>
              </div>

              <div className="prf-timeline" style={{ gap: 24 }}>
                <div className="prf-timeline-item">
                  <div className="prf-timeline-avatar" style={{ background: '#166534' }}>MFA</div>
                  <div className="prf-timeline-info">
                    <div className="prf-timeline-title-row">
                      <span className="prf-timeline-club">Mainland Football Academy</span>
                      <span className="prf-timeline-tag msg-role-tag--academy">Current</span>
                    </div>
                    <span className="prf-timeline-sub">Winger · 2024 — Present</span>
                  </div>
                </div>

                <div className="prf-timeline-item">
                  <div className="prf-timeline-avatar" style={{ background: '#1D4ED8' }}>FS</div>
                  <div className="prf-timeline-info">
                    <span className="prf-timeline-club">Future Stars FC</span>
                    <span className="prf-timeline-sub">Winger · 2022 — 2024</span>
                  </div>
                </div>

                <div className="prf-timeline-item">
                  <div className="prf-timeline-avatar" style={{ background: '#B45309' }}>LY</div>
                  <div className="prf-timeline-info">
                    <div className="prf-timeline-title-row">
                      <span className="prf-timeline-club">Lagos Youth Tournament — Finalist</span>
                      <span className="prf-timeline-tag msg-role-tag--scout">Tournament</span>
                    </div>
                    <span className="prf-timeline-sub">Winger · 2021</span>
                  </div>
                </div>

                <div className="prf-timeline-item">
                  <div className="prf-timeline-avatar" style={{ background: '#7E22CE' }}>EA</div>
                  <div className="prf-timeline-info">
                    <div className="prf-timeline-title-row">
                      <span className="prf-timeline-club">Eko Academy Youth Program</span>
                      <span className="prf-timeline-tag msg-role-tag--fan">Academy</span>
                    </div>
                    <span className="prf-timeline-sub">Academy Player · 2019 — 2021</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 6: ENDORSEMENTS ──────────────────────────────────────── */}
          {activeTab === 'Endorsements' && (
            <>
              <div className="prf-card">
                <div className="prf-card__header">
                  <h3 className="prf-card__title">Top Skills</h3>
                  <button className="notif-btn-outline" onClick={() => showToast('Request sent to coaches!')}>
                    + Request endorsement
                  </button>
                </div>

                <div className="prf-skill-row">
                  <div className="prf-skill-header">
                    <span>Pace & Acceleration</span>
                    <span>24 endorsements</span>
                  </div>
                  <div className="prf-skill-bar">
                    <div className="prf-skill-fill" style={{ width: '90%' }} />
                  </div>
                </div>

                <div className="prf-skill-row">
                  <div className="prf-skill-header">
                    <span>Ball Control & First Touch</span>
                    <span>18 endorsements</span>
                  </div>
                  <div className="prf-skill-bar">
                    <div className="prf-skill-fill" style={{ width: '75%' }} />
                  </div>
                </div>

                <div className="prf-skill-row">
                  <div className="prf-skill-header">
                    <span>Shooting & Finishing</span>
                    <span>14 endorsements</span>
                  </div>
                  <div className="prf-skill-bar">
                    <div className="prf-skill-fill" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>

              <div className="prf-card">
                <h3 className="prf-card__title" style={{ marginBottom: 16 }}>Endorsers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#FAFAFA', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                      Coach Musa Bello <span className="msg-role-tag msg-role-tag--coach">Coach</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151', italic: true }}>
                      "Strong movement off the ball and excellent pace in transition. One of the best young wingers I've worked with."
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 7: ABOUT ─────────────────────────────────────────────── */}
          {activeTab === 'About' && (
            <div className="prf-card">
              <h3 className="prf-card__title" style={{ marginBottom: 16 }}>Profile Information</h3>
              <div className="prf-about-grid">
                <div className="prf-about-item">
                  <span className="prf-about-lbl">Full Name</span>
                  <span className="prf-about-val">Tunde Adebayo</span>
                </div>
                <div className="prf-about-item">
                  <span className="prf-about-lbl">Handle</span>
                  <span className="prf-about-val">@tunde4real</span>
                </div>
                <div className="prf-about-item">
                  <span className="prf-about-lbl">Nationality</span>
                  <span className="prf-about-val">Nigerian</span>
                </div>
                <div className="prf-about-item">
                  <span className="prf-about-lbl">Location</span>
                  <span className="prf-about-val">Lagos, Nigeria</span>
                </div>
                <div className="prf-about-item">
                  <span className="prf-about-lbl">Date of Birth</span>
                  <span className="prf-about-val">15 March 2007 (Age 19)</span>
                </div>
                <div className="prf-about-item">
                  <span className="prf-about-lbl">Contact Preference</span>
                  <span className="prf-about-val">Via Footfrica Messages</span>
                </div>
              </div>

              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 12 }}>
                <button className="notif-action-btn-ghost" onClick={() => showToast('Profile reported')}>
                  🚩 Report profile
                </button>
                <button className="notif-action-btn-danger" onClick={() => showToast('User blocked')}>
                  🚫 Block user
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── Right Sidebar Widgets ───────────────────────────────────────── */}
        <aside className="prf-sidebar">
          
          {/* Widget 1: Player Snapshot */}
          <div className="prf-widget">
            <h3 className="prf-widget__title">Player Snapshot</h3>
            <div className="prf-snapshot-list">
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Position</span>
                <span className="prf-snapshot-val">{profileData.position}</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Secondary</span>
                <span className="prf-snapshot-val">{profileData.secondaryPosition}</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Age</span>
                <span className="prf-snapshot-val">19</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Height</span>
                <span className="prf-snapshot-val">{profileData.height}</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Weight</span>
                <span className="prf-snapshot-val">{profileData.weight}</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Dominant Foot</span>
                <span className="prf-snapshot-val">{profileData.dominantFoot}</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Club</span>
                <span className="prf-snapshot-val">{profileData.club}</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Location</span>
                <span className="prf-snapshot-val">{profileData.location}</span>
              </div>
            </div>

            <div className="prf-skill-tags-row">
              <span className="prf-skill-pill">Pace</span>
              <span className="prf-skill-pill">Direct winger</span>
              <span className="prf-skill-pill">1v1 dribbler</span>
            </div>
          </div>

          {/* Widget 2: Suggested Players */}
          <div className="prf-widget">
            <h3 className="prf-widget__title">Suggested profiles</h3>
            {suggestions.map(person => <div className="prf-sug-item" key={person.id}><a href={`/profile/${person.username}`}>{person.display_name}</a><span>{person.user_type}</span></div>)}
          </div>

          {/* Widget 3: Availability */}
          <div className="prf-widget">
            <h3 className="prf-widget__title">Availability</h3>
            <div className="prf-snapshot-list">
              <div className="prf-status-pill" style={{ margin: '0 0 10px 0' }}>
                ● Open to trials
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Preferred location</span>
                <span className="prf-snapshot-val">Lagos / South West</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Willing to relocate</span>
                <span className="prf-snapshot-val">Yes</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Available from</span>
                <span className="prf-snapshot-val">Immediately</span>
              </div>
              <div className="prf-snapshot-item">
                <span className="prf-snapshot-lbl">Contact via</span>
                <span className="prf-snapshot-val">Messages</span>
              </div>
            </div>
          </div>

        </aside>
      </main>

      {/* ── Edit Profile Modal ────────────────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="prf-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="prf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prf-modal__header">
              <h3 className="prf-modal__title">Edit Player Profile</h3>
              <button className="prf-modal__close" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>

            <div className="prf-form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profileData.display_name}
                onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
              />
            </div>

            <div className="prf-form-group">
              <label>Primary Position</label>
              <input
                type="text"
                value={profileData.position}
                onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
              />
            </div>

            <div className="prf-form-group">
              <label>Club Name</label>
              <input
                type="text"
                value={profileData.club}
                onChange={(e) => setProfileData({ ...profileData, club: e.target.value })}
              />
            </div>

            <div className="prf-form-group">
              <label>Bio / Playing Description</label>
              <textarea
                rows={3}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              />
            </div>

             <button
              className="prf-modal__submit"
              onClick={async () => {
                try {
                  await apiFetch('/api/profiles/me', {
                    method: 'PUT',
                    body: JSON.stringify({
                      display_name: profileData.display_name,
                      bio: profileData.bio,
                    }),
                  })
                  setIsEditModalOpen(false)
                  showToast('Profile updated successfully!')
                  fetchProfile()
                } catch (e) {
                  showToast(e.message || 'Failed to save')
                }
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

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
