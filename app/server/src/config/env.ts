import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_BASE_URL: z.string().default('http://localhost:3001'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // Algolia (optional for dev — falls back to Postgres search)
  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_ADMIN_API_KEY: z.string().optional(),
  ALGOLIA_SEARCH_API_KEY: z.string().optional(),
  ALGOLIA_PLAYERS_INDEX: z.string().default('footfrica_players'),

  // Upstash Redis (optional for dev)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Cloudflare Stream (optional for dev)
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN: z.string().optional(),

  // Firebase FCM (optional for dev)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    })
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()
export type Env = typeof env
