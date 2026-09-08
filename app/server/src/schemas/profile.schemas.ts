import { z } from 'zod'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'] as const
const DOMINANT_FEET = ['left', 'right', 'both'] as const

export const updateProfileSchema = z.object({
  interests: z.array(z.string().max(60)).max(20).optional(),
  display_name: z.string().min(2).max(60).optional(),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().optional(),
  cover_url: z.string().url().optional(),
})

export const updatePlayerProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nationality: z.string().max(60).optional(),
  height_cm: z.number().int().min(140).max(220).optional(),
  weight_kg: z.number().int().min(40).max(120).optional(),
  dominant_foot: z.enum(DOMINANT_FEET).optional(),
  primary_position: z.enum(POSITIONS).optional(),
  secondary_positions: z.array(z.enum(POSITIONS)).max(3).optional(),
  playing_style_tags: z.array(z.string().max(30)).max(8).optional(),
  jersey_number: z.number().int().min(1).max(99).optional(),
})

export const addCareerEntrySchema = z.object({
  club_name: z.string().min(2).max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  role: z.string().max(60).optional(),
  is_current: z.boolean().default(false),
})

export const upsertPlayerStatsSchema = z.object({
  season: z.string().regex(/^\d{4}(-\d{2})?$/, 'Season format: 2024 or 2024-25'),
  club_name: z.string().min(2).max(100),
  appearances: z.number().int().min(0).default(0),
  goals: z.number().int().min(0).default(0),
  assists: z.number().int().min(0).default(0),
  clean_sheets: z.number().int().min(0).default(0),
  yellow_cards: z.number().int().min(0).default(0),
  red_cards: z.number().int().min(0).default(0),
})

export const updateClubProfileSchema = z.object({
  club_name: z.string().min(2).max(100).optional(),
  founded_year: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  country: z.string().max(60).optional(),
  city: z.string().max(60).optional(),
  league: z.string().max(100).optional(),
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
})

export const updateScoutProfileSchema = z.object({
  organization: z.string().max(100).optional(),
  license_number: z.string().max(50).optional(),
  specialization: z.array(z.string().max(50)).max(5).optional(),
  regions_covered: z.array(z.string().max(60)).max(10).optional(),
})

export const updateCoachProfileSchema = z.object({
  license_level: z.string().max(50).optional(),
  specialization: z.array(z.string().max(50)).max(5).optional(),
})

export const updateFanProfileSchema = z.object({
  favorite_club_name: z.string().max(100).optional(),
  football_interests: z.array(z.string().max(50)).max(10).optional(),
})

export const endorsePlayerSchema = z.object({
  skill: z.enum([
    'pace', 'acceleration', 'ball_control', 'first_touch',
    'shooting', 'finishing', 'passing', 'crossing',
    'dribbling', 'defending', 'tackling', 'heading',
    'positioning', 'vision', 'work_rate', 'leadership',
    'communication', 'goalkeeping',
  ]),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdatePlayerProfileInput = z.infer<typeof updatePlayerProfileSchema>
export type AddCareerEntryInput = z.infer<typeof addCareerEntrySchema>
export type UpsertPlayerStatsInput = z.infer<typeof upsertPlayerStatsSchema>
export type EndorsePlayerInput = z.infer<typeof endorsePlayerSchema>
