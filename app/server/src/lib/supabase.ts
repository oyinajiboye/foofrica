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

// Password and refresh calls must not mutate the shared service-role session.
export function createAuthClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// A fresh, request-local PKCE store; the browser retains only the verifier.
export function createPkceClient(verifier?: string) {
  const values = new Map<string, string>()
  const storageKey = 'footfrica-auth'
  if (verifier) values.set(`${storageKey}-code-verifier`, JSON.stringify(verifier))
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', storageKey, autoRefreshToken: false, persistSession: true,
      detectSessionInUrl: false, storage: {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => { values.set(key, value) },
        removeItem: key => { values.delete(key) },
      } },
  })
  return { client, verifier: () => { const raw=values.get(`${storageKey}-code-verifier`); return raw ? JSON.parse(raw) as string : undefined } }
}
