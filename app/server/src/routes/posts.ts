import { normalizeTags } from '../domain/ranking'
import { canViewPost } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { cacheDelete, cacheDeletePattern, cacheKeys } from '../lib/redis'
import { createNotification } from '../services/notification.service'
import { createPostSchema, createCommentSchema } from '../schemas/post.schemas'
import { paginationSchema } from '../schemas/profile.schemas'

const postRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply the same authorization to comments, reactions, reposts and direct reads.
  fastify.addHook('preHandler', fastify.optionalAuth)
  fastify.addHook('preHandler', async (request,reply) => {
    const id=(request.params as {id?:string}).id
    if(!id)return
    const {data,error}=await supabaseAdmin.from('posts').select('author_id,visibility').eq('id',id).maybeSingle()
    if(error) return reply.code(500).send({message:'Unable to check post access'})
    if(!data)return reply.code(404).send({message:'Post not found'})
    if(!await canViewPost(request.user?.id,data))return reply.code(403).send({message:'Post is unavailable'})
  })
  /**
   * POST /api/posts
   * Create a new post
   */
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = createPostSchema.parse(request.body)
    const authorId = request.user.id
    if(body.video_id){
      const {data:video}=await supabaseAdmin.from('videos').select('uploader_id,status').eq('id',body.video_id).single()
      if(!video||video.uploader_id!==authorId||video.status!=='ready')return reply.code(400).send({message:'Choose a processed video that you uploaded.'})
    }
    if(body.repost_of){
      const {data:original}=await supabaseAdmin.from('posts').select('author_id,visibility').eq('id',body.repost_of).single()
      if(!original||!await canViewPost(authorId,original))return reply.code(403).send({message:'Original post is unavailable.'})
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        author_id: authorId,
        content: body.content ?? null,
        post_type: body.post_type,
        video_id: body.video_id ?? null,
        image_urls: body.image_urls ?? [],
        repost_of: body.repost_of ?? null,
        tags: normalizeTags([...(body.tags || []),...(body.hashtags || []),...(body.post_type==='video'?['player highlights']:[]) ]),
        hashtags: body.hashtags ?? [],
        mentions: body.mentions ?? [],
        visibility: body.visibility,
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
      })
      .select(`
        *,
        author:profiles!posts_author_id_fkey(
          id, username, display_name, avatar_url, is_verified, user_type
        ),
        video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds)
      `)
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    if(body.post_type==='poll'){
      const {error:pollError}=await supabaseAdmin.from('polls').insert({post_id:post.id,options:body.poll_options,closes_at:new Date(Date.now()+(body.poll_duration_hours||24)*3600000).toISOString()})
      if(pollError){await supabaseAdmin.from('posts').delete().eq('id',post.id);return reply.code(500).send({message:'Unable to create poll'})}
    }

    // Increment post count
    await supabaseAdmin.rpc('increment_post_count', { profile_id: authorId })

    // If repost, increment original repost count + notify
    if (body.repost_of) {
      await supabaseAdmin.rpc('increment_repost_count', { post_id: body.repost_of })
      const { data: original } = await supabaseAdmin
        .from('posts')
        .select('author_id')
        .eq('id', body.repost_of)
        .single()
      if (original) {
        createNotification({
          recipientId: original.author_id,
          actorId: authorId,
          type: 'like',
          entityType: 'post',
          entityId: body.repost_of,
        }).catch(console.error)
      }
    }

    // Notify mentioned users
    if (body.mentions && body.mentions.length > 0) {
      body.mentions.forEach((mentionedId) => {
        createNotification({
          recipientId: mentionedId,
          actorId: authorId,
          type: 'mention',
          entityType: 'post',
          entityId: post.id,
        }).catch(console.error)
      })
    }

    // Invalidate feed caches for the author's followers
    cacheDeletePattern(`feed:*`).catch(console.error)

    return reply.status(201).send({ success: true, data: post })
  })

  /**
   * GET /api/posts/:id
   * Get single post with full context
   */
  fastify.get('/:id', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(
          id, username, display_name, avatar_url, is_verified, verification_tier, user_type
        ),
        video:videos(id, cloudflare_uid, cloudflare_playback_url, thumbnail_url, duration_seconds, status),
        repost_source:posts!posts_repost_of_fkey(
          id, content, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !post) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Post not found' })
    }

    let is_liked = false
    let is_reposted = false

    if (request.user) {
      const [likeResult, repostResult] = await Promise.all([
        supabaseAdmin.from('likes').select('post_id').eq('user_id', request.user.id).eq('post_id', id).single(),
        supabaseAdmin.from('reposts').select('post_id').eq('user_id', request.user.id).eq('post_id', id).single(),
      ])
      is_liked = !!likeResult.data
      is_reposted = !!repostResult.data
    }

    return reply.send({ success: true, data: { ...post, is_liked, is_reposted } })
  })

  /**
   * DELETE /api/posts/:id
   */
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!post) return reply.status(404).send({ message: 'Post not found' })
    if (post.author_id !== request.user.id) {
      return reply.status(403).send({ message: 'You can only delete your own posts' })
    }

    await supabaseAdmin.from('posts').delete().eq('id', id)
    await supabaseAdmin.rpc('decrement_post_count', { profile_id: request.user.id })

    return reply.send({ success: true })
  })

  /**
   * POST /api/posts/:id/like
   */
  fastify.post('/:id/like', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: postId } = request.params as { id: string }
    const userId = request.user.id

    const { error } = await supabaseAdmin
      .from('likes')
      .insert({ user_id: userId, post_id: postId })

    if (error?.code === '23505') {
      return reply.status(409).send({ message: 'Already liked' })
    }
    if (error) return reply.status(500).send({ message: error.message })

    await supabaseAdmin.rpc('increment_likes_count', { post_id: postId })

    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (post) {
      createNotification({
        recipientId: post.author_id,
        actorId: userId,
        type: 'like',
        entityType: 'post',
        entityId: postId,
      }).catch(console.error)
    }

    return reply.status(201).send({ success: true })
  })

  /**
   * DELETE /api/posts/:id/like
   */
  fastify.delete('/:id/like', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: postId } = request.params as { id: string }

    await supabaseAdmin
      .from('likes')
      .delete()
      .eq('user_id', request.user.id)
      .eq('post_id', postId)

    await supabaseAdmin.rpc('decrement_likes_count', { post_id: postId })

    return reply.send({ success: true })
  })

  /**
   * POST /api/posts/:id/repost
   * Proper repost — inserts into the reposts table and increments counter.
   * Unlike the old workaround (creating a blank text post), this creates a
   * dedicated repost record associated to the original post.
   */
  fastify.post('/:id/repost', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: postId } = request.params as { id: string }
    const userId = request.user.id

    // Verify the original post exists
    const { data: original, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, author_id, reposts_count')
      .eq('id', postId)
      .single()

    if (fetchError || !original) {
      return reply.status(404).send({ message: 'Post not found' })
    }

    // Idempotency — return 409 if already reposted
    const { data: existing } = await supabaseAdmin
      .from('reposts')
      .select('post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    if (existing) {
      return reply.status(409).send({ message: 'Already reposted' })
    }

    // Insert repost record
    const { error: insertError } = await supabaseAdmin
      .from('reposts')
      .insert({ user_id: userId, post_id: postId })

    if (insertError) return reply.status(500).send({ message: insertError.message })

    // Increment counter
    await supabaseAdmin.rpc('increment_repost_count', { post_id: postId })

    // Notify original author
    if (original.author_id !== userId) {
      createNotification({
        recipientId: original.author_id,
        actorId: userId,
        type: 'repost' as any,
        entityType: 'post',
        entityId: postId,
      }).catch(console.error)
    }

    return reply.status(201).send({ success: true })
  })

  /**
   * DELETE /api/posts/:id/repost
   * Undo a repost
   */
  fastify.delete('/:id/repost', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: postId } = request.params as { id: string }

    await supabaseAdmin
      .from('reposts')
      .delete()
      .eq('user_id', request.user.id)
      .eq('post_id', postId)

    await supabaseAdmin.rpc('decrement_repost_count', { post_id: postId })

    return reply.send({ success: true })
  })

  /**
   * GET /api/posts/:id/comments
   */
  fastify.get('/:id/comments', async (request, reply) => {
    const { id: postId } = request.params as { id: string }
    const { page, limit } = paginationSchema.parse(request.query)
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey(
          id, username, display_name, avatar_url, is_verified
        )
      `, { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: {
        data: data ?? [],
        total: count ?? 0,
        page,
        limit,
        hasMore: offset + limit < (count ?? 0),
      },
    })
  })

  /**
   * POST /api/posts/:id/comments
   */
  fastify.post('/:id/comments', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: postId } = request.params as { id: string }
    const body = createCommentSchema.parse(request.body)
    const authorId = request.user.id

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: postId,
        author_id: authorId,
        content: body.content,
        likes_count: 0,
      })
      .select(`
        *,
        author:profiles!comments_author_id_fkey(
          id, username, display_name, avatar_url, is_verified
        )
      `)
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    await supabaseAdmin.rpc('increment_comments_count', { post_id: postId })

    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (post) {
      createNotification({
        recipientId: post.author_id,
        actorId: authorId,
        type: 'comment',
        entityType: 'post',
        entityId: postId,
      }).catch(console.error)
    }

    return reply.status(201).send({ success: true, data: comment })
  })
}

export default postRoutes
