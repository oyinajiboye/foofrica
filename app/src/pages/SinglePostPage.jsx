import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/single-post.css'

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

export default function SinglePostPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, apiFetch } = useAuth()

  const [post, setPost] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState(null)

  // ── Fetch post & comments ──────────────────────────────────────────────
  useEffect(() => {
    const loadPost = async () => {
      try {
        const [postRes, commentsRes] = await Promise.allSettled([
          apiFetch(`/api/posts/${id}`),
          apiFetch(`/api/posts/${id}/comments?limit=20`),
        ])
        if (postRes.status === 'fulfilled') setPost(postRes.value?.data)
        if (commentsRes.status === 'fulfilled') {
          const items = commentsRes.value?.data?.data || commentsRes.value?.data || []
          setComments(items.map(c => ({
            id: c.id,
            name: c.author?.display_name || 'Unknown',
            handle: `@${c.author?.username || ''}`,
            role: c.author?.user_type || 'Fan',
            time: formatTimeAgo(c.created_at),
            text: c.content,
          })))
        }
      } catch (e) {
        console.error('Failed to load post:', e)
      } finally {
        setLoading(false)
      }
    }
    if (id) loadPost()
  }, [id, apiFetch])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try {
      const res = await apiFetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText }),
      })
      setComments(prev => [
        ...prev,
        {
          id: res.data?.id || Date.now(),
          name: user?.display_name || 'You',
          handle: `@${user?.username || ''}`,
          role: user?.user_type || 'Player',
          time: 'Just now',
          text: commentText,
        },
      ])
      setCommentText('')
      showToast('Comment posted!')
    } catch (e) {
      showToast(e.message || 'Failed to post comment')
    }
  }

  return (
    <div className="spt-shell">
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
          <button className="stg-back-btn" onClick={() => navigate('/feed')}>‹</button>
          <h1 className="stg-title" style={{ display: 'inline-block', marginLeft: 12 }}>Post Discussion</h1>
        </div>
      </div>

      <main className="clb-grid" style={{ paddingTop: 20 }}>
        <div>
          {/* Main Post Card */}
          <div className="stg-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div className="clb-player-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>TA</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 14.5 }}>Tunde Adebayo</strong>
                  <span className="msg-role-tag msg-role-tag--player">Player</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>@tunde4real · 2 hours ago</div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#111827', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              Full match highlights from our 3-1 win over Ikeja United today! Glad to get on the scoresheet with a solo goal and provide an assist. Hard work continues! ⚽🔥 #GrassrootsFootball #LagosTalent
            </p>

            <div style={{ height: 260, background: '#111827', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/highlights')}>
              ▶ Click to Play Highlights Reel (1080p HD)
            </div>

            <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 14, borderTop: '1px solid #F3F4F6', fontSize: 13, color: '#6B7280', fontWeight: 600 }}>
              <span>❤️ 248 Likes</span>
              <span>💬 {comments.length} Comments</span>
              <span>🔄 42 Reposts</span>
              <span>🔖 Save</span>
            </div>
          </div>

          {/* Comment Box */}
          <div className="spt-comment-box">
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Leave a comment</div>
            <textarea
              rows={3}
              style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13 }}
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="clb-btn-primary" onClick={handleAddComment}>Post Comment</button>
            </div>
          </div>

          {/* Comments List */}
          <div className="stg-card" style={{ marginTop: 20 }}>
            <h3 className="stg-card__title">Comments ({comments.length})</h3>
            <div>
              {comments.map((c) => (
                <div key={c.id} className="spt-comment-item">
                  <div className="clb-player-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>{c.name}</strong>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{c.handle} · {c.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="stg-card">
            <h4 className="stg-card__title" style={{ fontSize: 14 }}>About Author</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <div className="clb-player-avatar">TA</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>Tunde Adebayo</div>
                <div style={{ fontSize: 11.5, color: '#6B7280' }}>Left Winger · Mainland FA</div>
              </div>
            </div>
            <button className="clb-btn-outline" style={{ width: '100%', marginTop: 14 }} onClick={() => navigate('/profile')}>
              View Profile
            </button>
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
