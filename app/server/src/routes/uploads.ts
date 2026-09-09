import type { FastifyPluginAsync } from 'fastify'
import { supabaseAdmin } from '../lib/supabase'
import { cacheDelete, cacheKeys } from '../lib/redis'

const AVATAR_BUCKET = 'avatars'
const COVER_BUCKET = 'covers'
const POST_IMAGE_BUCKET = 'post-images'

/**
 * Uploads routes — handle profile image uploads using Supabase Storage.
 * The client sends the file as multipart/form-data.
 * We store to Supabase Storage and update the profile record.
 */
const uploadsRoutes: FastifyPluginAsync = async (fastify) => {

  /**
   * POST /api/uploads/avatar
   * Upload or replace the authenticated user's avatar image.
   * Accepts: multipart/form-data with field "file" (image/*)
   * Returns: { avatar_url }
   */
  fastify.post('/avatar', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id

    // Read multipart
    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded. Send multipart/form-data with a "file" field.' })
    }

    const mime = data.mimetype
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
      return reply.status(400).send({ message: 'Only image files are allowed for avatars.' })
    }

    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const storagePath = `${userId}/avatar.${ext}`

    // Read buffer
    const buffer = await data.toBuffer()

    // Upload to Supabase Storage (upsert — overwrites any existing avatar)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mime,
        upsert: true,
      })

    if (uploadError) {
      return reply.status(500).send({ message: `Storage upload failed: ${uploadError.message}` })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(storagePath)

    const avatar_url = urlData.publicUrl

    // Update profile record
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      return reply.status(500).send({ message: `Profile update failed: ${updateError.message}` })
    }

    // Bust profile cache
    await cacheDelete(cacheKeys.profile(userId))

    return reply.send({ success: true, data: { avatar_url } })
  })

  /**
   * POST /api/uploads/cover
   * Upload or replace the authenticated user's cover/banner image.
   * Accepts: multipart/form-data with field "file" (image/*)
   * Returns: { cover_url }
   */
  fastify.post('/cover', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id

    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded. Send multipart/form-data with a "file" field.' })
    }

    const mime = data.mimetype
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
      return reply.status(400).send({ message: 'Only image files are allowed for covers.' })
    }

    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const storagePath = `${userId}/cover.${ext}`

    const buffer = await data.toBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from(COVER_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mime,
        upsert: true,
      })

    if (uploadError) {
      return reply.status(500).send({ message: `Storage upload failed: ${uploadError.message}` })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(COVER_BUCKET)
      .getPublicUrl(storagePath)

    const cover_url = urlData.publicUrl

    // Update profile record
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ cover_url, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      return reply.status(500).send({ message: `Profile update failed: ${updateError.message}` })
    }

    // Bust profile cache
    await cacheDelete(cacheKeys.profile(userId))

    return reply.send({ success: true, data: { cover_url } })
  })

  /**
   * POST /api/uploads/post-image
   * Upload an image to attach to a post.
   * Accepts: multipart/form-data with field "file" (image/*)
   * Returns: { image_url }
   */
  fastify.post('/post-image', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id

    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded. Send multipart/form-data with a "file" field.' })
    }

    const mime = data.mimetype
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
      return reply.status(400).send({ message: 'Only image files are allowed.' })
    }

    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const storagePath = `${userId}/${uniqueId}.${ext}`

    const buffer = await data.toBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from(POST_IMAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mime,
        upsert: false,
      })

    if (uploadError) {
      return reply.status(500).send({ message: `Storage upload failed: ${uploadError.message}` })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(POST_IMAGE_BUCKET)
      .getPublicUrl(storagePath)

    return reply.send({
      success: true,
      data: { image_url: urlData.publicUrl },
    })
  })
}

export default uploadsRoutes
