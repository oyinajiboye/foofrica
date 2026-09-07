# Footfrica Backend — Complete Reference Document

> **Purpose**: This document is the single source of truth for the Footfrica API backend.  
> Use this if chat history is lost. All decisions, structures, and endpoints are recorded here.  
> **Last Updated**: June 2026 | **Status**: TypeScript compiles clean (0 errors)

---

## 1. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | **Node.js** | v18+ required |
| Framework | **Fastify v4** | High-performance, TypeScript-first |
| Language | **TypeScript** | Strict mode enabled |
| Auth | **Supabase Auth** | JWT issued by Supabase, verified server-side |
| Database | **Supabase (PostgreSQL)** | Service role key used in backend; RLS protects direct client access |
| Caching | **Upstash Redis** | REST-based Redis; optional — gracefully skipped if not configured |
| Player Search | **Algolia** | Postgres full-text fallback if Algolia not configured |
| Video Storage | **Cloudflare R2** | Object storage |
| Video Processing | **Cloudflare Stream** | Handles transcoding; backend generates signed upload URLs |
| Push Notifications | **Firebase FCM** | Optional; skipped gracefully if not configured |
| Hosting (planned) | **Railway** | Backend deploy target |

---

## 2. Project Structure

```
footfrica/                          ← monorepo root
├── src/                            ← React/Vite frontend (untouched)
├── server/                         ← Fastify API backend
│   ├── src/
│   │   ├── index.ts                ← Entry point — registers all routes, starts server
│   │   ├── config/
│   │   │   └── env.ts              ← Zod-validated env config (fails fast on bad env)
│   │   ├── lib/
│   │   │   ├── supabase.ts         ← Supabase admin + public clients
│   │   │   ├── algolia.ts          ← Algolia client + index config
│   │   │   ├── redis.ts            ← Upstash Redis client + cache helpers
│   │   │   └── cloudflare.ts       ← Cloudflare Stream upload URL generator
│   │   ├── plugins/
│   │   │   └── auth.ts             ← authenticate + optionalAuth preHandlers
│   │   ├── routes/
│   │   │   ├── auth.ts             ← /api/auth/*
│   │   │   ├── profiles.ts         ← /api/profiles/*
│   │   │   ├── players.ts          ← /api/players/*
│   │   │   ├── clubs.ts            ← /api/clubs/*
│   │   │   ├── scouts.ts           ← /api/scouts/*
│   │   │   ├── coaches.ts          ← /api/coaches/*
│   │   │   ├── feed.ts             ← /api/feed/*
│   │   │   ├── posts.ts            ← /api/posts/*
│   │   │   ├── videos.ts           ← /api/videos/*
│   │   │   ├── search.ts           ← /api/search/*
│   │   │   ├── follows.ts          ← /api/follows/*
│   │   │   ├── messages.ts         ← /api/messages/*
│   │   │   ├── notifications.ts    ← /api/notifications/*
│   │   │   └── admin.ts            ← /api/admin/*
│   │   ├── schemas/
│   │   │   ├── auth.schemas.ts
│   │   │   ├── profile.schemas.ts  ← also exports paginationSchema
│   │   │   ├── post.schemas.ts
│   │   │   ├── video.schemas.ts
│   │   │   ├── search.schemas.ts
│   │   │   └── message.schemas.ts
│   │   ├── services/
│   │   │   ├── feed.service.ts     ← Personalized feed algorithm
│   │   │   ├── search.service.ts   ← Algolia sync + search + Postgres fallback
│   │   │   ├── video.service.ts    ← Cloudflare Stream integration
│   │   │   └── notification.service.ts ← FCM push + in-app notifications
│   │   └── types/
│   │       └── index.ts            ← All TypeScript interfaces + enums
│   ├── supabase/
│   │   └── migrations/
│   │       ├── 001_extensions.sql  ← uuid-ossp, pg_trgm, unaccent
│   │       ├── 002_profiles.sql    ← All profile tables + enums + counter functions
│   │       ├── 003_social.sql      ← posts, likes, comments, reposts, follows, reports
│   │       ├── 004_videos.sql      ← videos, video_views tables
│   │       ├── 005_messaging.sql   ← conversations, messages, shortlists
│   │       ├── 006_notifications.sql ← notifications table + view
│   │       └── 007_rls_policies.sql  ← RLS enabled + all policies
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── package.json                    ← Root: includes dev:server + dev:all scripts
└── BACKEND_REFERENCE.md            ← This file (also saved as artifact)
```

---

## 3. How to Run

### Prerequisites
- Node.js 18+
- A Supabase project (required)
- Run SQL migrations in order in Supabase SQL editor

### Setup
```bash
cd server
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install
npm run dev          # Starts on http://localhost:3001
```

### Root-level scripts (from repo root)
```bash
npm run dev          # Frontend only (Vite on :5173)
npm run dev:server   # Backend only (Fastify on :3001)
npm run dev:all      # Both frontend + backend concurrently
```

### Verify server is running
```bash
curl http://localhost:3001/health
# returns: { "status": "ok", "version": "1.0.0", ... }
```

---

## 4. Environment Variables

> All defined in `server/.env.example` and validated at startup via Zod.
> Server **refuses to start** if required vars are missing.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 3001) | Server port |
| `NODE_ENV` | No (default: development) | `development` / `production` / `test` |
| `FRONTEND_URL` | No (default: localhost:5173) | CORS allowed origin |
| `SUPABASE_URL` | **YES** | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | **YES** | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | Supabase service role key (never expose to frontend) |
| `JWT_SECRET` | **YES** | Must match your Supabase JWT secret |
| `ALGOLIA_APP_ID` | No | Algolia App ID (falls back to Postgres search if absent) |
| `ALGOLIA_ADMIN_API_KEY` | No | Algolia admin key |
| `ALGOLIA_SEARCH_API_KEY` | No | Algolia search-only key |
| `ALGOLIA_PLAYERS_INDEX` | No (default: footfrica_players) | Algolia index name |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL (caching skipped if absent) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `CLOUDFLARE_ACCOUNT_ID` | No | Required for video uploads |
| `CLOUDFLARE_API_TOKEN` | No | Required for video uploads |
| `CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN` | No | For Stream playback URLs |
| `FIREBASE_PROJECT_ID` | No | Required for push notifications |
| `FIREBASE_CLIENT_EMAIL` | No | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | No | Firebase private key (use `\n` for newlines in value) |

---

## 5. Authentication

### How it works
1. Client registers/logs in → receives a **Supabase JWT** (`access_token`)
2. Client sends `Authorization: Bearer <access_token>` on all protected requests
3. Server's `authenticate` preHandler calls `supabaseAdmin.auth.getUser(token)` to verify
4. If valid, fetches the `profiles` row and attaches `request.user` to the request

### Two auth modes
- **`authenticate`** — Hard requirement. Returns `401` if no valid token.
- **`optionalAuth`** — Attaches user if token present, continues if not (for public-but-aware endpoints like profile views).

### Auth flow for new users
```
POST /api/auth/register  →  Creates Supabase auth user
POST /api/auth/login     →  Returns access_token + refresh_token
POST /api/auth/onboard   →  (Authenticated) Creates profiles row + type-specific row
```

> After onboarding, the user has: `profiles` row + one of `player_profiles` / `club_profiles` / `scout_profiles` / `coach_profiles` / `fan_profiles`

---

## 6. Database Schema

> 18 tables across 7 migration files. Run in order in Supabase SQL Editor.

### Core Enums

| Enum | Values |
|---|---|
| `user_type_enum` | `player`, `club`, `scout`, `coach`, `fan` |
| `player_position_enum` | `GK`, `CB`, `LB`, `RB`, `CDM`, `CM`, `CAM`, `LW`, `RW`, `ST`, `CF` |
| `dominant_foot_enum` | `left`, `right`, `both` |
| `verification_tier_enum` | `professional`, `organization`, `player`, `contributor` |
| `post_type_enum` | `text`, `video`, `image`, `poll` |
| `video_status_enum` | `processing`, `ready`, `failed` |
| `notification_type_enum` | `like`, `comment`, `follow`, `mention`, `message`, `endorsement`, `verification`, `shortlist` |
| `endorsement_skill_enum` | `pace`, `acceleration`, `ball_control`, `first_touch`, `shooting`, `finishing`, `passing`, `crossing`, `dribbling`, `defending`, `tackling`, `heading`, `positioning`, `vision`, `work_rate`, `leadership`, `communication`, `goalkeeping` |

---

### Table: `profiles` (base for all users)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | References `auth.users(id)` |
| `username` | TEXT UNIQUE | Format: `^[a-z0-9_]{3,30}$` |
| `display_name` | TEXT | |
| `bio` | TEXT | |
| `avatar_url`, `cover_url` | TEXT | |
| `user_type` | enum | `player/club/scout/coach/fan` |
| `is_verified` | BOOL | Admin-granted badge |
| `is_admin` | BOOL | Admin access flag |
| `verification_tier` | enum | `professional/organization/player/contributor` |
| `follower_count`, `following_count`, `post_count` | INT | Maintained by atomic SQL functions |
| `fcm_token` | TEXT | Firebase push token |
| `created_at`, `updated_at` | TIMESTAMPTZ | `updated_at` auto-managed by trigger |

### Table: `player_profiles`

| Column | Type |
|---|---|
| `profile_id` | UUID PK → profiles |
| `full_name`, `date_of_birth`, `nationality` | TEXT / DATE |
| `height_cm` (100–250), `weight_kg` (30–200) | SMALLINT |
| `dominant_foot` | enum |
| `primary_position` | enum |
| `secondary_positions` | position_enum[] |
| `playing_style_tags` | TEXT[] |
| `current_club_id` | UUID → profiles |
| `jersey_number` (1–99) | SMALLINT |

### Table: `player_stats` (per season)

| Column | Type |
|---|---|
| `player_id` | UUID → profiles |
| `season` | TEXT (e.g. `2024/25`) |
| `club_id`, `club_name` | UUID / TEXT |
| `appearances`, `goals`, `assists`, `clean_sheets`, `yellow_cards`, `red_cards` | SMALLINT |
| UNIQUE | `(player_id, season)` |

### Table: `career_history`

| Column | Type |
|---|---|
| `player_id` | UUID → profiles |
| `club_name`, `role` | TEXT |
| `club_id` | UUID → profiles (nullable) |
| `start_date`, `end_date` | DATE |
| `is_current` | BOOL |

### Table: `club_profiles`
`profile_id`, `club_name`, `founded_year`, `country`, `city`, `league`, `logo_url`, `banner_url`, `website_url`

### Table: `club_verifications`
`(club_id, player_id)` PK — tracks which club has verified which player's affiliation.

### Table: `scout_profiles`
`profile_id`, `organization`, `license_number`, `specialization TEXT[]`, `regions_covered TEXT[]`

### Table: `coach_profiles`
`profile_id`, `license_level`, `specialization TEXT[]`, `current_club_id`

### Table: `fan_profiles`
`profile_id`, `favorite_club_id`, `favorite_club_name`, `football_interests TEXT[]`

### Table: `endorsements`
`(endorser_id, player_id, skill)` UNIQUE constraint — one endorsement per skill per endorser-player pair.

### Table: `posts`
`author_id`, `content` (max 2000), `post_type`, `video_id`, `image_urls[]`, `repost_of`, `hashtags[]`, `mentions UUID[]`, `likes_count`, `comments_count`, `reposts_count`, `visibility`

### Tables: `likes` / `reposts`
Junction tables: `(user_id, post_id)` composite PK.

### Table: `comments`
`post_id`, `author_id`, `content` (max 1000), `likes_count`

### Table: `follows`
`(follower_id, following_id)` composite PK. CHECK prevents self-follow.

### Table: `reports`
For moderation. Status: `pending → approved/dismissed`. Includes `reviewed_by`, `reviewer_note`.

### Table: `videos`
`uploader_id`, `cloudflare_uid` (UNIQUE), `cloudflare_playback_url`, `title`, `description`, `match_type`, `position_played`, `key_actions[]`, `thumbnail_url`, `duration_seconds`, `status`, `views_count`

### Table: `video_views`
Lightweight tracking: `video_id`, `viewer_id` (nullable), `ip_hash`, `viewed_at`

### Table: `conversations`
`participant_ids UUID[]` (always sorted, always 2 for DMs), `last_message`, `last_message_at`

### Table: `messages`
`conversation_id`, `sender_id`, `content` (max 5000), `read_at` (NULL = unread)

### Table: `shortlists`
`scout_id`, `name`, `description`, `player_count`

### Table: `shortlist_players`
`(shortlist_id, player_id)` PK + `notes`, `added_at`

### Table: `notifications`
`recipient_id`, `actor_id`, `type`, `entity_type`, `entity_id`, `read_at`

---

### Stored SQL Functions (atomic counter updates)

| Function | Effect |
|---|---|
| `increment/decrement_follower_count(profile_id)` | `follower_count ± 1` (min 0) |
| `increment/decrement_following_count(profile_id)` | `following_count ± 1` (min 0) |
| `increment/decrement_post_count(profile_id)` | `post_count ± 1` (min 0) |
| `increment/decrement_likes_count(post_id)` | `likes_count ± 1` (min 0) |
| `increment/decrement_comments_count(post_id)` | `comments_count ± 1` (min 0) |
| `increment/decrement_repost_count(post_id)` | `reposts_count ± 1` (min 0) |
| `increment_video_views(video_id)` | `views_count + 1` |

---

## 7. API Endpoints Reference

> **Base URL**: `http://localhost:3001`
> **Auth header**: `Authorization: Bearer <access_token>`
> `🔒` = requires auth | `🔓` = public | `👤` = optional auth (enriched if logged in)

---

### Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | 🔓 | Returns `{ status, version, timestamp, environment }` |

---

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | 🔓 | Create account. Body: `{ email?, phone?, password, user_type }` |
| POST | `/api/auth/login` | 🔓 | Sign in. Returns `access_token`, `refresh_token`, `profile`, `needs_onboarding` |
| POST | `/api/auth/onboard` | 🔒 | Complete profile. Body: `{ username, display_name, bio?, avatar_url? }` |
| POST | `/api/auth/refresh` | 🔓 | Refresh token. Body: `{ refresh_token }` |
| GET | `/api/auth/me` | 🔒 | Returns full authenticated user object |
| PUT | `/api/auth/fcm-token` | 🔒 | Update FCM push token. Body: `{ fcm_token }` |
| POST | `/api/auth/logout` | 🔒 | Invalidates session + clears FCM token |
| GET | `/api/auth/check-username/:username` | 🔓 | Returns `{ available: true/false }` |

---

### Profiles — `/api/profiles`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/profiles/:identifier` | 👤 | Get by UUID or username. Returns base + all sub-profiles + `is_following` |
| PUT | `/api/profiles/me` | 🔒 | Update base profile (display_name, bio, avatar_url, cover_url) |
| PUT | `/api/profiles/me/player` | 🔒 | Update player fields. Triggers Algolia sync + cache bust |
| PUT | `/api/profiles/me/club` | 🔒 | Update club fields |
| PUT | `/api/profiles/me/scout` | 🔒 | Update scout fields |
| PUT | `/api/profiles/me/coach` | 🔒 | Update coach fields |
| PUT | `/api/profiles/me/fan` | 🔒 | Update fan fields |
| GET | `/api/profiles/:id/posts` | 👤 | Paginated posts by user. `?page&limit` |
| GET | `/api/profiles/:id/videos` | 🔓 | Paginated video gallery (ready only) |
| POST | `/api/profiles/:id/career` | 🔒 | Add career entry. Auto-clears other `is_current` if new is current |
| DELETE | `/api/profiles/:id/career/:entryId` | 🔒 | Remove career entry (own only) |
| PUT | `/api/profiles/:id/stats` | 🔒 | Upsert season stats |
| POST | `/api/profiles/:id/endorse` | 🔒 | Endorse a skill (coaches + scouts only). Body: `{ skill }` |
| GET | `/api/profiles/:id/endorsements` | 🔓 | All endorsements with endorser profiles |

---

### Players — `/api/players`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/players` | 🔓 | Browse all players. `?page&limit` |
| GET | `/api/players/:id` | 👤 | Full player: base + player_profile + career + stats + endorsement_counts |
| GET | `/api/players/:id/stats` | 🔓 | All season stats rows |
| PUT | `/api/players/:id/stats` | 🔒 | Upsert season stats (own only) |
| GET | `/api/players/:id/career` | 🔓 | Full career history (newest first) |
| POST | `/api/players/:id/career` | 🔒 | Add career entry (own only) |
| PUT | `/api/players/:id/career/:entryId` | 🔒 | Update career entry |
| DELETE | `/api/players/:id/career/:entryId` | 🔒 | Delete career entry |
| GET | `/api/players/:id/videos` | 🔓 | Paginated video gallery |
| GET | `/api/players/:id/endorsements` | 🔓 | All endorsements with endorser profiles |

---

### Clubs — `/api/clubs`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/clubs` | 🔓 | Browse all clubs. `?page&limit&country&league` |
| GET | `/api/clubs/:id` | 👤 | Club profile with club_profile sub-record |
| GET | `/api/clubs/:id/squad` | 🔓 | Squad roster |
| POST | `/api/clubs/:id/squad` | 🔒 | Add player. Body: `{ player_id, jersey_number? }`. Club owner only |
| DELETE | `/api/clubs/:id/squad/:playerId` | 🔒 | Remove player. Ends career history entry |
| POST | `/api/clubs/:id/verify-player/:playerId` | 🔒 | Verify affiliation. Notifies player |

---

### Scouts — `/api/scouts`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/scouts/:id` | 👤 | Scout profile |
| GET | `/api/scouts/shortlists` | 🔒 | All shortlists for authenticated scout |
| GET | `/api/scouts/:id/shortlists` | 🔒 | Shortlists for scout (own only) |
| POST | `/api/scouts/shortlists` | 🔒 | Create shortlist. Body: `{ name, description? }` |
| PUT | `/api/scouts/shortlists/:shortlistId` | 🔒 | Update name/description |
| DELETE | `/api/scouts/shortlists/:shortlistId` | 🔒 | Delete shortlist + all entries |
| GET | `/api/scouts/shortlists/:shortlistId/players` | 🔒 | Players in shortlist with full profiles |
| POST | `/api/scouts/shortlists/:shortlistId/players` | 🔒 | Add player. Body: `{ player_id, notes? }`. Notifies player |
| DELETE | `/api/scouts/shortlists/:shortlistId/players/:playerId` | 🔒 | Remove player |

---

### Coaches — `/api/coaches`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/coaches` | 🔓 | Browse all coaches. Paginated |
| GET | `/api/coaches/:id` | 👤 | Coach profile |
| GET | `/api/coaches/:id/endorsements-given` | 🔓 | Endorsements this coach has given |
| POST | `/api/coaches/:id/endorse/:playerId` | 🔒 | Endorse player. Body: `{ skill }` |
| DELETE | `/api/coaches/:id/endorse/:playerId` | 🔒 | Remove endorsement. Query: `?skill=pace` |

---

### Feed — `/api/feed`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/feed` | 🔒 | **For You** — personalized (follows + trending + type-weighted). `?page&limit&cursor` |
| GET | `/api/feed/following` | 🔒 | Chronological posts from followed users. `?page&limit&cursor` |
| GET | `/api/feed/trending` | 🔓 | Trending (last 48h, engagement-velocity scored, cached 5 min). `?page&limit` |
| GET | `/api/feed/discover` | 🔒 | Video posts from outside your network. `?page&limit` |

**Feed Algorithm (For You):**
1. Gets IDs of followed users (cached 2 min in Redis)
2. Fetches posts, applies scoring: followed user posts (+5), verified authors (+2), scout sees videos (+3), fan gets engagement-weighted content
3. Decay formula: `engagement / (age_hours + 2)^1.5`
4. Cached 60s in Redis per user per page

---

### Posts — `/api/posts`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/posts` | 🔒 | Create post. Body: `{ content?, post_type, video_id?, image_urls?, hashtags?, mentions?, visibility, repost_of? }` |
| GET | `/api/posts/:id` | 👤 | Post + author + video + repost source + `is_liked`, `is_reposted` |
| DELETE | `/api/posts/:id` | 🔒 | Delete own post |
| POST | `/api/posts/:id/like` | 🔒 | Like. Notifies author |
| DELETE | `/api/posts/:id/like` | 🔒 | Unlike |
| GET | `/api/posts/:id/comments` | 🔓 | Paginated comments (oldest first). `?page&limit` |
| POST | `/api/posts/:id/comments` | 🔒 | Comment. Body: `{ content }`. Notifies author |

---

### Videos — `/api/videos`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/videos` | 🔓 | All ready videos. Paginated |
| GET | `/api/videos/:id` | 🔓 | Video detail + uploader. Increments view count |
| POST | `/api/videos/upload-url` | 🔒 | Get Cloudflare signed upload URL + `uid` |
| POST | `/api/videos/metadata` | 🔒 | Save metadata after upload. Body: `{ cloudflare_uid, title?, match_type?, position_played?, key_actions? }` |
| PUT | `/api/videos/:id/metadata` | 🔒 | Update metadata (uploader only) |
| DELETE | `/api/videos/:id` | 🔒 | Delete from Cloudflare + DB |
| POST | `/api/videos/webhook/stream` | 🔓 | Cloudflare webhook — updates status + playback URL |

**Video Upload Flow:**
```
1. POST /api/videos/upload-url → { upload_url, uid }
2. Client POSTs video file directly to Cloudflare (we never touch the bytes)
3. Cloudflare POSTs webhook to /api/videos/webhook/stream when done
4. Client POSTs /api/videos/metadata with cloudflare_uid + metadata
5. Video is now ready and visible
```

---

### Search — `/api/search`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/search/players` | 🔓 | Multi-filter player search. Algolia primary, Postgres fallback |
| GET | `/api/search/profiles` | 🔓 | Profile search for @mentions. `?q&limit` |
| GET | `/api/search/posts` | 🔓 | Post search. Prefix `#` for hashtag, else full-text |
| GET | `/api/search/trending-hashtags` | 🔓 | Top 20 hashtags from last 24h |

**Player Search Filters:**
`q`, `position`, `dominant_foot`, `nationality`, `country`, `city`, `min_height`, `max_height`, `min_age`, `max_age`, `club`, `verified_only`, `page`, `limit`

---

### Follows — `/api/follows`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/follows/:userId` | 🔒 | Follow. Updates counts atomically. Notifies target |
| DELETE | `/api/follows/:userId` | 🔒 | Unfollow. Decrements counts atomically |
| GET | `/api/follows/:userId/followers` | 🔓 | Paginated followers |
| GET | `/api/follows/:userId/following` | 🔓 | Paginated following |

---

### Messages — `/api/messages`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/conversations` | 🔒 | All conversations with `unread_count` + `other_participant` |
| POST | `/api/messages/conversations` | 🔒 | Start new or get existing conversation. Body: `{ recipient_id, message }` |
| GET | `/api/messages/conversations/:id` | 🔒 | Paginated messages (oldest first). Auto-marks unread as read |
| POST | `/api/messages/conversations/:id` | 🔒 | Send message. Body: `{ content }`. Notifies recipient |
| DELETE | `/api/messages/conversations/:id` | 🔒 | Leave conversation. Full delete if last participant |

---

### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | 🔒 | Paginated notifications + `unread_count`. `?unread_only=true` |
| GET | `/api/notifications/unread-count` | 🔒 | Fast badge: `{ count: N }` |
| PUT | `/api/notifications/:id/read` | 🔒 | Mark single as read |
| PUT | `/api/notifications/read-all` | 🔒 | Mark all as read |
| DELETE | `/api/notifications/:id` | 🔒 | Delete notification |
| DELETE | `/api/notifications` | 🔒 | Clear all notifications |

---

### Admin — `/api/admin`

> Requires `is_admin = true` in `profiles` table. Set manually in Supabase dashboard.

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users. `?user_type&search&is_verified&page&limit` |
| POST | `/api/admin/users/:id/verify` | Grant verification. Body: `{ tier }`. Notifies user + syncs Algolia |
| DELETE | `/api/admin/users/:id/verify` | Revoke verification |
| DELETE | `/api/admin/users/:id` | Hard delete user account. Body: `{ reason? }` |
| GET | `/api/admin/reports` | Moderation queue. `?status=pending&page&limit` |
| PUT | `/api/admin/reports/:id` | Resolve report. Body: `{ action: 'approved'/'dismissed', note? }` |
| DELETE | `/api/admin/posts/:id` | Remove a post. Body: `{ reason? }` |
| GET | `/api/admin/stats` | Platform stats: totals, 30d growth, user type breakdown |
| POST | `/api/admin/search/reindex` | Trigger full Algolia re-index of all players (background) |

---

## 8. Service Layer Summary

### `feed.service.ts`
- `getPersonalizedFeed()` — For You algorithm with Redis caching
- `getFollowingFeed()` — Chronological from followed users
- `getTrendingFeed()` — Engagement-velocity scored, cached 5 min
- `getDiscoveryFeed()` — Videos from outside your network

### `search.service.ts`
- `searchPlayers()` — Routes to Algolia or Postgres
- `syncPlayerToAlgolia()` — Called after profile updates
- `removePlayerFromAlgolia()` — Called on user deletion
- `searchProfiles()` — Quick ilike for @mention autocomplete

### `video.service.ts`
- `generateUploadUrl()` — Cloudflare Stream direct upload URL
- `saveVideoMetadata()` — Creates video record (status: processing)
- `handleStreamWebhook()` — Updates status, sets playback URL
- `deleteVideo()` — Deletes from Cloudflare + DB
- `incrementViews()` — Fire-and-forget view counter

### `notification.service.ts`
- `createNotification()` — Inserts DB record + sends FCM push
- `sendPushNotification()` — Firebase Admin SDK. Auto-cleans invalid tokens
- `getUnreadCount()` — Unread count for badge display

---

## 9. Caching Strategy (Upstash Redis)

| Key Pattern | TTL | Content |
|---|---|---|
| `profile:{id_or_username}` | 5 min | Full profile object |
| `feed:{userId}:foryou:{page}` | 60s | For You feed page |
| `trending:posts` | 5 min | Top 100 trending posts |
| `following:ids:{userId}` | 2 min | Array of following IDs |

Cache is **fail-silent** — if Redis unavailable, requests succeed without caching.

---

## 10. Row Level Security Summary

RLS enabled on all tables. Key policies:

| Table | Read | Write |
|---|---|---|
| `profiles` | Public (all rows) | Own row only |
| `player_profiles` / type-specific | Public | Own row only |
| `player_stats`, `career_history` | Public | Own data only |
| `posts` | Public + followers-only to followers | Author only |
| `likes`, `reposts`, `comments` | Public | Authenticated |
| `follows` | Public | Own follows |
| `videos` | Ready = public; processing = uploader only | Uploader only |
| `conversations` | Own (participant check) | Own participants |
| `messages` | Own (participant check) | Sender is participant |
| `shortlists` + `shortlist_players` | Own scout only | Own scout only |
| `notifications` | Own (recipient) | Recipient mark read/delete |
| `reports` | Own reports | Authenticated submit |

> The backend uses `service_role` key which bypasses RLS. RLS protects any direct client SDK access.

---

## 11. Standard API Response Formats

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Paginated:**
```json
{
  "success": true,
  "data": { "data": [...], "total": 150, "page": 1, "limit": 20, "hasMore": true }
}
```

**Error:**
```json
{ "statusCode": 404, "error": "Not Found", "message": "Profile not found" }
```

**HTTP Status Codes:**
- `400` Validation / bad input
- `401` Missing or invalid JWT
- `403` Not authorized for this resource
- `404` Not found
- `409` Conflict (duplicate like, username taken, etc.)
- `429` Rate limited (200 req/min global)
- `500` Internal server error

---

## 12. What's Next / Not Yet Built

| Feature | Priority | Notes |
|---|---|---|
| Trending hashtags RPC | P0 | `get_trending_hashtags` SQL function needs creating in Supabase |
| Polls (vote endpoint) | P1 | Schema has `poll_options` but no `POST /posts/:id/poll-vote` endpoint |
| Match Threads | P1 | PRD P1 feature — not built |
| Fan Communities/Groups | P1 | PRD P1 feature — not built |
| Profile Analytics | P1 | Who viewed my profile — not built |
| Real-time Messaging | P1 | Add Supabase Realtime subscription to messages table |
| Video trim/editing | P2 | Cloudflare Stream clip API |
| AI Player Evaluation | P2 | PRD P2 feature |
| Per-user rate limiting | P2 | Currently 200 req/min globally |

---

## 13. Key Design Decisions

1. **Monorepo**: Backend in `server/` within same repo as React frontend
2. **Service role bypass**: Backend always uses `supabaseAdmin`; RLS is a safety net for direct client SDK access only
3. **Atomic counters**: All `follower_count`, `likes_count` etc. updated via SQL functions to prevent race conditions
4. **Algolia fallback**: Search degrades to Postgres full-text + ilike if Algolia unconfigured — no feature breaks
5. **Video upload**: Client uploads directly to Cloudflare (we never handle video bytes) — only issue signed URLs
6. **Notification delivery**: Fire-and-forget — notification failures never block the primary operation
7. **DM conversation dedup**: `participant_ids` always stored sorted to prevent duplicate conversations
8. **Cache fail-silent**: All Redis operations wrapped in try/catch — cache failures never break requests
