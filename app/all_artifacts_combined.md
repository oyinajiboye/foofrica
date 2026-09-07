# Footfrica Combined Artifacts

## task.md

# Frontend API Wiring Tasks

- [x] **P0: ProfilePage** — Wire to `/api/profiles`, follows, videos, posts
- [x] **P0: MessagesPage** — Wire to `/api/messages/conversations`, send/receive
- [x] **P0: NotificationsPage** — Wire to `/api/notifications`, mark read
- [x] **P0: SearchPage** — Wire to `/api/search/*` endpoints
- [x] **P1: SettingsPage** — Wire to `/api/settings`, account changes
- [x] **P1: SinglePostPage** — Wire to `/api/posts/:id`, comments, like/repost
- [x] **P2: ClubPage** — Wire to `/api/clubs/:id`, squad
- [x] **P2: ScoutWatchlistPage** — Wire to `/api/scouts/shortlists`
- [x] **P2: DiscoverPage** — Wire to `/api/feed/discover`


---

## frontend_audit.md

# Frontend-to-Backend Connectivity Audit

## Verdict: ❌ Most pages are NOT connected to the backend

Only **4 out of 12** app pages make real API calls. The rest display **hardcoded mock data** and will not work as a real social media app until they're wired to the backend.

---

## Page-by-Page Status

### ✅ Connected to Backend (4 pages)

| Page | API Calls | Status |
|------|-----------|--------|
| **FeedPage** | `apiFetch('/api/posts')`, `apiFetch('/api/feed/...')`, `POST /api/posts`, `POST /api/posts/:id/comments`, like/repost/delete | ✅ Fully wired |
| **HighlightsPage** | `apiFetch('/api/videos/...')` for video data | ✅ Wired |
| **LoginPage** | `fetch('/api/auth/login')` | ✅ Wired |
| **RegisterPage** | `fetch('/api/auth/register')` | ✅ Wired |
| **OnboardIdentity** | `fetch('/api/auth/check-username')` | ✅ Wired |
| **OnboardComplete** | `fetch('/api/auth/complete-profile')`, avatar upload | ✅ Wired |

### ❌ NOT Connected — Using Mock Data (8 pages)

| Page | Issue | Mock Data Used |
|------|-------|----------------|
| **ProfilePage** | All data hardcoded in component | `profileData` state with hardcoded name/bio/stats, `PROFILE_HIGHLIGHTS` array of 12 fake videos, follow state is local toggles |
| **MessagesPage** | `INITIAL_CONVERSATIONS` array of 12 fake conversations | No `apiFetch` calls at all. Messages, typing indicators, online status all fake |
| **NotificationsPage** | `INITIAL_NOTIFICATIONS` array of hardcoded notifications | No `apiFetch` calls. Read/unread state is local-only |
| **SearchPage** | All 6 result cards hardcoded in JSX | No search API calls. "248 results" is a static string. Filters do nothing real |
| **SettingsPage** | 14 settings tabs with local state only | No `apiFetch` calls. Toggle switches change local state but never save to server |
| **ClubPage** | Entirely static club data | No API calls. Squad roster, stats all hardcoded |
| **ScoutWatchlistPage** | Static shortlist data | No API calls |
| **DiscoverPage** | Static video grid data | No API calls |
| **SinglePostPage** | Static post data | No API calls |

---

## What Needs to Happen

To make the app work like a real social media platform, each page needs to:

1. **Import `useAuth`** and destructure `{ apiFetch, user }`
2. **Replace mock data** with `useEffect` → `apiFetch('/api/...')` calls
3. **Wire user actions** (follow, like, send message, etc.) to `apiFetch` POST/PUT/DELETE calls
4. **Handle loading/error states** properly

### Priority Order (by user impact)

| Priority | Page | API Endpoints to Wire |
|----------|------|----------------------|
| **P0** | ProfilePage | `GET /api/profiles/:username`, `POST /api/follows`, `GET /api/profiles/:id/videos` |
| **P0** | MessagesPage | `GET /api/messages/conversations`, `GET /api/messages/:id`, `POST /api/messages/:id` |
| **P0** | NotificationsPage | `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all` |
| **P0** | SearchPage | `GET /api/search/players`, `GET /api/search/profiles`, `GET /api/search/posts` |
| **P1** | SettingsPage | `GET /api/settings`, `PUT /api/settings`, `PUT /api/settings/account/*` |
| **P1** | SinglePostPage | `GET /api/posts/:id`, comments, like/repost |
| **P2** | ClubPage | `GET /api/clubs/:id`, `GET /api/clubs/:id/squad` |
| **P2** | ScoutWatchlistPage | `GET /api/scouts/shortlists`, `GET /api/scouts/shortlists/:id/players` |
| **P2** | DiscoverPage | `GET /api/feed/discover`, `GET /api/search/players` |

---

## Summary

> The frontend pages are **beautifully designed** but currently function as **static prototypes**. The backend APIs are all built and ready — the gap is connecting them. This is a significant amount of work (~8 pages need full API integration) but the backend endpoints already exist for every feature.

Should I proceed with wiring all pages to the backend?


---

## walkthrough.md

# Frontend → Backend API Wiring — Walkthrough

All **9 previously-mocked pages** are now wired to use `apiFetch()` from the `useAuth` context, replacing hardcoded `INITIAL_DATA` arrays with real API calls.

## Changes Made

### P0 — Critical Pages

| Page | File | What was wired |
|------|------|----------------|
| **ProfilePage** | [ProfilePage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/ProfilePage.jsx) | Fetches profile, posts, videos, career, stats, endorsements, suggestions. Follow/unfollow via API. Edit modal saves via `PUT /api/profiles/:id`. |
| **MessagesPage** | [MessagesPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/MessagesPage.jsx) | Fetches conversations list, loads message thread on selection, sends messages via API with optimistic UI updates. |
| **NotificationsPage** | [NotificationsPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/NotificationsPage.jsx) | Fetches notifications, maps API data to component shape with time-section grouping. "Mark all read" calls `PUT /api/notifications/read-all`. |
| **SearchPage** | [SearchPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/SearchPage.jsx) | Debounced search (400ms) calls `GET /api/search/players`. Results count is dynamic. Position/tab filters passed as query params. |

### P1 — Important Pages

| Page | File | What was wired |
|------|------|----------------|
| **SettingsPage** | [SettingsPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/SettingsPage.jsx) | Fetches settings + profile on mount to populate forms. Save calls `PUT /api/settings`. |
| **SinglePostPage** | [SinglePostPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/SinglePostPage.jsx) | Fetches post + comments by ID. Add comment calls `POST /api/posts/:id/comments`. |

### P2 — Secondary Pages

| Page | File | What was wired |
|------|------|----------------|
| **ClubPage** | [ClubPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/ClubPage.jsx) | Fetches club data + squad roster. Follow/unfollow via API. |
| **ScoutWatchlistPage** | [ScoutWatchlistPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/ScoutWatchlistPage.jsx) | Fetches shortlisted players from `GET /api/scouts/shortlists`. |
| **DiscoverPage** | [DiscoverPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/DiscoverPage.jsx) | Fetches discover feed from `GET /api/feed/discover`. |

## Pattern Used

Every page follows the same pattern established by [FeedPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/FeedPage.jsx):

```javascript
const { user, apiFetch } = useAuth()
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const load = async () => {
    try {
      const res = await apiFetch('/api/endpoint')
      setData(res.data?.data || res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  load()
}, [apiFetch])
```

## Verification

- ✅ Frontend build (`npx vite build`) — **0 errors**
- ✅ Backend TypeScript (`npx tsc --noEmit`) — **0 errors**
- ✅ All pages correctly import `useAuth` and destructure `apiFetch`

## Next Steps

To make this fully functional end-to-end:

1. **Set up `.env`** in `/server/` with Supabase credentials
2. **Run SQL migrations** against the live Supabase database
3. **Start the backend** (`npm run dev` in `/server/`)
4. **Test each page** — they will fetch real data from the API

> [!NOTE]
> The hardcoded mock data arrays (`INITIAL_CONVERSATIONS`, `INITIAL_NOTIFICATIONS`, etc.) still exist in the files as dead code. They can be safely removed in a cleanup pass, but don't affect functionality since the component state is now initialized to `[]` and populated from API calls.


---

## implementation_plan.md

# Complete Footfrica Backend — Map Frontend Features to API Completeness

## Background

After a thorough audit of all 15 backend route files, 4 services, 8 database migrations, 6 Zod schemas, and 12 frontend pages, the backend is **already ~75% complete**. Most core CRUD operations exist. This plan identifies the **gaps** — features visible in the frontend UI that have no corresponding backend support — and adds them.

## Audit Summary: What Already Exists ✅

| Domain | Backend Coverage |
|--------|-----------------|
| **Auth** (register, login, refresh, logout, onboard, complete-profile, check-username, FCM token) | ✅ Complete |
| **Profiles** (CRUD for all 5 user types, career, stats, endorsements) | ✅ Complete |
| **Posts** (create, delete, like/unlike, repost/unrepost, comments) | ✅ Complete |
| **Feed** (personalized, following, trending, discover, match-day, highlights, suggestions, stats) | ✅ Complete |
| **Videos** (upload URL, metadata, webhook, CRUD, browse) | ✅ Complete |
| **Search** (players, profiles, posts, trending hashtags) | ✅ Complete |
| **Follows** (follow/unfollow, list followers/following) | ✅ Complete |
| **Messages** (conversations CRUD, send/receive, mark read, delete) | ✅ Complete |
| **Notifications** (list, mark read/all, delete, unread count) | ✅ Complete |
| **Clubs** (profile, squad CRUD, player verification, browse) | ✅ Complete |
| **Scouts** (profile, shortlists CRUD, add/remove players) | ✅ Complete |
| **Coaches** (profile, endorsements given, endorse/remove) | ✅ Complete |
| **Admin** (users, verify, delete, reports, stats, reindex) | ✅ Complete |
| **Uploads** (avatar, cover image to Supabase Storage) | ✅ Complete |

---

## What's Missing — Frontend Features Without Backend Support ❌

### 1. Settings Page — Account Management APIs

The [SettingsPage.jsx](file:///Users/macbook/Projects/footfrica/src/pages/SettingsPage.jsx) has 14 tabs but most settings changes have **no dedicated backend endpoints**:

- **Account Tab**: Change email, change phone, change password, update display name/username
- **Privacy & Visibility Tab**: Toggle profile visibility (public/private), toggle who can DM, toggle show online status, toggle show location
- **Messaging Tab**: Toggle message requests, auto-accept messages from verified users
- **Notifications Tab**: Toggle notification preferences per type (likes, comments, follows, messages, endorsements)
- **Discovery Preferences Tab**: Set preferred positions, age range, location radius for discovery
- **Security Tab**: Enable/disable 2FA, view active sessions, revoke sessions
- **Blocked & Muted Tab**: Block user, unblock user, mute user, unmute user, list blocked/muted
- **Data & Downloads Tab**: Export user data, clear search history
- **Deactivate Account Tab**: Deactivate (temporary), delete account (permanent)

### 2. Reporting System — User-Facing Report Endpoint

The `reports` table exists in the DB and admin can review them, but there's **no user-facing endpoint** to submit a report (`POST /api/reports`).

### 3. Profile — Missing `location` and `website_url` Fields

The feed stats endpoint returns `location` and `website_url`, but the `profiles` table doesn't have these columns in the migrations. Need a migration to add them.

### 4. Post Image Upload

Posts can have `image_urls` but there's **no endpoint** to upload post images to Supabase Storage. Currently only avatar/cover uploads exist.

### 5. Bookmark/Save Posts

Common social feature visible in some frontend post action menus — no `bookmarks` table or endpoints exist.

### 6. Trending Hashtags RPC

The search route calls `supabaseAdmin.rpc('get_trending_hashtags')` but this function **doesn't exist** in any migration. Need to create it.

---

## Proposed Changes

### Migration: `009_settings_and_missing.sql`

#### [NEW] [009_settings_and_missing.sql](file:///Users/macbook/Projects/footfrica/server/supabase/migrations/009_settings_and_missing.sql)

Adds:
- `location`, `website_url` columns to `profiles`
- `user_settings` table (privacy, notification prefs, messaging prefs, discovery prefs)
- `blocked_users` table
- `muted_users` table
- `bookmarks` table
- `get_trending_hashtags()` RPC function

---

### New Schema File

#### [NEW] [settings.schemas.ts](file:///Users/macbook/Projects/footfrica/server/src/schemas/settings.schemas.ts)

Zod validation schemas for all settings update endpoints.

---

### New Route File: Settings

#### [NEW] [settings.ts](file:///Users/macbook/Projects/footfrica/server/src/routes/settings.ts)

Endpoints:
- `GET /api/settings` — Get current user settings
- `PUT /api/settings` — Update settings (privacy, notifications, messaging, discovery)
- `PUT /api/settings/account/email` — Change email
- `PUT /api/settings/account/password` — Change password
- `PUT /api/settings/account/username` — Change username
- `POST /api/settings/deactivate` — Deactivate account
- `DELETE /api/settings/account` — Permanent account deletion

---

### New Route File: Blocked & Muted

#### [NEW] [blocks.ts](file:///Users/macbook/Projects/footfrica/server/src/routes/blocks.ts)

Endpoints:
- `POST /api/blocks/:userId` — Block a user
- `DELETE /api/blocks/:userId` — Unblock a user
- `GET /api/blocks` — List blocked users
- `POST /api/mutes/:userId` — Mute a user
- `DELETE /api/mutes/:userId` — Unmute a user
- `GET /api/mutes` — List muted users

---

### New Route File: Reports (User-Facing)

#### [NEW] [reports.ts](file:///Users/macbook/Projects/footfrica/server/src/routes/reports.ts)

Endpoints:
- `POST /api/reports` — Submit a report (post, comment, profile, video)

---

### New Route File: Bookmarks

#### [NEW] [bookmarks.ts](file:///Users/macbook/Projects/footfrica/server/src/routes/bookmarks.ts)

Endpoints:
- `POST /api/bookmarks/:postId` — Bookmark a post
- `DELETE /api/bookmarks/:postId` — Remove bookmark
- `GET /api/bookmarks` — List bookmarked posts (paginated)

---

### Modify: Post Image Uploads

#### [MODIFY] [uploads.ts](file:///Users/macbook/Projects/footfrica/server/src/routes/uploads.ts)

Add `POST /api/uploads/post-image` — Upload post images to Supabase Storage `post-images` bucket, returns public URL.

---

### Modify: Server Entry Point

#### [MODIFY] [index.ts](file:///Users/macbook/Projects/footfrica/server/src/index.ts)

Register new route modules:
- `settingsRoutes` → `/api/settings`
- `blockRoutes` → `/api/blocks`
- `reportRoutes` → `/api/reports`
- `bookmarkRoutes` → `/api/bookmarks`

---

### Modify: Types

#### [MODIFY] [types/index.ts](file:///Users/macbook/Projects/footfrica/server/src/types/index.ts)

Add interfaces: `UserSettings`, `BlockedUser`, `MutedUser`, `Bookmark`, `Report`.

---

## Verification Plan

### Automated Tests
- `curl` the health endpoint to verify server starts
- TypeScript type-check: `cd server && npx tsc --noEmit`

### Manual Verification
- Server starts without errors: `cd server && npm run dev`
- All new routes return proper JSON responses
- Settings CRUD operations work end-to-end


---

## BACKEND_REFERENCE.md

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


---

## footfrica_build_checklist.md

# Footfrica — Build Checklist & Missing Steps

> Last updated: 2026-07-19
> This document tracks every frontend page, backend endpoint, and wiring task.
> Use it as the source of truth whenever we pick up a new session.

---

## Legend
- `✅ Done` — Built and working
- `⚠️ Partial` — Built but not fully wired / has known gaps
- `🔴 Missing` — Not built yet

---

## 1. Database Migrations (Supabase)

| # | File | Status | Notes |
|---|------|--------|-------|
| 001 | `extensions.sql` | ✅ Done | uuid-ossp, pg_trgm |
| 002 | `profiles.sql` | ✅ Done | profiles, player/club/scout/coach/fan sub-tables |
| 003 | `social.sql` | ✅ Done | posts, likes, comments, reposts, follows, reports |
| 004 | `videos.sql` | ✅ Done | Cloudflare video storage |
| 005 | `messaging.sql` | ✅ Done | DMs and conversations |
| 006 | `notifications.sql` | ✅ Done | notification events table |
| 007 | `rls_policies.sql` | ✅ Done | Row Level Security for all tables |
| 008 | `interests_and_tags.sql` | ⚠️ Partial | **Written but NOT yet run against Supabase.** Must be applied before /complete-profile works. |

> [!IMPORTANT]
> **Run migration 008 first.** Until `interests TEXT[]` is on `profiles` and `tags TEXT[]` is on `posts`, the new endpoints will fail.

---

## 2. Backend — API Routes

### Auth (`/api/auth`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /register` | ✅ Done | Now returns JWT session immediately |
| `POST /login` | ✅ Done | Returns profile + needs_onboarding flag |
| `POST /complete-profile` | ✅ Done | Saves user_type + username + interests atomically |
| `POST /onboard` | ✅ Done | Legacy alias, kept for compatibility |
| `POST /refresh` | ✅ Done | Token refresh |
| `GET /me` | ✅ Done | Returns current user profile |
| `GET /check-username/:username` | ✅ Done | Returns available + suggestion |
| `PUT /fcm-token` | ✅ Done | Push notification token |
| `POST /logout` | ✅ Done | Clears session + FCM token |

### Profiles (`/api/profiles`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /:identifier` | ✅ Done | Lookup by UUID or username |
| `PUT /me` | ✅ Done | Update base profile |
| `PUT /me/player` | ✅ Done | Update player-specific fields |
| `PUT /me/club` | ✅ Done | Update club-specific fields |
| `PUT /me/scout` | ✅ Done | Update scout-specific fields |
| `PUT /me/coach` | ✅ Done | Update coach-specific fields |
| `PUT /me/fan` | ✅ Done | Update fan-specific fields |
| `POST /avatar` | 🔴 Missing | Avatar upload endpoint — called by OnboardComplete but never built |
| `GET /:id/posts` | ✅ Done | User's post history |
| `GET /:id/videos` | ✅ Done | User's video gallery |
| `POST /:id/career` | ✅ Done | Add career entry (players) |
| `DELETE /:id/career/:entryId` | ✅ Done | Remove career entry |
| `PUT /:id/stats` | ✅ Done | Upsert season stats |
| `POST /:id/endorse` | ✅ Done | Endorse a player skill |
| `GET /:id/endorsements` | ✅ Done | Get player endorsements |

### Posts (`/api/posts`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /` | ⚠️ Partial | Built, but does not yet save `tags[]` field (schema updated, route insert not updated) |
| `GET /:id` | ✅ Done | Single post with full context |
| `DELETE /:id` | ✅ Done | Author only |
| `POST /:id/like` | ✅ Done | Notifies author |
| `DELETE /:id/like` | ✅ Done | Unlike |
| `GET /:id/comments` | ✅ Done | Paginated |
| `POST /:id/comments` | ✅ Done | Creates comment + notifies |

### Feed (`/api/feed`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /` | ✅ Done | Personalised "For You" (now uses interest overlap scoring) |
| `GET /following` | ✅ Done | Chronological from followed users |
| `GET /trending` | ✅ Done | Engagement velocity scoring |
| `GET /discover` | ✅ Done | Discovery — video-first, out-of-network |

### Follows (`/api/follows`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /:id/follow` | ✅ Done | Follow a user |
| `DELETE /:id/follow` | ✅ Done | Unfollow |
| `GET /:id/followers` | ✅ Done | Who follows this user |
| `GET /:id/following` | ✅ Done | Who this user follows |

### Messages (`/api/messages`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /conversations` | ✅ Done | All conversations for user |
| `POST /conversations` | ✅ Done | Start a new conversation |
| `GET /conversations/:id/messages` | ✅ Done | Messages in a conversation |
| `POST /conversations/:id/messages` | ✅ Done | Send a message |

### Notifications (`/api/notifications`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /` | ✅ Done | List notifications |
| `PUT /:id/read` | ✅ Done | Mark one as read |
| `PUT /read-all` | ✅ Done | Mark all as read |

### Videos (`/api/videos`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /upload-url` | ✅ Done | Get Cloudflare direct upload URL |
| `POST /` | ✅ Done | Register video after upload |
| `GET /:id` | ✅ Done | Get video metadata |
| `DELETE /:id` | ✅ Done | Delete video |

### Search (`/api/search`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /` | ✅ Done | Search profiles/posts |
| `GET /players` | ✅ Done | Player-specific search (Algolia) |

### Scouts (`/api/scouts`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /` | ✅ Done | List scouts |
| `GET /:id/watchlist` | ✅ Done | Scout watchlist |
| `POST /:id/watchlist` | ✅ Done | Add to watchlist |
| `DELETE /:id/watchlist/:playerId` | ✅ Done | Remove from watchlist |

### Coaches (`/api/coaches`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /` | ✅ Done | List coaches |
| `GET /:id` | ✅ Done | Coach profile |

### Players (`/api/players`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /` | ✅ Done | Search/filter players |
| `GET /:id` | ✅ Done | Player profile + stats |

### Clubs (`/api/clubs`)
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /` | ✅ Done | List clubs |
| `GET /:id` | ✅ Done | Club profile |
| `GET /:id/squad` | ✅ Done | Club squad |

---

## 3. Backend — Missing / Broken Items

| Item | Priority | Description |
|------|----------|-------------|
| `POST /api/profiles/avatar` | 🔴 **High** | Avatar upload handler — OnboardComplete calls it but the route doesn't exist. Use Supabase Storage bucket. |
| `POST /api/posts` — save `tags[]` | 🔴 **High** | The `tags` column was added to DB + schema but the insert in `posts.ts` line 17-32 doesn't include `tags`. Feed scoring won't work without tagged posts. |
| Migration 008 applied to DB | 🔴 **High** | Must run `008_interests_and_tags.sql` against your Supabase project |
| `PUT /api/profiles/me` — include `interests` | ⚠️ Medium | `updateProfileSchema` doesn't include `interests` field yet, so users can't update interests from settings |
| Token refresh on 401 | ⚠️ Medium | `AuthContext.apiFetch` doesn't auto-retry with refresh_token on 401 — sessions will appear "expired" |
| Protected route guard | ⚠️ Medium | No `<ProtectedRoute>` component — any unauthenticated user can access `/feed`, `/onboard/*` etc. |
| Supabase RLS on `user_interest_scores` | 🔴 High | No RLS policy added in migration 007 for the new table (only user can read/write their own scores) |

---

## 4. Frontend — Pages

### Landing Page
| Page | Status | Notes |
|------|--------|-------|
| `/` — Marketing landing | ✅ Done | Hero, Problem, Solution, Features, HowItWorks, Spotlight, MarketStats, Waitlist, Footer |

### Onboarding Flow
| Route | File | Status | API Wired? |
|-------|------|--------|------------|
| `/welcome` | `WelcomePage.jsx` | ✅ Done | — (no API, navigation only) |
| `/register` | `RegisterPage.jsx` | ⚠️ Partial | Calls `POST /api/auth/register` but uses old schema that sent `user_type` — now removed from register |
| `/login` | `LoginPage.jsx` | ⚠️ Partial | Calls `POST /api/auth/login` ✅ but doesn't handle `needs_onboarding: true` redirect |
| `/onboard/user-type` | `OnboardUserType.jsx` | ✅ Done | sessionStorage only, no API |
| `/onboard/identity` | `OnboardIdentity.jsx` | ✅ Done | Calls `GET /api/auth/check-username/:username` ✅ |
| `/onboard/interests` | `OnboardInterests.jsx` | ✅ Done | sessionStorage only, no API |
| `/onboard/complete` | `OnboardComplete.jsx` | ⚠️ Partial | Calls `POST /api/auth/complete-profile` ✅ + calls `POST /api/profiles/avatar` 🔴 (missing) |

### App — Pages Not Yet Built
| Route | Page | Priority | Backend Ready? |
|-------|------|----------|----------------|
| `/feed` | **Feed Page** | 🔴 **#1 Priority** | ✅ `GET /api/feed` works |
| `/feed/following` | Following tab in Feed | 🔴 High | ✅ `GET /api/feed/following` works |
| `/feed/trending` | Trending tab | 🔴 High | ✅ `GET /api/feed/trending` works |
| `/post/create` | Create Post modal/page | 🔴 High | ✅ `POST /api/posts` works |
| `/post/:id` | Single Post view + comments | 🔴 High | ✅ `GET /api/posts/:id` + `GET /api/posts/:id/comments` |
| `/profile/:username` | Public Profile page | 🔴 High | ✅ `GET /api/profiles/:identifier` |
| `/profile/me` | Own Profile / Edit | 🔴 High | ✅ `PUT /api/profiles/me` |
| `/search` | Search page | 🔴 Medium | ✅ `GET /api/search` |
| `/messages` | Inbox / DMs | 🔴 Medium | ✅ all messaging endpoints |
| `/messages/:id` | Conversation thread | 🔴 Medium | ✅ `GET /api/messages/conversations/:id/messages` |
| `/notifications` | Notifications list | 🔴 Medium | ✅ `GET /api/notifications` |
| `/discover` | Discover / Explore | 🔴 Medium | ✅ `GET /api/feed/discover` |
| `/players` | Player directory | 🔴 Medium | ✅ `GET /api/players` |
| `/clubs` | Club directory | 🔴 Medium | ✅ `GET /api/clubs` |
| `/scouts` | Scout directory | 🔴 Low | ✅ `GET /api/scouts` |
| `/coaches` | Coach directory | 🔴 Low | ✅ `GET /api/coaches` |
| `/settings` | Account settings | 🔴 Low | ⚠️ partial — needs interests update |
| `/admin` | Admin dashboard | ⚠️ Partial | ✅ `GET /api/admin/*` routes |

---

## 5. Frontend — Missing Components / Wiring

| Component | Status | Notes |
|-----------|--------|-------|
| `<ProtectedRoute>` | 🔴 Missing | Redirect unauthenticated users to `/welcome` |
| `<Navbar>` (app shell) | 🔴 Missing | In-app navigation bar (different from landing page Navbar) |
| `<PostCard>` | 🔴 Missing | Reusable card to render a single post with like/comment/repost actions |
| `<VideoPlayer>` | 🔴 Missing | Cloudflare Stream player component |
| `<Avatar>` | 🔴 Missing | Reusable avatar with fallback initials |
| `<UserCard>` | 🔴 Missing | Profile preview card for search results / suggestions |
| `<CommentThread>` | 🔴 Missing | Render comments with nested replies |
| `<NotificationBadge>` | 🔴 Missing | Unread count badge |
| `AuthContext` — token refresh | ⚠️ Partial | `apiFetch` needs auto-refresh on 401 |
| `AuthContext` — persist refresh_token | ⚠️ Partial | Currently only stores `access_token`, not `refresh_token` |
| RegisterPage — fix user_type removal | 🔴 High | `user_type` was removed from the register schema — `RegisterPage.jsx` may still be sending it |

---

## 6. Figma Design Pages — Remaining to Build

> The `/onboard` folder has 13 Figma screens. The onboarding flow (screens 1–9) is done.
> Remaining screens yet to be matched and built:

| Figma Screen | Likely Page | Status |
|---|---|---|
| Screen 10 | Feed / Home | 🔴 Not built |
| Screen 11 | Create Post | 🔴 Not built |
| Screen 12 | Profile Page | 🔴 Not built |
| Screen 13 | Messages / Inbox | 🔴 Not built |

> [!NOTE]
> Share the remaining Figma screens and we will build them in the same way we built the onboarding — matching the design pixel-for-pixel.

---

## 7. Recommended Build Order

```
Phase A — Fix broken wiring (do now)
  1. Run migration 008 in Supabase
  2. Fix posts.ts to save tags[] on insert
  3. Build POST /api/profiles/avatar endpoint
  4. Fix RegisterPage to not send user_type
  5. Add ProtectedRoute component
  6. Fix AuthContext to store + refresh tokens properly

Phase B — Core app (build next)
  7. Feed page (For You + Following tabs)
  8. PostCard component
  9. Create Post page/modal
  10. Single Post view + comments

Phase C — Social graph
  11. Profile page (public + own)
  12. Search page
  13. Notifications page

Phase D — Messaging
  14. Inbox page
  15. Conversation thread

Phase E — Discovery & Directories
  16. Discover/Explore page
  17. Player directory
  18. Club directory

Phase F — Polish
  19. Settings page (update interests, bio, avatar)
  20. Admin dashboard improvements
```

---

## 8. Environment Variables Required

| Variable | Where | Set? |
|----------|-------|------|
| `VITE_API_URL` | Frontend `.env` | ⚠️ Check |
| `SUPABASE_URL` | Server `.env` | ⚠️ Check |
| `SUPABASE_SERVICE_ROLE_KEY` | Server `.env` | ⚠️ Check |
| `REDIS_URL` | Server `.env` | ⚠️ Check |
| `CLOUDFLARE_ACCOUNT_ID` | Server `.env` | ⚠️ Check |
| `CLOUDFLARE_API_TOKEN` | Server `.env` | ⚠️ Check |
| `ALGOLIA_APP_ID` | Server `.env` | ⚠️ Check |
| `ALGOLIA_API_KEY` | Server `.env` | ⚠️ Check |


---

