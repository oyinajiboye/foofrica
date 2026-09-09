import { getStreamVideo } from '../lib/cloudflare'
import { canViewProfile } from '../services/access.service'
import type { FastifyPluginAsync } from 'fastify'
import { generateUploadUrl, saveVideoMetadata, deleteVideo, incrementViews, handleStreamWebhook } from '../services/video.service'
import { videoMetadataSchema, updateVideoMetadataSchema } from '../schemas/video.schemas'
import { supabaseAdmin } from '../lib/supabase'
import { paginationSchema } from '../schemas/profile.schemas'

const videoRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/videos/upload-url
   * Get a signed Cloudflare Stream direct upload URL.
   * Client uploads directly to Cloudflare — we never handle video bytes.
   */
  fastify.post('/upload-url', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const result = await generateUploadUrl(request.user.id)
    return reply.send({
      success: true,
      data: {
        upload_url: result.uploadUrl,
        uid: result.uid,
        // Tell client to POST the video file to upload_url with Content-Type: video/*
        instructions: 'POST multipart/form-data with a file field to upload_url',
      },
    })
  })

  /**
   * POST /api/videos/metadata
   * Save video metadata after Cloudflare upload completes.
   */
  fastify.post('/metadata', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const body = videoMetadataSchema.parse(request.body)
    const video = await saveVideoMetadata(request.user.id, body)
    return reply.status(201).send({ success: true, data: video })
  })

  /**
   * GET /api/videos/:id
   * Get video details
   */
  fastify.get('/:id', {preHandler:[fastify.optionalAuth]}, async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data: video, error } = await supabaseAdmin
      .from('videos')
      .select(`
        *,
        uploader:profiles!videos_uploader_id_fkey(
          id, username, display_name, avatar_url, is_verified, user_type
        )
      `)
      .eq('id', id)
      .single()

    if (error || !video) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Video not found' })
    }

    if(!await canViewProfile(request.user?.id,video.uploader_id))return reply.code(403).send({message:'Video unavailable'})
    // Increment views (fire and forget)
    incrementViews(id).catch(console.error)

    return reply.send({ success: true, data: video })
  })

  /**
   * PUT /api/videos/:id/metadata
   * Update video metadata (uploader only)
   */
  fastify.put('/:id/metadata', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateVideoMetadataSchema.parse(request.body)

    const { data: video } = await supabaseAdmin
      .from('videos')
      .select('uploader_id')
      .eq('id', id)
      .single()

    if (!video) return reply.status(404).send({ message: 'Video not found' })
    if (video.uploader_id !== request.user.id) {
      return reply.status(403).send({ message: 'You can only edit your own videos' })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('videos')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })
    return reply.send({ success: true, data: updated })
  })

  /**
   * DELETE /api/videos/:id
   */
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await deleteVideo((request.params as {id:string}).id, request.user.id)
    return reply.send({ success: true })
  })

  /**
   * POST /api/videos/webhook/stream
   * Cloudflare Stream status webhook — called by Cloudflare when video processing completes
   */
  fastify.post('/webhook/stream', async (_request, reply) => {
    return reply.code(503).send({message:'Webhook delivery is disabled. Uploaders can refresh processing status.'})
  })
  fastify.post('/:id/status', {preHandler:[fastify.authenticate]}, async(request,reply)=>{
    const {id}=request.params as {id:string}
    const {data:video}=await supabaseAdmin.from('videos').select('*').eq('id',id).eq('uploader_id',request.user.id).single()
    if(!video)return reply.code(404).send({message:'Video not found'})
    const cf=await getStreamVideo(video.cloudflare_uid)
    if(!cf||cf.meta?.uploaderId!==request.user.id)return reply.code(503).send({message:'Unable to check processing status'})
    const {data,error}=await supabaseAdmin.from('videos').update({status:cf.status.state==='ready'?'ready':cf.status.state==='error'?'failed':'processing',duration_seconds:Math.round(cf.duration||0),thumbnail_url:cf.thumbnail,cloudflare_playback_url:cf.playback?.hls||video.cloudflare_playback_url}).eq('id',id).select().single()
    if(error)return reply.code(500).send({message:'Unable to save video status'})
    return {success:true,data}
  })

  /**
   * GET /api/videos
   * Get all videos (discover page)
   */
  fastify.get('/', {preHandler:[fastify.optionalAuth]}, async (request, reply) => {
    const { page, limit } = paginationSchema.parse(request.query)
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('videos')
      .select(`
        *,
        uploader:profiles!videos_uploader_id_fkey(
          id, username, display_name, avatar_url, is_verified
        )
      `, { count: 'exact' })
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return reply.status(500).send({ message: error.message })

    return reply.send({
      success: true,
      data: { data: (await Promise.all((data??[]).map(async v=>await canViewProfile(request.user?.id,v.uploader_id)?v:null))).filter(Boolean), total: count ?? 0, page, limit, hasMore: offset + limit < (count ?? 0) },
    })
  })
}

export default videoRoutes
