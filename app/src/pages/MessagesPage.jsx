import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/messages.css'

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
const VerifiedBadge = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="none">
    <circle cx="12" cy="12" r="10" fill="#1A7A2E"/>
    <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
)
const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
)
const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
  </svg>
)
const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
)
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A7A2E" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const StarIcon = ({ filled = true, color = 'currentColor' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const BookmarkIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const BellOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-6H6.5L5 17z"/><path d="M9 11V4a3 3 0 016 0v7"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
)
const FlagIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
)
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const UserPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/>
  </svg>
)

// ─── Time helper ─────────────────────────────────────────────────────────────

function formatMsgTime(dateStr) {
  const now = new Date()
  const d = new Date(dateStr)
  const secs = Math.floor((now - d) / 1000)
  if (secs < 60) return 'Just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`
  return `${Math.floor(secs / 86400)}d`
}

// ─── Initial Mock Data ───────────────────────────────────────────────────────

const INITIAL_CONVERSATIONS = [
  {
    id: 'c1',
    participant: {
      id: 'mfa',
      display_name: 'Mainland Football Academy',
      username: 'mainlandfa',
      role: 'Academy',
      is_verified: true,
      avatar_url: null,
      initials: 'MFA',
      color: '#166534',
      is_online: true,
      followers: '1.2k',
      players: 48,
      location: 'Lagos, Nigeria',
      level: 'Academy Level',
      cover_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
    },
    last_message: "We'd like to invite you for trials this Saturday.",
    time: '2m',
    unread_count: 2,
    is_muted: false,
    is_pinned: true,
  },
  {
    id: 'c2',
    participant: {
      id: 'mb',
      display_name: 'Coach Musa Bello',
      username: 'musabello',
      role: 'Coach',
      is_verified: true,
      avatar_url: null,
      initials: 'MB',
      color: '#1D4ED8',
      is_online: false,
      followers: '850',
      players: 22,
      location: 'Abuja, Nigeria',
      level: 'Head Coach',
      cover_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    },
    last_message: 'Your movement off the ball has improved...',
    time: '1h',
    unread_count: 0,
    is_muted: false,
    is_pinned: false,
  },
  {
    id: 'c3',
    participant: {
      id: 'ao',
      display_name: 'Ada Okonkwo',
      username: 'ada_ok',
      role: 'Fan',
      is_verified: false,
      avatar_url: null,
      initials: 'AO',
      color: '#7E22CE',
      is_online: false,
      followers: '340',
      players: 0,
      location: 'Lagos, Nigeria',
      level: 'Football Enthusiast',
      cover_url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
    },
    last_message: 'That U20 thread was br...',
    time: '3h',
    unread_count: 0,
    is_muted: false,
    is_pinned: false,
  },
  {
    id: 'c4',
    participant: {
      id: 'km',
      display_name: 'Kwame Mensah',
      username: 'kwame_m',
      role: 'Player',
      is_verified: false,
      avatar_url: null,
      initials: 'KM',
      color: '#B45309',
      is_online: true,
      followers: '1.5k',
      players: 0,
      location: 'Accra, Ghana',
      level: 'Midfielder',
      cover_url: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80',
    },
    last_message: 'Can you send your latest match clip?',
    time: '5h',
    unread_count: 0,
    is_muted: false,
    is_pinned: false,
  },
  {
    id: 'c5',
    participant: {
      id: 'lu',
      display_name: 'Lagos United Scout Team',
      username: 'lagosunited_scout',
      role: 'Scout',
      is_verified: true,
      avatar_url: null,
      initials: 'LU',
      color: '#15803D',
      is_online: true,
      followers: '4.2k',
      players: 120,
      location: 'Lagos, Nigeria',
      level: 'Talent Scout',
      cover_url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&q=80',
    },
    last_message: 'We reviewed your highlight video.',
    time: '1d',
    unread_count: 3,
    is_muted: false,
    is_pinned: false,
  },
]

const INITIAL_MESSAGES_MAP = {
  c1: [
    {
      id: 'm1',
      sender: 'them',
      type: 'text',
      content: 'Hi Tunde, we watched your latest highlight. Strong movement from the left side.',
      time: '10:14 AM',
    },
    {
      id: 'm2',
      sender: 'me',
      type: 'text',
      content: 'Thank you coach. I can send more clips from last weekend\'s match.',
      time: '10:16 AM',
      status: 'read',
    },
    {
      id: 'm3',
      sender: 'me',
      type: 'highlight',
      title: 'Goal vs Rangers Academy',
      tag: 'Goal',
      duration: '0:42',
      thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      time: '10:17 AM',
      status: 'read',
    },
    {
      id: 'm4',
      sender: 'them',
      type: 'text',
      content: "We'd like to invite you for trials this Saturday.",
      time: '10:20 AM',
    },
    {
      id: 'm5',
      sender: 'them',
      type: 'trial_invite',
      clubName: 'Mainland Football Academy',
      date: 'Saturday, 14 June 2026',
      trialTime: '10:00 AM',
      location: 'Teslim Balogun Stadium, Lagos',
      bring: 'Boots, ID, and training kit',
      time: '10:20 AM',
    },
    {
      id: 'm6',
      sender: 'system',
      type: 'system',
      content: 'Mainland Football Academy viewed your profile.',
    },
    {
      id: 'm7',
      sender: 'me',
      type: 'text',
      content: "I'm available. Please send the full details.",
      time: '10:22 AM',
      status: 'read',
    },
  ],
  c2: [
    {
      id: 'm201',
      sender: 'them',
      type: 'text',
      content: 'Hello Tunde, impressive press performance on Wednesday.',
      time: '9:30 AM',
    },
    {
      id: 'm202',
      sender: 'me',
      type: 'text',
      content: 'Appreciate it Coach Musa! Working on defensive positioning.',
      time: '9:45 AM',
      status: 'read',
    },
  ],
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()
  
  // State
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messagesMap, setMessagesMap] = useState({})
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [contextMenuConvId, setContextMenuConvId] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [followingState, setFollowingState] = useState({})
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [newChat, setNewChat] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [reload, setReload] = useState(0)

  const feedRef = useRef(null)
  const fileInputRef = useRef(null)

  // Scroll to bottom of message feed
  const scrollToBottom = useCallback(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [activeConvId, messagesMap, scrollToBottom])

  // ── Fetch conversations from API ───────────────────────────────────────
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await apiFetch('/api/messages/conversations')
        const convos = res.data?.data || res.data || []
        const mapped = convos.map((c) => {
          const other = c.other_participant || c.participant || {}
          const initials = (other.display_name || '??').split(' ').map(w => w[0]).join('').slice(0, 3)
          return {
            id: c.id,
            participant: {
              id: other.id,
              display_name: other.display_name || 'Unknown',
              username: other.username || '',
              role: other.user_type || 'Fan',
              is_verified: other.is_verified || false,
              avatar_url: other.avatar_url,
              initials,
              color: '#166534',
              is_online: false,
              followers: other.follower_count || 0,
              location: other.location || '',
            },
            last_message: c.last_message_content || c.last_message || '',
            time: c.last_message_at ? formatMsgTime(c.last_message_at) : '',
            unread_count: c.unread_count || 0,
            is_muted: false,
            is_pinned: false,
          }
        })
        setConversations(mapped)
        if (mapped.length > 0 && !activeConvId) {
          setActiveConvId(mapped[0].id)
        }
      } catch (e) {
        console.error('Failed to load conversations:', e)
        // Keep empty state — user will see empty inbox
      } finally {
        setLoadingConvos(false)
      }
    }
    loadConversations()
  }, [apiFetch, reload])

  // ── Fetch messages when active conversation changes ────────────────────
  useEffect(() => {
    if (!activeConvId) return
    if (messagesMap[activeConvId]) return // already loaded
    const loadMessages = async () => {
      try {
        const res = await apiFetch(`/api/messages/conversations/${activeConvId}?limit=50`)
        const msgs = res.data?.data || res.data || []
        const mapped = msgs.map((m) => ({
          id: m.id,
          sender: m.sender_id === user?.id ? 'me' : 'other',
          type: m.message_type || 'text',
          content: m.content || '',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: m.read_at ? 'read' : 'sent',
        }))
        setMessagesMap(prev => ({ ...prev, [activeConvId]: mapped }))
      } catch (e) {
        console.error('Failed to load messages:', e)
        setMessagesMap(prev => ({ ...prev, [activeConvId]: [] }))
      }
    }
    loadMessages()
  }, [activeConvId, apiFetch, user])

  // Toast handler
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Active conversation object
  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0]
  const activeMessages = messagesMap[activeConvId] || []

  // Send text message via API
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConvId) return
    const content = inputText.trim()
    
    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender: 'me',
      type: 'text',
      content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    }

    setMessagesMap((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), tempMsg],
    }))
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, last_message: content, time: 'Just now' }
          : c
      )
    )
    setInputText('')

    // Send to API
    try {
      const res = await apiFetch(`/api/messages/conversations/${activeConvId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      // Replace temp message with real one
      setMessagesMap((prev) => ({
        ...prev,
        [activeConvId]: (prev[activeConvId] || []).map(m =>
          m.id === tempMsg.id ? { ...m, id: res.data?.id || m.id, status: 'sent' } : m
        ),
      }))
    } catch (e) {
      setMessagesMap(prev => ({ ...prev, [activeConvId]: (prev[activeConvId] || []).filter(m => m.id !== tempMsg.id) }))
      setInputText(content)
      showToast(e.message || 'Failed to send message')
    }
  }

  // Quick Action Pill handlers
  const handleShareHighlight = () => setInputText('Take a look at this highlight: ')
  const handleSendTrialInvite = () => setInputText('Trial invitation\nDate: \nTime: \nVenue: \nWhat to bring: ')
  const handleShareProfile = () => setInputText(`${window.location.origin}/profile/${user.username}`)
  const handleAttachFile = () => showToast('Share a link to your document in the message box.')

  const startConversation = async e => {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    try {
      const profile = await apiFetch(`/api/profiles/${encodeURIComponent(recipient.replace(/^@/, '').trim())}`)
      const res = await apiFetch('/api/messages/conversations', { method: 'POST', body: JSON.stringify({ recipient_id: profile.data.id, message: firstMessage.trim() }) })
      setActiveConvId(res.data.conversation_id)
      setReload(n => n + 1)
      setNewChat(false); setRecipient(''); setFirstMessage('')
    } catch (err) { showToast(err.message) }
    finally { setCreating(false) }
  }

  // Context menu actions
  const handleToggleMute = (convId) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, is_muted: !c.is_muted } : c))
    )
    const target = conversations.find((c) => c.id === convId)
    showToast(target?.is_muted ? 'Conversation unmuted' : 'Conversation muted')
    setContextMenuConvId(null)
  }

  const handleTogglePin = (convId) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, is_pinned: !c.is_pinned } : c))
    )
    showToast('Conversation pin toggled')
    setContextMenuConvId(null)
  }

  const handleDeleteConv = async (convId) => {
    try {
      await apiFetch(`/api/messages/conversations/${convId}`, { method: 'DELETE' })
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (activeConvId === convId) setActiveConvId(null)
      showToast('Conversation removed')
    } catch (err) { showToast(err.message) }
    setContextMenuConvId(null)
  }

  const handleReportConv = () => {
    showToast('Conversation reported')
    setContextMenuConvId(null)
  }

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.participant.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
    if (filterRole === 'All') return matchesSearch
    if (filterRole === 'Unread') return matchesSearch && c.unread_count > 0
    return matchesSearch && c.participant.role === filterRole
  })

  return (
    <div className="msg-shell" onClick={() => setContextMenuConvId(null)}>
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
          <button className="msg-navbar__nav-link active">
            <MessagesIcon /> Messages
          </button>
        </nav>

        <button className="msg-navbar__notif-btn" aria-label="Notifications">
          <BellIcon />
          <span className="msg-navbar__notif-badge">3</span>
        </button>

        <div className="msg-navbar__avatar" title={user?.display_name || 'Profile'}>
          {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'Y'}
        </div>
      </header>

      {newChat && <div className="ff-modal-backdrop"><form className="ff-modal" onSubmit={startConversation} role="dialog" aria-modal="true" aria-label="New message">
        <h2>New message</h2><label>Recipient username<input required autoFocus value={recipient} onChange={e => setRecipient(e.target.value)} /></label>
        <label>Message<textarea required maxLength={2000} value={firstMessage} onChange={e => setFirstMessage(e.target.value)} /></label>
        <button disabled={creating || !firstMessage.trim()} type="submit">{creating ? 'Sending…' : 'Send message'}</button><button type="button" onClick={() => setNewChat(false)}>Cancel</button>
      </form></div>}
      {/* ── Main Content Area (3 Columns) ─────────────────────────────────── */}
      <div className="msg-container">
        
        {/* ── Left Column: Conversation Sidebar ───────────────────────────── */}
        <aside className="msg-sidebar">
          <div className="msg-sidebar__header">
            <h2 className="msg-sidebar__title">Messages</h2><button onClick={() => setNewChat(true)}>New message</button>
            <button className="msg-sidebar__filter-btn" onClick={(e) => {
              e.stopPropagation()
              const roles = ['All', 'Unread', 'Academy', 'Coach', 'Scout', 'Player', 'Fan']
              const nextIndex = (roles.indexOf(filterRole) + 1) % roles.length
              setFilterRole(roles[nextIndex])
            }}>
              {filterRole} ▾
            </button>
          </div>

          <div className="msg-sidebar__search">
            <span className="msg-sidebar__search-icon"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="msg-sidebar__list">
            {filteredConversations.map((conv) => {
              const p = conv.participant
              const isSelected = conv.id === activeConvId
              const isMenuOpen = contextMenuConvId === conv.id

              return (
                <div
                  key={conv.id}
                  className={`msg-conv-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setActiveConvId(conv.id)
                    // Clear unread count on click
                    setConversations((prev) =>
                      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
                    )
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setContextMenuConvId(conv.id)
                  }}
                >
                  <div className="msg-conv-item__avatar-wrap">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.display_name} className="msg-conv-item__avatar" />
                    ) : (
                      <div className="msg-conv-item__avatar" style={{ background: p.color }}>
                        {p.initials}
                      </div>
                    )}
                    {p.is_online && <div className="msg-conv-item__online-dot" />}
                  </div>

                  <div className="msg-conv-item__content">
                    <div className="msg-conv-item__top">
                      <div className="msg-conv-item__name-row">
                        <span className="msg-conv-item__name">{p.display_name}</span>
                        {p.is_verified && <VerifiedBadge />}
                        <span className={`msg-role-tag msg-role-tag--${p.role.toLowerCase()}`}>
                          {p.role}
                        </span>
                      </div>
                      <span className="msg-conv-item__time">{conv.time}</span>
                    </div>

                    <div className="msg-conv-item__bottom">
                      <p className={`msg-conv-item__snippet ${conv.unread_count > 0 ? 'unread' : ''}`}>
                        {conv.last_message}
                      </p>
                      {conv.unread_count > 0 && (
                        <div className="msg-conv-item__unread-badge">{conv.unread_count}</div>
                      )}
                    </div>
                  </div>

                  {/* Context Menu Popup */}
                  {isMenuOpen && (
                    <div className="msg-context-menu" onClick={(e) => e.stopPropagation()}>
                      <button className="msg-context-menu__item" onClick={() => handleToggleMute(conv.id)}>
                        <BellOffIcon /> {conv.is_muted ? 'Unmute conversation' : 'Mute conversation'}
                      </button>
                      <button className="msg-context-menu__item" onClick={() => handleTogglePin(conv.id)}>
                        <PinIcon /> {conv.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
                      </button>
                      <button className="msg-context-menu__item msg-context-menu__item--danger" onClick={() => handleDeleteConv(conv.id)}>
                        <TrashIcon /> Delete conversation
                      </button>
                      <button className="msg-context-menu__item" onClick={handleReportConv}>
                        <FlagIcon /> Report conversation
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── Middle Column: Chat Feed Area ───────────────────────────────── */}
        <section className="msg-chat-area">
          {/* Header */}
          <div className="msg-chat-header">
            <div className="msg-chat-header__info">
              {activeConv.participant.avatar_url ? (
                <img src={activeConv.participant.avatar_url} alt="" className="msg-chat-header__avatar" />
              ) : (
                <div className="msg-chat-header__avatar" style={{ background: activeConv.participant.color }}>
                  {activeConv.participant.initials}
                </div>
              )}
              <div className="msg-chat-header__details">
                <div className="msg-chat-header__name-row">
                  <span className="msg-chat-header__name">{activeConv.participant.display_name}</span>
                  {activeConv.participant.is_verified && <VerifiedBadge />}
                  <span className={`msg-role-tag msg-role-tag--${activeConv.participant.role.toLowerCase()}`}>
                    {activeConv.participant.role}
                  </span>
                </div>
                <div className="msg-chat-header__sub">
                  <span>@{activeConv.participant.username}</span>
                  <span>·</span>
                  {activeConv.participant.is_online && (
                    <span className="msg-chat-header__online-text">● Online</span>
                  )}
                </div>
              </div>
            </div>

            <div className="msg-chat-header__actions">
              <button className="msg-icon-btn" onClick={() => showToast(`Calling ${activeConv.participant.display_name}...`)}>
                <PhoneIcon />
              </button>
              <button className="msg-icon-btn" onClick={(e) => {
                e.stopPropagation()
                setContextMenuConvId(activeConvId)
              }}>
                <MoreIcon />
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="msg-chat-feed" ref={feedRef}>
            {activeMessages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="msg-system-pill">
                    {msg.content}
                  </div>
                )
              }

              const isMe = msg.sender === 'me'

              return (
                <div key={msg.id} className={`msg-row ${isMe ? 'msg-row--outgoing' : 'msg-row--incoming'}`}>
                  {!isMe && (
                    <div className="msg-row__avatar" style={{ background: activeConv.participant.color }}>
                      {activeConv.participant.initials}
                    </div>
                  )}

                  <div className="msg-bubble-wrap">
                    {/* Render different message bubble types */}
                    {msg.type === 'text' && (
                      <div className={`msg-bubble ${isMe ? 'msg-bubble--outgoing' : 'msg-bubble--incoming'}`}>
                        {msg.content}
                      </div>
                    )}

                    {msg.type === 'highlight' && (
                      <div className="msg-card-highlight">
                        <div className="msg-card-highlight__thumb">
                          <img src={msg.thumbnail} alt="" className="msg-card-highlight__img" />
                          <span className="msg-card-highlight__tag">{msg.tag}</span>
                          <span className="msg-card-highlight__duration">{msg.duration}</span>
                          <div className="msg-card-highlight__play-btn" onClick={() => navigate('/highlights')}>
                            <PlayIcon />
                          </div>
                        </div>
                        <div className="msg-card-highlight__body">
                          <h4 className="msg-card-highlight__title">{msg.title}</h4>
                          <button className="msg-card-highlight__btn" onClick={() => navigate('/highlights')}>
                            Watch Highlight
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.type === 'trial_invite' && (
                      <div className="msg-card-trial">
                        <div className="msg-card-trial__banner">
                          <StarIcon filled={true} color="#111827" />
                          <span>TRIAL INVITATION</span>
                        </div>
                        <div className="msg-card-trial__body">
                          <h3 className="msg-card-trial__club-name">{msg.clubName}</h3>
                          <div className="msg-card-trial__grid">
                            <span className="msg-card-trial__label">Date</span>
                            <span className="msg-card-trial__val">{msg.date}</span>
                            <span className="msg-card-trial__label">Time</span>
                            <span className="msg-card-trial__val">{msg.trialTime}</span>
                            <span className="msg-card-trial__label">Location</span>
                            <span className="msg-card-trial__val">{msg.location}</span>
                            <span className="msg-card-trial__label">Bring</span>
                            <span className="msg-card-trial__val">{msg.bring}</span>
                          </div>
                          <div className="msg-card-trial__actions">
                            <button className="msg-card-trial__btn-accept" onClick={() => showToast('Trial Invitation accepted!')}>
                              Accept
                            </button>
                            <button className="msg-card-trial__btn-ask" onClick={() => setInputText('Could you clarify the trial requirements?')}>
                              Ask question
                            </button>
                            <button className="msg-card-trial__btn-icon" onClick={() => showToast('Trial saved to bookmarks')}>
                              <BookmarkIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="msg-meta">
                      {isMe && <span className="msg-meta__checks">✓✓</span>}
                      <span>{msg.time}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Action Bar & Input */}
          <div className="msg-chat-input-area">
            <div className="msg-quick-bar">
              <span className="msg-quick-bar__label">Quick:</span>
              <button className="msg-quick-pill" onClick={handleShareHighlight}>
                <StarIcon filled={false} /> Share Highlight
              </button>
              <button className="msg-quick-pill" onClick={handleShareProfile}>
                👤 Share Profile
              </button>
              <button className="msg-quick-pill msg-quick-pill--highlighted" onClick={handleSendTrialInvite}>
                <StarIcon filled={true} color="#B45309" /> Send Trial Invite
              </button>
              <button className="msg-quick-pill" onClick={() => fileInputRef.current?.click()}>
                📄 Attach File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAttachFile}
              />
            </div>

            <div className="msg-input-box">
              <div className="msg-input-box__attach-btns">
                <button className="msg-input-box__attach-btn" onClick={() => fileInputRef.current?.click()}>
                  <PaperclipIcon />
                </button>
                <button className="msg-input-box__attach-btn" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon />
                </button>
              </div>

              <input
                type="text"
                placeholder="Write a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />

              <button
                className={`msg-input-box__send-btn ${inputText.trim() ? 'active' : ''}`}
                onClick={handleSendMessage}
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </section>

        {/* ── Right Column: User / Club Context Panel ─────────────────────── */}
        <aside className="msg-context-panel">
          {/* Card 1: Profile Card */}
          <div className="msg-context-card msg-context-card--profile">
            <div className="msg-context-card__cover">
              <img src={activeConv.participant.cover_url} alt="" className="msg-context-card__cover-img" />
            </div>
            <div className="msg-context-card__profile-body">
              <div className="msg-context-card__avatar-row">
                {activeConv.participant.avatar_url ? (
                  <img src={activeConv.participant.avatar_url} alt="" className="msg-context-card__avatar" />
                ) : (
                  <div className="msg-context-card__avatar" style={{ background: activeConv.participant.color }}>
                    {activeConv.participant.initials}
                  </div>
                )}
                {activeConv.participant.is_verified && (
                  <span className="msg-role-tag msg-role-tag--academy" style={{ gap: 4 }}>
                    <VerifiedBadge /> Verified
                  </span>
                )}
              </div>

              <div>
                <h3 className="msg-context-card__title">{activeConv.participant.display_name}</h3>
                <div className="msg-context-card__sub" style={{ marginTop: 2 }}>
                  <span className={`msg-role-tag msg-role-tag--${activeConv.participant.role.toLowerCase()}`}>
                    {activeConv.participant.role}
                  </span>{' '}
                  @{activeConv.participant.username}
                </div>
                <div className="msg-context-card__sub" style={{ marginTop: 6 }}>
                  {activeConv.participant.location} · {activeConv.participant.level}
                </div>
              </div>

              <div className="msg-context-card__stats">
                <span><strong>{activeConv.participant.followers}</strong> Followers</span>
                <span>·</span>
                <span><strong>{activeConv.participant.players}</strong> Players</span>
              </div>

              <div className="msg-context-card__actions">
                <button className="msg-btn-primary" onClick={() => showToast('Opening Club Page...')}>
                  View Club Page
                </button>
                <button
                  className="msg-btn-secondary"
                  onClick={() => {
                    const isF = followingState[activeConv.participant.id]
                    setFollowingState((prev) => ({ ...prev, [activeConv.participant.id]: !isF }))
                    showToast(isF ? `Unfollowed ${activeConv.participant.display_name}` : `Now following ${activeConv.participant.display_name}`)
                  }}
                >
                  {followingState[activeConv.participant.id] ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Shared in this chat */}
          <div className="msg-context-card">
            <div className="msg-context-card__header">Shared in this chat</div>
            <div>
              <div className="msg-shared-item" onClick={() => navigate('/highlights')}>
                <div className="msg-shared-item__icon"><PlayIcon /></div>
                <div className="msg-shared-item__content">
                  <div className="msg-shared-item__title">Goal vs Rangers Academy</div>
                  <div className="msg-shared-item__sub">Highlight · Today</div>
                </div>
                <div className="msg-shared-item__arrow"><ChevronRightIcon /></div>
              </div>

              <div className="msg-shared-item" onClick={() => showToast('Opening Trial Invitation details')}>
                <div className="msg-shared-item__icon"><StarIcon filled={true} color="#D97706" /></div>
                <div className="msg-shared-item__content">
                  <div className="msg-shared-item__title">Trial Invitation</div>
                  <div className="msg-shared-item__sub">Trial · Today</div>
                </div>
                <div className="msg-shared-item__arrow"><ChevronRightIcon /></div>
              </div>

              <div className="msg-shared-item" onClick={() => showToast('Opening Tunde Adebayo profile')}>
                <div className="msg-shared-item__icon"><UsersIcon /></div>
                <div className="msg-shared-item__content">
                  <div className="msg-shared-item__title">Tunde Adebayo</div>
                  <div className="msg-shared-item__sub">Player Profile · Yesterday</div>
                </div>
                <div className="msg-shared-item__arrow"><ChevronRightIcon /></div>
              </div>
            </div>
          </div>

          {/* Card 3: Football Actions */}
          <div className="msg-context-card">
            <div className="msg-context-card__header">Football Actions</div>
            <div>
              <div className="msg-action-row" onClick={() => showToast('Viewing Club Page')}>
                <EyeIcon /> View Club Page
              </div>
              <div className="msg-action-row" onClick={() => showToast('Viewing Squad List')}>
                <UsersIcon /> See Squad
              </div>
              <div className="msg-action-row msg-action-row--highlighted" onClick={() => showToast('Viewing Open Trials')}>
                <StarIcon filled={true} color="#B45309" /> See Trials
              </div>
              <div className="msg-action-row" onClick={() => showToast(`Following ${activeConv.participant.display_name}`)}>
                <UserPlusIcon /> Follow Club
              </div>
            </div>
          </div>

          {/* Card 4: Safety / Privacy Warning Box */}
          <div className="msg-safety-card">
            <div className="msg-safety-card__header">
              <span className="msg-safety-card__icon"><ShieldIcon /></span>
              <span>Only share personal documents with <strong>verified clubs, scouts, or coaches.</strong></span>
            </div>
            <div className="msg-safety-card__footer">
              <button className="msg-safety-card__btn" onClick={handleReportConv}>
                🚩 Report
              </button>
              <span>·</span>
              <button className="msg-safety-card__btn" onClick={() => showToast('User blocked')}>
                ✕ Block
              </button>
              <span>·</span>
              <button className="msg-safety-card__btn" onClick={() => handleToggleMute(activeConvId)}>
                🔇 Mute
              </button>
            </div>
          </div>

        </aside>
      </div>

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
          animation: 'fadeIn 0.2s ease',
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}
