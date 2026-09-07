import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/search.css'

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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const VerifiedBadge = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="none">
    <circle cx="12" cy="12" r="10" fill="#166534"/>
    <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

export default function SearchPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('All')
  const [activeViewMode, setActiveViewMode] = useState('list')

  // API-driven search results
  const [searchResults, setSearchResults] = useState([])
  const [totalResults, setTotalResults] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)

  // Filter States
  const [activeFilters, setActiveFilters] = useState([])
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedFoot, setSelectedFoot] = useState('')
  const [selectedAvailability, setSelectedAvailability] = useState('')
  const [toastMessage, setToastMessage] = useState(null)
  const debounceRef = useRef(null)

  // ── Debounced search API call ──────────────────────────────────────────
  const performSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSearchResults([])
      setTotalResults(0)
      return
    }
    setSearchLoading(true)
    try {
      const tabParam = activeTab !== 'All' ? `&type=${activeTab.toLowerCase()}` : ''
      const posParam = selectedPosition ? `&position=${selectedPosition}` : ''
      const res = await apiFetch(`/api/search/players?q=${encodeURIComponent(q)}${tabParam}${posParam}&limit=20`)
      const items = res.data?.data || res.data || []
      setSearchResults(items)
      setTotalResults(res.data?.total || items.length)
    } catch (e) {
      console.error('Search failed:', e)
    } finally {
      setSearchLoading(false)
    }
  }, [apiFetch, activeTab, selectedPosition])

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, performSearch])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const removeFilter = (filterName) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filterName))
  }

  const clearAllFilters = () => {
    setActiveFilters([])
    setSelectedPosition('')
    setSelectedFoot('')
    showToast('All filters cleared')
  }

  return (
    <div className="srch-shell">
      {/* ── Top Navbar ────────────────────────────────────────────────────── */}
      <header className="msg-navbar">
        <a href="/feed" className="msg-navbar__logo">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#166534"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">F</text>
          </svg>
          <span>footfrica</span>
        </a>

        <div className="msg-navbar__search" style={{ background: '#ffffff', border: '1px solid #D1D5DB' }}>
          <span className="msg-navbar__search-icon"><SearchIcon /></span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players, clubs, topics…"
          />
          {query && (
            <button
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 16 }}
              onClick={() => setQuery('')}
            >
              ×
            </button>
          )}
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

        <div className="msg-navbar__avatar" title={user?.display_name || 'Profile'} onClick={() => navigate('/profile')}>
          {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'T'}
        </div>
      </header>

      {/* ── Page Header Section ───────────────────────────────────────────── */}
      <div className="srch-header">
        <div className="srch-header__inner">
          <div className="srch-title-row">
            <button className="srch-back-btn" onClick={() => navigate(-1)} aria-label="Back">
              <ChevronLeftIcon />
            </button>
            <h1 className="srch-title">Search</h1>
          </div>
          <p className="srch-subtitle">
            Find players, clubs, highlights, posts, and football conversations across Africa.
          </p>

          <div className="srch-quick-tags">
            {['LW in Lagos', 'Verified players', 'U20 strikers', 'Goalkeeper saves', 'Tactical analysis'].map((tag) => (
              <button
                key={tag}
                className="srch-quick-tag"
                onClick={() => {
                  setQuery(tag)
                  showToast(`Searching for "${tag}"`)
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Filter Tabs Bar ─────────────────────────────────────── */}
      <div className="srch-tabs-bar">
        <div className="srch-tabs-bar__inner">
          {['All', 'Players', 'Clubs', 'Highlights', 'Posts', 'Coaches', 'Scouts', 'Fans', 'Topics'].map((cat) => (
            <button
              key={cat}
              className={`srch-cat-tab ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main 3-Column Grid Layout ────────────────────────────────────── */}
      <main className="srch-grid">
        
        {/* ── Left Column: Filters Sidebar ────────────────────────────────── */}
        <aside className="srch-filters-col">
          <div className="srch-filter-card">
            <div className="srch-filter-card__header">
              <h3 className="srch-filter-card__title">⚙ Filters</h3>
              <button className="srch-filter-clear" onClick={clearAllFilters}>Clear all</button>
            </div>

            {/* LOCATION */}
            <div className="srch-filter-group">
              <span className="srch-filter-label">Location</span>
              <input type="text" className="srch-input-sm" placeholder="Country / State" defaultValue="Nigeria" />
              <input type="text" className="srch-input-sm" placeholder="City" defaultValue="Lagos" />
            </div>

            {/* VERIFICATION */}
            <div className="srch-filter-group">
              <span className="srch-filter-label">Verification</span>
              <label className="srch-checkbox-row">
                <input type="checkbox" defaultChecked /> Verified only
              </label>
              <label className="srch-checkbox-row">
                <input type="checkbox" /> Verified players
              </label>
              <label className="srch-checkbox-row">
                <input type="checkbox" /> Verified clubs
              </label>
              <label className="srch-checkbox-row">
                <input type="checkbox" /> Verified scouts/coaches
              </label>
            </div>

            {/* ACTIVITY */}
            <div className="srch-filter-group">
              <span className="srch-filter-label">Activity</span>
              <label className="srch-checkbox-row">
                <input type="checkbox" /> Active in last 7 days
              </label>
              <label className="srch-checkbox-row">
                <input type="checkbox" /> Active in last 30 days
              </label>
              <label className="srch-checkbox-row">
                <input type="checkbox" /> Has recent posts
              </label>
              <label className="srch-checkbox-row">
                <input type="checkbox" defaultChecked /> Has uploaded highlights
              </label>
            </div>

            {/* POSITION */}
            <div className="srch-filter-group">
              <span className="srch-filter-label">Position</span>
              <div className="srch-pills-wrap">
                {['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'].map((pos) => (
                  <button
                    key={pos}
                    className={`srch-pill-opt ${selectedPosition === pos ? 'active' : ''}`}
                    onClick={() => setSelectedPosition(pos)}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* AGE RANGE */}
            <div className="srch-filter-group">
              <span className="srch-filter-label">Age Range</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                <span>16</span>
                <input type="range" min="15" max="35" defaultValue="25" style={{ flex: 1, margin: '0 8px', accentColor: '#166534' }} />
                <span>25</span>
              </div>
            </div>

            {/* DOMINANT FOOT */}
            <div className="srch-filter-group">
              <span className="srch-filter-label">Dominant Foot</span>
              <div className="srch-pills-wrap">
                {['Left', 'Right', 'Both'].map((foot) => (
                  <button
                    key={foot}
                    className={`srch-pill-opt ${selectedFoot === foot ? 'active' : ''}`}
                    onClick={() => setSelectedFoot(foot)}
                  >
                    {foot}
                  </button>
                ))}
              </div>
            </div>

            {/* AVAILABILITY */}
            <div className="srch-filter-group">
              <span className="srch-filter-label">Availability</span>
              <div className="srch-avail-list">
                {['Open to trials ⭐', 'Under contract', 'Unattached', 'Not looking'].map((st) => (
                  <button
                    key={st}
                    className={`srch-avail-item ${selectedAvailability === st ? 'active' : ''}`}
                    onClick={() => setSelectedAvailability(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* PLAYER CONTENT */}
            <div className="srch-filter-group">
              <span className="srch-filter-label">Player Content</span>
              <label className="srch-checkbox-row"><input type="checkbox" defaultChecked /> Has highlights</label>
              <label className="srch-checkbox-row"><input type="checkbox" /> Has pinned reel</label>
              <label className="srch-checkbox-row"><input type="checkbox" /> Has stats</label>
              <label className="srch-checkbox-row"><input type="checkbox" /> Has endorsements</label>
            </div>

            <button className="srch-btn-apply" onClick={() => showToast('Filters applied!')}>
              Apply filters
            </button>
            <button className="srch-btn-advanced" onClick={() => showToast('Advanced options opened')}>
              ⚙ Advanced Search
            </button>
          </div>
        </aside>

        {/* ── Center Column: Search Results Feed ──────────────────────────── */}
        <div className="srch-main-col">
          
          {/* Active Filter Bar & Results Count */}
          <div className="srch-results-meta">
            <div className="srch-results-count">
              {totalResults > 0 ? totalResults : searchResults.length || '0'} results{query ? ` for "${query}"` : ''}
            </div>

            <div className="srch-active-filters-row">
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Filters:</span>
              {activeFilters.map((f) => (
                <span key={f} className="srch-filter-badge">
                  {f}
                  <span className="srch-filter-badge__close" onClick={() => removeFilter(f)}>×</span>
                </span>
              ))}
              {activeFilters.length > 0 && (
                <button className="srch-filter-clear" onClick={clearAllFilters} style={{ marginLeft: 4 }}>
                  Clear all
                </button>
              )}
            </div>

            <div className="srch-view-mode-btns">
              <button
                className={`srch-view-btn ${activeViewMode === 'list' ? 'active' : ''}`}
                onClick={() => setActiveViewMode('list')}
                title="List View"
              >
                ☰
              </button>
              <button
                className={`srch-view-btn ${activeViewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setActiveViewMode('grid')}
                title="Grid View"
              >
                ⊞
              </button>
            </div>
          </div>

          {/* Result Card 1: Player (Tunde Adebayo) */}
          <div className="srch-player-card">
            <div className="srch-player-info">
              <div className="srch-player-avatar">TA</div>
              <div className="srch-player-details">
                <div className="srch-player-name-row">
                  <h3 className="srch-player-name">Tunde Adebayo</h3>
                  <VerifiedBadge />
                  <span className="msg-role-tag msg-role-tag--player">Player</span>
                </div>
                <div className="srch-player-sub-meta">
                  <span style={{ fontWeight: 600, color: '#111827' }}>@tunde4real</span>
                  <span>·</span>
                  <span style={{ fontWeight: 700, color: '#166534' }}>LW / RW</span>
                  <span>·</span>
                  <span>19y</span>
                  <span>·</span>
                  <span>178cm</span>
                  <span>·</span>
                  <span>Right foot</span>
                </div>
                <div className="srch-player-sub-meta">
                  <span>Mainland Football Academy</span>
                  <span>·</span>
                  <span>📍 Lagos, Nigeria</span>
                </div>
                <div className="srch-player-status-row">
                  <span style={{ color: '#166534', fontWeight: 700 }}>● Open to trials</span>
                  <span style={{ color: '#D97706', fontWeight: 600 }}>⭐ 12 endorsements</span>
                </div>

                <div className="srch-player-actions">
                  <button className="srch-btn-primary" onClick={() => navigate('/profile')}>
                    View profile
                  </button>
                  <button className="srch-btn-outline" onClick={() => navigate('/messages')}>
                    💬 Message
                  </button>
                  <button className="srch-btn-outline" onClick={() => navigate('/highlights')}>
                    ▶ Watch
                  </button>
                  <button className="srch-btn-shortlist" onClick={() => showToast('Added to Shortlist ⭐')}>
                    ⭐ Shortlist
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side Video Preview Box */}
            <div className="srch-video-preview" onClick={() => navigate('/highlights')}>
              <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80" alt="" />
              <div className="srch-video-play-btn"><PlayIcon /></div>
              <span className="srch-video-duration">0:42</span>
            </div>
            <div className="srch-player-stats-mini">
              <span style={{ fontWeight: 800, color: '#111827', fontSize: 13 }}>18 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>apps</span></span>
              <span style={{ fontWeight: 800, color: '#166534', fontSize: 12 }}>7 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>goals</span></span>
              <span style={{ fontWeight: 800, color: '#1D4ED8', fontSize: 12 }}>5 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>assists</span></span>
            </div>
          </div>

          {/* Result Card 2: Player (Chioma Nwosu) */}
          <div className="srch-player-card">
            <div className="srch-player-info">
              <div className="srch-player-avatar" style={{ background: '#7E22CE' }}>CN</div>
              <div className="srch-player-details">
                <div className="srch-player-name-row">
                  <h3 className="srch-player-name">Chiamaka Nwosu</h3>
                  <span className="msg-role-tag msg-role-tag--player">Player</span>
                </div>
                <div className="srch-player-sub-meta">
                  <span style={{ fontWeight: 600, color: '#111827' }}>@chiamaka11</span>
                  <span>·</span>
                  <span style={{ fontWeight: 700, color: '#166534' }}>Forward / LW</span>
                  <span>·</span>
                  <span>18y</span>
                  <span>·</span>
                  <span>165cm</span>
                  <span>·</span>
                  <span>Left foot</span>
                </div>
                <div className="srch-player-sub-meta">
                  <span>Future Stars FC</span>
                  <span>·</span>
                  <span>📍 Lagos, Nigeria</span>
                </div>
                <div className="srch-player-status-row">
                  <span style={{ color: '#166534', fontWeight: 700 }}>● Open to trials</span>
                  <span style={{ color: '#D97706', fontWeight: 600 }}>⭐ 4 endorsements</span>
                </div>

                <div className="srch-player-actions">
                  <button className="srch-btn-primary" onClick={() => navigate('/profile')}>View profile</button>
                  <button className="srch-btn-outline" onClick={() => navigate('/messages')}>💬 Message</button>
                  <button className="srch-btn-outline" onClick={() => navigate('/highlights')}>▶ Watch</button>
                  <button className="srch-btn-shortlist" onClick={() => showToast('Added to Shortlist ⭐')}>⭐ Shortlist</button>
                </div>
              </div>
            </div>

            <div className="srch-video-preview" onClick={() => navigate('/highlights')}>
              <img src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=400&q=80" alt="" />
              <div className="srch-video-play-btn"><PlayIcon /></div>
              <span className="srch-video-duration">1:10</span>
            </div>
            <div className="srch-player-stats-mini">
              <span style={{ fontWeight: 800, color: '#111827', fontSize: 13 }}>14 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>apps</span></span>
              <span style={{ fontWeight: 800, color: '#166534', fontSize: 12 }}>5 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>goals</span></span>
              <span style={{ fontWeight: 800, color: '#1D4ED8', fontSize: 12 }}>3 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>assists</span></span>
            </div>
          </div>

          {/* Result Card 3: Player (Emeka Eze) */}
          <div className="srch-player-card">
            <div className="srch-player-info">
              <div className="srch-player-avatar" style={{ background: '#B45309' }}>EE</div>
              <div className="srch-player-details">
                <div className="srch-player-name-row">
                  <h3 className="srch-player-name">Emeka Eze</h3>
                  <span className="msg-role-tag msg-role-tag--player">Player</span>
                </div>
                <div className="srch-player-sub-meta">
                  <span style={{ fontWeight: 600, color: '#111827' }}>@emekaeze7</span>
                  <span>·</span>
                  <span style={{ fontWeight: 700, color: '#166534' }}>LW</span>
                  <span>·</span>
                  <span>20y</span>
                  <span>·</span>
                  <span>175cm</span>
                  <span>·</span>
                  <span>Right foot</span>
                </div>
                <div className="srch-player-sub-meta">
                  <span>Eko Academy</span>
                  <span>·</span>
                  <span>📍 Lagos, Nigeria</span>
                </div>
                <div className="srch-player-status-row">
                  <span style={{ color: '#D97706', fontWeight: 700 }}>● Unattached</span>
                  <span style={{ color: '#D97706', fontWeight: 600 }}>⭐ 8 endorsements</span>
                </div>

                <div className="srch-player-actions">
                  <button className="srch-btn-primary" onClick={() => navigate('/profile')}>View profile</button>
                  <button className="srch-btn-outline" onClick={() => navigate('/messages')}>💬 Message</button>
                  <button className="srch-btn-outline" onClick={() => navigate('/highlights')}>▶ Watch</button>
                  <button className="srch-btn-shortlist" onClick={() => showToast('Added to Shortlist ⭐')}>⭐ Shortlist</button>
                </div>
              </div>
            </div>

            <div className="srch-video-preview" onClick={() => navigate('/highlights')}>
              <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80" alt="" />
              <div className="srch-video-play-btn"><PlayIcon /></div>
              <span className="srch-video-duration">0:55</span>
            </div>
            <div className="srch-player-stats-mini">
              <span style={{ fontWeight: 800, color: '#111827', fontSize: 13 }}>22 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>apps</span></span>
              <span style={{ fontWeight: 800, color: '#166534', fontSize: 12 }}>9 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>goals</span></span>
              <span style={{ fontWeight: 800, color: '#1D4ED8', fontSize: 12 }}>7 <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>assists</span></span>
            </div>
          </div>

          {/* Result Card 4: Club (Mainland Football Academy) */}
          <div className="srch-player-card">
            <div className="srch-player-info">
              <div className="srch-player-avatar" style={{ background: '#166534' }}>MFA</div>
              <div className="srch-player-details">
                <div className="srch-player-name-row">
                  <h3 className="srch-player-name">Mainland Football Academy</h3>
                  <VerifiedBadge />
                  <span className="msg-role-tag msg-role-tag--academy">Academy</span>
                </div>
                <div className="srch-player-sub-meta">
                  <span>📍 Lagos, Nigeria</span>
                  <span>·</span>
                  <span>Academy Level</span>
                </div>
                <div className="srch-player-status-row">
                  <span><strong>42</strong> players</span>
                  <span>·</span>
                  <span><strong>1.2k</strong> followers</span>
                  <span>·</span>
                  <span><strong>12</strong> highlights</span>
                </div>

                <div className="srch-player-actions">
                  <button className="srch-btn-primary" onClick={() => showToast('Opening Club Page')}>View club page</button>
                  <button className="srch-btn-outline" onClick={() => showToast('Following Mainland FA')}>Follow</button>
                  <button className="srch-btn-outline" onClick={() => showToast('Viewing Squad')}>See squad</button>
                </div>
              </div>
            </div>
          </div>

          {/* Result Card 5: Highlight Reel (Goal vs Rangers Academy) */}
          <div className="srch-hl-result-card">
            <div className="srch-hl-thumb" onClick={() => navigate('/highlights')}>
              <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80" alt="" />
              <div className="srch-video-play-btn"><PlayIcon /></div>
              <span className="srch-video-duration">0:42</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="prf-hl-tag" style={{ background: '#FEF08A', color: '#854D0E', fontSize: 10 }}>Goal</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Goal vs Rangers Academy</h4>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                Tunde Adebayo · LW · 📍 Lagos
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 12 }}>
                <span>👁 12.3k</span>
                <span>♡ 234</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="srch-btn-primary" onClick={() => navigate('/highlights')}>Watch</button>
              <button className="srch-btn-outline" onClick={() => navigate('/profile')}>View player</button>
            </div>
          </div>

          {/* Result Card 6: Scout (Coach Musa Bello) */}
          <div className="srch-player-card">
            <div className="srch-player-info">
              <div className="srch-player-avatar" style={{ background: '#1D4ED8' }}>MB</div>
              <div className="srch-player-details">
                <div className="srch-player-name-row">
                  <h3 className="srch-player-name">Coach Musa Bello</h3>
                  <VerifiedBadge />
                  <span className="msg-role-tag msg-role-tag--coach">Coach</span>
                </div>
                <div className="srch-player-sub-meta">
                  <span>Mainland Football Academy · 📍 Lagos, Nigeria</span>
                </div>
                <p style={{ margin: '4px 0', fontSize: 12, color: '#4B5563' }}>
                  UEFA B licensed. Specialises in attacking play and winger development.
                </p>
                <div className="srch-player-actions">
                  <button className="srch-btn-primary" onClick={() => navigate('/profile')}>View profile</button>
                  <button className="srch-btn-outline" onClick={() => showToast('Following Coach Musa')}>Follow</button>
                  <button className="srch-btn-outline" onClick={() => navigate('/messages')}>💬 Message</button>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'right' }}>
              <strong style={{ color: '#111827', fontSize: 16 }}>48</strong>
              <div style={{ fontSize: 10 }}>endorsed players</div>
            </div>
          </div>

        </div>

        {/* ── Right Column: Trending & Suggestions Sidebar ────────────────── */}
        <aside className="srch-sidebar">
          
          {/* Card 1: Trending Searches */}
          <div className="srch-widget">
            <h3 className="srch-widget__title">⚡ Trending Searches</h3>
            <div className="srch-trending-list">
              {[
                'U20 strikers in Lagos',
                'Verified goalkeepers',
                'Lagos League highlights',
                'African Talent',
                'Open trials this week',
              ].map((item, idx) => (
                <div
                  key={item}
                  className="srch-trending-item"
                  onClick={() => {
                    setQuery(item)
                    showToast(`Searching "${item}"`)
                  }}
                >
                  <span>{idx + 1}. {item}</span>
                  <span style={{ color: '#9CA3AF' }}>→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Popular Filters */}
          <div className="srch-widget">
            <h3 className="srch-widget__title">⭐ Popular Filters</h3>
            <div className="srch-pills-wrap">
              {['Verified players', 'Has highlights', 'Open to trials', 'Active this month', 'Scout picks'].map((pf) => (
                <button
                  key={pf}
                  className="srch-pill-opt"
                  onClick={() => showToast(`Applied filter "${pf}"`)}
                >
                  {pf}
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Recently Viewed */}
          <div className="srch-widget">
            <h3 className="srch-widget__title">🕒 Recently Viewed</h3>
            <div className="srch-trending-list">
              {['LW Lagos', 'Mainland Football Academy', 'Goalkeeper saves', 'U20 strikers'].map((rv) => (
                <div key={rv} className="srch-trending-item" onClick={() => setQuery(rv)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <SearchIcon /> {rv}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Search Smarter Tips Box */}
          <div className="srch-tips-box">
            <h4 className="srch-tips-title">💡 Search smarter</h4>
            <div className="srch-tips-list">
              <div>→ Try position + city, like "LW Lagos"</div>
              <div>→ Use filters to find verified players</div>
              <div>→ Search by club, academy, or style</div>
              <div>→ Filter by availability for open trials</div>
            </div>
          </div>

        </aside>
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
