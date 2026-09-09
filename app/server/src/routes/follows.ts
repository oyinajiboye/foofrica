import { canViewProfile, protectProfilePayload } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { createNotification } from '../services/notification.service'
import { cacheDelete, cacheDeletePattern, cacheKeys } from '../lib/redis'

const followRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler',fastify.optionalAuth)
  fastify.addHook('preSerialization',async(req,_reply,payload)=>protectProfilePayload(req.user?.id,payload))
  /**
   * POST /api/follows/:userId
   * Follow a user
   */
  fastify.post('/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId: targetId } = request.params as { userId: string }
    const followerId = request.user.id

    if (followerId === targetId) {
      return reply.status(400).send({ message: 'You cannot follow yourself' })
    }

    if(!await canViewProfile(followerId,targetId))return reply.code(403).send({message:'Account unavailable'})
    // Check target profile exists
    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name')
      .eq('id', targetId)
      .single()

    if (!target) {
      return reply.status(404).send({ message: 'User not found' })
    }

    // Check already following
    const { data: existing } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', targetId)
      .single()

    if (existing) {
      return reply.status(409).send({ message: 'Already following this user' })
    }

    // Insert follow record
    const { error } = await supabaseAdmin
      .from('follows')
      .insert({ follower_id: followerId, following_id: targetId })

    if (error) return reply.status(500).send({ message: error.message })

    // Update follower/following counts atomically via Postgres function
    await Promise.all([
      supabaseAdmin.rpc('increment_follower_count', { profile_id: targetId }),
      supabaseAdmin.rpc('increment_following_count', { profile_id: followerId }),
    ])

    // Invalidate caches
    await Promise.all([
      cacheDelete(cacheKeys.profile(followerId)),
      cacheDelete(cacheKeys.profile(targetId)),
      cacheDeletePattern(`feed:${followerId}:*`),
      cacheDelete(cacheKeys.followingIds(followerId)),
    ])

    // Send notification
    createNotification({
      recipientId: targetId,
      actorId: followerId,
      type: 'follow',
    }).catch(console.error)

    return reply.status(201).send({ success: true, message: `Now following ${target.display_name}` })
  })

  /**
   * DELETE /api/follows/:userId
   * Unfollow a user
   */
  fastify.delete('/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId: targetId } = request.params as { userId: string }
    const followerId = request.user.id

    const { error } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', targetId)

    if (error) return reply.status(500).send({ message: error.message })

    // Decrement counts
    await Promise.all([
      supabaseAdmin.rpc('decrement_follower_count', { profile_id: targetId }),
      supabaseAdmin.rpc('decrement_following_count', { profile_id: followerId }),
    ])

    // Invalidate caches
    await Promise.all([
      cacheDelete(cacheKeys.profile(followerId)),
      cacheDelete(cacheKeys.profile(targetId)),
      cacheDeletePattern(`feed:${followerId}:*`),
      cacheDelete(cacheKeys.followingIds(followerId)),
    ])

    return reply.send({ success: true, message: 'Unfollowed' })
  })

  /**
   * GET /api/follows/:userId/followers
   */
  fastify.get('/:userId/followers', async (request, reply) => {
    const { userId } = request.params as { userId: string }
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    const { data, error, count } = await supabaseAdmin
      .from('follows')
      .select(
        `follower:profiles!follows_follower_id_fkey(
          id, username, display_name, avatar_url, user_type, is_verified, follower_count
        )`,
        { count: 'exact' }
      )
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: {
        data: (data ?? []).map((f: any) => f.follower),
        total: count ?? 0,
        page: p,
        limit: l,
        hasMore: offset + l < (count ?? 0),
      },
    })
  })

  /**
   * GET /api/follows/:userId/following
   */
  fastify.get('/:userId/following', async (request, reply) => {
    const { userId } = request.params as { userId: string }
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    const { data, error, count } = await supabaseAdmin
      .from('follows')
      .select(
        `following:profiles!follows_following_id_fkey(
          id, username, display_name, avatar_url, user_type, is_verified, follower_count
        )`,
        { count: 'exact' }
      )
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: {
        data: (data ?? []).map((f: any) => f.following),
        total: count ?? 0,
        page: p,
        limit: l,
        hasMore: offset + l < (count ?? 0),
      },
    })
  })
}

export default followRoutes
