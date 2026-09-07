import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'

const directoryRoutes: FastifyPluginAsync = async fastify => {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { role, q, page, limit } = z.object({
      role: z.enum(['player', 'club', 'scout', 'coach']),
      q: z.string().max(100).default(''),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(request.query)
    const offset = (page - 1) * limit
    let query = supabaseAdmin.from('profiles')
      .select('id,username,display_name,bio,avatar_url,user_type,is_verified,location', { count: 'exact' })
      .eq('user_type', role).order('display_name').order('id')
    const term = q.trim().replace(/[^\p{L}\p{N} _-]/gu, '')
    if (term) query = query.or(`display_name.ilike.%${term}%,username.ilike.%${term}%`)
    const { data, error, count } = await query.range(offset, offset + limit - 1)
    if (error) return reply.code(500).send({ message: 'Unable to load directory' })
    return reply.send({ success: true, data: { data: data ?? [], total: count ?? 0, hasMore: offset + limit < (count ?? 0) } })
  })
}
export default directoryRoutes
