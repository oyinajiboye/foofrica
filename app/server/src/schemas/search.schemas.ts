import { z } from 'zod'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'] as const

export const playerSearchSchema = z.object({
  q: z.string().optional(),
  position: z.enum(POSITIONS).optional(),
  min_age: z.string().transform(Number).pipe(z.number().int().min(14).max(50)).optional(),
  max_age: z.string().transform(Number).pipe(z.number().int().min(14).max(50)).optional(),
  nationality: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  min_height: z.string().transform(Number).pipe(z.number().int().min(140).max(220)).optional(),
  max_height: z.string().transform(Number).pipe(z.number().int().min(140).max(220)).optional(),
  dominant_foot: z.enum(['left', 'right', 'both']).optional(),
  club: z.string().optional(),
  verified_only: z.string().transform((v) => v === 'true').optional(),
  has_videos: z.string().transform((v) => v === 'true').optional(),
  min_endorsements: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
})

export const generalSearchSchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['profiles', 'posts', 'videos', 'all']).default('all'),
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
})

export type PlayerSearchInput = z.infer<typeof playerSearchSchema>
export type GeneralSearchInput = z.infer<typeof generalSearchSchema>
