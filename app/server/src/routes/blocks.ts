import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { cacheDelete, cacheKeys } from '../lib/redis'

const blockRoutes: FastifyPluginAsync = async (fastify) => {
  // ── BLOCKED USERS ─────────────────────────────────────────────────────────

  /**
   * POST /api/blocks/:userId
   * Block a user — also auto-unfollows in both directions
   */
  fastify.post('/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId: targetId } = request.params as { userId: string }
    const blockerId = request.user.id

    if (blockerId === targetId) {
      return reply.status(400).send({ message: 'You cannot block yourself' })
    }

    // Check target exists
    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name')
      .eq('id', targetId)
      .single()

    if (!target) {
      return reply.status(404).send({ message: 'User not found' })
    }

    // Insert block record
    const { error } = await supabaseAdmin
      .from('blocked_users')
      .insert({ blocker_id: blockerId, blocked_id: targetId })

    if (error?.code === '23505') {
      return reply.status(409).send({ message: 'User already blocked' })
    }
    if (error) return reply.status(500).send({ message: error.message })

    // Count only relationships that were actually removed.
    for(const [follower,following] of [[blockerId,targetId],[targetId,blockerId]]){
      const {data:removed,error:removeError}=await supabaseAdmin.from('follows').delete().eq('follower_id',follower).eq('following_id',following).select('follower_id')
      if(removeError)return reply.code(500).send({message:'Block saved but follow cleanup failed.'})
      if(removed?.length)await Promise.all([supabaseAdmin.rpc('decrement_following_count',{profile_id:follower}),supabaseAdmin.rpc('decrement_follower_count',{profile_id:following})])
    }

    // Bust caches
    await Promise.all([
      cacheDelete(cacheKeys.profile(blockerId)),
      cacheDelete(cacheKeys.profile(targetId)),
    ])

    return reply.status(201).send({
      success: true,
      message: `${target.display_name} blocked`,
    })
  })

  /**
   * DELETE /api/blocks/:userId
   * Unblock a user
   */
  fastify.delete('/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId: targetId } = request.params as { userId: string }

    const { error } = await supabaseAdmin
      .from('blocked_users')
      .delete()
      .eq('blocker_id', request.user.id)
      .eq('blocked_id', targetId)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, message: 'User unblocked' })
  })

  /**
   * GET /api/blocks
   * List all blocked users
   */
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    const { data, error, count } = await supabaseAdmin
      .from('blocked_users')
      .select(`
        created_at,
        blocked:profiles!blocked_users_blocked_id_fkey(
          id, username, display_name, avatar_url, user_type, is_verified
        )
      `, { count: 'exact' })
      .eq('blocker_id', request.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: {
        data: data ?? [],
        total: count ?? 0,
        page: p,
        limit: l,
        hasMore: offset + l < (count ?? 0),
      },
    })
  })

  // ── MUTED USERS ───────────────────────────────────────────────────────────

  /**
   * POST /api/blocks/mutes/:userId
   * Mute a user (hide their content from your feed, but keep following)
   */
  fastify.post('/mutes/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId: targetId } = request.params as { userId: string }
    const muterId = request.user.id

    if (muterId === targetId) {
      return reply.status(400).send({ message: 'You cannot mute yourself' })
    }

    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name')
      .eq('id', targetId)
      .single()

    if (!target) {
      return reply.status(404).send({ message: 'User not found' })
    }

    const { error } = await supabaseAdmin
      .from('muted_users')
      .insert({ muter_id: muterId, muted_id: targetId })

    if (error?.code === '23505') {
      return reply.status(409).send({ message: 'User already muted' })
    }
    if (error) return reply.status(500).send({ message: error.message })

    return reply.status(201).send({
      success: true,
      message: `${target.display_name} muted`,
    })
  })

  /**
   * DELETE /api/blocks/mutes/:userId
   * Unmute a user
   */
  fastify.delete('/mutes/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId: targetId } = request.params as { userId: string }

    const { error } = await supabaseAdmin
      .from('muted_users')
      .delete()
      .eq('muter_id', request.user.id)
      .eq('muted_id', targetId)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, message: 'User unmuted' })
  })

  /**
   * GET /api/blocks/mutes
   * List all muted users
   */
  fastify.get('/mutes', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    const { data, error, count } = await supabaseAdmin
      .from('muted_users')
      .select(`
        created_at,
        muted:profiles!muted_users_muted_id_fkey(
          id, username, display_name, avatar_url, user_type, is_verified
        )
      `, { count: 'exact' })
      .eq('muter_id', request.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: {
        data: data ?? [],
        total: count ?? 0,
        page: p,
        limit: l,
        hasMore: offset + l < (count ?? 0),
      },
    })
  })

  /**
   * GET /api/blocks/check/:userId
   * Check if a user is blocked or muted by the authenticated user
   */
  fastify.get('/check/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId: targetId } = request.params as { userId: string }
    const myId = request.user.id

    const [blockResult, muteResult] = await Promise.all([
      supabaseAdmin
        .from('blocked_users')
        .select('blocker_id')
        .eq('blocker_id', myId)
        .eq('blocked_id', targetId)
        .single(),
      supabaseAdmin
        .from('muted_users')
        .select('muter_id')
        .eq('muter_id', myId)
        .eq('muted_id', targetId)
        .single(),
    ])

    return reply.send({
      success: true,
      data: {
        is_blocked: !!blockResult.data,
        is_muted: !!muteResult.data,
      },
    })
  })
}

export default blockRoutes
