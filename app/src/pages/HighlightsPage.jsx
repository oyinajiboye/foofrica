import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/highlights.css'

// ─── Mock data for when API is unavailable ────────────────────────────────────
const MOCK_HIGHLIGHTS = [
  {
    id: 'h1',
    author: { id: 'u1', display_name: 'Tunde Adebayo', username: 'tunde4real', avatar_url: null, user_type: 'player', is_verified: false },
    content: 'Quick highlights from today\'s league match. Goal + two key chances created.',
    caption: 'LW · Mainland Football Academy · Lagos, Nigeria',
    hashtags: ['Goal', 'AfricanTalent', 'LagosLeague'],
    tags: ['Goal', 'LW'],
    duration: 42,
    thumbnail_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    cloudflare_playback_url: null,
    likes_count: 3200, comments_count: 245, reposts_count: 88, saves_count: 112,
    is_liked: false, is_saved: false, is_reposted: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'h2',
    author: { id: 'u2', display_name: 'Chiamaka Nwosu', username: 'chiamaka_winger', avatar_url: null, user_type: 'player', is_verified: true },
    content: 'Training session drill compilation. Working on first touch and positioning.',
    caption: 'RW · Nairobi City FC · Kenya',
    hashtags: ['Training', 'AfricanTalent', 'WomenFootball'],
    tags: ['Training', 'RW'],
    duration: 70,
    thumbnail_url: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80',
    cloudflare_playback_url: null,
    likes_count: 1800, comments_count: 132, reposts_count: 54, saves_count: 89,
    is_liked: true, is_saved: false, is_reposted: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'h3',
    author: { id: 'u3', display_name: 'Kwame Mensah', username: 'kwamemid8', avatar_url: null, user_type: 'player', is_verified: false },
    content: 'Full match highlights vs FC Lagos. CM role — pressing, ball recovery, and final pass.',
    caption: 'CM · Ghana Premier League',
    hashtags: ['Ghana', 'Midfielder', 'Pressing'],
    tags: ['Matchday', 'CM'],
    duration: 118,
    thumbnail_url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
    cloudflare_playback_url: null,
    likes_count: 4500, comments_count: 321, reposts_count: 210, saves_count: 178,
    is_liked: false, is_saved: true, is_reposted: false,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'h4',
    author: { id: 'u4', display_name: 'Ada Okonkwo', username: 'adagk1', avatar_url: null, user_type: 'player', is_verified: false },
    content: 'CB clean sheet reel — headers, tackles, and sweeping. Best defensive display this season.',
    caption: 'CB · Abuja FC · Nigeria',
    hashtags: ['Defender', 'CleanSheet', 'NigerianFootball'],
    tags: ['Defense', 'CB'],
    duration: 95,
    thumbnail_url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&q=80',
    cloudflare_playback_url: null,
    likes_count: 2100, comments_count: 89, reposts_count: 43, saves_count: 66,
    is_liked: false, is_saved: false, is_reposted: true,
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
]

const MOCK_COMMENTS = [
  { id: 'c1', author: { display_name: 'Coach Musa Bello', username: 'coachmusa', avatar_url: null, user_type: 'coach' }, content: 'Great movement before the finish. His first touch created the space.', likes_count: 12, created_at: new Date(Date.now() - 3600000).toISOString(), replies: [
    { id: 'c1r1', author: { display_name: 'Coach Musa Bello', username: 'coachmusa', avatar_url: null, user_type: 'coach' }, content: '@coachmusa Great movement before the finish. His first touch created the space.', likes_count: 12, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'c1r2', author: { display_name: 'Coach Musa Bello', username: 'coachmusa', avatar_url: null, user_type: 'coach' }, content: '@coachmusa Another insightful point about positioning.', likes_count: 8, created_at: new Date(Date.now() - 1800000).toISOString() },
  ]},
  { id: 'c2', author: { display_name: 'Coach Musa Bello', username: 'coachmusa2', avatar_url: null, user_type: 'coach' }, content: 'Great movement before the finish. His first touch created the space.', likes_count: 12, created_at: new Date(Date.now() - 3600000).toISOString(), replies: [] },
  { id: 'c3', author: { display_name: 'Coach Musa Bello', username: 'coachmusa3', avatar_url: null, user_type: 'coach' }, content: 'Great movement before the finish. His first touch created the space.', likes_count: 12, created_at: new Date(Date.now() - 3600000).toISOString(), replies: [
    { id: 'c3r1', author: { display_name: 'Coach Musa Bello', username: 'coachmusa', avatar_url: null, user_type: 'coach' }, content: '@coachmusa Excellent point!', likes_count: 5, created_at: new Date(Date.now() - 900000).toISOString() },
  ]},
  { id: 'c4', author: { display_name: 'Coach Musa Bello', username: 'coachmusa4', avatar_url: null, user_type: 'coach' }, content: 'Great movement before the finish. His first touch created the space.', likes_count: 12, created_at: new Date(Date.now() - 3600000).toISOString(), replies: [] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatDuration(s) {
  const m = Math.floor(s / 60)
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return `${Math.floor(diff)}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? '#F59E0B' : 'none'} stroke={filled ? '#F59E0B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const CommentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const RepostIcon = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? '#1A7A2E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)

const BookmarkIcon = ({ filled }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? '#1A7A2E' : 'none'} stroke={filled ? '#1A7A2E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
)

const MoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
)

const ChevronUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)

const ChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const PlayIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="rgba(255,255,255,0.18)" backdropFilter="blur(4px)"/>
    <polygon points="21,16 38,26 21,36" fill="#1A7A2E"/>
  </svg>
)

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const HighlightsNavIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const MessagesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const MuteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
)

const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
)

// ─── Comment Component ────────────────────────────────────────────────────────
function CommentItem({ comment }) {
  const [expanded, setExpanded] = useState(false)
  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div className="hl-comment">
      <div className="hl-comment__avatar">
        {comment.author.avatar_url
          ? <img src={comment.author.avatar_url} alt={comment.author.display_name} />
          : <div className="hl-comment__avatar-fallback">{comment.author.display_name.charAt(0).toUpperCase()}</div>
        }
      </div>
      <div className="hl-comment__body">
        <div className="hl-comment__header">
          <span className="hl-comment__name">{comment.author.display_name}</span>
          {comment.author.user_type && (
            <span className="hl-comment__badge">{comment.author.user_type.charAt(0).toUpperCase() + comment.author.user_type.slice(1)}</span>
          )}
          <span className="hl-comment__time">· {timeAgo(comment.created_at)}</span>
        </div>
        <p className="hl-comment__text">{comment.content}</p>
        <div className="hl-comment__actions">
          <button className="hl-comment__like">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {comment.likes_count}
          </button>
          <button className="hl-comment__reply-btn">Reply</button>
        </div>
        {hasReplies && (
          <button className="hl-comment__expand" onClick={() => setExpanded((v) => !v)}>
            {expanded ? `— Hide all replies` : `— View all ${comment.replies.length} replies`}
          </button>
        )}
        {expanded && hasReplies && (
          <div className="hl-comment__replies">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="hl-comment hl-comment--reply">
                <div className="hl-comment__avatar">
                  {reply.author.avatar_url
                    ? <img src={reply.author.avatar_url} alt={reply.author.display_name} />
                    : <div className="hl-comment__avatar-fallback">{reply.author.display_name.charAt(0).toUpperCase()}</div>
                  }
                </div>
                <div className="hl-comment__body">
                  <div className="hl-comment__header">
                    <span className="hl-comment__name">{reply.author.display_name}</span>
                    {reply.author.user_type && (
                      <span className="hl-comment__badge">{reply.author.user_type.charAt(0).toUpperCase() + reply.author.user_type.slice(1)}</span>
                    )}
                    <span className="hl-comment__time">· {timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="hl-comment__text">{reply.content}</p>
                  <div className="hl-comment__actions">
                    <button className="hl-comment__like">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      {reply.likes_count}
                    </button>
                    <button className="hl-comment__reply-btn">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Comment Drawer ───────────────────────────────────────────────────────────
function CommentDrawer({ open, onClose, highlight, comments, onSubmit }) {
  const [text, setText] = useState('')

  const [submitError, setSubmitError] = useState('')
  const [sending, setSending] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try { await onSubmit(text.trim()); setText(''); setSubmitError('') }
    catch (err) { setSubmitError(err.message) }
    finally { setSending(false) }
  }

  return (
    <div className={`hl-comment-drawer ${open ? 'open' : ''}`}>
      <div className="hl-comment-drawer__header">
        <h3 className="hl-comment-drawer__title">Comments ({highlight?.comments_count ?? 0})</h3>
        <button className="hl-comment-drawer__close" onClick={onClose}>✕</button>
      </div>
      <div className="hl-comment-drawer__list">
        {comments.map((c) => <CommentItem key={c.id} comment={c} />)}
      </div>
      {submitError && <p role="alert">{submitError}</p>}
      <form className="hl-comment-drawer__form" onSubmit={handleSubmit}>
        <input
          className="hl-comment-drawer__input"
          placeholder="Add your football take..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus={open}
        />
        <button type="submit" className="hl-comment-drawer__send" disabled={!text.trim() || sending}>
          <SendIcon />
        </button>
      </form>
    </div>
  )
}

// ─── Single Reel Slide ────────────────────────────────────────────────────────
function ReelSlide({ highlight, isActive, onLike, onRepost, onSave, onCommentOpen, onNext, onPrev, hasNext, hasPrev, nextHighlight, muted, onMuteToggle }) {
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [touched, setTouched] = useState(false)
  const touchStartY = useRef(null)
  const navigate = useNavigate()

  // Auto-play when active
  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      videoRef.current.pause()
      setPlaying(false)
    }
  }, [isActive])

  // Mute sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100 || 0
    setProgress(pct)
  }

  const handleVideoClick = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play(); setPlaying(true)
    } else {
      videoRef.current.pause(); setPlaying(false)
    }
    setTouched(true)
    setTimeout(() => setTouched(false), 800)
  }

  const handleProgressClick = (e) => {
    if (!videoRef.current || !videoRef.current.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * videoRef.current.duration
    setProgress(pct * 100)
  }

  // Touch swipe support
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return
    const delta = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(delta) > 50) {
      if (delta > 0 && hasNext) onNext()
      if (delta < 0 && hasPrev) onPrev()
    }
    touchStartY.current = null
  }

  const authorInitial = highlight.author.display_name.charAt(0).toUpperCase()
  const avatarBg = ['#1A7A2E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][highlight.author.id?.charCodeAt(0) % 5 || 0]

  return (
    <div
      className="hl-reel-slide"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Left info panel (Floating Card) ── */}
      <div className="hl-author-card">
        <div className="hl-author-card__header">
          <div className="hl-author-card__avatar" style={{ background: avatarBg }}>
            {highlight.author.avatar_url
              ? <img src={highlight.author.avatar_url} alt={highlight.author.display_name} />
              : highlight.author.display_name.charAt(0).toUpperCase()
            }
          </div>
          <div className="hl-author-card__header-info">
            <div className="hl-author-card__name-row">
              <span className="hl-author-card__name">{highlight.author.display_name}</span>
              {highlight.author.is_verified && <span className="hl-author-card__verified">●</span>}
            </div>
            <div className="hl-author-card__meta">
              <span className="hl-author-card__handle">@{highlight.author.username}</span>
              <span className="hl-author-card__type-badge">{highlight.author.user_type?.charAt(0).toUpperCase() + highlight.author.user_type?.slice(1)}</span>
            </div>
          </div>
          <button className="hl-author-card__follow-btn">Follow</button>
        </div>

        <p className="hl-author-card__caption">{highlight.content}</p>
        <p className="hl-author-card__sub">{highlight.caption}</p>

        <div className="hl-author-card__hashtags">
          {highlight.hashtags?.map((tag) => (
            <span key={tag} className="hl-author-card__hashtag">#{tag}</span>
          ))}
        </div>

        <div className="hl-author-card__btns">
          <button className="hl-author-card__profile-btn" onClick={() => navigate(`/profile/${highlight.author.username}`)}>
            View Profile
          </button>
          <button className="hl-author-card__shortlist-btn">Add to Shortlist</button>
          <button className="hl-author-card__share-btn" aria-label="Share">
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ── Video / Thumbnail area ── */}
      <div className="hl-reel-video-wrap" onClick={handleVideoClick}>
        {highlight.cloudflare_playback_url ? (
          <video
            ref={videoRef}
            src={highlight.cloudflare_playback_url}
            poster={highlight.thumbnail_url}
            loop
            playsInline
            muted={muted}
            onTimeUpdate={handleTimeUpdate}
            className="hl-reel-video"
          />
        ) : (
          <img
            src={highlight.thumbnail_url}
            alt={highlight.content}
            className="hl-reel-video"
            style={{ objectFit: 'cover' }}
          />
        )}

        {/* Gradient overlay */}
        <div className="hl-reel-gradient" />

        {/* Play icon (shown briefly on tap or when paused) */}
        {(!playing || touched) && (
          <div className="hl-reel-play-icon">
            <PlayIcon />
          </div>
        )}

        {/* Tags top-left */}
        <div className="hl-reel-tags">
          {highlight.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="hl-reel-tag">{tag}</span>
          ))}
        </div>

        {/* Duration top-right */}
        <div className="hl-reel-duration">{formatDuration(highlight.duration)}</div>

        {/* Progress bar at bottom */}
        <div className="hl-reel-progress-track" onClick={handleProgressClick}>
          <div className="hl-reel-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Mute button */}
        <button className="hl-reel-mute" onClick={(e) => { e.stopPropagation(); onMuteToggle() }}>
          {muted ? <MuteIcon /> : <VolumeIcon />}
        </button>
      </div>

      {/* ── Nav arrows (Next to video) ── */}
      <div className="hl-reel-nav-group-floating">
        <button className={`hl-reel-nav-btn ${!hasPrev ? 'disabled' : ''}`} onClick={hasPrev ? onPrev : undefined} aria-label="Previous">
          <ChevronUp />
        </button>
        <button className={`hl-reel-nav-btn ${!hasNext ? 'disabled' : ''}`} onClick={hasNext ? onNext : undefined} aria-label="Next">
          <ChevronDown />
        </button>
      </div>

      {/* ── Right side column: Actions + Up Next (Far right) ── */}
      <div className="hl-reel-far-right">
        {/* Actions */}
        <div className="hl-action-group">
          <div className="hl-action-item">
            <button
              className={`hl-action-btn ${highlight.is_liked ? 'active-heart' : ''}`}
              onClick={() => onLike(highlight.id, highlight.is_liked)}
              aria-label="Like"
            >
              <HeartIcon filled={highlight.is_liked} />
            </button>
            <span className="hl-action-count">{formatCount(highlight.likes_count)}</span>
          </div>

          <div className="hl-action-item">
            <button className="hl-action-btn" onClick={() => onCommentOpen(highlight.id)} aria-label="Comment">
              <CommentIcon />
            </button>
            <span className="hl-action-count">{formatCount(highlight.comments_count)}</span>
          </div>

          <div className="hl-action-item">
            <button
              className={`hl-action-btn ${highlight.is_reposted ? 'active-repost' : ''}`}
              onClick={() => onRepost(highlight.id, highlight.is_reposted)}
              aria-label="Repost"
            >
              <RepostIcon active={highlight.is_reposted} />
            </button>
            <span className="hl-action-count">{formatCount(highlight.reposts_count)}</span>
          </div>

          <div className="hl-action-item">
            <button
              className={`hl-action-btn ${highlight.is_saved ? 'active-save' : ''}`}
              onClick={() => onSave(highlight.id, highlight.is_saved)}
              aria-label="Save"
            >
              <BookmarkIcon filled={highlight.is_saved} />
            </button>
            <span className="hl-action-count">{formatCount(highlight.saves_count)}</span>
          </div>

          <div className="hl-action-item">
            <button className="hl-action-btn" aria-label="More">
              <MoreIcon />
            </button>
          </div>
          
          <div className="hl-action-author-avatar-wrap">
            <div className="hl-action-author-avatar" style={{ background: avatarBg }}>
              {highlight.author.avatar_url
                ? <img src={highlight.author.avatar_url} alt={highlight.author.display_name} />
                : <span>{authorInitial}</span>
              }
            </div>
          </div>
        </div>

        {/* Up Next preview */}
        {hasNext && nextHighlight && (
          <div className="hl-reel-upnext" onClick={onNext}>
            <div className="hl-reel-upnext__label">Up Next</div>
            <div className="hl-reel-upnext__thumb-wrap">
              <img
                src={nextHighlight.thumbnail_url}
                alt={nextHighlight.author.display_name}
                className="hl-reel-upnext__thumb"
              />
              <div className="hl-reel-upnext__duration">{formatDuration(nextHighlight.duration)}</div>
              {/* Like button overlay */}
              <button 
                className={`hl-reel-upnext__like ${nextHighlight.is_liked ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(nextHighlight.id, nextHighlight.is_liked)
                }}
                aria-label="Like next video"
              >
                <HeartIcon filled={nextHighlight.is_liked} />
              </button>
            </div>
            <div className="hl-reel-upnext__name">{nextHighlight.author.display_name}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HighlightsPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()
  const [highlights, setHighlights] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [commentOpen, setCommentOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const containerRef = useRef(null)
  const isTransitioning = useRef(false)

  // Fetch highlights from API
  const fetchHighlights = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true)
    try {
      const res = await apiFetch(`/api/feed/highlights?limit=20&page=${pageNum}`)
      const data = (res?.data?.data || res?.data || []).map(post => ({ ...post, ...post.video, id: post.id, duration: post.video?.duration_seconds || 0, author: post.author }))
      {
        setHighlights((prev) => pageNum === 1 ? data : [...prev, ...data])
        setHasMore(false)
      }
    } catch (err) {
      setError(err.message)
      setHighlights([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { fetchHighlights(1) }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'j') goNext()
      if (e.key === 'ArrowUp' || e.key === 'k') goPrev()
      if (e.key === 'm') setMuted((v) => !v)
      if (e.key === 'Escape') setCommentOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentIndex, highlights.length])

  // Scroll wheel navigation
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let lastScroll = 0
    const handler = (e) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastScroll < 600) return
      lastScroll = now
      if (e.deltaY > 30) goNext()
      else if (e.deltaY < -30) goPrev()
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [currentIndex, highlights.length])

  const goNext = useCallback(() => {
    if (isTransitioning.current) return
    setCurrentIndex((prev) => {
      if (prev >= highlights.length - 1) return prev
      isTransitioning.current = true
      setTimeout(() => { isTransitioning.current = false }, 500)
      // Load more when near end
      if (prev >= highlights.length - 3 && hasMore) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchHighlights(nextPage)
      }
      return prev + 1
    })
  }, [highlights.length, hasMore, page, fetchHighlights])

  const goPrev = useCallback(() => {
    if (isTransitioning.current) return
    setCurrentIndex((prev) => {
      if (prev <= 0) return prev
      isTransitioning.current = true
      setTimeout(() => { isTransitioning.current = false }, 500)
      return prev - 1
    })
  }, [])

  const handleLike = useCallback(async (id, wasLiked) => {
    setHighlights((prev) => prev.map((h) => h.id === id
      ? { ...h, is_liked: !wasLiked, likes_count: wasLiked ? h.likes_count - 1 : h.likes_count + 1 }
      : h
    ))
    try {
      await apiFetch(`/api/posts/${id}/like`, { method: wasLiked ? 'DELETE' : 'POST' })
    } catch {
      setHighlights((prev) => prev.map((h) => h.id === id
        ? { ...h, is_liked: wasLiked, likes_count: wasLiked ? h.likes_count + 1 : h.likes_count - 1 }
        : h
      ))
    }
  }, [apiFetch])

  const handleRepost = useCallback(async (id, wasReposted) => {
    if (wasReposted) return
    setHighlights((prev) => prev.map((h) => h.id === id
      ? { ...h, is_reposted: true, reposts_count: h.reposts_count + 1 }
      : h
    ))
    try {
      await apiFetch(`/api/posts/${id}/repost`, { method: 'POST' })
    } catch {
      setHighlights((prev) => prev.map((h) => h.id === id
        ? { ...h, is_reposted: false, reposts_count: h.reposts_count - 1 }
        : h
      ))
    }
  }, [apiFetch])

  const handleSave = useCallback(async (id, wasSaved) => {
    try {
      await apiFetch(`/api/bookmarks/${id}`, { method: wasSaved ? 'DELETE' : 'POST' })
      setHighlights(prev => prev.map(h => h.id === id ? { ...h, is_saved: !wasSaved } : h))
    } catch (err) { setError(err.message) }
  }, [apiFetch])

  useEffect(() => {
    setComments([])
    if (!commentOpen || !highlights[currentIndex]) return
    let cancelled = false
    apiFetch(`/api/posts/${highlights[currentIndex].id}/comments`).then(res => {
      if (!cancelled) setComments(res.data?.data || res.data || [])
    }).catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [commentOpen, currentIndex, highlights, apiFetch])

  const addComment = async content => {
    const res = await apiFetch(`/api/posts/${highlights[currentIndex].id}/comments`, { method: 'POST', body: JSON.stringify({ content }) })
    setComments(prev => [...prev, { ...res.data, author: res.data.author || user }])
  }

  const currentHighlight = highlights[currentIndex]
  const displayName = user?.display_name || user?.full_name || 'You'

  if (loading && highlights.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #1A7A2E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="hl-shell" ref={containerRef}>
      {/* ── Navbar ── */}
      <nav className="hl-navbar">
        <a className="hl-navbar__logo" href="/feed">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#1A7A2E"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">F</text>
          </svg>
          <span>footfrica</span>
        </a>

        <div className="hl-navbar__search">
          <SearchIcon />
          <input type="text" placeholder="Search players, clubs, topics…" id="hl-search" />
        </div>

        <nav className="hl-navbar__nav">
          <button className="hl-navbar__nav-link" onClick={() => navigate('/feed')}><HomeIcon /> Home</button>
          <button className="hl-navbar__nav-link active"><HighlightsNavIcon /> Highlights</button>
          <button className="hl-navbar__nav-link" onClick={() => navigate('/messages')}><MessagesIcon /> Messages</button>
        </nav>

        <button className="hl-navbar__notif" aria-label="Notifications">
          <BellIcon />
          <span className="hl-navbar__notif-badge">3</span>
        </button>

        <div className="hl-navbar__avatar" style={{ background: '#1A7A2E' }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      </nav>

      {/* ── Main layout: Center reel contains everything ── */}
      <div className="hl-layout">
        {error && <p role="alert">{error}</p>}
        {!loading && highlights.length === 0 && <p style={{color: "white", padding: 32}}>No highlights yet. <a href="/feed">Back to feed</a></p>}
        {/* Center reel container */}
        <div className="hl-reel-container">
          <div
            className="hl-reel-track"
            style={{ transform: `translateY(calc(-${currentIndex} * (100dvh - 56px)))` }}
          >
            {highlights.map((highlight, i) => (
              <div key={highlight.id} className="hl-reel-item">
                <ReelSlide
                  highlight={highlight}
                  isActive={i === currentIndex}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  onSave={handleSave}
                  onCommentOpen={() => setCommentOpen(true)}
                  onNext={goNext}
                  onPrev={goPrev}
                  hasNext={i < highlights.length - 1}
                  hasPrev={i > 0}
                  nextHighlight={highlights[i + 1] ?? null}
                  muted={muted}
                  onMuteToggle={() => setMuted((v) => !v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Comment drawer (slides in from right) */}
        <CommentDrawer
          open={commentOpen}
          onClose={() => setCommentOpen(false)}
          highlight={currentHighlight}
          comments={comments}
          onSubmit={addComment}
        />
      </div>

      {/* Keyboard hint (fades out after 4s) */}
      <div className="hl-keyboard-hint">
        <span>↑↓ or J/K to navigate · M to mute</span>
      </div>
    </div>
  )
}
