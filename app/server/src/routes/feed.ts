import { z } from 'zod'
import { recommendedFeed } from '../services/recommendation.service'
import { canViewPost } from '../services/access.service'
import { visiblePosts, canViewProfile, publicProfile } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { getFollowingFeed, getTrendingFeed, getDiscoveryFeed, getMatchDayFeed, getFeedHighlights, getSuggestedProfiles } from '../services/feed.service'
import { feedQuerySchema } from '../schemas/post.schemas'
import { supabaseAdmin } from '../lib/supabase'
import { cacheGet, cacheSet, cacheKeys } from '../lib/redis'

const feedRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler',fastify.optionalAuth)
  fastify.post('/feedback/:id',{preHandler:[fastify.authenticate]},async(request,reply)=>{
    const {id}=z.object({id:z.string().uuid()}).parse(request.params)
    const {kind}=z.object({kind:z.enum(['impression','interested','dismissed','profile_open'])}).parse(request.body)
    const {data:post,error}=await supabaseAdmin.from('posts').select('author_id,visibility').eq('id',id).maybeSingle()
    if(error)return reply.code(503).send({message:'Unable to save feedback'})
    if(!post||!await canViewPost(request.user.id,post))return reply.code(403).send({message:'Post unavailable'})
    const result=await supabaseAdmin.from('feed_feedback').upsert({user_id:request.user.id,post_id:id,kind,created_at:new Date().toISOString()},{onConflict:'user_id,post_id,kind'})
    if(result.error)return reply.code(503).send({message:'Unable to save feedback'})
    return {success:true}
  })
  fastify.delete('/feedback',{preHandler:[fastify.authenticate]},async(request,reply)=>{
    const {error}=await supabaseAdmin.from('feed_feedback').delete().eq('user_id',request.user.id)
    if(error)return reply.code(503).send({message:'Unable to reset feedback'})
    await supabaseAdmin.from('feed_sessions').delete().eq('user_id',request.user.id)
    return {success:true}
  })

  /**
   * GET /api/feed
   * Personalized "For You" feed
   */
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page, limit, cursor } = feedQuerySchema.parse(request.query)

    const data=await recommendedFeed(request.user.id,request.user.user_type,limit,cursor)
    return reply.send({success:true,data})
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

    return reply.send({ success: true, data: await visiblePosts(request.user?.id,posts) })
  })

  /**
   * GET /api/feed/trending
   * Trending posts (no auth required)
   */
  fastify.get('/trending', async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const posts = await getTrendingFeed(Number(page), Number(limit))
    return reply.send({ success: true, data: await visiblePosts(request.user?.id,posts) })
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

    return reply.send({ success: true, data: await visiblePosts(request.user?.id,posts) })
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

    return reply.send({ success: true, data: await visiblePosts(request.user?.id,posts) })
  })

  /**
   * GET /api/feed/highlights
   * Curated video highlights strip — top video posts from last 7 days
   * Used by the Highlights strip in the center feed column
   */
  fastify.get('/highlights', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { limit = '10' } = request.query as Record<string, string>
    const highlights = await getFeedHighlights(Number(limit))
    return reply.send({ success: true, data: await visiblePosts(request.user?.id,highlights) })
  })

  /**
   * GET /api/feed/suggestions
   * Suggested profiles to follow — shown in the right sidebar
   * Returns profiles the current user doesn't already follow, ranked by relevance
   */
  fastify.get('/suggestions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { limit = '5' } = request.query as Record<string, string>
    const suggestions = await getSuggestedProfiles(request.user.id, request.user.user_type, Number(limit))
    return reply.send({ success: true, data: await Promise.all((await Promise.all(suggestions.map(async (p:any)=>await canViewProfile(request.user.id,p.id)?p:null))).filter(Boolean).map(p=>publicProfile(request.user.id,p))) })
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
