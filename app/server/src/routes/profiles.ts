import { canViewProfile, publicProfile, visiblePosts } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { cacheGet, cacheSet, cacheDelete, cacheKeys, TTL } from '../lib/redis'
import { syncPlayerToAlgolia } from '../services/search.service'
import {
  updateProfileSchema,
  updatePlayerProfileSchema,
  addCareerEntrySchema,
  upsertPlayerStatsSchema,
  updateClubProfileSchema,
  updateScoutProfileSchema,
  updateCoachProfileSchema,
  updateFanProfileSchema,
  endorsePlayerSchema,
  paginationSchema,
} from '../schemas/profile.schemas'

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/profiles/:identifier
   * Get any profile by ID (uuid) or username
   */
  fastify.get('/:identifier', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { identifier } = request.params as { identifier: string }
    const cacheKey = cacheKeys.profile(identifier)

    // Follow state is viewer-specific; do not serve it from a shared profile cache.

    const isUuid = /^[0-9a-f-]{36}$/.test(identifier)
    const query = supabaseAdmin.from('profiles').select(`
      *,
      player_profile:player_profiles(*),
      club_profile:club_profiles(*),
      scout_profile:scout_profiles(*),
      coach_profile:coach_profiles(*),
      fan_profile:fan_profiles(*)
    `)

    const { data, error } = isUuid
      ? await query.eq('id', identifier).single()
      : await query.eq('username', identifier).single()

    if (error || !data) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Profile not found',
      })
    }

    if (!await canViewProfile(request.user?.id,data.id)) return reply.code(403).send({ message:'This profile is private or unavailable.' })

    // Check if current user follows this profile
    let is_following = false
    if (request.user && request.user.id !== data.id) {
      const { data: follow } = await supabaseAdmin
        .from('follows')
        .select('follower_id')
        .eq('follower_id', request.user.id)
        .eq('following_id', data.id)
        .single()
      is_following = !!follow
    }

    const result = { ...await publicProfile(request.user?.id,data), is_following }
    // A shared cache must never contain is_following.

    return reply.send({ success: true, data: result })
  })

  /**
   * PUT /api/profiles/me
   * Update own base profile
   */
  fastify.put('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = updateProfileSchema.parse(request.body)
    const userId = request.user.id

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return reply.status(500).send({ message: error.message })
    }

    await cacheDelete(cacheKeys.profile(userId))
    await cacheDelete(cacheKeys.profile(data.username))

    return reply.send({ success: true, data })
  })

  /**
   * PUT /api/profiles/me/player
   * Update player-specific profile fields
   */
  fastify.put('/me/player', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.user_type !== 'player') {
      return reply.status(403).send({ message: 'Only players can update player profiles' })
    }

    const body = updatePlayerProfileSchema.parse(request.body)
    const userId = request.user.id

    const { data, error } = await supabaseAdmin
      .from('player_profiles')
      .update(body)
      .eq('profile_id', userId)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    // Sync updated profile to Algolia
    await syncPlayerToAlgolia(userId).catch(console.error)
    await cacheDelete(cacheKeys.profile(userId))

    return reply.send({ success: true, data })
  })

  /**
   * PUT /api/profiles/me/club
   */
  fastify.put('/me/club', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.user_type !== 'club') {
      return reply.status(403).send({ message: 'Only clubs can update club profiles' })
    }

    const body = updateClubProfileSchema.parse(request.body)
    const { data, error } = await supabaseAdmin
      .from('club_profiles')
      .update(body)
      .eq('profile_id', request.user.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    await cacheDelete(cacheKeys.profile(request.user.id))
    return reply.send({ success: true, data })
  })

  /**
   * PUT /api/profiles/me/scout
   */
  fastify.put('/me/scout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can update scout profiles' })
    }

    const body = updateScoutProfileSchema.parse(request.body)
    const { data, error } = await supabaseAdmin
      .from('scout_profiles')
      .update(body)
      .eq('profile_id', request.user.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data })
  })

  /**
   * PUT /api/profiles/me/coach
   */
  fastify.put('/me/coach', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.user_type !== 'coach') {
      return reply.status(403).send({ message: 'Only coaches can update coach profiles' })
    }

    const body = updateCoachProfileSchema.parse(request.body)
    const { data, error } = await supabaseAdmin
      .from('coach_profiles')
      .update(body)
      .eq('profile_id', request.user.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data })
  })

  /**
   * PUT /api/profiles/me/fan
   */
  fastify.put('/me/fan', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.user_type !== 'fan') {
      return reply.status(403).send({ message: 'Only fans can update fan profiles' })
    }

    const body = updateFanProfileSchema.parse(request.body)
    const { data, error } = await supabaseAdmin
      .from('fan_profiles')
      .update(body)
      .eq('profile_id', request.user.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data })
  })

  /**
   * GET /api/profiles/:id/posts
   * Get all posts by a profile
   */
  fastify.get('/:id/posts', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!await canViewProfile(request.user?.id,id)) return reply.code(403).send({message:'Profile is private or unavailable.'})
    const { page, limit } = paginationSchema.parse(request.query)
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('posts')
      .select('*, video:videos(*)', { count: 'exact' })
      .eq('author_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: {
        data: await visiblePosts(request.user?.id,data ?? []),
        total: count ?? 0,
        page,
        limit,
        hasMore: offset + limit < (count ?? 0),
      },
    })
  })

  /**
   * GET /api/profiles/:id/videos
   * Get video gallery for a profile
   */
  fastify.get('/:id/videos', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!await canViewProfile(request.user?.id,id)) return reply.code(403).send({message:'Profile is private or unavailable.'})
    const { page, limit } = paginationSchema.parse(request.query)
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('videos')
      .select('*', { count: 'exact' })
      .eq('uploader_id', id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: { data: data ?? [], total: count ?? 0, page, limit, hasMore: offset + limit < (count ?? 0) },
    })
  })

  /**
   * POST /api/profiles/:id/career
   * Add a career entry (players only)
   */
  for (const [suffix, table, column] of [['career', 'career_history', 'start_date'], ['stats', 'player_stats', 'season']]) {
    fastify.get(`/:id/${suffix}`, { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
      const { id } = request.params as { id: string }
    if (!await canViewProfile(request.user?.id,id)) return reply.code(403).send({message:'Profile is private or unavailable.'})
      const { data, error } = await supabaseAdmin.from(table).select('*').eq('player_id', id).order(column, { ascending: false })
      if (error) return reply.code(500).send({ message: error.message })
      return reply.send({ success: true, data: data ?? [] })
    })
  }

  fastify.post('/:id/career', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.user_type !== 'player') {
      return reply.status(403).send({ message: 'Only players can add career entries' })
    }
    if (request.user.id !== (request.params as any).id) {
      return reply.status(403).send({ message: 'You can only edit your own career' })
    }

    const body = addCareerEntrySchema.parse(request.body)

    // If marking as current, unset other current entries
    if (body.is_current) {
      await supabaseAdmin
        .from('career_history')
        .update({ is_current: false })
        .eq('player_id', request.user.id)
    }

    const { data, error } = await supabaseAdmin
      .from('career_history')
      .insert({ player_id: request.user.id, ...body })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.status(201).send({ success: true, data })
  })

  /**
   * DELETE /api/profiles/:id/career/:entryId
   */
  fastify.delete('/:id/career/:entryId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id, entryId } = request.params as { id: string; entryId: string }

    if (request.user.id !== id || request.user.user_type !== 'player') {
      return reply.status(403).send({ message: 'Unauthorized' })
    }

    await supabaseAdmin
      .from('career_history')
      .delete()
      .eq('id', entryId)
      .eq('player_id', id)

    return reply.send({ success: true })
  })

  /**
   * PUT /api/profiles/:id/stats
   * Upsert season stats for a player
   */
  fastify.put('/:id/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!await canViewProfile(request.user?.id,id)) return reply.code(403).send({message:'Profile is private or unavailable.'})

    if (request.user.id !== id || request.user.user_type !== 'player') {
      return reply.status(403).send({ message: 'Unauthorized' })
    }

    const body = upsertPlayerStatsSchema.parse(request.body)

    const { data, error } = await supabaseAdmin
      .from('player_stats')
      .upsert({
        player_id: id,
        ...body,
      }, { onConflict: 'player_id,season' })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data })
  })

  /**
   * POST /api/profiles/:id/endorse
   * Endorse a player's skill (coaches and scouts only)
   */
  fastify.post('/:id/endorse', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: playerId } = request.params as { id: string }
    const endorserId = request.user.id

    if (!['coach', 'scout'].includes(request.user.user_type)) {
      return reply.status(403).send({ message: 'Only coaches and scouts can endorse players' })
    }
    if (endorserId === playerId) {
      return reply.status(400).send({ message: 'You cannot endorse yourself' })
    }

    if (!await canViewProfile(endorserId,playerId)) return reply.code(403).send({message:'Player is unavailable.'})
    const body = endorsePlayerSchema.parse(request.body)

    // Check for duplicate endorsement of same skill
    const { data: existing } = await supabaseAdmin
      .from('endorsements')
      .select('id')
      .eq('endorser_id', endorserId)
      .eq('player_id', playerId)
      .eq('skill', body.skill)
      .single()

    if (existing) {
      return reply.status(409).send({ message: 'You have already endorsed this skill' })
    }

    const { data, error } = await supabaseAdmin
      .from('endorsements')
      .insert({ endorser_id: endorserId, player_id: playerId, skill: body.skill })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    // Trigger notification
    const { createNotification } = await import('../services/notification.service')
    createNotification({
      recipientId: playerId,
      actorId: endorserId,
      type: 'endorsement',
      entityType: 'endorsement',
      entityId: data.id,
    }).catch(console.error)

    return reply.status(201).send({ success: true, data })
  })

  /**
   * GET /api/profiles/:id/endorsements
   * Get all endorsements for a player
   */
  fastify.get('/:id/endorsements', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!await canViewProfile(request.user?.id,id)) return reply.code(403).send({message:'Profile is private or unavailable.'})

    const { data, error } = await supabaseAdmin
      .from('endorsements')
      .select(`
        *,
        endorser:profiles!endorsements_endorser_id_fkey(
          id, username, display_name, avatar_url, user_type, is_verified
        )
      `)
      .eq('player_id', id)
      .order('created_at', { ascending: false })

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data: data ?? [] })
  })
}

export default profileRoutes
