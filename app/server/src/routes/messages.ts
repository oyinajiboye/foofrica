import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { paginationSchema } from '../schemas/profile.schemas'
import { canMessage } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { createNotification } from '../services/notification.service'

const messageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/conversations/:id/attachments',{preHandler:[fastify.authenticate]},async(request,reply)=>{
    const {id}=z.object({id:z.string().uuid()}).parse(request.params)
    const {data:conv}=await supabaseAdmin.from('conversations').select('participant_ids').eq('id',id).single()
    if(!conv?.participant_ids.includes(request.user.id))return reply.code(403).send({message:'Conversation unavailable'})
    const other=conv.participant_ids.find((p:string)=>p!==request.user.id)
    if(!other||!await canMessage(request.user.id,other))return reply.code(403).send({message:'This account is not accepting messages from you.'})
    const file=await request.file()
    if(!file||!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.mimetype))return reply.code(400).send({message:'Choose a PDF, JPEG, PNG or WebP file up to 5 MB.'})
    const bytes=await file.toBuffer(),path=`${id}/${randomUUID()}`
    const storage=supabaseAdmin.storage.from('message-attachments')
    const {error:uploadError}=await storage.upload(path,bytes,{contentType:file.mimetype})
    if(uploadError)return reply.code(500).send({message:'Unable to upload attachment'})
    const filename=file.filename.replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,120)||'Attachment'
    const {data:msg,error}=await supabaseAdmin.from('messages').insert({conversation_id:id,sender_id:request.user.id,content:`Attachment: ${filename}`}).select().single()
    if(error){await storage.remove([path]);return reply.code(500).send({message:'Unable to send attachment'})}
    const {error:linkError}=await supabaseAdmin.from('message_attachments').insert({message_id:msg.id,storage_path:path,file_name:filename,mime_type:file.mimetype,file_size:bytes.length})
    if(linkError){await storage.remove([path]);await supabaseAdmin.from('messages').delete().eq('id',msg.id);return reply.code(500).send({message:'Unable to save attachment'})}
    await supabaseAdmin.from('conversations').update({last_message:msg.content,last_message_at:new Date().toISOString()}).eq('id',id)
    return reply.code(201).send({success:true,data:msg})
  })
  fastify.get('/attachments/:id',{preHandler:[fastify.authenticate]},async(request,reply)=>{
    const {id}=z.object({id:z.string().uuid()}).parse(request.params)
    const {data:a}=await supabaseAdmin.from('message_attachments').select('*,message:messages!inner(conversation:conversations!inner(participant_ids))').eq('id',id).single()
    if(!a?.message?.conversation?.participant_ids.includes(request.user.id))return reply.code(403).send({message:'Attachment unavailable'})
    const {data,error}=await supabaseAdmin.storage.from('message-attachments').createSignedUrl(a.storage_path,60,{download:a.file_name})
    if(error)return reply.code(500).send({message:'Unable to download attachment'})
    return {success:true,data:{url:data.signedUrl}}
  })

  /**
   * GET /api/messages/conversations
   * List all conversations for the authenticated user
   */
  fastify.get('/conversations', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id
    const {page:p,limit:l}=paginationSchema.parse(request.query)
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

    const {data:preferences,error:prefError}=await supabaseAdmin.from('conversation_preferences').select('conversation_id,pinned,muted').eq('user_id',userId)
    if(prefError)throw new Error('Unable to load conversation preferences')
    const prefs=new Map((preferences||[]).map(p=>[p.conversation_id,p]))
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
          pinned: prefs.get(conv.id)?.pinned || false,
          muted: prefs.get(conv.id)?.muted || false,
          other_participant: otherParticipant,
          unread_count: unreadMessages.length,
        }
      })
    )

    return reply.send({
      success: true,
      data: {
        data: enriched.sort((a,b)=>Number(b.pinned)-Number(a.pinned)),
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
    const { recipient_id, message } = z.object({recipient_id:z.string().uuid(),message:z.string().trim().min(1).max(2000)}).parse(request.body)

    if (!recipient_id || !message?.trim()) {
      return reply.status(400).send({ message: 'recipient_id and message are required' })
    }

    if (recipient_id === userId) {
      return reply.status(400).send({ message: 'You cannot message yourself' })
    }

    if(!await canMessage(userId,recipient_id))return reply.code(403).send({message:'This account is not accepting messages from you.'})

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
    const {page:p,limit:l}=paginationSchema.parse(request.query)
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
        *, attachments:message_attachments(id,file_name,mime_type,file_size),
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
    const { content } = z.object({content:z.string().trim().min(1).max(2000)}).parse(request.body)

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

    const recipient=conv.participant_ids.find((id:string)=>id!==userId)
    if(!recipient || !await canMessage(userId,recipient))return reply.code(403).send({message:'This account is not accepting messages from you.'})

    const { data: msg, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
      })
      .select(`
        *, attachments:message_attachments(id,file_name,mime_type,file_size),
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
