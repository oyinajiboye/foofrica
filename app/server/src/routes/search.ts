import type { FastifyPluginAsync } from 'fastify'
import { searchPlayers, searchProfiles } from '../services/search.service'
import { supabaseAdmin } from '../lib/supabase'
import { playerSearchSchema, generalSearchSchema } from '../schemas/search.schemas'

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/search/players
   * Multi-filter player search (Algolia primary, Postgres fallback)
   */
  fastify.get('/players', async (request, reply) => {
    const params = playerSearchSchema.parse(request.query)
    const result = await searchPlayers(params)
    return reply.send({ success: true, data: result })
  })

  /**
   * GET /api/search/profiles
   * General profile search — for @mentions, user discovery
   */
  fastify.get('/profiles', async (request, reply) => {
    const { q, limit = '10' } = request.query as { q: string; limit?: string }

    if (!q || q.trim().length < 1) {
      return reply.status(400).send({ message: 'Search query q is required' })
    }

    const profiles = await searchProfiles(q.trim(), Number(limit))
    return reply.send({ success: true, data: profiles })
  })

  /**
   * GET /api/search/posts
   * Search posts by hashtag or keyword
   */
  fastify.get('/posts', async (request, reply) => {
    const { q, page = '1', limit = '20' } = request.query as Record<string, string>

    if (!q) return reply.status(400).send({ message: 'Query q is required' })

    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    // Search by hashtag (exact) or content (full-text)
    const isHashtag = q.startsWith('#')
    const searchTerm = isHashtag ? q.slice(1).toLowerCase() : q

    let query = supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(
          id, username, display_name, avatar_url, is_verified, user_type
        )
      `, { count: 'exact' })
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (isHashtag) {
      query = query.contains('hashtags', [searchTerm])
    } else {
      query = query.ilike('content', `%${searchTerm}%`)
    }

    const { data, error, count } = await query

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
   * GET /api/search/trending-hashtags
   * Get trending hashtags (last 24 hours)
   */
  fastify.get('/trending-hashtags', async (_request, reply) => {
    // Use Postgres to unnest hashtag arrays and count
    const { data, error } = await supabaseAdmin.rpc('get_trending_hashtags', { hours_back: 24, max_results: 20 })

    if (error) {
      // Fallback if RPC not yet created
      return reply.send({ success: true, data: [] })
    }

    return reply.send({ success: true, data: data ?? [] })
  })
}

export default searchRoutes
