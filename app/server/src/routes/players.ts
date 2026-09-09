import { canViewProfile, protectProfilePayload } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { paginationSchema, addCareerEntrySchema, upsertPlayerStatsSchema } from '../schemas/profile.schemas'

const playerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler',fastify.optionalAuth)
  fastify.addHook('preHandler',async(req,reply)=>{const id=(req.params as {id?:string}).id;if(id&&!await canViewProfile(req.user?.id,id))return reply.code(403).send({message:'Profile unavailable'})})
  fastify.addHook('preSerialization',async(req,_reply,payload)=>protectProfilePayload(req.user?.id,payload))

  /**
   * GET /api/players/:id
   * Full player profile — base profile + player_profile + career + stats + endorsements
   */
  fastify.get('/:id', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        player_profile:player_profiles(*),
        career_history:career_history(*),
        current_season_stats:player_stats(
          *
        ),
        endorsements_summary:endorsements(skill)
      `)
      .eq('id', id)
      .eq('user_type', 'player')
      .order('start_date', { referencedTable: 'career_history', ascending: false })
      .single()

    if (error || !data) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Player not found',
      })
    }

    // Aggregate endorsement skill counts
    const endorsementCounts: Record<string, number> = {}
    for (const e of (data.endorsements_summary ?? []) as Array<{ skill: string }>) {
      endorsementCounts[e.skill] = (endorsementCounts[e.skill] ?? 0) + 1
    }

    // Check follow status
    let is_following = false
    if (request.user && request.user.id !== id) {
      const { data: follow } = await supabaseAdmin
        .from('follows')
        .select('follower_id')
        .eq('follower_id', request.user.id)
        .eq('following_id', id)
        .single()
      is_following = !!follow
    }

    return reply.send({
      success: true,
      data: {
        ...data,
        endorsement_counts: endorsementCounts,
        is_following,
      },
    })
  })

  /**
   * GET /api/players/:id/stats
   * All season stats for a player
   */
  fastify.get('/:id/stats', async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data, error } = await supabaseAdmin
      .from('player_stats')
      .select('*')
      .eq('player_id', id)
      .order('season', { ascending: false })

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, data: data ?? [] })
  })

  /**
   * PUT /api/players/:id/stats
   * Upsert season stats (own profile only)
   */
  fastify.put('/:id/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    if (request.user.id !== id || request.user.user_type !== 'player') {
      return reply.status(403).send({ message: 'Unauthorized' })
    }
    if (request.user.user_type !== 'player') {
      return reply.status(403).send({ message: 'Only players can update stats' })
    }

    const body = upsertPlayerStatsSchema.strict().parse(request.body)

    const { data, error } = await supabaseAdmin
      .from('player_stats')
      .upsert({ player_id: id, ...body }, { onConflict: 'player_id,season' })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data })
  })

  /**
   * GET /api/players/:id/career
   * Career history for a player
   */
  fastify.get('/:id/career', async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data, error } = await supabaseAdmin
      .from('career_history')
      .select('*')
      .eq('player_id', id)
      .order('start_date', { ascending: false })

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data: data ?? [] })
  })

  /**
   * POST /api/players/:id/career
   * Add career entry
   */
  fastify.post('/:id/career', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    if (request.user.id !== id || request.user.user_type !== 'player') {
      return reply.status(403).send({ message: 'You can only edit your own career' })
    }

    const body = addCareerEntrySchema.strict().parse(request.body)

    // If marking as current, clear existing current entries
    if (body.is_current) {
      await supabaseAdmin
        .from('career_history')
        .update({ is_current: false })
        .eq('player_id', id)
    }

    const { data, error } = await supabaseAdmin
      .from('career_history')
      .insert({ player_id: id, ...body })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.status(201).send({ success: true, data })
  })

  /**
   * PUT /api/players/:id/career/:entryId
   * Update a career entry
   */
  fastify.put('/:id/career/:entryId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id, entryId } = request.params as { id: string; entryId: string }

    if (request.user.id !== id || request.user.user_type !== 'player') {
      return reply.status(403).send({ message: 'Unauthorized' })
    }

    const body = addCareerEntrySchema.partial().strict().parse(request.body)

    const { data, error } = await supabaseAdmin
      .from('career_history')
      .update(body)
      .eq('id', entryId)
      .eq('player_id', id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data })
  })

  /**
   * DELETE /api/players/:id/career/:entryId
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
   * GET /api/players/:id/videos
   * Paginated video gallery for a player
   */
  fastify.get('/:id/videos', async (request, reply) => {
    const { id } = request.params as { id: string }
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
   * GET /api/players/:id/endorsements
   * Get all endorsements for a player (grouped by skill)
   */
  fastify.get('/:id/endorsements', async (request, reply) => {
    const { id } = request.params as { id: string }

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

  /**
   * GET /api/players
   * Browse all players (paginated, with optional filters)
   */
  fastify.get('/', async (request, reply) => {
    const { page, limit } = paginationSchema.parse(request.query)
    const {
      position,
      nationality,
      country,
    } = request.query as Record<string, string>
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('profiles')
      .select(`
        *,
        player_profile:player_profiles(
          primary_position, secondary_positions, dominant_foot,
          nationality, height_cm, current_club_id, playing_style_tags
        )
      `, { count: 'exact' })
      .eq('user_type', 'player')
      .order('follower_count', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: { data: data ?? [], total: count ?? 0, page, limit, hasMore: offset + limit < (count ?? 0) },
    })
  })
}

export default playerRoutes
