import type { FastifyPluginAsync } from 'fastify'
import { blockedIds, publicProfile } from '../services/access.service'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'

const directoryRoutes: FastifyPluginAsync = async fastify => {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { role, q, page, limit, position, nationality, foot, min_age, max_age } = z.object({
      position: z.enum(['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','CF']).optional(),
      nationality: z.string().max(80).optional(), foot: z.enum(['left','right','both']).optional(),
      min_age: z.coerce.number().int().min(16).max(50).optional(),max_age:z.coerce.number().int().min(16).max(50).optional(),
      role: z.enum(['player', 'club', 'scout', 'coach']),
      q: z.string().max(100).default(''),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(request.query)
    const offset = (page - 1) * limit
    let query = supabaseAdmin.from('profiles')
      .select('id,username,display_name,bio,avatar_url,user_type,is_verified,location,settings:user_settings!inner(profile_visibility)' + (role === 'player' ? ',player_profile:player_profiles!inner(primary_position,nationality,dominant_foot,height_cm,date_of_birth)' : ''), { count: 'exact' })
      .eq('settings.profile_visibility','public').eq('user_type', role).order('display_name').order('id')
    const blocked = await blockedIds(request.user.id)
    if (blocked.length) query = query.not('id','in',`(${blocked.join(',')})`)
    if (role === 'player') {
      if(position)query=query.eq('player_profile.primary_position',position)
      if(nationality)query=query.ilike('player_profile.nationality',nationality)
      if(foot)query=query.eq('player_profile.dominant_foot',foot)
      const cutoff=(years:number)=>{const d=new Date();d.setUTCFullYear(d.getUTCFullYear()-years);return d.toISOString().slice(0,10)}
      if(min_age)query=query.lte('player_profile.date_of_birth',cutoff(min_age))
      if(max_age)query=query.gt('player_profile.date_of_birth',cutoff(max_age+1))
    }
    const term = q.trim().replace(/[^\p{L}\p{N} _-]/gu, '')
    if (term) query = query.or(`display_name.ilike.%${term}%,username.ilike.%${term}%`)
    const { data, error, count } = await query.range(offset, offset + limit - 1)
    if (error) return reply.code(500).send({ message: 'Unable to load directory' })
    return reply.send({ success: true, data: { data: await Promise.all((data??[]).map(p=>publicProfile(request.user.id,p))), total: count ?? 0, hasMore: offset + limit < (count ?? 0) } })
  })
}
export default directoryRoutes
