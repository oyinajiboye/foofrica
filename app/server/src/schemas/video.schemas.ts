import { z } from 'zod'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'] as const

export const videoMetadataSchema = z.object({
  cloudflare_uid: z.string().min(1),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  match_type: z.enum(['match', 'training', 'highlight']).optional(),
  position_played: z.enum(POSITIONS).optional(),
  key_actions: z.array(z.enum([
    'goal', 'assist', 'tackle', 'save', 'dribble',
    'header', 'free_kick', 'penalty', 'clearance', 'interception',
  ])).max(10).optional(),
  duration_seconds: z.number().int().min(1).max(600).optional(),
})

export const updateVideoMetadataSchema = videoMetadataSchema.partial().omit({ cloudflare_uid: true })

export type VideoMetadataInput = z.infer<typeof videoMetadataSchema>
export type UpdateVideoMetadataInput = z.infer<typeof updateVideoMetadataSchema>
