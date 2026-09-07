import type { FastifyPluginAsync } from 'fastify'
import { getPersonalizedFeed, getFollowingFeed, getTrendingFeed, getDiscoveryFeed, getMatchDayFeed, getFeedHighlights, getSuggestedProfiles } from '../services/feed.service'
import { feedQuerySchema } from '../schemas/post.schemas'
import { supabaseAdmin } from '../lib/supabase'
import { cacheGet, cacheSet, cacheKeys } from '../lib/redis'

const feedRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/feed
   * Personalized "For You" feed
   */
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page, limit, cursor } = feedQuerySchema.parse(request.query)

    const posts = await getPersonalizedFeed({
      userId: request.user.id,
      userType: request.user.user_type,
      page,
      limit,
      cursor,
    })

    return reply.send({ success: true, data: posts })
  })

  /**
   * GET /api/feed/following
   * Chronological feed from followed users
   */
  fastify.get('/following', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page, limit, cursor } = feedQuerySchema.parse(request.query)

    const posts = await getFollowingFeed({
      userId: request.user.id,
      userType: request.user.user_type,
      page,
      limit,
      cursor,
    })

    return reply.send({ success: true, data: posts })
  })

  /**
   * GET /api/feed/trending
   * Trending posts (no auth required)
   */
  fastify.get('/trending', async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const posts = await getTrendingFeed(Number(page), Number(limit))
    return reply.send({ success: true, data: posts })
  })

  /**
   * GET /api/feed/discover
   * Discovery feed — content outside your network
   */
  fastify.get('/discover', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page, limit } = feedQuerySchema.parse(request.query)

    const posts = await getDiscoveryFeed({
      userId: request.user.id,
      userType: request.user.user_type,
      page,
      limit,
    })

    return reply.send({ success: true, data: posts })
  })

  /**
   * GET /api/feed/match-day
   * Match Day feed — posts tagged with match/game related content
   */
  fastify.get('/match-day', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page, limit } = feedQuerySchema.parse(request.query)

    const posts = await getMatchDayFeed({
      userId: request.user.id,
      userType: request.user.user_type,
      page,
      limit,
    })

    return reply.send({ success: true, data: posts })
  })

  /**
   * GET /api/feed/highlights
   * Curated video highlights strip — top video posts from last 7 days
   * Used by the Highlights strip in the center feed column
   */
  fastify.get('/highlights', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { limit = '10' } = request.query as Record<string, string>
    const highlights = await getFeedHighlights(Number(limit))
    return reply.send({ success: true, data: highlights })
  })

  /**
   * GET /api/feed/suggestions
   * Suggested profiles to follow — shown in the right sidebar
   * Returns profiles the current user doesn't already follow, ranked by relevance
   */
  fastify.get('/suggestions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { limit = '5' } = request.query as Record<string, string>
    const suggestions = await getSuggestedProfiles(request.user.id, request.user.user_type, Number(limit))
    return reply.send({ success: true, data: suggestions })
  })

  /**
   * GET /api/feed/me/stats
   * Profile completion stats for the left sidebar card
   * Returns the logged-in user's profile with follower/following counts and completion %
   */
  fastify.get('/me/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id
    const cacheKey = `profile:stats:${userId}`

    const cached = await cacheGet(cacheKey)
    if (cached) return reply.send({ success: true, data: cached })

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, username, display_name, avatar_url, cover_url, bio, user_type,
        follower_count, following_count, post_count, is_verified,
        interests, location, website_url
      `)
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return reply.status(404).send({ message: 'Profile not found' })
    }

    // Calculate profile completion percentage
    const completionFields = [
      !!profile.display_name,
      !!profile.username,
      !!profile.bio,
      !!profile.avatar_url,
      !!profile.cover_url,
      !!profile.location,
      !!profile.website_url,
      Array.isArray(profile.interests) && profile.interests.length > 0,
    ]
    const completedCount = completionFields.filter(Boolean).length
    const completion_percent = Math.round((completedCount / completionFields.length) * 100)

    const result = { ...profile, completion_percent }
    await cacheSet(cacheKey, result, 120) // 2 min cache

    return reply.send({ success: true, data: result })
  })
}

export default feedRoutes
