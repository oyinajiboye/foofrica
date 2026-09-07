import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/notifications.css'

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
const StarIconOverlay = () => (
  <div style={{ background: '#F59E0B', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
    ★
  </div>
)
const EyeIconOverlay = () => (
  <div style={{ background: '#3B82F6', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
    👁
  </div>
)
const CommentIconOverlay = () => (
  <div style={{ background: '#2563EB', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
    💬
  </div>
)
const HeartIconOverlay = () => (
  <div style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
    ♥
  </div>
)
const MentionIconOverlay = () => (
  <div style={{ background: '#8B5CF6', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
    @
  </div>
)
const PlayIconOverlay = () => (
  <div style={{ background: '#16A34A', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
    ▶
  </div>
)
const UserPlusIconOverlay = () => (
  <div style={{ background: '#7C3AED', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
    👤
  </div>
)
const RepostIconOverlay = () => (
  <div style={{ background: '#059669', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
    🔄
  </div>
)

// ─── Initial Mock Notifications Data ─────────────────────────────────────────

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    section: 'TODAY',
    actor: { display_name: 'Mainland Football Academy', role: 'Academy', is_verified: true, initials: 'MFA', color: '#166534' },
    badgeOverlay: <StarIconOverlay />,
    text: 'Mainland Football Academy invited you to trials this Saturday.',
    detailBox: '⭐ Saturday 14 June · 10:00 AM · Teslim Balogun Stadium, Lagos',
    time: '12m ago',
    unread: true,
    unreadDotColor: 'gold',
    category: 'Opportunities',
    actions: [
      { label: 'View Invite', primary: true, route: '/messages' },
      { label: 'Reply', ghost: true, route: '/messages' },
    ],
  },
  {
    id: 'n2',
    section: 'TODAY',
    actor: { display_name: 'Lagos United Scout Team', role: 'Scout', is_verified: true, initials: 'LU', color: '#15803D' },
    badgeOverlay: <EyeIconOverlay />,
    text: 'Lagos United Scout Team viewed your player profile.',
    time: '34m ago',
    unread: true,
    unreadDotColor: 'green',
    category: 'System',
    actions: [
      { label: 'View Scout', secondary: true, route: '/feed' },
    ],
  },
  {
    id: 'n3',
    section: 'TODAY',
    actor: { display_name: 'Coach Musa Bello', role: 'Coach', is_verified: true, initials: 'MB', color: '#1D4ED8' },
    badgeOverlay: <CommentIconOverlay />,
    text: 'commented on your highlight.',
    quote: '"Great movement before the finish. Keep working on your off-ball runs."',
    tag: 'Highlight',
    time: '1h ago',
    unread: true,
    unreadDotColor: 'green',
    category: 'Highlights',
    actions: [
      { label: 'View Comment', secondary: true, route: '/highlights' },
    ],
  },
  {
    id: 'n4',
    section: 'TODAY',
    actor: { display_name: 'Chiamaka Nwosu', role: 'Player', is_verified: false, initials: 'CN', color: '#BE185D' },
    badgeOverlay: <HeartIconOverlay />,
    text: 'and 24 others liked your highlight.',
    tag: 'Goal',
    time: '2h ago',
    unread: true,
    unreadDotColor: 'green',
    category: 'Highlights',
    actions: [
      { label: 'View Highlight', secondary: true, route: '/highlights' },
    ],
  },
  {
    id: 'n5',
    section: 'TODAY',
    actor: { display_name: 'Ada Okonkwo', role: 'Fan', is_verified: false, initials: 'AO', color: '#7E22CE' },
    badgeOverlay: <MentionIconOverlay />,
    text: 'mentioned you in a match debate.',
    quote: '"@tundeadebayo is exactly the kind of winger AFCON needs right now."',
    tag: 'Match Debate',
    time: '3h ago',
    unread: false,
    category: 'Mentions',
    actions: [
      { label: 'View Post', secondary: true, route: '/feed' },
    ],
  },

  // YESTERDAY
  {
    id: 'n6',
    section: 'YESTERDAY',
    actor: { display_name: 'Footfrica System', role: 'System', is_verified: true, initials: '▶', color: '#16A34A' },
    badgeOverlay: <PlayIconOverlay />,
    text: "Your highlight 'Goal vs Rangers Academy' reached 3.2k views.",
    quote: '234 likes · 45 comments',
    tags: ['Goal', '👁 3.2k views', '♡ 234 likes', '💬 45 comments'],
    time: 'Yesterday',
    unread: false,
    category: 'Highlights',
    actions: [
      { label: 'View Highlight', secondary: true, route: '/highlights' },
    ],
  },
  {
    id: 'n7',
    section: 'YESTERDAY',
    actor: { display_name: 'Kwame Mensah', role: 'Player', is_verified: false, initials: 'KM', color: '#B45309' },
    badgeOverlay: <UserPlusIconOverlay />,
    text: 'Kwame Mensah started following you.',
    time: 'Yesterday',
    unread: false,
    category: 'Posts',
    actions: [
      { label: 'Follow Back', secondary: true, route: '/feed' },
    ],
  },
  {
    id: 'n8',
    section: 'YESTERDAY',
    actor: { display_name: 'FC Lagos United', role: 'Club', is_verified: true, initials: 'FC', color: '#059669' },
    badgeOverlay: <RepostIconOverlay />,
    text: 'reposted your club update.',
    tag: 'Club Update',
    time: 'Yesterday',
    unread: false,
    category: 'Posts',
    actions: [
      { label: 'View Post', secondary: true, route: '/feed' },
    ],
  },
  {
    id: 'n9',
    section: 'YESTERDAY',
    actor: { display_name: 'Verification Center', role: 'System', is_verified: true, initials: '✓', color: '#1A7A2E' },
    text: 'Your player profile verification was approved.',
    quote: 'Your verified badge is now visible on your profile.',
    time: 'Yesterday',
    unread: false,
    category: 'System',
    actions: [
      { label: 'View Profile', primary: true, route: '/feed' },
    ],
  },

  // THIS WEEK
  {
    id: 'n10',
    section: 'THIS WEEK',
    actor: { display_name: 'Coach Musa Bello', role: 'Coach', is_verified: true, initials: 'MB', color: '#1D4ED8' },
    text: 'endorsed you for Pace & Acceleration.',
    tag: 'Pace & Acceleration',
    time: '2 days ago',
    unread: false,
    category: 'Posts',
    actions: [
      { label: 'View Endorsement', secondary: true, route: '/feed' },
    ],
  },
  {
    id: 'n11',
    section: 'THIS WEEK',
    actor: { display_name: 'Nigerian Football Hub', role: 'Community', is_verified: false, initials: 'NF', color: '#7E22CE' },
    text: 'New activity in the Nigerian Football community thread.',
    quote: '48 new replies · 12 new posts',
    tag: 'AFCON 2026',
    time: '3 days ago',
    unread: false,
    category: 'System',
    actions: [
      { label: 'Join Discussion', secondary: true, route: '/feed' },
    ],
  },
  {
    id: 'n12',
    section: 'THIS WEEK',
    actor: { display_name: 'Mainland Football Academy', role: 'Academy', is_verified: true, initials: 'MFA', color: '#166534' },
    text: 'sent you a message.',
    quote: '"We\'d like to discuss a development opportunity with you..."',
    time: '3 days ago',
    unread: false,
    category: 'Messages',
    actions: [
      { label: 'Open Message', primary: true, route: '/messages' },
    ],
  },
  {
    id: 'n13',
    section: 'THIS WEEK',
    actor: { display_name: 'Lagos United Scout Team', role: 'Scout', is_verified: true, initials: 'LU', color: '#15803D' },
    text: 'Your profile was added to a scout shortlist.',
    time: '4 days ago',
    unread: false,
    category: 'System',
    actions: [
      { label: 'View Activity', primary: true, route: '/feed' },
    ],
  },
  {
    id: 'n14',
    section: 'THIS WEEK',
    actor: { display_name: 'Security Alert', role: 'System', is_verified: true, initials: '🔒', color: '#EF4444' },
    text: 'New login detected from Lagos, Nigeria.',
    quote: 'Chrome · Lagos, Nigeria · If this wasn\'t you, secure your account.',
    time: '5 days ago',
    unread: false,
    category: 'System',
    actions: [
      { label: 'Review Activity', danger: true, route: '/feed' },
    ],
  },
]

// ─── Time helpers ────────────────────────────────────────────────────────────

function getTimeSection(dateStr) {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = now - d
  const oneDay = 86400000
  if (diff < oneDay) return 'TODAY'
  if (diff < oneDay * 2) return 'YESTERDAY'
  return 'THIS WEEK'
}

function formatTimeAgo(dateStr) {
  const now = new Date()
  const d = new Date(dateStr)
  const secs = Math.floor((now - d) / 1000)
  if (secs < 60) return 'Just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 172800) return 'Yesterday'
  return `${Math.floor(secs / 86400)}d ago`
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()

  // State
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [filterCheckboxes, setFilterCheckboxes] = useState({
    'Social activity': true,
    'Highlights': true,
    'Scouting': true,
    'Opportunities': true,
    'Messages': true,
    'Verification': true,
    'Communities': true,
  })

  // ── Fetch notifications from API ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/api/notifications?limit=50')
      const items = res.data?.data || res.data || []
      // Map API data to component shape
      const mapped = items.map((n) => {
        const actor = n.actor || {}
        const initials = (actor.display_name || '??').split(' ').map(w => w[0]).join('').slice(0, 3)
        return {
          id: n.id,
          section: getTimeSection(n.created_at),
          actor: {
            display_name: actor.display_name || 'Unknown',
            role: actor.user_type || 'System',
            is_verified: actor.is_verified || false,
            initials,
            color: '#166534',
          },
          text: n.body || n.message || '',
          time: formatTimeAgo(n.created_at),
          unread: !n.is_read,
          category: n.type || 'System',
          actions: n.action_url ? [{ label: 'View', primary: true, route: n.action_url }] : [],
        }
      })
      setNotifications(mapped)
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Toast handler
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PUT' })
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
      showToast('All notifications marked as read')
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
      showToast('All notifications marked as read')
    }
  }

  // Calculate unread count
  const unreadCount = notifications.filter((n) => n.unread).length

  // Filtered notifications logic
  const filteredNotifications = notifications.filter((n) => {
    if (unreadOnly && !n.unread) return false
    if (activeTab === 'All') return true
    return n.category === activeTab
  })

  // Group notifications by section (TODAY, YESTERDAY, THIS WEEK)
  const groupedSections = ['TODAY', 'YESTERDAY', 'THIS WEEK'].map((sec) => ({
    section: sec,
    items: filteredNotifications.filter((n) => n.section === sec),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="notif-shell">
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
          {unreadCount > 0 && <span className="msg-navbar__notif-badge">{unreadCount}</span>}
        </button>

        <div className="msg-navbar__avatar" title={user?.display_name || 'Profile'}>
          {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'Y'}
        </div>
      </header>

      {/* ── Top Header Sub-bar ────────────────────────────────────────────── */}
      <div className="notif-top-bar">
        <div className="notif-top-bar__row1">
          <div className="notif-top-bar__left">
            <button className="notif-back-btn" onClick={() => navigate('/feed')} aria-label="Back">
              <ChevronLeftIcon />
            </button>
            <div>
              <h1 className="notif-title">Notifications</h1>
              <p className="notif-subtitle">Stay updated on your football activity, opportunities, and conversations.</p>
            </div>
          </div>

          <div className="notif-top-bar__actions">
            <button className="notif-btn-outline" onClick={handleMarkAllRead}>
              Mark all as read
            </button>
            <button className="notif-btn-ghost" onClick={() => showToast('Opening notification settings...')}>
              ⚙ Settings
            </button>
          </div>
        </div>

        {/* Summary Pills Row */}
        <div className="notif-pills-row">
          <span className="notif-summary-pill notif-summary-pill--green">{unreadCount} unread</span>
          <span className="notif-summary-pill notif-summary-pill--gold">2 opportunities</span>
          <span className="notif-summary-pill notif-summary-pill--orange">5 scout activities</span>
          <span className="notif-summary-pill notif-summary-pill--purple">8 post interactions</span>
        </div>
      </div>

      {/* ── Filter Tabs Row ────────────────────────────────────────────────── */}
      <div className="notif-tabs-bar">
        <div className="notif-tabs">
          {['All', 'Mentions', 'Posts', 'Highlights', 'Opportunities', 'Messages', 'System'].map((tab) => (
            <button
              key={tab}
              className={`notif-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span>{tab}</span>
              {tab === 'Opportunities' && <span className="notif-tab__badge">2</span>}
            </button>
          ))}
        </div>

        <div className="notif-toggle-wrap" onClick={() => setUnreadOnly(!unreadOnly)}>
          <span>Unread only</span>
          <div className={`notif-toggle ${unreadOnly ? 'active' : ''}`}>
            <div className="notif-toggle__circle" />
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Grid ────────────────────────────────────────────── */}
      <main className="notif-grid">
        
        {/* ── Left Column: Notifications Feed ────────────────────────────── */}
        <section className="notif-feed">
          {groupedSections.length === 0 ? (
            <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', color: '#6B7280' }}>
              No notifications found in this filter.
            </div>
          ) : (
            groupedSections.map((group) => (
              <div key={group.section}>
                <div className="notif-section-title">{group.section}</div>
                <div className="notif-list">
                  {group.items.map((item) => (
                    <div key={item.id} className={`notif-item ${item.unread ? 'unread' : ''}`}>
                      {item.unread && (
                        <div className={`notif-item__unread-dot ${item.unreadDotColor === 'gold' ? 'notif-item__unread-dot--gold' : ''}`} />
                      )}

                      <div className="notif-item__avatar-wrap">
                        <div className="notif-item__avatar" style={{ background: item.actor.color }}>
                          {item.actor.initials}
                        </div>
                        {item.badgeOverlay && (
                          <div className="notif-item__badge-overlay">
                            {item.badgeOverlay}
                          </div>
                        )}
                      </div>

                      <div className="notif-item__content">
                        <div className="notif-item__header-row">
                          <div className="notif-item__author-info">
                            <span className="notif-item__author-name">{item.actor.display_name}</span>
                            {item.actor.is_verified && <VerifiedBadge />}
                            <span className={`msg-role-tag msg-role-tag--${item.actor.role.toLowerCase()}`}>
                              {item.actor.role}
                            </span>
                          </div>
                          <span className="notif-item__time">{item.time}</span>
                        </div>

                        <p className="notif-item__text">{item.text}</p>

                        {item.quote && <p className="notif-item__quote">{item.quote}</p>}

                        {item.detailBox && (
                          <div className="notif-item__detail-box">
                            {item.detailBox}
                          </div>
                        )}

                        {item.tag && (
                          <div className="notif-item__tags-row">
                            <span className="notif-tag">{item.tag}</span>
                          </div>
                        )}

                        {item.tags && (
                          <div className="notif-item__tags-row">
                            {item.tags.map((t, idx) => (
                              <span key={idx} className="notif-tag">{t}</span>
                            ))}
                          </div>
                        )}

                        {item.actions && (
                          <div className="notif-item__actions">
                            {item.actions.map((act, idx) => (
                              <button
                                key={idx}
                                className={
                                  act.primary
                                    ? 'notif-action-btn-primary'
                                    : act.danger
                                    ? 'notif-action-btn-danger'
                                    : act.ghost
                                    ? 'notif-action-btn-ghost'
                                    : 'notif-action-btn-secondary'
                                }
                                onClick={() => {
                                  if (act.route) navigate(act.route)
                                  else showToast(`Action: ${act.label}`)
                                }}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {/* ── Right Column: Sidebar Widgets ───────────────────────────────── */}
        <aside className="notif-sidebar">
          {/* Card 1: Activity Summary */}
          <div className="notif-widget">
            <h3 className="notif-widget__title">Activity Summary</h3>
            <div className="notif-summary-list">
              <div className="notif-summary-item">
                <div className="notif-summary-item__label">🔔 Unread notifications</div>
                <span className="notif-summary-item__val">{unreadCount}</span>
              </div>
              <div className="notif-summary-item">
                <div className="notif-summary-item__label">👁 Profile views this week</div>
                <span className="notif-summary-item__val">84</span>
              </div>
              <div className="notif-summary-item">
                <div className="notif-summary-item__label">▶ Highlight views today</div>
                <span className="notif-summary-item__val">3.2k</span>
              </div>
              <div className="notif-summary-item">
                <div className="notif-summary-item__label">👥 New followers</div>
                <span className="notif-summary-item__val">18</span>
              </div>
              <div className="notif-summary-item">
                <div className="notif-summary-item__label">⭐ Opportunities</div>
                <span className="notif-summary-item__val">2</span>
              </div>
            </div>
          </div>

          {/* Card 2: Priority Notifications */}
          <div className="notif-widget">
            <h3 className="notif-widget__title">⚡ Priority</h3>
            <div className="notif-priority-item" onClick={() => navigate('/messages')}>
              <span>⭐ Trial invitation pending</span>
              <span>›</span>
            </div>
            <div className="notif-priority-item" onClick={() => navigate('/feed')}>
              <span>👁 Scout viewed your profile</span>
              <span>›</span>
            </div>
          </div>

          {/* Card 3: Filter by activity */}
          <div className="notif-widget">
            <h3 className="notif-widget__title">⚙ Filter by activity</h3>
            <div className="notif-checkbox-list">
              {Object.keys(filterCheckboxes).map((key) => (
                <label key={key} className="notif-checkbox-item">
                  <input
                    type="checkbox"
                    checked={filterCheckboxes[key]}
                    onChange={() => setFilterCheckboxes((prev) => ({ ...prev, [key]: !prev[key] }))}
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 4: Notification Settings */}
          <div className="notif-settings-card">
            <h3 className="notif-widget__title" style={{ color: '#15803D' }}>⚙ Notification Settings</h3>
            <p className="notif-settings-card__desc">
              Choose which football updates you want to receive — in-app, email, or push.
            </p>

            <div className="notif-settings-table">
              <div className="notif-settings-row">
                <span>Social interactions</span>
                <div className="notif-settings-pills">
                  <span className="notif-setting-pill">App</span>
                  <span className="notif-setting-pill">Email</span>
                </div>
              </div>
              <div className="notif-settings-row">
                <span>Scout & club activity</span>
                <div className="notif-settings-pills">
                  <span className="notif-setting-pill">App</span>
                  <span className="notif-setting-pill">Email</span>
                </div>
              </div>
              <div className="notif-settings-row">
                <span>Trial opportunities</span>
                <div className="notif-settings-pills">
                  <span className="notif-setting-pill">App</span>
                  <span className="notif-setting-pill">Email</span>
                </div>
              </div>
              <div className="notif-settings-row">
                <span>Match threads</span>
                <div className="notif-settings-pills">
                  <span className="notif-setting-pill">App</span>
                  <span className="notif-setting-pill">Email</span>
                </div>
              </div>
            </div>

            <button className="notif-manage-btn" onClick={() => showToast('Opening notification settings modal')}>
              Manage Settings
            </button>
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
