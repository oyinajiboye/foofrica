import { z } from 'zod'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { syncPlayerToAlgolia } from '../services/search.service'

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // ── Middleware: Admin-only guard ────────────────────────────────────────────
  // All admin routes require auth + is_verified flag used as admin signal
  // In production, you'd use a separate admin role in Supabase
  async function requireAdmin(request: any, reply: any) {
    await fastify.authenticate(request, reply)
    if (reply.sent) return

    // Check for admin role in user metadata (set in Supabase dashboard)
    const { data: adminCheck } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', request.user.id)
      .eq('is_admin', true)
      .single()

    if (!adminCheck) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Admin access required',
      })
    }
  }

  // ── User Management ─────────────────────────────────────────────────────────

  /**
   * GET /api/admin/users
   * List all users with pagination and filters
   */
  fastify.get('/users', { preHandler: [requireAdmin] }, async (request, reply) => {
    const {
      page = '1',
      limit = '50',
      user_type,
      search,
      is_verified,
    } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (user_type) query = query.eq('user_type', user_type)
    if (is_verified) query = query.eq('is_verified', is_verified === 'true')
    if (search) query = query.ilike('display_name', `%${search}%`)

    const { data, error, count } = await query

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: { data: data ?? [], total: count ?? 0, page: p, limit: l, hasMore: offset + l < (count ?? 0) },
    })
  })

  /**
   * POST /api/admin/users/:id/verify
   * Grant verification badge to a user
   */
  fastify.post('/users/:id/verify', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tier } = request.body as {
      tier: 'professional' | 'organization' | 'player' | 'contributor'
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_verified: true,
        verification_tier: tier ?? 'player',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    // Notify the user
    const { createNotification } = await import('../services/notification.service')
    createNotification({
      recipientId: id,
      actorId: request.user.id,
      type: 'verification',
      entityType: 'profile',
      entityId: id,
    }).catch(console.error)

    // Sync to Algolia if player
    if (data.user_type === 'player') {
      syncPlayerToAlgolia(id).catch(console.error)
    }

    return reply.send({ success: true, data })
  })

  /**
   * DELETE /api/admin/users/:id/verify
   * Revoke verification
   */
  fastify.delete('/users/:id/verify', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_verified: false,
        verification_tier: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, data })
  })

  /**
   * DELETE /api/admin/users/:id
   * Soft-ban / delete a user account
   */
  fastify.delete('/users/:id', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { reason } = request.body as { reason?: string }

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authError) return reply.status(500).send({ message: authError.message })

    // Profile will cascade delete via FK constraints
    return reply.send({ success: true, message: `User ${id} deleted. Reason: ${reason ?? 'not specified'}` })
  })

  // ── Content Moderation ──────────────────────────────────────────────────────

  /**
   * GET /api/admin/reports
   * Get reported content (posts, comments, profiles)
   */
  fastify.get('/reports', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { status = 'pending', page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    const { data, error, count } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(id, username, display_name),
        reported_user:profiles!reports_reported_user_id_fkey(id, username, display_name)
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: { data: data ?? [], total: count ?? 0, page: p, limit: l, hasMore: offset + l < (count ?? 0) },
    })
  })

  /**
   * PUT /api/admin/reports/:id
   * Resolve a report (approve/dismiss)
   */
  fastify.put('/reports/:id', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const {action,note}=z.object({action:z.enum(['approved','dismissed']),note:z.string().max(1000).optional()}).parse(request.body)

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update({
        status: action,
        reviewed_by: request.user.id,
        reviewer_note: note ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({ success: true, data })
  })

  /**
   * DELETE /api/admin/posts/:id
   * Admin remove a post
   */
  fastify.delete('/posts/:id', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { reason } = request.body as { reason?: string }

    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!post) return reply.status(404).send({ message: 'Post not found' })

    await supabaseAdmin.from('posts').delete().eq('id', id)

    return reply.send({ success: true, message: `Post removed. Reason: ${reason ?? 'admin action'}` })
  })

  // ── Platform Analytics ──────────────────────────────────────────────────────

  /**
   * GET /api/admin/stats
   * High-level platform statistics
   */
  fastify.get('/stats', { preHandler: [requireAdmin] }, async (request, reply) => {
    const [
      { count: totalUsers },
      { count: totalPlayers },
      { count: totalPosts },
      { count: totalVideos },
      { count: totalFollows },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'player'),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('videos').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('follows').select('follower_id', { count: 'exact', head: true }),
    ])

    // Users created in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: newUsersThisMonth } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)

    // User type breakdown
    const userTypes = ['player', 'club', 'scout', 'coach', 'fan']
    const typeBreakdown: Record<string, number> = {}
    await Promise.all(
      userTypes.map(async (type) => {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('user_type', type)
        typeBreakdown[type] = count ?? 0
      })
    )

    return reply.send({
      success: true,
      data: {
        totals: {
          users: totalUsers ?? 0,
          players: totalPlayers ?? 0,
          posts: totalPosts ?? 0,
          videos: totalVideos ?? 0,
          follows: totalFollows ?? 0,
        },
        growth: {
          new_users_30d: newUsersThisMonth ?? 0,
        },
        user_type_breakdown: typeBreakdown,
      },
    })
  })

  // ── Algolia Re-indexing ─────────────────────────────────────────────────────

  /**
   * POST /api/admin/search/reindex
   * Trigger a full re-index of all players to Algolia
   */
  fastify.post('/search/reindex', { preHandler: [requireAdmin] }, async (request, reply) => {
    // Fire and forget — this can take a while
    ;(async () => {
      const { data: players } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_type', 'player')

      if (players) {
        for (const player of players) {
          await syncPlayerToAlgolia(player.id).catch(console.error)
        }
        console.log(`✅ Re-indexed ${players.length} players to Algolia`)
      }
    })()

    return reply.send({
      success: true,
      message: 'Algolia re-index started in background',
    })
  })
}

export default adminRoutes
