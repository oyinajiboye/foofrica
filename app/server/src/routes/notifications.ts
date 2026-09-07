import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { getUnreadCount } from '../services/notification.service'

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/notifications
   * Get paginated notifications for the authenticated user
   */
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id
    const { page = '1', limit = '20', unread_only = 'false' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    let query = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(
          id, username, display_name, avatar_url, is_verified, user_type
        )
      `, { count: 'exact' })
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (unread_only === 'true') {
      query = query.is('read_at', null)
    }

    const { data, error, count } = await query

    if (error) return reply.status(500).send({ message: error.message })

    // Also return unread count
    const unreadCount = await getUnreadCount(userId)

    return reply.send({
      success: true,
      data: {
        data: data ?? [],
        total: count ?? 0,
        page: p,
        limit: l,
        hasMore: offset + l < (count ?? 0),
        unread_count: unreadCount,
      },
    })
  })

  /**
   * PUT /api/notifications/:id/read
   * Mark a single notification as read
   */
  fastify.put('/:id/read', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user.id

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('recipient_id', userId)
      .is('read_at', null)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true })
  })

  /**
   * PUT /api/notifications/read-all
   * Mark all unread notifications as read
   */
  fastify.put('/read-all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .is('read_at', null)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, message: 'All notifications marked as read' })
  })

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('recipient_id', request.user.id)

    return reply.send({ success: true })
  })

  /**
   * DELETE /api/notifications
   * Clear all notifications
   */
  fastify.delete('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('recipient_id', request.user.id)

    return reply.send({ success: true, message: 'All notifications cleared' })
  })

  /**
   * GET /api/notifications/unread-count
   * Quick endpoint to get only the unread count (for badges)
   */
  fastify.get('/unread-count', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const count = await getUnreadCount(request.user.id)
    return reply.send({ success: true, data: { count } })
  })
}

export default notificationRoutes
