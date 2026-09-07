import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

// Admin client — uses service role key, bypasses RLS
// NEVER expose this to the frontend
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Public client — uses anon key, respects RLS
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

// Create a client scoped to a specific user JWT (for user-context operations)
export function createUserClient(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
