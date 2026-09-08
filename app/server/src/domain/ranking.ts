// Transparent first-generation ranking. Weights are hypotheses, not engagement guarantees.
export const RANKING_VERSION = 'football-v2'
export function normalizeTag(tag: string) { return tag.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60) }
export function normalizeTags(tags: string[]) { return [...new Set(tags.map(normalizeTag).filter(Boolean))].slice(0, 10) }
export function decay(date: string, now: number, halfLifeDays = 21) {
  const elapsed = Math.max(0, now - Date.parse(date))
  return Number.isFinite(elapsed) ? Math.pow(0.5, elapsed / (halfLifeDays * 86400000)) : 0
}
export interface Candidate {
  id: string; author_id: string; created_at: string; tags?: string[]; post_type: string;
  likes_count: number; comments_count: number; reposts_count: number;
  author?: { user_type?: string; is_verified?: boolean } | null
}
export interface Context {
  role: string; interests: Record<string, number>; following: Set<string>;
  seen: Set<string>; dismissed: Set<string>; now: number
}
const roleAffinity: Record<string, Record<string, number>> = {
  player: { club: 2.5, scout: 2, coach: 2, player: 1 },
  scout: { player: 3, coach: 1 }, club: { player: 3, coach: 1.5, scout: 1 },
  coach: { coach: 2.5, player: 2, club: 1 }, fan: { player: 1.5, club: 1.5 },
}
export function scorePost(post: Candidate, context: Context) {
  const tags = normalizeTags(post.tags || [])
  const relevance = Math.max(-6, Math.min(8, tags.reduce((sum, tag) => sum + (context.interests[tag] || 0), 0)))
  const fresh = 2 * decay(post.created_at, context.now, 3)
  const popularity = Math.min(2, Math.log1p(Math.max(0, post.likes_count) + 2 * Math.max(0, post.comments_count) + 3 * Math.max(0, post.reposts_count)) / 4)
  const following = context.following.has(post.author_id)
  const score = relevance + fresh + popularity + (following ? 2 : 0)
    + (roleAffinity[context.role]?.[post.author?.user_type || ''] || 0)
    + (['scout', 'club'].includes(context.role) && post.post_type === 'video' ? 1.5 : 0)
    + (post.author?.is_verified ? 0.5 : 0) - (context.seen.has(post.id) ? 5 : 0)
  const reason = relevance > 1 ? 'Matches your football interests' : following ? 'From an account you follow' : 'Discover a football creator'
  return { score, reason }
}
export function rankPosts<T extends Candidate>(posts: T[], context: Context): Array<T & { recommendation_reason: string }> {
  const unique = [...new Map(posts.map(p => [p.id, p])).values()].filter(p => !context.dismissed.has(p.id))
  const pool = unique.map(post => ({ post, ...scorePost(post, context) })).sort((a, b) => b.score - a.score || a.post.id.localeCompare(b.post.id))
  const result: Array<T & { recommendation_reason: string }> = []
  // At most two posts per creator per ten where alternatives exist. Every fifth slot
  // explores an unseen, unfollowed creator with positive relevance, irrespective of followers.
  while (pool.length) {
    const recent = result.slice(-9)
    const eligible = (p: typeof pool[number]) => recent.filter(r => r.author_id === p.post.author_id).length < 2 && result.at(-1)?.author_id !== p.post.author_id
    let index = -1
    if (result.length % 5 === 4) index = pool.findIndex(p => eligible(p) && !context.following.has(p.post.author_id) && !context.seen.has(p.post.id) && p.score > 2)
    if (index < 0) index = pool.findIndex(eligible)
    if (index < 0) index = 0 // Sparse communities still get available content.
    const [next] = pool.splice(index, 1)
    result.push({ ...next.post, recommendation_reason: next.reason })
  }
  return result
}
export function learnInterests(stated: string[], signals: Array<{tags: string[]; weight: number; at: string}>, now: number) {
  const result: Record<string, number> = {}
  for (const tag of [...new Set(stated.map(normalizeTag).filter(Boolean))].slice(0,30)) result[tag] = 1.5
  for (const signal of signals) for (const tag of normalizeTags(signal.tags)) {
    result[tag] = (result[tag] || 0) + signal.weight * decay(signal.at, now)
  }
  for (const tag of Object.keys(result)) result[tag] = Math.max(-3, Math.min(5, result[tag]))
  return result
}
