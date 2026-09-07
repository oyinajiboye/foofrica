import { supabaseAdmin } from '../lib/supabase'
import { cacheGet, cacheSet, cacheKeys, TTL } from '../lib/redis'
import type { Post, UserType } from '../types'

interface FeedOptions {
  userId: string
  userType: UserType
  page: number
  limit: number
  cursor?: string
}

/**
 * Personalized "For You" feed.
 * Algorithm:
 *   1. Get IDs of users this user follows (cached)
 *   2. Fetch user's stated interests + behavioural interest scores (cached)
 *   3. Fetch recent public posts
 *   4. Boost posts whose tags overlap with user interests
 *   5. Apply user-type weighting (scouts get more player video content)
 *   6. Boost followed user posts and verified accounts
 */
export async function getPersonalizedFeed(options: FeedOptions): Promise<Post[]> {
  const { userId, userType, page, limit, cursor } = options
  const offset = (page - 1) * limit
  const cacheKey = cacheKeys.feed(userId, 'foryou', page)

  // Try cache first (short TTL for feed freshness)
  const cached = await cacheGet<Post[]>(cacheKey)
  if (cached) return cached

  // Get following IDs and user interests in parallel
  const [followingIds, userInterests] = await Promise.all([
    getFollowingIds(userId),
    getUserInterests(userId),
  ])

  // Build the query — include tags in the select
  let query = supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, username, display_name, avatar_url, is_verified, verification_tier, user_type
      ),
      video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds, status)
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: posts, error } = await query

  if (error) throw new Error(`Feed error: ${error.message}`)

  // Add is_liked / is_reposted flags
  const enriched = await enrichPostsWithUserInteractions(posts ?? [], userId)

  // Personalize ordering by user type + interests
  const personalized = personalizeByUserType(enriched, userType, followingIds, userInterests)

  await cacheSet(cacheKey, personalized, TTL.feed)
  return personalized
}

/**
 * Chronological feed of followed users only.
 */
export async function getFollowingFeed(options: FeedOptions): Promise<Post[]> {
  const { userId, page, limit } = options
  const offset = (page - 1) * limit

  const followingIds = await getFollowingIds(userId)
  if (followingIds.length === 0) return []

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, username, display_name, avatar_url, is_verified, verification_tier, user_type
      ),
      video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds, status)
    `)
    .in('author_id', followingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Following feed error: ${error.message}`)

  return enrichPostsWithUserInteractions(posts ?? [], userId)
}

/**
 * Trending posts — sorted by engagement velocity (likes + comments + reposts / time).
 */
export async function getTrendingFeed(page: number, limit: number): Promise<Post[]> {
  const cacheKey = cacheKeys.trending()
  const cached = await cacheGet<Post[]>(cacheKey)
  if (cached) {
    const offset = (page - 1) * limit
    return cached.slice(offset, offset + limit)
  }

  // Posts from the last 48 hours, sorted by engagement
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, username, display_name, avatar_url, is_verified, verification_tier, user_type
      ),
      video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds, status)
    `)
    .eq('visibility', 'public')
    .gte('created_at', since)
    .order('likes_count', { ascending: false })
    .limit(100) // Fetch top 100 then rank

  if (error) throw new Error(`Trending feed error: ${error.message}`)

  // Score by engagement velocity
  const scored = (posts ?? [])
    .map((post) => ({
      ...post,
      _score: computeEngagementScore(post),
    }))
    .sort((a, b) => b._score - a._score)

  await cacheSet(cacheKey, scored, TTL.trending)

  const offset = (page - 1) * limit
  return scored.slice(offset, offset + limit)
}

/**
 * Discovery feed — content from users this person doesn't follow.
 */
export async function getDiscoveryFeed(options: FeedOptions): Promise<Post[]> {
  const { userId, page, limit } = options
  const offset = (page - 1) * limit

  const followingIds = await getFollowingIds(userId)
  const excludeIds = [userId, ...followingIds]

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, username, display_name, avatar_url, is_verified, verification_tier, user_type
      ),
      video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds, status)
    `)
    .eq('visibility', 'public')
    .eq('post_type', 'video') // Discovery focuses on video content
    .not('author_id', 'in', `(${excludeIds.join(',')})`)
    .order('likes_count', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Discovery feed error: ${error.message}`)

  return enrichPostsWithUserInteractions(posts ?? [], userId)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getFollowingIds(userId: string): Promise<string[]> {
  const cacheKey = cacheKeys.followingIds(userId)
  const cached = await cacheGet<string[]>(cacheKey)
  if (cached) return cached

  const { data, error } = await supabaseAdmin
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (error) return []

  const ids = (data ?? []).map((f) => f.following_id)
  await cacheSet(cacheKey, ids, TTL.followingIds)
  return ids
}

/**
 * Get the set of interest tags for a user.
 * Phase 1: uses stated profile interests.
 * Phase 2: merges with behavioural scores from user_interest_scores table.
 */
async function getUserInterests(userId: string): Promise<Set<string>> {
  const cacheKey = `user:${userId}:interests`
  const cached = await cacheGet<string[]>(cacheKey)
  if (cached) return new Set(cached)

  // Fetch both stated interests and top behavioural scores in parallel
  const [profileResult, scoresResult] = await Promise.all([
    supabaseAdmin.from('profiles').select('interests').eq('id', userId).single(),
    supabaseAdmin
      .from('user_interest_scores')
      .select('tag')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(20),
  ])

  const statedInterests: string[] = profileResult.data?.interests ?? []
  const behaviouralTags: string[] = (scoresResult.data ?? []).map((r) => r.tag)

  // Merge — behavioural signals take precedence but stated interests seed cold-start
  const allTags = Array.from(new Set([...behaviouralTags, ...statedInterests]))

  await cacheSet(cacheKey, allTags, 300) // cache for 5 minutes
  return new Set(allTags)
}

async function enrichPostsWithUserInteractions(
  posts: Post[],
  userId: string
): Promise<Post[]> {
  if (posts.length === 0) return []

  const postIds = posts.map((p) => p.id)

  const [likesResult, repostsResult] = await Promise.all([
    supabaseAdmin.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
    supabaseAdmin.from('reposts').select('post_id').eq('user_id', userId).in('post_id', postIds),
  ])

  const likedIds = new Set((likesResult.data ?? []).map((l) => l.post_id))
  const repostedIds = new Set((repostsResult.data ?? []).map((r) => r.post_id))

  return posts.map((post) => ({
    ...post,
    is_liked: likedIds.has(post.id),
    is_reposted: repostedIds.has(post.id),
  }))
}

function computeEngagementScore(post: Post & { created_at: string }): number {
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
  const engagement = post.likes_count * 1 + post.comments_count * 2 + post.reposts_count * 3
  // Decay engagement score over time (gravity = 1.5)
  return engagement / Math.pow(ageHours + 2, 1.5)
}

function personalizeByUserType(
  posts: Post[],
  userType: UserType,
  followingIds: string[],
  userInterests: Set<string>
): Post[] {
  return posts.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    // ── 1. Following boost — posts from people you follow surface first
    if (followingIds.includes(a.author_id)) scoreA += 5
    if (followingIds.includes(b.author_id)) scoreB += 5

    // ── 2. Interest-tag overlap — the core personalisation signal
    //    Each matching tag contributes +3 to the post score.
    //    A post tagged ['Grassroots football', 'Nigeria'] shown to a user
    //    interested in those topics scores +6 vs an untagged post scoring 0.
    if (userInterests.size > 0) {
      const tagsA: string[] = (a as any).tags ?? []
      const tagsB: string[] = (b as any).tags ?? []
      const overlapA = tagsA.filter((t) => userInterests.has(t)).length
      const overlapB = tagsB.filter((t) => userInterests.has(t)).length
      scoreA += overlapA * 3
      scoreB += overlapB * 3
    }

    // ── 3. User-type weighting
    // Scout/Agent: prefer video posts (highlight reels, match clips)
    if (userType === 'scout') {
      if (a.post_type === 'video') scoreA += 3
      if (b.post_type === 'video') scoreB += 3
    }

    // Fan: prefer high-engagement posts and discussions
    if (userType === 'fan') {
      scoreA += Math.log(a.likes_count + a.comments_count + 1)
      scoreB += Math.log(b.likes_count + b.comments_count + 1)
    }

    // Player: prefer posts from clubs, scouts, coaches (career relevance)
    if (userType === 'player') {
      const relevantTypes = ['club', 'scout', 'coach']
      if (relevantTypes.includes((a.author as any)?.user_type)) scoreA += 2
      if (relevantTypes.includes((b.author as any)?.user_type)) scoreB += 2
    }

    // ── 4. Verified account boost
    if ((a.author as any)?.is_verified) scoreA += 2
    if ((b.author as any)?.is_verified) scoreB += 2

    // ── 5. Engagement velocity (log scale to prevent viral posts from dominating)
    scoreA += Math.log(a.likes_count + a.reposts_count + 1) * 0.5
    scoreB += Math.log(b.likes_count + b.reposts_count + 1) * 0.5

    return scoreB - scoreA
  })
}

// ─── Match Day Feed ────────────────────────────────────────────────────────────

const MATCH_DAY_TAGS = ['match', 'matchday', 'gameday', 'afcon', 'premier league', 'champions league', 'laliga', 'bundesliga', 'seria a', 'live', 'fixtureday']
const MATCH_DAY_HASHTAGS = ['matchday', 'gameday', 'afcon2026', 'premierleague', 'championsleague', 'footballlive']

/**
 * Match Day feed — surfaces posts about live/upcoming matches, game results, fixture discussions.
 * Uses hashtag matching and engagement velocity to surface timely content.
 */
export async function getMatchDayFeed(options: FeedOptions): Promise<Post[]> {
  const { userId, userType, page, limit } = options
  const offset = (page - 1) * limit

  // Posts from the last 72 hours tagged with match-day content
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, username, display_name, avatar_url, is_verified, verification_tier, user_type
      ),
      video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds, status)
    `)
    .eq('visibility', 'public')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit + 20 - 1) // fetch slightly more to filter

  if (error) throw new Error(`Match Day feed error: ${error.message}`)

  // Filter posts that contain match-day hashtags OR match-day tags
  const matchDayPosts = (posts ?? []).filter((post) => {
    const postHashtags: string[] = (post.hashtags ?? []).map((h: string) => h.toLowerCase())
    const postTags: string[] = ((post as any).tags ?? []).map((t: string) => t.toLowerCase())
    const hasMatchHashtag = postHashtags.some((h) => MATCH_DAY_HASHTAGS.includes(h))
    const hasMatchTag = postTags.some((t) => MATCH_DAY_TAGS.some((mt) => t.includes(mt)))
    const hasMatchContent = (post.content ?? '').toLowerCase().match(/\b(match|game|vs|score|goal|fixture|live)\b/)
    return hasMatchHashtag || hasMatchTag || !!hasMatchContent
  }).slice(0, limit)

  // If not enough match-day posts, fall back to trending posts as padding
  if (matchDayPosts.length < limit) {
    const trending = await getTrendingFeed(1, limit - matchDayPosts.length)
    const existingIds = new Set(matchDayPosts.map((p) => p.id))
    const padding = trending.filter((p) => !existingIds.has(p.id))
    matchDayPosts.push(...padding)
  }

  return enrichPostsWithUserInteractions(matchDayPosts, userId)
}

// ─── Highlights Strip ──────────────────────────────────────────────────────────

/**
 * Get the top video posts from the last 7 days for the Highlights strip.
 * Ranked by engagement score, filtered to video post type only.
 */
export async function getFeedHighlights(limit: number = 10): Promise<Post[]> {
  const cacheKey = 'feed:highlights'
  const cached = await cacheGet<Post[]>(cacheKey)
  if (cached) return cached.slice(0, limit)

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, username, display_name, avatar_url, is_verified, user_type
      ),
      video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds, status)
    `)
    .eq('visibility', 'public')
    .eq('post_type', 'video')
    .not('video_id', 'is', null)
    .gte('created_at', since)
    .order('likes_count', { ascending: false })
    .limit(50)

  if (error) throw new Error(`Highlights error: ${error.message}`)

  // Sort by engagement score to surface the most viral highlights
  const scored = (posts ?? [])
    .map((post) => ({ ...post, _score: computeEngagementScore(post) }))
    .sort((a, b) => b._score - a._score)

  await cacheSet(cacheKey, scored, 300) // 5 min cache
  return scored.slice(0, limit)
}

// ─── Suggested Profiles ────────────────────────────────────────────────────────

interface SuggestedProfile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  user_type: string
  is_verified: boolean
  follower_count: number
  mutual_follows?: number
}

/**
 * Get suggested profiles for the right sidebar "Who to Follow" section.
 * Algorithm:
 *   1. Exclude users the current user already follows + themselves
 *   2. Prioritise profiles with user-type relevance to the current user
 *   3. Boost profiles with mutual connections
 *   4. Sort by follower_count as a proxy for credibility
 */
export async function getSuggestedProfiles(
  userId: string,
  userType: UserType,
  limit: number = 5
): Promise<SuggestedProfile[]> {
  const cacheKey = `suggestions:${userId}`
  const cached = await cacheGet<SuggestedProfile[]>(cacheKey)
  if (cached) return cached.slice(0, limit)

  // Get list of users already followed
  const followingIds = await getFollowingIds(userId)
  const excludeIds = [userId, ...followingIds]

  // Determine preferred user_types to suggest based on the current user's type
  const preferredTypes: Record<string, string[]> = {
    player:  ['scout', 'coach', 'club', 'player'],
    scout:   ['player', 'coach', 'club'],
    coach:   ['player', 'club', 'scout'],
    club:    ['player', 'coach', 'scout'],
    fan:     ['player', 'club', 'coach'],
  }
  const preferred = preferredTypes[userType] ?? ['player', 'club', 'coach', 'scout']

  // Fetch a pool of candidates — fetch more than needed to rank and slice
  const { data: candidates, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, display_name, avatar_url, user_type, is_verified, follower_count')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .in('user_type', preferred)
    .order('follower_count', { ascending: false })
    .limit(50)

  if (error) return []

  // Score and sort candidates
  const scored = (candidates ?? []).map((profile) => {
    let score = 0
    // User-type relevance — higher score for more relevant types
    const typeIndex = preferred.indexOf(profile.user_type)
    if (typeIndex !== -1) score += (preferred.length - typeIndex) * 3

    // Credibility signals
    if (profile.is_verified) score += 5
    score += Math.log(profile.follower_count + 1) * 2

    return { ...profile, _score: score }
  }).sort((a, b) => b._score - a._score)

  const results = scored.slice(0, limit).map(({ _score, ...p }) => p as SuggestedProfile)

  await cacheSet(cacheKey, results, 300) // 5 min cache
  return results
}

