import { env } from '../config/env'

const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}`

function cfHeaders() {
  return {
    Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function isConfigured(): boolean {
  return !!(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN)
}

// ─── Cloudflare Stream ────────────────────────────────────────────────────────

export interface StreamUploadUrlResult {
  uploadUrl: string
  uid: string
  scheduledDeletion?: string
}

/**
 * Creates a direct-upload URL via Cloudflare Stream.
 * The client uploads directly to Cloudflare — our server never handles the video bytes.
 */
export async function createStreamUploadUrl(options: {
  maxDurationSeconds?: number
  requireSignedURLs?: boolean
  uploaderId: string
}): Promise<StreamUploadUrlResult | null> {
  if (!isConfigured()) {
    console.warn('⚠️  Cloudflare not configured — returning mock upload URL')
    return {
      uploadUrl: 'https://mock-upload-url.example.com',
      uid: `mock-${Date.now()}`,
    }
  }

  const response = await fetch(`${CF_BASE}/stream/direct_upload`, {
    method: 'POST',
    headers: cfHeaders(),
    body: JSON.stringify({
      maxDurationSeconds: options.maxDurationSeconds ?? 600, // 10 min max
      requireSignedURLs: options.requireSignedURLs ?? false,
      meta: {
        uploaderId: options.uploaderId,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Cloudflare Stream error: ${JSON.stringify(error)}`)
  }

  const data = await response.json() as {
    result: { uploadURL: string; uid: string; scheduledDeletion?: string }
  }

  return {
    uploadUrl: data.result.uploadURL,
    uid: data.result.uid,
    scheduledDeletion: data.result.scheduledDeletion,
  }
}

/**
 * Gets video details from Cloudflare Stream by UID.
 */
export async function getStreamVideo(uid: string) {
  if (!isConfigured()) return null

  const response = await fetch(`${CF_BASE}/stream/${uid}`, {
    headers: cfHeaders(),
  })

  if (!response.ok) return null

  const data = await response.json() as {
    result: {
      uid: string
      status: { state: string }
      thumbnail: string
      playback: { hls: string; dash: string }
      duration: number
      meta: Record<string, string>
    }
  }

  return data.result
}

/**
 * Deletes a video from Cloudflare Stream.
 */
export async function deleteStreamVideo(uid: string): Promise<boolean> {
  if (!isConfigured()) return true

  const response = await fetch(`${CF_BASE}/stream/${uid}`, {
    method: 'DELETE',
    headers: cfHeaders(),
  })

  return response.ok
}

/**
 * Returns the public HLS playback URL for a Cloudflare Stream video.
 */
export function getPlaybackUrl(uid: string): string {
  const subdomain = env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN ?? 'customer-PLACEHOLDER'
  return `https://${subdomain}.cloudflarestream.com/${uid}/manifest/video.m3u8`
}

/**
 * Returns the thumbnail URL for a Cloudflare Stream video.
 */
export function getThumbnailUrl(uid: string): string {
  const subdomain = env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN ?? 'customer-PLACEHOLDER'
  return `https://${subdomain}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`
}
