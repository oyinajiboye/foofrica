import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
})

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
})

export const onboardSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  display_name: z.string().min(2).max(60),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().optional(),
})

/**
 * Complete-profile schema — called by the frontend at the end of onboarding.
 * Combines: user_type selection + identity (username, display_name, country) +
 *           interests selection in a single request.
 */
export const completeProfileSchema = z.object({
  user_type: z.enum(['player', 'club', 'scout', 'coach', 'fan']),
  full_name: z.string().min(2).max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, and underscores only'),
  country: z.string().min(2).max(80).optional(),
  interests: z.array(z.string().max(60)).max(20).default([]),
  avatar_url: z.string().url().optional(),
})

export const updateFcmTokenSchema = z.object({
  fcm_token: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OnboardInput = z.infer<typeof onboardSchema>
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
