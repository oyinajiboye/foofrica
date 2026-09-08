import { supabaseAdmin as db } from '../lib/supabase'
import { blockedIds } from './access.service'
import { learnInterests, rankPosts, RANKING_VERSION } from '../domain/ranking'
const selection = `*,author:profiles!posts_author_id_fkey(id,username,display_name,avatar_url,is_verified,user_type),video:videos(id,cloudflare_uid,cloudflare_playback_url,thumbnail_url,duration_seconds,status)`
function chunks<T>(items:T[],size=100):T[][] { return Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size)) }
function check(error: any) { if (error) throw new Error('Unable to load recommendations') }
export async function eligiblePosts(userId: string, posts: any[]) {
  if (!posts.length) return []
  const authors = [...new Set(posts.map(p => p.author_id))]
  const [blocked, muted, settings, follows] = await Promise.all([
    blockedIds(userId), db.from('muted_users').select('muted_id').eq('muter_id', userId),
    Promise.all(chunks(authors).map(ids=>db.from('user_settings').select('user_id,profile_visibility').in('user_id', ids))),
    Promise.all(chunks(authors).map(ids=>db.from('follows').select('following_id').eq('follower_id', userId).in('following_id', ids))),
  ])
  for (const r of [muted, ...settings, ...follows]) check(r.error)
  const excluded = new Set([...blocked, ...(muted.data || []).map(m => m.muted_id)])
  const privateIds = new Set(settings.flatMap(r=>r.data || []).filter(s => s.profile_visibility === 'private').map(s => s.user_id))
  const followed = new Set(follows.flatMap(r=>r.data || []).map(f => f.following_id))
  return posts.filter(p => !excluded.has(p.author_id) && (p.author_id === userId || !privateIds.has(p.author_id)) &&
    (p.visibility === 'public' || p.author_id === userId || followed.has(p.author_id)) && (p.post_type !== 'video' || p.video?.status === 'ready'))
}
export async function recommendedFeed(userId: string, role: string, limit: number, cursor?: string) {
  let ids: string[], sessionId: string, offset = 0
  let reasons: Record<string,string> = {}
  const now = Date.now()
  if (cursor) {
    const parts = cursor.split(':'); sessionId = parts[0]; offset = Number(parts[1])
    if (!/^[a-f0-9-]{36}$/.test(sessionId) || parts.length !== 2 || !Number.isSafeInteger(offset) || offset < 0 || offset > 600) throw Object.assign(new Error('Invalid feed cursor'), {statusCode:400})
    const {data, error} = await db.from('feed_sessions').select('post_ids,reasons').eq('id', sessionId).eq('user_id', userId).gt('expires_at', new Date(now).toISOString()).maybeSingle(); check(error)
    if (!data) throw Object.assign(new Error('Your feed has expired. Refresh to start a new feed.'), {statusCode:410})
    ids = data.post_ids
    reasons = data.reasons || {}
  } else {
    const since = new Date(now - 60 * 86400000).toISOString()
    const [profile, following, feedback, likes, saves, reposts, comments] = await Promise.all([
      db.from('profiles').select('interests,location,player_profile:player_profiles!player_profiles_profile_id_fkey(primary_position,nationality)').eq('id', userId).single(),
      db.from('follows').select('following_id').eq('follower_id', userId).order('created_at',{ascending:false}).limit(1000),
      db.from('feed_feedback').select('post_id,kind,created_at,post:posts(tags)').eq('user_id', userId).gte('created_at', since).order('created_at',{ascending:false}).limit(1000),
      db.from('likes').select('created_at,post:posts(tags)').eq('user_id', userId).gte('created_at', since).order('created_at',{ascending:false}).limit(200),
      db.from('bookmarks').select('created_at,post:posts(tags)').eq('user_id', userId).gte('created_at', since).order('created_at',{ascending:false}).limit(200),
      db.from('reposts').select('created_at,post:posts(tags)').eq('user_id', userId).gte('created_at', since).order('created_at',{ascending:false}).limit(200),
      db.from('comments').select('post_id,created_at,post:posts(tags)').eq('author_id',userId).gte('created_at',since).order('created_at',{ascending:false}).limit(200),
    ])
    for (const r of [profile, following, feedback, likes, saves, reposts, comments]) check(r.error)
    const signals: Array<{tags:string[];weight:number;at:string}> = []
    for (const [result, weight] of [[likes, 0.6], [saves, 2], [reposts, 1.2]] as const) for (const row of result.data || []) signals.push({tags:(row.post as any)?.tags || [],weight,at:row.created_at})
    for(const row of new Map((comments.data||[]).map(row=>[row.post_id,row])).values())signals.push({tags:(row.post as any)?.tags||[],weight:0.4,at:row.created_at})
    const weights: Record<string,number> = {interested:2, dismissed:-2, profile_open:0.5}
    for (const row of feedback.data || []) if (weights[row.kind]) signals.push({tags:(row.post as any)?.tags || [],weight:weights[row.kind],at:row.created_at})
    const pp=profile.data?.player_profile as any
    const contextualTags=[profile.data?.location,pp?.primary_position,pp?.nationality].filter(Boolean) as string[]
    const interests = learnInterests([...(profile.data?.interests || []),...contextualTags], signals, now)
    const tags = Object.keys(interests).filter(t => interests[t] > 0).sort((a,b)=>interests[b]-interests[a]).slice(0,20)
    const followedIds = (following.data || []).map(f => f.following_id)
    const query = () => db.from('posts').select(selection).gte('created_at', since).order('created_at',{ascending:false}).order('id')
    const recent = await query().eq('visibility','public').limit(200); check(recent.error)
    const topical = tags.length ? await query().eq('visibility','public').overlaps('tags',tags).limit(200) : {data:[],error:null}; check(topical.error)
    const networkBatches=await Promise.all(chunks(followedIds).map(ids=>query().in('author_id',ids).limit(200)))
    networkBatches.forEach(r=>check(r.error))
    const network={data:networkBatches.flatMap(r=>r.data||[]).sort((a,b)=>b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id)).slice(0,200)}
    const candidates = await eligiblePosts(userId, [...new Map([...(recent.data||[]),...(topical.data||[]),...(network.data||[])].map(p=>[p.id,p])).values()])
    const ranked = rankPosts(candidates, {role, interests, following:new Set(followedIds), now,
      seen:new Set((feedback.data||[]).filter(f=>f.kind==='impression').map(f=>f.post_id)),
      dismissed:new Set((feedback.data||[]).filter(f=>f.kind==='dismissed').map(f=>f.post_id)),
    })
    ids=ranked.map(p=>p.id)
    reasons=Object.fromEntries(ranked.map(p=>[p.id,p.recommendation_reason]))
    const {data:session,error} = await db.from('feed_sessions').insert({user_id:userId,post_ids:ids,reasons,algorithm_version:RANKING_VERSION,expires_at:new Date(now+30*60000).toISOString()}).select('id').single(); check(error)
    if(!session)throw new Error('Unable to start feed session')
    sessionId = session.id
    // Remove expired ranking snapshots; never retain post-order histories indefinitely.
    await db.from('feed_sessions').delete().lt('expires_at',new Date(now).toISOString())
  }
  const remaining = ids.slice(offset)
  if (!remaining.length) return {data:[],hasMore:false,next_cursor:null,algorithm_version:RANKING_VERSION}
  const [records, feedback] = await Promise.all([
    Promise.all(chunks(remaining).map(ids=>db.from('posts').select(selection).in('id',ids))),
    Promise.all(chunks(remaining).map(ids=>db.from('feed_feedback').select('post_id').eq('user_id',userId).eq('kind','dismissed').in('post_id',ids))),
  ]); [...records,...feedback].forEach(r=>check(r.error))
  const hidden = new Set(feedback.flatMap(r=>r.data||[]).map(f=>f.post_id))
  const allowed = await eligiblePosts(userId,records.flatMap(r=>r.data||[]).filter(p=>!hidden.has(p.id)))
  const byId = new Map(allowed.map(p=>[p.id,p]))
  const ordered = remaining.filter(id=>byId.has(id)), pageIds = ordered.slice(0,limit)
  const nextOffset = pageIds.length ? ids.indexOf(pageIds[pageIds.length-1])+1 : ids.length
  if(!pageIds.length)return {data:[],hasMore:false,next_cursor:null,algorithm_version:RANKING_VERSION}
  const [likes,reposts] = await Promise.all([
    db.from('likes').select('post_id').eq('user_id',userId).in('post_id',pageIds),
    db.from('reposts').select('post_id').eq('user_id',userId).in('post_id',pageIds),
  ]);check(likes.error);check(reposts.error)
  return {data:pageIds.map(id=>({...byId.get(id),recommendation_reason:reasons[id],is_liked:likes.data?.some(l=>l.post_id===id),is_reposted:reposts.data?.some(r=>r.post_id===id)})),
    hasMore:ordered.length>limit,next_cursor:ordered.length>limit?`${sessionId}:${nextOffset}`:null,algorithm_version:RANKING_VERSION}
}
