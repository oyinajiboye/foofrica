// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserType = 'player' | 'club' | 'scout' | 'coach' | 'fan'

export type VerificationTier = 'professional' | 'organization' | 'player' | 'contributor'

export type DominantFoot = 'left' | 'right' | 'both'

export type PlayerPosition =
  | 'GK' | 'CB' | 'LB' | 'RB'
  | 'CDM' | 'CM' | 'CAM'
  | 'LW' | 'RW' | 'ST' | 'CF'

export type PostType = 'text' | 'video' | 'image' | 'poll'

export type VideoStatus = 'processing' | 'ready' | 'failed'

export type VideoMatchType = 'match' | 'training' | 'highlight'

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'message'
  | 'endorsement'
  | 'verification'
  | 'shortlist'
  | 'opportunity'
  | 'application'
  | 'squad'

export type EndorsementSkill =
  | 'pace'
  | 'acceleration'
  | 'ball_control'
  | 'first_touch'
  | 'shooting'
  | 'finishing'
  | 'passing'
  | 'crossing'
  | 'dribbling'
  | 'defending'
  | 'tackling'
  | 'heading'
  | 'positioning'
  | 'vision'
  | 'work_rate'
  | 'leadership'
  | 'communication'
  | 'goalkeeping'

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  user_type: UserType
  is_verified: boolean
  verification_tier: VerificationTier | null
  follower_count: number
  following_count: number
  post_count: number
  fcm_token: string | null
  created_at: string
  updated_at: string
}

export interface PlayerProfile {
  profile_id: string
  full_name: string
  date_of_birth: string | null
  nationality: string | null
  height_cm: number | null
  weight_kg: number | null
  dominant_foot: DominantFoot | null
  primary_position: PlayerPosition | null
  secondary_positions: PlayerPosition[]
  playing_style_tags: string[]
  current_club_id: string | null
  jersey_number: number | null
}

export interface PlayerStats {
  id: string
  player_id: string
  season: string
  club_id: string | null
  club_name: string
  appearances: number
  goals: number
  assists: number
  clean_sheets: number
  yellow_cards: number
  red_cards: number
}

export interface CareerEntry {
  id: string
  player_id: string
  club_name: string
  start_date: string
  end_date: string | null
  role: string | null
  is_current: boolean
}

export interface ClubProfile {
  profile_id: string
  club_name: string
  founded_year: number | null
  country: string | null
  city: string | null
  league: string | null
  logo_url: string | null
  banner_url: string | null
}

export interface ScoutProfile {
  profile_id: string
  organization: string | null
  license_number: string | null
  specialization: string[]
  regions_covered: string[]
}

export interface CoachProfile {
  profile_id: string
  license_level: string | null
  specialization: string[]
  current_club_id: string | null
}

export interface FanProfile {
  profile_id: string
  favorite_club_id: string | null
  favorite_club_name: string | null
  football_interests: string[]
}

export interface Post {
  id: string
  author_id: string
  content: string | null
  post_type: PostType
  video_id: string | null
  image_urls: string[]
  repost_of: string | null
  likes_count: number
  comments_count: number
  reposts_count: number
  hashtags: string[]
  mentions: string[]
  visibility: 'public' | 'followers'
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
  video?: Video
  is_liked?: boolean
  is_reposted?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  likes_count: number
  created_at: string
  author?: Profile
}

export interface Video {
  id: string
  uploader_id: string
  cloudflare_uid: string
  cloudflare_playback_url: string | null
  title: string | null
  description: string | null
  match_type: VideoMatchType | null
  position_played: PlayerPosition | null
  key_actions: string[]
  thumbnail_url: string | null
  duration_seconds: number | null
  status: VideoStatus
  views_count: number
  created_at: string
}

export interface Conversation {
  id: string
  participant_ids: string[]
  last_message: string | null
  last_message_at: string | null
  created_at: string
  // Joined
  other_participant?: Profile
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
  sender?: Profile
}

export interface Notification {
  id: string
  recipient_id: string
  actor_id: string
  type: NotificationType
  entity_type: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
  actor?: Profile
}

export interface Endorsement {
  id: string
  endorser_id: string
  player_id: string
  skill: EndorsementSkill
  created_at: string
  endorser?: Profile
}

export interface Shortlist {
  id: string
  scout_id: string
  name: string
  description: string | null
  player_count: number
  created_at: string
  updated_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface UserSettings {
  user_id: string

  // Privacy
  profile_visibility: 'public' | 'private'
  who_can_dm: 'everyone' | 'followers' | 'nobody'
  show_online_status: boolean
  show_location: boolean
  show_age: boolean

  // Messaging
  message_requests: boolean
  auto_accept_verified: boolean

  // Notification toggles
  notify_likes: boolean
  notify_comments: boolean
  notify_follows: boolean
  notify_messages: boolean
  notify_mentions: boolean
  notify_endorsements: boolean
  notify_shortlists: boolean
  notify_push_enabled: boolean
  notify_email_enabled: boolean

  // Discovery
  discovery_positions: PlayerPosition[]
  discovery_min_age: number | null
  discovery_max_age: number | null
  discovery_countries: string[]

  created_at: string
  updated_at: string
}

export interface BlockedUser {
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface MutedUser {
  muter_id: string
  muted_id: string
  created_at: string
}

export interface Bookmark {
  user_id: string
  post_id: string
  created_at: string
}

export interface ReportInput {
  entity_type: 'post' | 'comment' | 'profile' | 'video'
  entity_id: string
  reported_user_id?: string
  reason: string
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  message?: string
}

export interface ApiError {
  statusCode: number
  error: string
  message: string
}

// ─── Search Input Types ──────────────────────────────────────────────────────

export interface PlayerSearchInput {
  q?: string
  position?: PlayerPosition
  dominant_foot?: DominantFoot
  nationality?: string
  country?: string
  city?: string
  min_height?: number
  max_height?: number
  min_age?: number
  max_age?: number
  club?: string
  verified_only?: boolean
  page?: number
  limit?: number
}

// ─── Algolia Index Types ──────────────────────────────────────────────────────

export interface AlgoliaPlayer {
  objectID: string
  profile_id: string
  display_name: string
  username: string
  avatar_url: string | null
  primary_position: PlayerPosition | null
  secondary_positions: PlayerPosition[]
  nationality: string | null
  country: string | null
  city: string | null
  height_cm: number | null
  weight_kg: number | null
  dominant_foot: DominantFoot | null
  current_club_name: string | null
  is_verified: boolean
  playing_style_tags: string[]
  follower_count: number
  updated_at: string
}

// ─── Request Context ──────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string | undefined
  user_type: UserType
  profile: Profile
}
