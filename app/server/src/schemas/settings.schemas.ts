import { z } from 'zod'

// ─── Settings Update Schemas ────────────────────────────────────────────────

export const updatePrivacySchema = z.object({
  profile_visibility: z.enum(['public', 'private']).optional(),
  who_can_dm: z.enum(['everyone', 'followers', 'nobody']).optional(),
  show_online_status: z.boolean().optional(),
  show_location: z.boolean().optional(),
  show_age: z.boolean().optional(),
})

export const updateMessagingSettingsSchema = z.object({
  message_requests: z.boolean().optional(),
  auto_accept_verified: z.boolean().optional(),
})

export const updateNotificationSettingsSchema = z.object({
  notify_likes: z.boolean().optional(),
  notify_comments: z.boolean().optional(),
  notify_follows: z.boolean().optional(),
  notify_messages: z.boolean().optional(),
  notify_mentions: z.boolean().optional(),
  notify_endorsements: z.boolean().optional(),
  notify_shortlists: z.boolean().optional(),
  notify_push_enabled: z.boolean().optional(),
  notify_email_enabled: z.boolean().optional(),
})

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'] as const

export const updateDiscoverySettingsSchema = z.object({
  discovery_positions: z.array(z.enum(POSITIONS)).max(5).optional(),
  discovery_min_age: z.number().int().min(14).max(50).nullable().optional(),
  discovery_max_age: z.number().int().min(14).max(50).nullable().optional(),
  discovery_countries: z.array(z.string().max(60)).max(20).optional(),
})

// Unified settings update — accepts any combination of settings fields
export const updateSettingsSchema = z.object({
  // Privacy
  profile_visibility: z.enum(['public', 'private']).optional(),
  who_can_dm: z.enum(['everyone', 'followers', 'nobody']).optional(),
  show_online_status: z.boolean().optional(),
  show_location: z.boolean().optional(),
  show_age: z.boolean().optional(),

  // Messaging
  message_requests: z.boolean().optional(),
  auto_accept_verified: z.boolean().optional(),

  // Notifications
  notify_likes: z.boolean().optional(),
  notify_comments: z.boolean().optional(),
  notify_follows: z.boolean().optional(),
  notify_messages: z.boolean().optional(),
  notify_mentions: z.boolean().optional(),
  notify_endorsements: z.boolean().optional(),
  notify_shortlists: z.boolean().optional(),
  notify_push_enabled: z.boolean().optional(),
  notify_email_enabled: z.boolean().optional(),

  // Discovery
  discovery_positions: z.array(z.enum(POSITIONS)).max(5).optional(),
  discovery_min_age: z.number().int().min(14).max(50).nullable().optional(),
  discovery_max_age: z.number().int().min(14).max(50).nullable().optional(),
  discovery_countries: z.array(z.string().max(60)).max(20).optional(),
})

// ─── Account Change Schemas ─────────────────────────────────────────────────

export const changeEmailSchema = z.object({
  new_email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Current password is required'),
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const changeUsernameSchema = z.object({
  new_username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Username must be lowercase alphanumeric with underscores only'),
})

// ─── Report Schema ──────────────────────────────────────────────────────────

export const createReportSchema = z.object({
  entity_type: z.enum(['post', 'comment', 'profile', 'video']),
  entity_id: z.string().uuid('Invalid entity ID'),
  reported_user_id: z.string().uuid().optional(),
  reason: z.string().min(5, 'Please provide a reason (at least 5 characters)').max(500),
})

// Type exports
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
