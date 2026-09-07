import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { paginationSchema } from '../schemas/profile.schemas'

const clubRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/clubs/:id
   * Get a club profile with squad summary
   */
  fastify.get('/:id', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        club_profile:club_profiles(*)
      `)
      .eq('id', id)
      .eq('user_type', 'club')
      .single()

    if (error || !data) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Club not found',
      })
    }

    return reply.send({ success: true, data })
  })

  /**
   * GET /api/clubs/:id/squad
   * Get the full squad roster for a club
   */
  fastify.get('/:id/squad', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { page, limit } = paginationSchema.parse(request.query)
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, username, display_name, avatar_url, is_verified, follower_count,
        player_profile:player_profiles(
          primary_position, secondary_positions, jersey_number,
          nationality, height_cm, dominant_foot
        )
      `, { count: 'exact' })
      .eq('user_type', 'player')
      // Players whose current_club_id matches
      // Using a join via player_profiles
      .order('display_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) return reply.status(500).send({ message: error.message })

    // Filter by current_club_id in player_profiles
    const { data: squadData, error: squadError, count: squadCount } = await supabaseAdmin
      .from('player_profiles')
      .select(`
        *,
        profile:profiles(
          id, username, display_name, avatar_url, is_verified,
          follower_count, post_count
        )
      `, { count: 'exact' })
      .eq('current_club_id', id)
      .range(offset, offset + limit - 1)

    if (squadError) return reply.status(500).send({ message: squadError.message })

    return reply.send({
      success: true,
      data: {
        data: squadData ?? [],
        total: squadCount ?? 0,
        page,
        limit,
        hasMore: offset + limit < (squadCount ?? 0),
      },
    })
  })

  /**
   * POST /api/clubs/:id/squad
   * Add a player to the club squad (club owner only)
   * This sets the player's current_club_id if they accept or the club adds them directly
   */
  fastify.post('/:id/squad', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: clubId } = request.params as { id: string }

    if (request.user.id !== clubId) {
      return reply.status(403).send({ message: 'Only the club account can manage its squad' })
    }
    if (request.user.user_type !== 'club') {
      return reply.status(403).send({ message: 'Only club accounts can manage squads' })
    }

    const { player_id, jersey_number } = request.body as {
      player_id: string
      jersey_number?: number
    }

    // Verify player exists
    const { data: player } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name')
      .eq('id', player_id)
      .eq('user_type', 'player')
      .single()

    if (!player) {
      return reply.status(404).send({ message: 'Player not found' })
    }

    // Update player's current_club_id
    const updatePayload: Record<string, unknown> = { current_club_id: clubId }
    if (jersey_number) updatePayload.jersey_number = jersey_number

    const { error } = await supabaseAdmin
      .from('player_profiles')
      .update(updatePayload)
      .eq('profile_id', player_id)

    if (error) return reply.status(500).send({ message: error.message })

    // Add to career history as current
    await supabaseAdmin.from('career_history').insert({
      player_id,
      club_name: (await supabaseAdmin.from('club_profiles').select('club_name').eq('profile_id', clubId).single()).data?.club_name ?? 'Unknown Club',
      start_date: new Date().toISOString().split('T')[0],
      is_current: true,
    })

    return reply.status(201).send({
      success: true,
      message: `${player.display_name} added to squad`,
    })
  })

  /**
   * DELETE /api/clubs/:id/squad/:playerId
   * Remove player from squad
   */
  fastify.delete('/:id/squad/:playerId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: clubId, playerId } = request.params as { id: string; playerId: string }

    if (request.user.id !== clubId) {
      return reply.status(403).send({ message: 'Only the club account can manage its squad' })
    }

    await supabaseAdmin
      .from('player_profiles')
      .update({ current_club_id: null })
      .eq('profile_id', playerId)
      .eq('current_club_id', clubId)

    // Mark career entry as ended
    await supabaseAdmin
      .from('career_history')
      .update({ is_current: false, end_date: new Date().toISOString().split('T')[0] })
      .eq('player_id', playerId)
      .eq('is_current', true)

    return reply.send({ success: true, message: 'Player removed from squad' })
  })

  /**
   * POST /api/clubs/:id/verify-player/:playerId
   * Clubs can verify a player's affiliation — adds trust signal to the player profile.
   */
  fastify.post('/:id/verify-player/:playerId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: clubId, playerId } = request.params as { id: string; playerId: string }

    if (request.user.id !== clubId) {
      return reply.status(403).send({ message: 'Only the club account can verify affiliations' })
    }

    // Check that player is actually in this club's squad
    const { data: playerProfile } = await supabaseAdmin
      .from('player_profiles')
      .select('current_club_id')
      .eq('profile_id', playerId)
      .single()

    if (!playerProfile || playerProfile.current_club_id !== clubId) {
      return reply.status(400).send({ message: 'Player is not in this club\'s squad' })
    }

    // Upsert a club_verification record
    const { error } = await supabaseAdmin
      .from('club_verifications')
      .upsert({
        club_id: clubId,
        player_id: playerId,
        verified_at: new Date().toISOString(),
      }, { onConflict: 'club_id,player_id' })

    if (error) return reply.status(500).send({ message: error.message })

    // Notify the player
    const { createNotification } = await import('../services/notification.service')
    createNotification({
      recipientId: playerId,
      actorId: clubId,
      type: 'verification',
      entityType: 'club',
      entityId: clubId,
    }).catch(console.error)

    return reply.send({ success: true, message: 'Player affiliation verified' })
  })

  /**
   * GET /api/clubs
   * Browse all clubs (paginated)
   */
  fastify.get('/', async (request, reply) => {
    const { page, limit } = paginationSchema.parse(request.query)
    const { country, league } = request.query as Record<string, string>
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('profiles')
      .select(`
        *,
        club_profile:club_profiles(club_name, country, city, league, logo_url, founded_year)
      `, { count: 'exact' })
      .eq('user_type', 'club')
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

export default clubRoutes
