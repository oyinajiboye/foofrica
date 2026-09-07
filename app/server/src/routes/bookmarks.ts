import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'

const bookmarkRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/bookmarks/:postId
   * Bookmark / save a post
   */
  fastify.post('/:postId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { postId } = request.params as { postId: string }
    const userId = request.user.id

    // Verify post exists
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (!post) {
      return reply.status(404).send({ message: 'Post not found' })
    }

    const { error } = await supabaseAdmin
      .from('bookmarks')
      .insert({ user_id: userId, post_id: postId })

    if (error?.code === '23505') {
      return reply.status(409).send({ message: 'Post already bookmarked' })
    }
    if (error) return reply.status(500).send({ message: error.message })

    return reply.status(201).send({ success: true, message: 'Post bookmarked' })
  })

  /**
   * DELETE /api/bookmarks/:postId
   * Remove a bookmark
   */
  fastify.delete('/:postId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { postId } = request.params as { postId: string }

    const { error } = await supabaseAdmin
      .from('bookmarks')
      .delete()
      .eq('user_id', request.user.id)
      .eq('post_id', postId)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, message: 'Bookmark removed' })
  })

  /**
   * GET /api/bookmarks
   * List all bookmarked posts (paginated, newest first)
   */
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    const { data, error, count } = await supabaseAdmin
      .from('bookmarks')
      .select(`
        created_at,
        post:posts!bookmarks_post_id_fkey(
          *,
          author:profiles!posts_author_id_fkey(
            id, username, display_name, avatar_url, is_verified, user_type
          ),
          video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds)
        )
      `, { count: 'exact' })
      .eq('user_id', request.user.id)
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
   * GET /api/bookmarks/check/:postId
   * Quick check if a post is bookmarked (for UI toggle state)
   */
  fastify.get('/check/:postId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { postId } = request.params as { postId: string }

    const { data } = await supabaseAdmin
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', request.user.id)
      .eq('post_id', postId)
      .single()

    return reply.send({
      success: true,
      data: { is_bookmarked: !!data },
    })
  })
}

export default bookmarkRoutes
