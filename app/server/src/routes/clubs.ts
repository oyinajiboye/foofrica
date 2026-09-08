import {z} from 'zod'
import { canViewProfile, protectProfilePayload } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { paginationSchema } from '../schemas/profile.schemas'

const clubRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler',fastify.optionalAuth)
  fastify.addHook('preHandler',async(req,reply)=>{const id=(req.params as {id?:string}).id;if(id&&!await canViewProfile(req.user?.id,id))return reply.code(403).send({message:'Profile unavailable'})})
  fastify.addHook('preSerialization',async(req,_reply,payload)=>protectProfilePayload(req.user?.id,payload))

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
  fastify.post('/:id/squad', {preHandler:[fastify.authenticate]}, async(request,reply)=>{
    const {id}=z.object({id:z.string().uuid()}).parse(request.params)
    const {player_id}=z.object({player_id:z.string().uuid()}).parse(request.body)
    if(request.user.id!==id||request.user.user_type!=='club')return reply.code(403).send({message:'Club owner required'})
    const {data:player}=await supabaseAdmin.from('profiles').select('id').eq('id',player_id).eq('user_type','player').single()
    if(!player||!await canViewProfile(request.user.id,player_id))return reply.code(404).send({message:'Player unavailable'})
    const {data,error}=await supabaseAdmin.from('squad_memberships').insert({club_id:id,player_id}).select().single()
    if(error)return reply.code(error.code==='23505'?409:500).send({message:'Unable to invite player'})
    return reply.code(201).send({success:true,data,message:'Invitation sent. The player must accept.'})
  })

  /**
   * DELETE /api/clubs/:id/squad/:playerId
   * Remove player from squad
   */
  fastify.delete('/:id/squad/:playerId', {preHandler:[fastify.authenticate]}, async(request,reply)=>{
    const {id,playerId}=z.object({id:z.string().uuid(),playerId:z.string().uuid()}).parse(request.params)
    if(request.user.id!==id||request.user.user_type!=='club')return reply.code(403).send({message:'Club owner required'})
    const {data:m}=await supabaseAdmin.from('squad_memberships').select('id').eq('club_id',id).eq('player_id',playerId).in('status',['pending','accepted']).maybeSingle()
    if(!m)return reply.code(404).send({message:'Membership not found'})
    const {error}=await supabaseAdmin.rpc('respond_squad_membership',{membership_id:m.id,actor_id:id,decision:'ended'})
    if(error)return reply.code(409).send({message:'Unable to end membership'})
    return {success:true}
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
