import { Redis } from '@upstash/redis'
import { env } from '../config/env'

let _redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!_redis) {
    _redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}

// ─── Cache Key Helpers ────────────────────────────────────────────────────────

export const cacheKeys = {
  profile: (id: string) => `profile:${id}`,
  feed: (userId: string, tab: string, page: number) => `feed:${userId}:${tab}:${page}`,
  trending: () => 'trending:posts',
  followersCount: (userId: string) => `followers:count:${userId}`,
  followingIds: (userId: string) => `following:ids:${userId}`,
  unreadCount: (userId: string) => `notifications:unread:${userId}`,
}

export const TTL = {
  profile: 300,        // 5 minutes
  feed: 60,            // 1 minute
  trending: 300,       // 5 minutes
  followingIds: 120,   // 2 minutes
}

// ─── Cache Helpers ────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const value = await redis.get<T>(key)
    return value
  } catch {
    return null
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds = 300
): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // Fail silently — cache is not critical
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    // Fail silently
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Fail silently
  }
}
