import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { createReportSchema } from '../schemas/settings.schemas'

const reportRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/reports
   * Submit a report against a post, comment, profile, or video.
   * Any authenticated user can submit a report.
   */
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = createReportSchema.parse(request.body)
    const reporterId = request.user.id

    // Prevent self-reporting
    if (body.reported_user_id === reporterId) {
      return reply.status(400).send({ message: 'You cannot report yourself' })
    }

    // Verify the entity exists
    let entityExists = false
    let entityOwnerId: string | null = body.reported_user_id ?? null

    switch (body.entity_type) {
      case 'post': {
        const { data } = await supabaseAdmin
          .from('posts')
          .select('id, author_id')
          .eq('id', body.entity_id)
          .single()
        entityExists = !!data
        if (data) entityOwnerId = data.author_id
        break
      }
      case 'comment': {
        const { data } = await supabaseAdmin
          .from('comments')
          .select('id, author_id')
          .eq('id', body.entity_id)
          .single()
        entityExists = !!data
        if (data) entityOwnerId = data.author_id
        break
      }
      case 'profile': {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', body.entity_id)
          .single()
        entityExists = !!data
        if (data) entityOwnerId = data.id
        break
      }
      case 'video': {
        const { data } = await supabaseAdmin
          .from('videos')
          .select('id, uploader_id')
          .eq('id', body.entity_id)
          .single()
        entityExists = !!data
        if (data) entityOwnerId = data.uploader_id
        break
      }
    }

    if (!entityExists) {
      return reply.status(404).send({
        message: `${body.entity_type} not found`,
      })
    }

    // Check for duplicate reports (same user, same entity)
    const { data: existingReport } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('reporter_id', reporterId)
      .eq('entity_type', body.entity_type)
      .eq('entity_id', body.entity_id)
      .single()

    if (existingReport) {
      return reply.status(409).send({
        message: 'You have already reported this content',
      })
    }

    // Insert the report
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: entityOwnerId,
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        reason: body.reason,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    return reply.status(201).send({
      success: true,
      data: report,
      message: 'Report submitted. Our moderation team will review it shortly.',
    })
  })

  /**
   * GET /api/reports/mine
   * Get reports submitted by the authenticated user (to see their status)
   */
  fastify.get('/mine', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page = '1', limit = '10' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    const { data, error, count } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('reporter_id', request.user.id)
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
}

export default reportRoutes
