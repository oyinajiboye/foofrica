import StreamPlayer from '../components/StreamPlayer'
import Poll from '../components/Poll'
import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/feed.css'

import { API_BASE } from '../lib/api'

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
const LikeIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#EF4444' : 'none'} stroke={filled ? '#EF4444' : 'currentColor'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)
const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)
const RepostIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
)
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A7A2E" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
)
const BookmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>
)
const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const SmileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
)
const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
)
const VideoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>
)

const PollIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
)
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)
const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function Avatar({ src, name, size = 44, className = '' }) {
  const initials = (name || '?').charAt(0).toUpperCase()
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} className={className} />
  return (
    <div className={className} style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #1A7A2E, #2D9D47)',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      {initials}
    </div>
  )
}

function UserTypeBadge({ type }) {
  if (!type) return null
  return <span className={`user-type-badge ${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
}

// ─── Compose Modal ────────────────────────────────────────────────────────────

function ComposeModal({ user, onClose, onPost }) {
  const [text, setText] = useState('')
  const [postType, setPostType] = useState('text')
  const [files, setFiles] = useState([])
  const [pollOptions,setPollOptions]=useState('')
  const [topics,setTopics]=useState('')
  const [composeError, setComposeError] = useState('')
  const [loading, setLoading] = useState(false)
  const { apiFetch } = useAuth()

  const handleSubmit = async () => {
    if (loading || (!text.trim() && !files.length)) return
    setLoading(true)
    setComposeError('')
    try {
      const image_urls = []
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) throw new Error('Each photo must be 5 MB or smaller.')
        const body = new FormData(); body.append('file', file)
        const result = await apiFetch('/api/uploads/post-image', { method: 'POST', body })
        image_urls.push(result.data.image_url)
      }
      const data = await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: text.trim(), tags:topics.split(',').map(t=>t.trim()).filter(Boolean).slice(0,10), post_type: postType==='poll'?'poll':image_urls.length ? 'image' : 'text', image_urls, ...(postType==='poll'?{poll_options:pollOptions.split('\n').map(x=>x.trim()).filter(Boolean),poll_duration_hours:24}:{}) }),
      })
      onPost(data.data)
      onClose()
    } catch (e) {
      setComposeError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="compose-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="compose-modal" id="compose-modal">
        <div className="compose-modal__header">
          <span className="compose-modal__title">Create Post</span>
          <button className="compose-modal__close" onClick={onClose} id="compose-close">✕</button>
        </div>
        <div className="compose-modal__body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Avatar src={user?.avatar_url} name={user?.display_name} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 8 }}>{user?.display_name || 'You'}</div>
              <textarea
                className="compose-modal__textarea"
                placeholder="Share a football update…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                id="compose-textarea"
              />
            </div>
          </div>
        </div>
        {postType==='poll'&&<label style={{padding:16}}>2–4 options, one per line<textarea value={pollOptions} onChange={e=>setPollOptions(e.target.value)}/></label>}
        <label style={{padding:16}}>Football topics (comma separated)<input value={topics} onChange={e=>setTopics(e.target.value)} placeholder='Training, grassroots football, Nigeria' maxLength={600}/></label>
        {composeError && <p role="alert" style={{padding:16}}>{composeError}</p>}
        {postType === 'image' && <label style={{padding:16}}>Choose up to 4 photos<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={e => setFiles(Array.from(e.target.files || []).slice(0,4))} /></label>}
        <div className="compose-modal__footer">
          <div className="compose-modal__type-btns">
            {[

              { key: 'image', icon: <ImageIcon />, label: 'Photos' },
              { key:'poll',icon:<PollIcon/>,label:'Poll' },

            ].map(({ key, icon, label }) => (
              <button
                key={key}
                className={`compose-modal__type-btn ${postType === key ? 'active' : ''}`}
                onClick={() => { setPostType(postType === key ? 'text' : key); setFiles([]) }}
                id={`compose-type-${key}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <button
            className="compose-modal__submit"
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !files.length)}
            id="compose-submit"
          >
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onLike, onRepost, toast, onHide }) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const { apiFetch } = useAuth()

  const cardRef=useRef(null)
  useEffect(()=>{
    const node=cardRef.current;if(!node||!('IntersectionObserver' in window))return
    let timer,recorded=false
    const observer=new IntersectionObserver(entries=>{
      clearTimeout(timer)
      if(entries[0].isIntersecting&&!recorded)timer=setTimeout(()=>{if(document.hidden)return;recorded=true;apiFetch(`/api/feed/feedback/${post.id}`,{method:'POST',body:JSON.stringify({kind:'impression'})}).catch(()=>{})},2000)
    },{threshold:.5});observer.observe(node);return()=>{clearTimeout(timer);observer.disconnect()}
  },[apiFetch,post.id])
  const feedback=async kind=>{try{await apiFetch(`/api/feed/feedback/${post.id}`,{method:'POST',body:JSON.stringify({kind})});if(kind==='dismissed')onHide(post.id);else toast('Preference saved. Refresh your feed to see changes.')}catch(e){toast(e.message)}}
  const author = post.author || {}
  const isLiked = post.is_liked
  const isReposted = post.is_reposted

  const fetchComments = useCallback(async () => {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const res = await apiFetch(`/api/posts/${post.id}/comments?limit=3`)
      setComments(res.data?.data || [])
    } catch {}
    finally { setLoadingComments(false) }
  }, [post.id, apiFetch, loadingComments])

  const handleToggleComments = () => {
    setCommentsOpen((prev) => {
      if (!prev && comments.length === 0) fetchComments()
      return !prev
    })
  }

  const handleSendComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      const res = await apiFetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText }),
      })
      setComments((prev) => [res.data, ...prev])
      setCommentText('')
    } catch (e) { toast(e.message) }
  }

  // Render media based on post type
  const renderMedia = () => {
    if (post.post_type === 'video' && post.video) return <StreamPlayer video={post.video}/>
    if (post.post_type === 'image') return <div className='post-image-carousel'>{post.image_urls?.map(url=><img key={url} src={url} alt='Post photo'/>)}</div>
    if (post.post_type === 'poll') return <Poll postId={post.id}/>
    return null
  }

  const hashtags = post.hashtags || []
  const content = post.content || ''

  return (
    <div ref={cardRef} className="post-card" id={`post-${post.id}`}>
      <div className="post-header">
        <Avatar src={author.avatar_url} name={author.display_name} size={44} className="post-avatar" />
        <div className="post-meta">
          <div className="post-author-row">
            <Link className='post-author-name' to={`/profile/${author.username}`} onClick={()=>apiFetch(`/api/feed/feedback/${post.id}`,{method:'POST',body:JSON.stringify({kind:'profile_open'})}).catch(()=>{})}>{author.display_name || 'Unknown'}</Link>
            <UserTypeBadge type={author.user_type} />
            <span className="post-time">· {timeAgo(post.created_at)}</span>
          </div>
          <div className="post-handle">@{author.username || 'user'}</div>
        </div>
<details><summary aria-label='Recommendation options'>•••</summary><button onClick={()=>feedback('interested')}>More like this</button><button onClick={()=>feedback('dismissed')}>Not interested</button><Link to={`/post/${post.id}`}>Open post</Link></details>
      </div>

      {(content || hashtags.length > 0) && (
        <div className="post-body">
          <p className="post-text">
            {content}
            {hashtags.length > 0 && (
              <span className="post-hashtags"> {hashtags.map((h) => `#${h}`).join(' ')}</span>
            )}
          </p>
        </div>
      )}

      {post.recommendation_reason&&<p style={{padding:'0 16px',color:'#64748b',fontSize:12}}>{post.recommendation_reason}</p>}
      {renderMedia()}

      <div className="post-footer">
        <div className="post-stats">{post.likes_count || 0} likes · {post.comments_count || 0} Comments</div>
        <div className="post-footer-left">
          <button
            className={`post-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => onLike(post.id, isLiked)}
            id={`like-btn-${post.id}`}
          >
            <LikeIcon filled={isLiked} /> Like
          </button>
          <button
            className="post-action-btn"
            onClick={handleToggleComments}
            id={`comment-btn-${post.id}`}
          >
            <CommentIcon /> Comment
          </button>
          <button
            className={`post-action-btn ${isReposted ? 'reposted' : ''}`}
            onClick={() => onRepost(post.id, isReposted)}
            id={`repost-btn-${post.id}`}
          >
            <RepostIcon /> Repost
          </button>
        </div>
      </div>

      {commentsOpen && (
        <div className="post-comments-section">
          {loadingComments && <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '8px 0' }}>Loading…</div>}

          {comments.map((c, i) => (
            <Fragment key={c.id}>
              <div className="comment-item">
                <Avatar src={c.author?.avatar_url} name={c.author?.display_name} size={32} className="comment-avatar" />
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-name">{c.author?.display_name || 'User'}</span>
                    <UserTypeBadge type={c.author?.user_type} />
                    <span className="comment-time">· {timeAgo(c.created_at)}</span>
                  </div>
                  <div className="comment-text">{c.content}</div>
                  <div className="comment-actions">

                    <button className="comment-action-btn" onClick={()=>setCommentText(`@${c.author?.username||''} `)}>Reply</button>
                  </div>

                </div>
              </div>

            </Fragment>
          ))}

          {/* Main comment input box */}
          <div className="reply-input-container" style={{ marginTop: 8 }}>
            <textarea
              className="reply-textarea"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(e); } }}
            ></textarea>
            <div className="reply-input-footer">
              <div className="reply-icons">
                <button type="button"><SmileIcon /></button>
                <button type="button"><ImageIcon /></button>
              </div>
              <button className="btn-submit-reply" onClick={handleSendComment}>Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonPost() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton skeleton-line" style={{ width: '25%' }} />
        </div>
      </div>
      <div className="skeleton skeleton-line" style={{ width: '90%' }} />
      <div className="skeleton skeleton-line" style={{ width: '70%' }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 12, marginTop: 12 }} />
    </div>
  )
}

// ─── Main Feed Page ───────────────────────────────────────────────────────────

const TABS = ['For You', 'Following', 'Trending', 'Discover', 'Match Day']
const TOPICS = ['Grassroots Football', 'Nigerian Football', 'African Talent', 'Tactical Analysis']
const TRENDING = [
  { name: 'AFCON 2026 Qualifiers', count: '2.4k posts' },
  { name: 'Nigerian Premier League', count: '1.8k posts' },
  { name: 'Youth Development', count: '956 posts' },
  { name: 'European Transfers', count: '720 posts' },
]
const SUGGESTED = [
  { name: 'Kwame Mensah', sub: 'Midfielder · Ghana', initials: 'K', color: '#1A7A2E' },
  { name: 'Chioma Nwosu', sub: 'Defender · Abuja', initials: 'C', color: '#3B82F6', following: true },
  { name: 'Ada Okonkwo', sub: 'Defender · Abuja', initials: 'A', color: '#F59E0B' },
]
const CLUBS_NEAR = ['FC Lagos United', 'Mainland Football Academy', 'Nairobi City FC']

export default function FeedPage() {
  const navigate = useNavigate()
  const { user, clearSession, apiFetch } = useAuth()
  const [activeTab, setActiveTab] = useState('For You')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const nextCursor=useRef(null)
  const requestGeneration=useRef(0)
  const [loadingMore,setLoadingMore]=useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [suggestedFollowing, setSuggestedFollowing] = useState({})
  const [profileStats, setProfileStats] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const accountRef = useRef(null)
  const coverInputRef = useRef(null)
  const avatarInputRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  // Load real profile stats + sidebar suggestions on mount
  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const [statsRes, suggestRes] = await Promise.allSettled([
          apiFetch('/api/feed/me/stats'),
          apiFetch('/api/feed/suggestions?limit=5'),
        ])
        if (statsRes.status === 'fulfilled') setProfileStats(statsRes.value?.data)
        if (suggestRes.status === 'fulfilled') setSuggestions(suggestRes.value?.data ?? [])
      } catch (err) {
        console.warn('Sidebar data load failed:', err?.message)
      }
    }
    loadSidebarData()
  }, [apiFetch])

  const fetchFeed = useCallback(async (tab, pageNum = 1) => {
    const generation=++requestGeneration.current
    setLoading(pageNum === 1);setLoadingMore(true)
    if(pageNum===1)nextCursor.current=null
    try {
      const endpoints = {
        'For You': `/api/feed?limit=10${pageNum>1&&nextCursor.current?'&cursor='+encodeURIComponent(nextCursor.current):''}`,
        'Following': `/api/feed/following?page=${pageNum}&limit=10`,
        'Trending': `/api/feed/trending?page=${pageNum}&limit=10`,
        'Discover': `/api/feed/discover?page=${pageNum}&limit=10`,
        'Match Day': `/api/feed/match-day?page=${pageNum}&limit=10`,
      }
      const res = await apiFetch(endpoints[tab] || endpoints['For You'])
      if(generation!==requestGeneration.current)return
      const newPosts = res.data?.data || res.data || []
      setPosts((prev) => pageNum === 1 ? newPosts : [...new Map([...prev,...newPosts].map(p=>[p.id,p])).values()])
      nextCursor.current=res.data?.next_cursor||null
      setHasMore(typeof res.data?.hasMore==='boolean'?res.data.hasMore:newPosts.length===10)
    } catch (err) {
      if(generation!==requestGeneration.current)return
      showToast(err.message || 'Unable to load your feed. Please try again.')
      if (pageNum === 1) setPosts([])
      setHasMore(false)
    } finally {
      if(generation===requestGeneration.current){setLoading(false);setLoadingMore(false)}
    }
  }, [apiFetch])

  useEffect(() => {
    setPage(1)
    fetchFeed(activeTab, 1)
  }, [activeTab])

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLike = useCallback(async (postId, isLiked) => {
    setPosts((prev) => prev.map((p) => p.id === postId
      ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
      : p
    ))
    try {
      await apiFetch(`/api/posts/${postId}/like`, { method: isLiked ? 'DELETE' : 'POST' })
    } catch {
      // Revert on error
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { ...p, is_liked: isLiked, likes_count: isLiked ? p.likes_count + 1 : p.likes_count - 1 }
        : p
      ))
    }
  }, [apiFetch])

  const handleRepost = useCallback(async (postId, isReposted) => {
    if (isReposted) return
    setPosts((prev) => prev.map((p) => p.id === postId
      ? { ...p, is_reposted: true, reposts_count: p.reposts_count + 1 }
      : p
    ))
    showToast('Post reposted!')
    try {
      await apiFetch(`/api/posts/${postId}/repost`, { method: 'POST' })
    } catch {
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { ...p, is_reposted: false, reposts_count: p.reposts_count - 1 }
        : p
      ))
    }
  }, [apiFetch, showToast])

  const handleNewPost = useCallback((post) => {
    setPosts((prev) => [post, ...prev])
    showToast('Post shared!')
  }, [showToast])

  const handleLogout = () => {
    clearSession()
    navigate('/welcome')
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const token = localStorage.getItem('ff_token')
      const res = await fetch(`${API_BASE}/api/uploads/cover`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const json = await res.json()
      if (json?.data?.cover_url) {
        setProfileStats((prev) => prev ? { ...prev, cover_url: json.data.cover_url } : prev)
        showToast('Cover photo updated!')
      }
    } catch { showToast('Cover upload failed') }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const token = localStorage.getItem('ff_token')
      const res = await fetch(`${API_BASE}/api/uploads/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const json = await res.json()
      if (json?.data?.avatar_url) {
        setProfileStats((prev) => prev ? { ...prev, avatar_url: json.data.avatar_url } : prev)
        showToast('Profile photo updated!')
      }
    } catch { showToast('Avatar upload failed') }
  }

  const toggleFollow = async (profileId, displayNameArg, isFollowing) => {
    setSuggestedFollowing((prev) => ({ ...prev, [profileId]: !isFollowing }))
    showToast(isFollowing ? `Unfollowed ${displayNameArg}` : `Now following ${displayNameArg}`)
    try {
      await apiFetch(`/api/follows/${profileId}`, { method: isFollowing ? 'DELETE' : 'POST' })
    } catch {
      // revert
      setSuggestedFollowing((prev) => ({ ...prev, [profileId]: isFollowing }))
    }
  }

  const displayName = profileStats?.display_name || user?.display_name || user?.full_name || 'You'
  const handle = profileStats?.username || user?.username || 'yourhandle'
  const followingCount = profileStats?.following_count ?? 0
  const followerCount = profileStats?.follower_count ?? 0
  const completionPct = profileStats?.completion_percent ?? 25

  return (
    <div className="app-shell">
      {/* ── Top Navbar ─────────────────────────────────────────────────────── */}
      <nav className="app-navbar" id="app-navbar">
        <a className="app-navbar__logo" href="/feed">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#1A7A2E"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">F</text>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>footfrica</span>
        </a>

        <div className="app-navbar__search">
          <span className="app-navbar__search-icon"><SearchIcon /></span>
          <input type="text" placeholder="Search players, clubs, topics…" id="feed-search" />
        </div>

        <nav className="app-navbar__nav">
          <button className="app-navbar__nav-link active" id="nav-home"><HomeIcon /> Home</button>
          <button className="app-navbar__nav-link" id="nav-highlights" onClick={() => navigate('/highlights')}><HighlightsIcon /> Highlights</button>
          <button className="app-navbar__nav-link" id="nav-messages" onClick={() => navigate('/messages')}><MessagesIcon /> Messages</button>
        </nav>

        <button className="app-navbar__notif-btn" id="nav-notifications" aria-label="Notifications">
          <BellIcon />
          <span className="app-navbar__notif-badge">3</span>
        </button>

        <div style={{ position: 'relative' }} ref={accountRef}>
          <button
            className="app-navbar__avatar-btn"
            onClick={() => setAccountOpen((v) => !v)}
            id="nav-avatar-btn"
            aria-label="Account menu"
          >
            <div className="avatar-fallback" style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: '#1A7A2E', color: '#fff', fontWeight: 700, fontSize: 15
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          </button>

          {accountOpen && (
            <div className="account-dropdown" id="account-dropdown">
              <div className="account-dropdown__header">
                <div className="account-dropdown__avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="account-dropdown__name">{displayName}</div>
                  <div className="account-dropdown__email">@{handle}</div>
                </div>
              </div>
              <button className="account-dropdown__item" id="dd-settings" onClick={() => navigate('/settings')}>
                <SettingsIcon /> Settings
              </button>
              <button className="account-dropdown__item" id="dd-help">
                <HelpIcon /> Help & Support
              </button>
              <button className="account-dropdown__item danger" id="dd-logout" onClick={handleLogout}>
                <LogOutIcon /> Log Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── 3-Column Layout ─────────────────────────────────────────────────── */}
      <div className="feed-layout">
        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <aside className="feed-left-sidebar" id="left-sidebar">
          {/* Profile card */}
          <div className="sidebar-card" id="profile-sidebar-card">
            <div
              className="profile-card__banner"
              style={profileStats?.cover_url
                ? { backgroundImage: `url(${profileStats.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : {}}
            >
              <button className="banner-edit-btn" title="Upload cover picture" onClick={() => coverInputRef.current?.click()}>
                <CameraIcon />
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
            </div>

            <div className="profile-card__avatar-wrap" style={{ position: 'relative' }}>
              {profileStats?.avatar_url
                ? <img src={profileStats.avatar_url} alt="avatar" className="profile-card__avatar" style={{ objectFit: 'cover' }} />
                : <div className="profile-card__avatar">{displayName.charAt(0).toUpperCase()}</div>
              }
              <button
                onClick={() => avatarInputRef.current?.click()}
                title="Change profile photo"
                style={{ position: 'absolute', bottom: 0, right: -4, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              >
                <CameraIcon />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            <div className="profile-card__info">
              <div className="profile-card__name">{displayName}</div>
              <div className="profile-card__handle">@{handle}</div>
              <div className="profile-card__stats">
                <span className="profile-card__stat"><strong>{followingCount.toLocaleString()}</strong> Following</span>
                <span className="profile-card__stat"><strong>{followerCount.toLocaleString()}</strong> Followers</span>
              </div>
              <div className="profile-card__completion">Profile {completionPct}% complete</div>
              <div className="profile-card__progress">
                <div className="profile-card__progress-bar" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          </div>

          <nav className='sidebar-card' style={{display:'grid',gap:12,padding:16}}><Link to='/opportunities'>Opportunities & trials</Link><Link to='/applications'>Applications</Link><Link to='/alerts'>Opportunity alerts</Link><Link to='/compare'>Compare players</Link><Link to='/safety'>Safety centre</Link><Link to='/saved'>Saved posts</Link></nav>
          <button onClick={()=>{setPage(1);fetchFeed(activeTab,1)}} disabled={loadingMore}>Refresh feed</button><button onClick={()=>apiFetch('/api/feed/feedback',{method:'DELETE'}).then(()=>{setPage(1);fetchFeed(activeTab,1);showToast('Feed feedback reset. Your likes, saves and interests are unchanged.')}).catch(e=>showToast(e.message))}>Reset feed feedback</button>
          {/* Quick Actions */}
          <div className="sidebar-section">
            <div className="sidebar-section-title" style={{padding: '14px 16px 8px', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em'}}>Quick Actions</div>
            <a href="/profile" className="quick-action-item green">
              <div className="quick-action-icon">👤</div>
              <div className="quick-action-text">
                <div className="quick-action-label">Complete profile</div>
                <div className="quick-action-sub" style={{color: '#E8F5EC'}}>Add position & stats</div>
              </div>
            </a>
            <Link to="/upload-highlight" className="quick-action-item yellow">
              <div className="quick-action-icon">🎬</div>
              <div className="quick-action-text">
                <div className="quick-action-label">Upload highlight</div>
                <div className="quick-action-sub" style={{color: '#4B5563'}}>Show your skills</div>
              </div>
            </Link>
            <Link to="/squad" className="quick-action-item grey">
              <div className="quick-action-icon">🏟️</div>
              <div className="quick-action-text">
                <div className="quick-action-label">Manage squad</div>
                <div className="quick-action-sub" style={{color: '#6B7280'}}>Manage your team</div>
              </div>
            </Link>
          </div>

          {/* Topics */}
          <div className="sidebar-card" id="topics-card">
            <div className="sidebar-section-title">Topics</div>
            {TOPICS.map((t) => (
              <div key={t} className="topic-item">
                <span className="topic-name">{t}</span>
                <span className="topic-arrow">›</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Center Feed ─────────────────────────────────────────────────── */}
        <main className="feed-center" id="feed-center">
          {/* Tabs */}
          <div className="feed-tabs" id="feed-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`feed-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                id={`tab-${tab.toLowerCase().replace(/\s/g, '-')}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Compose box */}
          <div className="compose-box" id="compose-box">
            <div className="compose-row">
              <div className="compose-avatar">{displayName.charAt(0).toUpperCase()}</div>
              <input
                className="compose-input"
                placeholder="Share a football update…"
                readOnly
                onClick={() => setComposeOpen(true)}
                id="compose-trigger"
              />
            </div>
            <div className="compose-actions">
              <button className="compose-action-btn" onClick={() => setComposeOpen(true)} id="compose-video-btn">
                <VideoIcon /> Video
              </button>
              <button className="compose-action-btn" onClick={() => setComposeOpen(true)} id="compose-photo-btn">
                <ImageIcon /> Photos
              </button>
              <button className="compose-action-btn" onClick={() => setComposeOpen(true)} id="compose-poll-btn">
                <PollIcon /> Poll
              </button>
              <button className="compose-post-btn" onClick={() => setComposeOpen(true)} id="compose-post-btn">Post</button>
            </div>
          </div>

          {/* Highlights strip */}
          <div className="highlights-strip" id="highlights-strip">
            <div className="highlights-strip__title">Highlights</div>
            <div className="highlights-strip__sub" style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>Watch player clips, training footage, and tactical breakdowns.</div>
            <div className="highlights-scroll">
              {[
                { dur: '0:41', badge: 'Goal', name: 'Tunde Adebayo', handle: 'Forward · Abuja', stats: '12k · 24', img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=200&q=70' },
                { dur: '1:23', badge: 'Training', name: 'Chiamaka Nwosu', handle: 'Midfielder · Accra', stats: '8.1k · 87', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&q=70' },
                { dur: '3:15', badge: 'Assist', name: 'Kwame Mensah', handle: 'Defender · Lagos', stats: '11k · 64', img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&q=70' },
                { dur: '3:25', badge: 'Tactical', name: 'Tactical Breakdown', handle: 'Coach Musa Bello', stats: '6.4k · 62', img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=200&q=70' },
              ].map((h, i) => (
                <div key={i} className="highlight-thumb" id={`highlight-${i}`}>
                  <img src={h.img} alt={h.name} />
                  <div className="highlight-overlay">
                    <div className="highlight-thumb__top">
                      <span className="highlight-thumb__duration">{h.dur}</span>
                      <span className="highlight-thumb__bookmark"><BookmarkIcon /></span>
                    </div>
                    <div className="highlight-thumb__bottom">
                      <div className="highlight-author">
                        <div className="highlight-avatar"></div>
                        <div className="highlight-author-info">
                          <span className="highlight-thumb__name">{h.name}</span>
                          <span className="highlight-thumb__handle">{h.handle}</span>
                        </div>
                      </div>
                      <div className="highlight-meta-row">
                        <span className={`highlight-thumb__badge ${h.badge}`}>{h.badge}</span>
                        <span className="highlight-thumb__stats">👁 {h.stats.split('·')[0]} ♡ {h.stats.split('·')[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Posts */}
          {loading ? (
            [1, 2, 3].map((i) => <SkeletonPost key={i} />)
          ) : (
            <>
              {posts.map((post, idx) => (
                <>
                  <PostCard
                    onHide={id=>setPosts(items=>items.filter(p=>p.id!==id))}
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    toast={showToast}
                  />
                  {/* Promo cards interspersed in feed */}
                  {idx === 2 && (
                    <div className="promo-card green" id="promo-complete-profile">
                      <div className="promo-card__icon">👤</div>
                      <div className="promo-card__body">
                        <div className="promo-card__title">Complete your player profile</div>
                        <div className="promo-card__sub">Add your position, height, preferred foot, club history, and playing stats to help scouts and coaches discover your talent.</div>
                        <button className="promo-card__btn" onClick={() => navigate('/profile/me')}>Add details</button>
                      </div>
                    </div>
                  )}
                  {idx === 5 && (
                    <div className="promo-card yellow" id="promo-upload-video">
                      <div className="promo-card__icon">🎬</div>
                      <div className="promo-card__body">
                        <div className="promo-card__title">Upload your first highlight reel</div>
                        <div className="promo-card__sub">Show scouts and coaches what you can do. Upload match footage, training clips, or skill demonstrations.</div>
                        <button className="promo-card__btn" onClick={() => navigate('/highlights')}>Upload video</button>
                      </div>
                    </div>
                  )}

                </>
              ))}

              {hasMore && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <button
                    disabled={loadingMore}
                    onClick={() => { const next = page + 1; setPage(next); fetchFeed(activeTab, next) }}
                    style={{
                      padding: '10px 28px', borderRadius: 10,
                      border: '1.5px solid #E5E7EB', background: '#fff',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', color: '#374151',
                    }}
                    id="load-more-btn"
                  >
                    Load more
                  </button>
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 14 }}>
                  You're all caught up ⚽
                </div>
              )}
            </>
          )}
        </main>

        {/* ── Right Sidebar ────────────────────────────────────────────────── */}
        <aside className="feed-right-sidebar" id="right-sidebar">
          {/* Suggested players */}
          <div className="right-sidebar-card" id="suggested-players-card">
            <div className="right-sidebar-title">Who to Follow</div>
            {(suggestions.length > 0 ? suggestions : SUGGESTED.map((s) => ({
              id: s.name,
              display_name: s.name,
              username: s.name.toLowerCase().replace(/\s+/g, ''),
              user_type: 'player',
              avatar_url: null,
              is_verified: false,
              follower_count: 0,
              _initials: s.initials,
              _color: s.color,
              _isFollowing: s.following ?? false,
            }))).map((p) => {
              const isFollowing = suggestedFollowing[p.id] ?? p._isFollowing ?? false
              return (
                <div key={p.id} className="suggested-player-item">
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt={p.display_name} className="suggested-avatar" style={{ objectFit: 'cover' }} />
                    : <div className="suggested-avatar" style={{ background: p._color ?? '#1A7A2E' }}>
                        {(p._initials ?? p.display_name?.charAt(0) ?? '?').toUpperCase()}
                      </div>
                  }
                  <div className="suggested-info">
                    <div className="suggested-name">{p.display_name}</div>
                    <div className="suggested-sub">
                      {p.user_type?.charAt(0).toUpperCase() + p.user_type?.slice(1)}
                      {p.follower_count > 0 ? ` · ${p.follower_count.toLocaleString()} followers` : ''}
                    </div>
                  </div>
                  <button
                    className={`follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={() => toggleFollow(p.id, p.display_name, isFollowing)}
                    id={`follow-${(p.username || p.id).replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Trending */}
          <div className="right-sidebar-card" id="trending-card">
            <div className="right-sidebar-title">Trending Discussions</div>
            {TRENDING.map((t) => (
              <div key={t.name} className="trending-item">
                <span className="trending-name">{t.name}</span>
                <span className="trending-count">{t.count}</span>
              </div>
            ))}
          </div>

          {/* Upcoming Trials */}
          <div className="trials-card" id="trials-card">
            <div className="trials-card__title">Upcoming Trials</div>
            <div className="trials-card__sub">Lagos Slite U19 Open Trials this Saturday.</div>
            <button className="trials-card__btn" id="trials-details-btn">View details</button>
          </div>

          {/* Clubs near you */}
          <div className="right-sidebar-card" id="clubs-near-card">
            <div className="right-sidebar-title">Clubs Near You</div>
            {CLUBS_NEAR.map((c) => (
              <div key={c} className="club-near-item">
                <div className="club-dot">{c.charAt(0)}</div>
                <span className="club-near-name">{c}</span>
                <span className="club-near-arrow">›</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ── Compose Modal ────────────────────────────────────────────────────── */}
      {composeOpen && (
        <ComposeModal
          user={user}
          onClose={() => setComposeOpen(false)}
          onPost={handleNewPost}
        />
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <div className={`feed-toast ${toast ? 'show' : ''}`} id="feed-toast">{toast}</div>
    </div>
  )
}
