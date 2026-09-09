import { canViewProfile, publicProfile, protectProfilePayload } from '../services/access.service'
import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { paginationSchema } from '../schemas/profile.schemas'

const scoutRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preSerialization',async(req,_reply,payload)=>protectProfilePayload(req.user?.id,payload))
  /**
   * GET /api/scouts/:id
   * Get a scout's public profile
   */
  fastify.get('/:id', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        scout_profile:scout_profiles(*)
      `)
      .eq('id', id)
      .eq('user_type', 'scout')
      .single()

    if (error || !data) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Scout not found',
      })
    }

    if(!await canViewProfile(request.user?.id,id))return reply.code(403).send({message:'Profile unavailable'})
    return reply.send({ success: true, data:await publicProfile(request.user?.id,data) })
  })

  // ─── Shortlists ──────────────────────────────────────────────────────────────

  /**
   * GET /api/scouts/shortlists
   * Get all shortlists for the authenticated scout (own shortlists only)
   */
  fastify.get('/shortlists', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can access shortlists' })
    }

    const { data, error } = await supabaseAdmin
      .from('shortlists')
      .select('*')
      .eq('scout_id', request.user.id)
      .order('created_at', { ascending: false })

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, data: data ?? [] })
  })

  /**
   * GET /api/scouts/:id/shortlists
   * Get all shortlists for a specific scout (own only — scouts can't see others' lists)
   */
  fastify.get('/:id/shortlists', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    if (request.user.id !== id) {
      return reply.status(403).send({ message: 'You can only view your own shortlists' })
    }
    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can access shortlists' })
    }

    const { data, error } = await supabaseAdmin
      .from('shortlists')
      .select('*')
      .eq('scout_id', id)
      .order('updated_at', { ascending: false })

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, data: data ?? [] })
  })

  /**
   * POST /api/scouts/shortlists
   * Create a new shortlist
   */
  fastify.post('/shortlists', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can create shortlists' })
    }

    const { name, description } = request.body as { name: string; description?: string }

    if (!name?.trim()) {
      return reply.status(400).send({ message: 'Shortlist name is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('shortlists')
      .insert({
        scout_id: request.user.id,
        name: name.trim(),
        description: description ?? null,
        player_count: 0,
      })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    return reply.status(201).send({ success: true, data })
  })

  /**
   * PUT /api/scouts/shortlists/:shortlistId
   * Update shortlist name/description
   */
  fastify.put('/shortlists/:shortlistId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { shortlistId } = request.params as { shortlistId: string }

    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can update shortlists' })
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('shortlists')
      .select('scout_id')
      .eq('id', shortlistId)
      .single()

    if (!existing) return reply.status(404).send({ message: 'Shortlist not found' })
    if (existing.scout_id !== request.user.id) {
      return reply.status(403).send({ message: 'Unauthorized' })
    }

    const { name, description } = request.body as { name?: string; description?: string }

    const { data, error } = await supabaseAdmin
      .from('shortlists')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', shortlistId)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, data })
  })

  /**
   * DELETE /api/scouts/shortlists/:shortlistId
   */
  fastify.delete('/shortlists/:shortlistId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { shortlistId } = request.params as { shortlistId: string }

    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can delete shortlists' })
    }

    const { data: existing } = await supabaseAdmin
      .from('shortlists')
      .select('scout_id')
      .eq('id', shortlistId)
      .single()

    if (!existing) return reply.status(404).send({ message: 'Shortlist not found' })
    if (existing.scout_id !== request.user.id) {
      return reply.status(403).send({ message: 'Unauthorized' })
    }

    await supabaseAdmin.from('shortlists').delete().eq('id', shortlistId)
    await supabaseAdmin.from('shortlist_players').delete().eq('shortlist_id', shortlistId)

    return reply.send({ success: true })
  })

  /**
   * GET /api/scouts/shortlists/:shortlistId/players
   * Get all players in a shortlist
   */
  fastify.get('/shortlists/:shortlistId/players', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { shortlistId } = request.params as { shortlistId: string }

    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can view shortlists' })
    }

    const { data: shortlist } = await supabaseAdmin
      .from('shortlists')
      .select('scout_id')
      .eq('id', shortlistId)
      .single()

    if (!shortlist || shortlist.scout_id !== request.user.id) {
      return reply.status(403).send({ message: 'Unauthorized' })
    }

    const { data, error } = await supabaseAdmin
      .from('shortlist_players')
      .select(`
        added_at, notes,
        player:profiles!shortlist_players_player_id_fkey(
          id, username, display_name, avatar_url, is_verified, follower_count,
          player_profile:player_profiles(
            primary_position, secondary_positions, nationality,
            height_cm, dominant_foot, current_club_id
          )
        )
      `)
      .eq('shortlist_id', shortlistId)
      .order('added_at', { ascending: false })

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, data: data ?? [] })
  })

  /**
   * POST /api/scouts/shortlists/:shortlistId/players
   * Add a player to a shortlist
   */
  fastify.post('/shortlists/:shortlistId/players', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { shortlistId } = request.params as { shortlistId: string }

    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can add to shortlists' })
    }

    const { player_id, notes } = request.body as { player_id: string; notes?: string }

    // Verify shortlist ownership
    const { data: shortlist } = await supabaseAdmin
      .from('shortlists')
      .select('scout_id, player_count')
      .eq('id', shortlistId)
      .single()

    if (!shortlist) return reply.status(404).send({ message: 'Shortlist not found' })
    if (shortlist.scout_id !== request.user.id) return reply.status(403).send({ message: 'Unauthorized' })

    // Check player exists
    const { data: player } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', player_id)
      .eq('user_type', 'player')
      .single()

    if (!player) return reply.status(404).send({ message: 'Player not found' })

    // Add to shortlist
    const { error } = await supabaseAdmin
      .from('shortlist_players')
      .insert({ shortlist_id: shortlistId, player_id, notes: notes ?? null })

    if (error?.code === '23505') {
      return reply.status(409).send({ message: 'Player already in this shortlist' })
    }
    if (error) return reply.status(500).send({ message: error.message })

    // Update player count
    await supabaseAdmin
      .from('shortlists')
      .update({
        player_count: (shortlist.player_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shortlistId)

    // Notify the player
    const { createNotification } = await import('../services/notification.service')
    createNotification({
      recipientId: player_id,
      actorId: request.user.id,
      type: 'shortlist',
      entityType: 'shortlist',
      entityId: shortlistId,
    }).catch(console.error)

    return reply.status(201).send({ success: true, message: 'Player added to shortlist' })
  })

  /**
   * DELETE /api/scouts/shortlists/:shortlistId/players/:playerId
   * Remove a player from a shortlist
   */
  fastify.put('/shortlists/:shortlistId/players/:playerId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { shortlistId, playerId } = z.object({ shortlistId: z.string().uuid(), playerId: z.string().uuid() }).parse(request.params)
    const { notes } = z.object({ notes: z.string().max(500) }).parse(request.body)
    const { data: shortlist } = await supabaseAdmin.from('shortlists').select('scout_id').eq('id', shortlistId).single()
    if (request.user.user_type !== 'scout' || shortlist?.scout_id !== request.user.id) return reply.code(403).send({ message: 'Unauthorized' })
    const { data, error } = await supabaseAdmin.from('shortlist_players').update({ notes }).eq('shortlist_id', shortlistId).eq('player_id', playerId).select('player_id').maybeSingle()
    if (error) return reply.code(500).send({ message: error.message })
    if (!data) return reply.code(404).send({ message: 'Player is not in this shortlist' })
    return reply.send({ success: true })
  })

  fastify.delete('/shortlists/:shortlistId/players/:playerId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { shortlistId, playerId } = request.params as { shortlistId: string; playerId: string }

    if (request.user.user_type !== 'scout') {
      return reply.status(403).send({ message: 'Only scouts can manage shortlists' })
    }

    const { data: shortlist } = await supabaseAdmin
      .from('shortlists')
      .select('scout_id, player_count')
      .eq('id', shortlistId)
      .single()

    if (!shortlist || shortlist.scout_id !== request.user.id) {
      return reply.status(403).send({ message: 'Unauthorized' })
    }

    await supabaseAdmin
      .from('shortlist_players')
      .delete()
      .eq('shortlist_id', shortlistId)
      .eq('player_id', playerId)

    // Decrement count
    await supabaseAdmin
      .from('shortlists')
      .update({
        player_count: Math.max(0, (shortlist.player_count ?? 1) - 1),
        updated_at: new Date().toISOString(),
      })
      .eq('id', shortlistId)

    return reply.send({ success: true, message: 'Player removed from shortlist' })
  })
}

export default scoutRoutes
