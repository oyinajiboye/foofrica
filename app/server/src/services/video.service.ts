import { createStreamUploadUrl, getStreamVideo, getPlaybackUrl, getThumbnailUrl, deleteStreamVideo } from '../lib/cloudflare'
import { supabaseAdmin } from '../lib/supabase'
import type { VideoMetadataInput } from '../schemas/video.schemas'

/**
 * Generate a Cloudflare Stream direct upload URL.
 * The client uploads directly to Cloudflare — we never proxy video bytes.
 */
export async function generateUploadUrl(uploaderId: string) {
  const result = await createStreamUploadUrl({
    maxDurationSeconds: 600, // 10 min max
    requireSignedURLs: false,
    uploaderId,
  })

  if (!result) {
    throw new Error('Failed to generate upload URL')
  }

  return result
}

/**
 * Save video metadata after Cloudflare confirms the upload.
 * This is called by the client after upload completes.
 */
export async function saveVideoMetadata(
  uploaderId: string,
  metadata: VideoMetadataInput
) {
  const { cloudflare_uid, ...rest } = metadata

  // Poll Cloudflare for video status (it processes asynchronously)
  const cfVideo = await getStreamVideo(cloudflare_uid)
  if (!cfVideo || cfVideo.meta?.uploaderId !== uploaderId) throw Object.assign(new Error('Upload ownership could not be verified.'), {statusCode:403})
  const status = cfVideo.status.state === 'ready' ? 'ready' : cfVideo.status.state === 'error' ? 'failed' : 'processing'

  const playbackUrl = cfVideo.playback?.hls || getPlaybackUrl(cloudflare_uid)
  const thumbnailUrl = cfVideo.thumbnail || getThumbnailUrl(cloudflare_uid)

  const { data, error } = await supabaseAdmin
    .from('videos')
    .insert({
      uploader_id: uploaderId,
      cloudflare_uid,
      cloudflare_playback_url: playbackUrl,
      thumbnail_url: thumbnailUrl,
      status,
      views_count: 0,
      ...rest,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to save video: ${error.message}`)
  return data
}

/**
 * Webhook handler for Cloudflare Stream status updates.
 * Cloudflare calls this when video processing completes.
 */
export async function handleStreamWebhook(payload: {
  uid: string
  status: { state: string }
  thumbnail: string
  duration: number
}) {
  const status = payload.status.state === 'ready' ? 'ready' : 'failed'

  await supabaseAdmin
    .from('videos')
    .update({
      status,
      thumbnail_url: payload.thumbnail,
      duration_seconds: Math.round(payload.duration),
      cloudflare_playback_url: getPlaybackUrl(payload.uid),
    })
    .eq('cloudflare_uid', payload.uid)
}

/**
 * Delete video from both Cloudflare and the database.
 */
export async function deleteVideo(videoId: string, userId: string) {
  // Get the video
  const { data: video, error } = await supabaseAdmin
    .from('videos')
    .select('cloudflare_uid, uploader_id')
    .eq('id', videoId)
    .single()

  if (error || !video) throw new Error('Video not found')

  if (video.uploader_id !== userId) {
    throw new Error('Unauthorized: you can only delete your own videos')
  }

  // Delete from Cloudflare
  if (!await deleteStreamVideo(video.cloudflare_uid)) throw new Error('Unable to delete video from storage')

  // Delete from DB
  await supabaseAdmin.from('videos').delete().eq('id', videoId)
}

/**
 * Increment view count (debounced per user via Redis in production).
 */
export async function incrementViews(videoId: string) {
  await supabaseAdmin.rpc('increment_video_views', { video_id: videoId })
}
