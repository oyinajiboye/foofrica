import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { createNotification } from '../services/notification.service'

const messageRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/messages/conversations
   * List all conversations for the authenticated user
   */
  fastify.get('/conversations', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    // Get all conversations where user is a participant
    const { data, error, count } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        messages(
          id, content, created_at, read_at, sender_id
        )
      `, { count: 'exact' })
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + l - 1)

    if (error) return reply.status(500).send({ message: error.message })

    // Enrich with other participant's profile
    const enriched = await Promise.all(
      (data ?? []).map(async (conv) => {
        const otherParticipantId = conv.participant_ids.find((id: string) => id !== userId)
        let otherParticipant = null

        if (otherParticipantId) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, username, display_name, avatar_url, is_verified, user_type')
            .eq('id', otherParticipantId)
            .single()
          otherParticipant = profile
        }

        // Count unread messages
        const unreadMessages = (conv.messages ?? []).filter(
          (msg: any) => msg.sender_id !== userId && !msg.read_at
        )

        return {
          ...conv,
          messages: undefined, // don't send all messages in list view
          other_participant: otherParticipant,
          unread_count: unreadMessages.length,
        }
      })
    )

    return reply.send({
      success: true,
      data: {
        data: enriched,
        total: count ?? 0,
        page: p,
        limit: l,
        hasMore: offset + l < (count ?? 0),
      },
    })
  })

  /**
   * POST /api/messages/conversations
   * Start a new conversation (or return existing)
   */
  fastify.post('/conversations', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id
    const { recipient_id, message } = request.body as {
      recipient_id: string
      message: string
    }

    if (!recipient_id || !message?.trim()) {
      return reply.status(400).send({ message: 'recipient_id and message are required' })
    }

    if (recipient_id === userId) {
      return reply.status(400).send({ message: 'You cannot message yourself' })
    }

    // Verify recipient exists
    const { data: recipient } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', recipient_id)
      .single()

    if (!recipient) return reply.status(404).send({ message: 'Recipient not found' })

    // Check if conversation already exists between these two users
    const participantsSorted = [userId, recipient_id].sort()
    const { data: existing } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .contains('participant_ids', participantsSorted)
      .single()

    let conversationId = existing?.id

    if (!conversationId) {
      // Create new conversation
      const { data: conv, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({
          participant_ids: participantsSorted,
          last_message: message.trim(),
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (convError) return reply.status(500).send({ message: convError.message })
      conversationId = conv.id
    }

    // Send the initial message
    const { data: msg, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: message.trim(),
      })
      .select()
      .single()

    if (msgError) return reply.status(500).send({ message: msgError.message })

    // Update conversation last_message
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message: message.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    // Notify recipient
    createNotification({
      recipientId: recipient_id,
      actorId: userId,
      type: 'message',
      entityType: 'conversation',
      entityId: conversationId,
    }).catch(console.error)

    return reply.status(201).send({
      success: true,
      data: { conversation_id: conversationId, message: msg },
    })
  })

  /**
   * GET /api/messages/conversations/:id
   * Get paginated messages in a conversation
   */
  fastify.get('/conversations/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: conversationId } = request.params as { id: string }
    const userId = request.user.id
    const { page = '1', limit = '30' } = request.query as Record<string, string>
    const p = Number(page)
    const l = Number(limit)
    const offset = (p - 1) * l

    // Verify user is a participant
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id, participant_ids')
      .eq('id', conversationId)
      .single()

    if (!conv || !conv.participant_ids.includes(userId)) {
      return reply.status(403).send({ message: 'Not authorized to view this conversation' })
    }

    const { data, error, count } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id, username, display_name, avatar_url
        )
      `, { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + l - 1)

    if (error) return reply.status(500).send({ message: error.message })

    // Mark unread messages as read
    const unreadIds = (data ?? [])
      .filter((msg) => msg.sender_id !== userId && !msg.read_at)
      .map((msg) => msg.id)

    if (unreadIds.length > 0) {
      await supabaseAdmin
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)
    }

    return reply.send({
      success: true,
      data: {
        data: (data ?? []).reverse(), // oldest first
        total: count ?? 0,
        page: p,
        limit: l,
        hasMore: offset + l < (count ?? 0),
      },
    })
  })

  /**
   * POST /api/messages/conversations/:id
   * Send a message in an existing conversation
   */
  fastify.post('/conversations/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: conversationId } = request.params as { id: string }
    const userId = request.user.id
    const { content } = request.body as { content: string }

    if (!content?.trim()) {
      return reply.status(400).send({ message: 'Message content is required' })
    }

    // Verify user is a participant
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id, participant_ids')
      .eq('id', conversationId)
      .single()

    if (!conv || !conv.participant_ids.includes(userId)) {
      return reply.status(403).send({ message: 'Not authorized to send to this conversation' })
    }

    const { data: msg, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id, username, display_name, avatar_url
        )
      `)
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    // Update conversation
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message: content.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    // Notify the other participant
    const recipientId = conv.participant_ids.find((id: string) => id !== userId)
    if (recipientId) {
      createNotification({
        recipientId,
        actorId: userId,
        type: 'message',
        entityType: 'conversation',
        entityId: conversationId,
      }).catch(console.error)
    }

    return reply.status(201).send({ success: true, data: msg })
  })

  /**
   * DELETE /api/messages/conversations/:id
   * Leave / delete a conversation (removes user from participants)
   */
  fastify.delete('/conversations/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: conversationId } = request.params as { id: string }
    const userId = request.user.id

    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id, participant_ids')
      .eq('id', conversationId)
      .single()

    if (!conv || !conv.participant_ids.includes(userId)) {
      return reply.status(403).send({ message: 'Not authorized' })
    }

    const remaining = conv.participant_ids.filter((id: string) => id !== userId)

    if (remaining.length === 0) {
      // Delete the whole conversation if no participants left
      await supabaseAdmin.from('messages').delete().eq('conversation_id', conversationId)
      await supabaseAdmin.from('conversations').delete().eq('id', conversationId)
    } else {
      await supabaseAdmin
        .from('conversations')
        .update({ participant_ids: remaining })
        .eq('id', conversationId)
    }

    return reply.send({ success: true })
  })
}

export default messageRoutes
