import { algoliasearch } from 'algoliasearch'
import { env } from '../config/env'

let _algoliaClient: ReturnType<typeof algoliasearch> | null = null

export function getAlgoliaClient() {
  if (!env.ALGOLIA_APP_ID || !env.ALGOLIA_ADMIN_API_KEY) {
    return null
  }
  if (!_algoliaClient) {
    _algoliaClient = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_ADMIN_API_KEY)
  }
  return _algoliaClient
}

export const PLAYERS_INDEX = env.ALGOLIA_PLAYERS_INDEX

// Configure the players index settings (run once during setup)
export async function configurePlayersIndex() {
  const client = getAlgoliaClient()
  if (!client) {
    console.warn('⚠️  Algolia not configured — skipping index setup')
    return
  }

  await client.setSettings({
    indexName: PLAYERS_INDEX,
    indexSettings: {
      searchableAttributes: [
        'display_name',
        'username',
        'nationality',
        'current_club_name',
        'playing_style_tags',
      ],
      attributesForFaceting: [
        'filterOnly(primary_position)',
        'filterOnly(secondary_positions)',
        'filterOnly(dominant_foot)',
        'filterOnly(nationality)',
        'filterOnly(country)',
        'filterOnly(is_verified)',
        'filterOnly(current_club_name)',
        'numericAttributesForFiltering(height_cm)',
        'numericAttributesForFiltering(weight_kg)',
        'numericAttributesForFiltering(follower_count)',
      ],
      ranking: [
        'desc(follower_count)',
        'desc(is_verified)',
        'typo',
        'geo',
        'words',
        'filters',
        'proximity',
        'attribute',
        'exact',
        'custom',
      ],
      hitsPerPage: 20,
    },
  })

  console.log('✅ Algolia players index configured')
}
