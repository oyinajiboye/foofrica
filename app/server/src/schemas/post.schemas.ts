import { z } from 'zod'

export const createPostSchema = z.object({
  content: z.string().trim().max(2000).optional(),
  post_type: z.enum(['text', 'video', 'image', 'poll']),
  video_id: z.string().uuid().optional(),
  image_urls: z.array(z.string().url()).max(4).optional(),
  repost_of: z.string().uuid().optional(),
  hashtags: z.array(z.string().max(50)).max(10).optional(),
  mentions: z.array(z.string().uuid()).max(10).optional(),
  tags: z.array(z.string().max(60)).max(10).optional(), // interest topic tags for feed personalisation
  visibility: z.enum(['public', 'followers']).default('public'),
  // Poll-specific
  poll_options: z.array(z.string().trim().min(1).max(100)).min(2).max(4).optional(),
  poll_duration_hours: z.number().int().min(1).max(168).optional(),
}).refine(
  (data) => data.content || data.video_id || (data.image_urls && data.image_urls.length > 0),
  { message: 'Post must have content, a video, or at least one image' }
).refine(data=>data.post_type!=='poll'||!!data.poll_options,{message:'Poll requires 2–4 options'})
.refine(data=>data.post_type!=='video'||!!data.video_id,{message:'Video post requires a video'})
.refine(data=>data.post_type!=='image'||!!data.image_urls?.length,{message:'Image post requires photos'})

export const createCommentSchema = z.object({
  parent_id: z.string().uuid().optional(),
  content: z.string().min(1).max(500),
  mentions: z.array(z.string().uuid()).max(5).optional(),
})

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(100).optional(), // ISO timestamp for cursor pagination
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type FeedQueryInput = z.infer<typeof feedQuerySchema>
