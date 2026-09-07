import { getAlgoliaClient, PLAYERS_INDEX } from '../lib/algolia'
import { supabaseAdmin } from '../lib/supabase'
import type { AlgoliaPlayer, PlayerSearchInput } from '../types'

/**
 * Search players using Algolia (primary) or Postgres full-text (fallback).
 */
export async function searchPlayers(params: PlayerSearchInput) {
  const algolia = getAlgoliaClient()

  if (algolia) {
    return searchPlayersAlgolia(algolia, params)
  }

  // Fallback to Postgres full-text search
  return searchPlayersPostgres(params)
}

async function searchPlayersAlgolia(
  client: NonNullable<ReturnType<typeof getAlgoliaClient>>,
  params: PlayerSearchInput
) {
  const filters: string[] = []

  if (params.position) {
    filters.push(`primary_position:"${params.position}"`)
  }
  if (params.dominant_foot) {
    filters.push(`dominant_foot:"${params.dominant_foot}"`)
  }
  if (params.nationality) {
    filters.push(`nationality:"${params.nationality}"`)
  }
  if (params.country) {
    filters.push(`country:"${params.country}"`)
  }
  if (params.verified_only) {
    filters.push('is_verified:true')
  }
  if (params.min_height) {
    filters.push(`height_cm >= ${params.min_height}`)
  }
  if (params.max_height) {
    filters.push(`height_cm <= ${params.max_height}`)
  }
  if (params.club) {
    filters.push(`current_club_name:"${params.club}"`)
  }

  const { results } = await client.search({
    requests: [
      {
        indexName: PLAYERS_INDEX,
        query: params.q ?? '',
        filters: filters.join(' AND '),
        page: (params.page ?? 1) - 1,
        hitsPerPage: params.limit ?? 20,
      },
    ],
  })

  const searchResult = results[0] as {
    hits: AlgoliaPlayer[]
    nbHits: number
    page: number
    nbPages: number
  }

  return {
    data: searchResult.hits,
    total: searchResult.nbHits,
    page: (searchResult.page ?? 0) + 1,
    limit: params.limit ?? 20,
    hasMore: (searchResult.page ?? 0) + 1 < (searchResult.nbPages ?? 1),
  }
}

async function searchPlayersPostgres(params: PlayerSearchInput) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('profiles')
    .select(`
      *,
      player_profile:player_profiles(*)
    `, { count: 'exact' })
    .eq('user_type', 'player')
    .range(offset, offset + limit - 1)

  if (params.q) {
    query = query.or(`display_name.ilike.%${params.q}%,username.ilike.%${params.q}%`)
  }
  if (params.verified_only) {
    query = query.eq('is_verified', true)
  }

  const { data, error, count } = await query

  if (error) throw new Error(`Search error: ${error.message}`)

  // Apply player-specific filters in memory (for Postgres fallback)
  let results = data ?? []

  if (params.position) {
    results = results.filter(
      (p: any) => p.player_profile?.primary_position === params.position
    )
  }
  if (params.dominant_foot) {
    results = results.filter(
      (p: any) => p.player_profile?.dominant_foot === params.dominant_foot
    )
  }
  if (params.nationality) {
    results = results.filter(
      (p: any) => p.player_profile?.nationality?.toLowerCase() === params.nationality?.toLowerCase()
    )
  }

  return {
    data: results,
    total: count ?? results.length,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  }
}

/**
 * Sync a player profile to Algolia index.
 * Called after profile creation/updates.
 */
export async function syncPlayerToAlgolia(profileId: string) {
  const algolia = getAlgoliaClient()
  if (!algolia) return

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      player_profile:player_profiles(*)
    `)
    .eq('id', profileId)
    .eq('user_type', 'player')
    .single()

  if (error || !data) return

  const pp = (data as any).player_profile

  const record: AlgoliaPlayer = {
    objectID: profileId,
    profile_id: profileId,
    display_name: data.display_name,
    username: data.username,
    avatar_url: data.avatar_url,
    primary_position: pp?.primary_position ?? null,
    secondary_positions: pp?.secondary_positions ?? [],
    nationality: pp?.nationality ?? null,
    country: null, // Would come from location service
    city: null,
    height_cm: pp?.height_cm ?? null,
    weight_kg: pp?.weight_kg ?? null,
    dominant_foot: pp?.dominant_foot ?? null,
    current_club_name: null,
    is_verified: data.is_verified,
    playing_style_tags: pp?.playing_style_tags ?? [],
    follower_count: data.follower_count,
    updated_at: data.updated_at,
  }

  await algolia.saveObject({ indexName: PLAYERS_INDEX, body: record })
}

/**
 * Remove a player from Algolia index.
 */
export async function removePlayerFromAlgolia(profileId: string) {
  const algolia = getAlgoliaClient()
  if (!algolia) return

  await algolia.deleteObject({ indexName: PLAYERS_INDEX, objectID: profileId })
}

/**
 * General profile search (for @mentions, user discovery).
 */
export async function searchProfiles(query: string, limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, display_name, avatar_url, user_type, is_verified')
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(limit)

  if (error) throw new Error(`Profile search error: ${error.message}`)
  return data ?? []
}
