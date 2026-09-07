import { z } from 'zod'

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
})

export const startConversationSchema = z.object({
  recipient_id: z.string().uuid(),
  initial_message: z.string().min(1).max(2000),
})

export const createShortlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
})

export const addToShortlistSchema = z.object({
  player_id: z.string().uuid(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type StartConversationInput = z.infer<typeof startConversationSchema>
export type CreateShortlistInput = z.infer<typeof createShortlistSchema>
