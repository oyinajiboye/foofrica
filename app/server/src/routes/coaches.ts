import { canViewProfile, protectProfilePayload } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { paginationSchema } from '../schemas/profile.schemas'

const coachRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler',fastify.optionalAuth)
  fastify.addHook('preHandler',async(req,reply)=>{const id=(req.params as {id?:string}).id;if(id&&!await canViewProfile(req.user?.id,id))return reply.code(403).send({message:'Profile unavailable'})})
  fastify.addHook('preSerialization',async(req,_reply,payload)=>protectProfilePayload(req.user?.id,payload))

  /**
   * GET /api/coaches/:id
   * Get a coach's public profile
   */
  fastify.get('/:id', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        coach_profile:coach_profiles(*)
      `)
      .eq('id', id)
      .eq('user_type', 'coach')
      .single()

    if (error || !data) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Coach not found',
      })
    }

    return reply.send({ success: true, data })
  })

  /**
   * GET /api/coaches
   * Browse all coaches (paginated)
   */
  fastify.get('/', async (request, reply) => {
    const { page, limit } = paginationSchema.parse(request.query)
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        coach_profile:coach_profiles(license_level, specialization, current_club_id)
      `, { count: 'exact' })
      .eq('user_type', 'coach')
      .order('follower_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: { data: data ?? [], total: count ?? 0, page, limit, hasMore: offset + limit < (count ?? 0) },
    })
  })

  /**
   * GET /api/coaches/:id/endorsements-given
   * Endorsements this coach has given to players
   */
  fastify.get('/:id/endorsements-given', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { page, limit } = paginationSchema.parse(request.query)
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('endorsements')
      .select(`
        *,
        player:profiles!endorsements_player_id_fkey(
          id, username, display_name, avatar_url, is_verified,
          player_profile:player_profiles(primary_position, nationality)
        )
      `, { count: 'exact' })
      .eq('endorser_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: { data: data ?? [], total: count ?? 0, page, limit, hasMore: offset + limit < (count ?? 0) },
    })
  })

  /**
   * POST /api/coaches/:id/endorse/:playerId
   * Endorse a player (convenience route — also available at /profiles/:id/endorse)
   */
  fastify.post('/:id/endorse/:playerId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: coachId, playerId } = request.params as { id: string; playerId: string }

    if (request.user.id !== coachId) {
      return reply.status(403).send({ message: 'Unauthorized' })
    }
    if (request.user.user_type !== 'coach') {
      return reply.status(403).send({ message: 'Only coaches can use this endpoint' })
    }
    if (coachId === playerId) {
      return reply.status(400).send({ message: 'You cannot endorse yourself' })
    }

    const { skill } = request.body as { skill: string }

    if (!skill) {
      return reply.status(400).send({ message: 'Skill is required' })
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('endorsements')
      .select('id')
      .eq('endorser_id', coachId)
      .eq('player_id', playerId)
      .eq('skill', skill)
      .single()

    if (existing) {
      return reply.status(409).send({ message: 'You have already endorsed this skill for this player' })
    }

    const { data, error } = await supabaseAdmin
      .from('endorsements')
      .insert({ endorser_id: coachId, player_id: playerId, skill })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    // Notify player
    const { createNotification } = await import('../services/notification.service')
    createNotification({
      recipientId: playerId,
      actorId: coachId,
      type: 'endorsement',
      entityType: 'endorsement',
      entityId: data.id,
    }).catch(console.error)

    return reply.status(201).send({ success: true, data })
  })

  /**
   * DELETE /api/coaches/:id/endorse/:playerId
   * Remove an endorsement (by skill)
   */
  fastify.delete('/:id/endorse/:playerId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: coachId, playerId } = request.params as { id: string; playerId: string }
    const { skill } = request.query as { skill: string }

    if (request.user.id !== coachId) {
      return reply.status(403).send({ message: 'Unauthorized' })
    }

    await supabaseAdmin
      .from('endorsements')
      .delete()
      .eq('endorser_id', coachId)
      .eq('player_id', playerId)
      .eq('skill', skill)

    return reply.send({ success: true, message: 'Endorsement removed' })
  })
}

export default coachRoutes
