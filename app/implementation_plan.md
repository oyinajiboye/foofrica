# Footfrica Backend — Implementation Plan

Build a production-ready REST API backend for the Footfrica platform, aligned with the recommended tech stack (replacing the PRD's original suggestions).

---

## Updated Tech Stack (PRD Override)

| Layer | Old PRD | New (This Plan) |
|---|---|---|
| Backend | Node.js/Express or Django | **Node.js + Fastify + TypeScript** |
| Auth | JWT + OAuth2 (custom) | **Supabase Auth** |
| Database | PostgreSQL + Redis (self-hosted) | **Supabase (Postgres) + Upstash Redis** |
| Search | Elasticsearch | **Algolia** |
| Video Storage | AWS S3 | **Cloudflare R2** |
| Video Processing | FFmpeg + MediaConvert | **Cloudflare Stream** |
| Hosting | AWS/GCP | **Railway** |
| Analytics | Mixpanel/Amplitude | **Posthog** |

---

## User Review Required

> [!IMPORTANT]
> The existing project is a React/Vite frontend (landing page + admin). The backend will be built as a **separate `server/` directory** within the same monorepo. This keeps everything in one repo while maintaining clean separation. Approve this structure before proceeding.

> [!IMPORTANT]
> **Supabase project required**: You'll need a Supabase project created at supabase.com. I'll generate all SQL migrations, but you'll need to provide the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` before running the server.

> [!IMPORTANT]
> **Algolia account required** for player search. I'll build with Algolia but add a fallback to Postgres full-text search so development can proceed without it.

---

## Project Structure

```
footfrica/                          ← existing repo root
├── src/                            ← existing React frontend (untouched)
├── server/                         ← NEW: Fastify API backend
│   ├── src/
│   │   ├── index.ts                ← Server entry point
│   │   ├── config/
│   │   │   └── env.ts              ← Zod-validated environment config
│   │   ├── lib/
│   │   │   ├── supabase.ts         ← Supabase admin client
│   │   │   ├── algolia.ts          ← Algolia search client
│   │   │   ├── redis.ts            ← Upstash Redis client
│   │   │   └── cloudflare.ts       ← Cloudflare R2/Stream client
│   │   ├── plugins/
│   │   │   ├── auth.ts             ← JWT verification plugin (Supabase tokens)
│   │   │   └── cors.ts             ← CORS plugin
│   │   ├── routes/
│   │   │   ├── auth.ts             ← POST /auth/register, /auth/login, /auth/onboard
│   │   │   ├── profiles.ts         ← GET/PUT /profiles/:id, /profiles/me
│   │   │   ├── players.ts          ← Player-specific endpoints
│   │   │   ├── clubs.ts            ← Club-specific endpoints
│   │   │   ├── scouts.ts           ← Scout-specific endpoints
│   │   │   ├── coaches.ts          ← Coach-specific endpoints
│   │   │   ├── feed.ts             ← GET /feed (personalized), POST /posts
│   │   │   ├── posts.ts            ← CRUD posts, likes, comments, reposts
│   │   │   ├── videos.ts           ← Upload URL generation, metadata
│   │   │   ├── search.ts           ← GET /search/players
│   │   │   ├── follows.ts          ← POST/DELETE /follows/:userId
│   │   │   ├── messages.ts         ← GET/POST /messages/conversations
│   │   │   ├── notifications.ts    ← GET /notifications
│   │   │   └── admin.ts            ← Admin-only endpoints
│   │   ├── schemas/
│   │   │   └── *.ts                ← Zod validation schemas (request/response)
│   │   ├── services/
│   │   │   ├── feed.service.ts     ← Feed algorithm logic
│   │   │   ├── search.service.ts   ← Algolia sync + search logic
│   │   │   ├── video.service.ts    ← Cloudflare Stream integration
│   │   │   └── notification.service.ts ← FCM push notifications
│   │   └── types/
│   │       └── index.ts            ← Shared TypeScript types
│   ├── supabase/
│   │   └── migrations/             ← SQL migration files
│   │       ├── 001_extensions.sql
│   │       ├── 002_profiles.sql
│   │       ├── 003_social.sql
│   │       ├── 004_videos.sql
│   │       ├── 005_messaging.sql
│   │       ├── 006_notifications.sql
│   │       └── 007_rls_policies.sql
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
```

---

## Database Schema

### Core Tables

#### `profiles` (base for all users)
```sql
id (uuid, FK → auth.users)
username (text, unique)
display_name (text)
bio (text)
avatar_url (text)
cover_url (text)
user_type (enum: player | club | scout | coach | fan)
is_verified (bool)
verification_tier (enum: professional | organization | player | contributor)
follower_count (int)
following_count (int)
created_at, updated_at
```

#### `player_profiles`
```sql
profile_id (uuid, FK → profiles)
full_name, date_of_birth, nationality
height_cm, weight_kg, dominant_foot (enum: left|right|both)
primary_position (enum: GK|CB|LB|RB|CDM|CM|CAM|LW|RW|ST|CF)
secondary_positions (text[])
playing_style_tags (text[])
current_club_id (uuid, FK → club_profiles)
jersey_number (int)
```

#### `player_stats` (per season)
```sql
player_id, season, club_id
appearances, goals, assists
clean_sheets, yellow_cards, red_cards
```

#### `career_history`
```sql
player_id, club_name, start_date, end_date
role, is_current
```

#### `club_profiles`
```sql
profile_id
club_name, founded_year, location
country, city, league
logo_url, banner_url
squad_size (computed)
```

#### `scout_profiles`
```sql
profile_id
organization, license_number
specialization (text[])
regions_covered (text[])
```

#### `coach_profiles`
```sql
profile_id
license_level, specialization
current_club_id
```

#### `posts`
```sql
id, author_id (FK → profiles)
content (text)
post_type (enum: text|video|image|poll)
video_id, image_urls (text[])
repost_of (uuid, self-ref)
likes_count, comments_count, reposts_count
visibility (enum: public|followers)
created_at
```

#### `likes`, `comments`, `reposts`
Standard junction tables with `user_id` + `post_id`.

#### `follows`
```sql
follower_id, following_id (both FK → profiles)
created_at
UNIQUE(follower_id, following_id)
```

#### `videos`
```sql
id, uploader_id (FK → profiles)
cloudflare_uid (text)
title, description
match_type (enum: match|training|highlight)
position_played, key_actions (text[])
thumbnail_url, duration_seconds
status (enum: processing|ready|failed)
views_count
```

#### `conversations` + `messages`
```sql
-- conversations: id, participant_ids (uuid[])
-- messages: id, conversation_id, sender_id, content, read_at
```

#### `notifications`
```sql
id, recipient_id, actor_id
type (enum: like|comment|follow|mention|message|endorsement)
entity_type, entity_id
read_at, created_at
```

#### `endorsements`
```sql
id, endorser_id, player_id
skill (enum: pace|ball_control|shooting|passing|defending|...)
created_at
```

#### `shortlists` (scouts only)
```sql
id, scout_id, name
player_ids (uuid[])
```

---

## API Routes

### Auth (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account (email/phone + user_type) |
| POST | `/login` | Sign in, return JWT |
| POST | `/onboard` | Complete profile setup after registration |
| POST | `/logout` | Invalidate session |
| GET | `/me` | Current user profile |

### Profiles (`/api/profiles`)
| Method | Path | Description |
|---|---|---|
| GET | `/:id` | Get any profile by ID or username |
| PUT | `/me` | Update own profile |
| GET | `/me/stats` | Profile view count, engagement |

### Players (`/api/players`)
| Method | Path | Description |
|---|---|---|
| GET | `/:id` | Full player profile with stats |
| PUT | `/:id/stats` | Update season stats |
| POST | `/:id/career` | Add career entry |
| DELETE | `/:id/career/:entryId` | Remove career entry |

### Feed (`/api/feed`)
| Method | Path | Description |
|---|---|---|
| GET | `/` | Personalized feed (For You) |
| GET | `/following` | Chronological following feed |
| GET | `/trending` | Trending posts + hashtags |
| GET | `/discover` | Discovery feed |

### Posts (`/api/posts`)
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create post (text/image/video/poll) |
| GET | `/:id` | Get single post |
| DELETE | `/:id` | Delete own post |
| POST | `/:id/like` | Like a post |
| DELETE | `/:id/like` | Unlike |
| POST | `/:id/repost` | Repost |
| GET | `/:id/comments` | Paginated comments |
| POST | `/:id/comments` | Add comment |

### Videos (`/api/videos`)
| Method | Path | Description |
|---|---|---|
| POST | `/upload-url` | Get Cloudflare Stream signed upload URL |
| PUT | `/:id/metadata` | Save video metadata after upload |
| GET | `/:id` | Get video details |
| DELETE | `/:id` | Delete video |

### Search (`/api/search`)
| Method | Path | Description |
|---|---|---|
| GET | `/players` | Multi-filter player search via Algolia |
| GET | `/profiles` | General profile/user search |
| GET | `/posts` | Post search by hashtag/keyword |

### Follows (`/api/follows`)
| Method | Path | Description |
|---|---|---|
| POST | `/:userId` | Follow a user |
| DELETE | `/:userId` | Unfollow |
| GET | `/:userId/followers` | User's followers |
| GET | `/:userId/following` | Users they follow |

### Messages (`/api/messages`)
| Method | Path | Description |
|---|---|---|
| GET | `/conversations` | List all conversations |
| POST | `/conversations` | Start new conversation |
| GET | `/conversations/:id` | Get messages in conversation |
| POST | `/conversations/:id` | Send message |

### Notifications (`/api/notifications`)
| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated notifications |
| PUT | `/:id/read` | Mark as read |
| PUT | `/read-all` | Mark all as read |

### Scouts (`/api/scouts`)
| Method | Path | Description |
|---|---|---|
| GET | `/:id/shortlists` | Get all shortlists |
| POST | `/shortlists` | Create shortlist |
| POST | `/shortlists/:id/players` | Add player to shortlist |
| DELETE | `/shortlists/:id/players/:playerId` | Remove player |

### Clubs (`/api/clubs`)
| Method | Path | Description |
|---|---|---|
| GET | `/:id/squad` | Get club squad |
| POST | `/:id/squad` | Add player to squad |
| POST | `/:id/verify-player/:playerId` | Verify player affiliation |

---

## Proposed Changes

### Backend Directory

#### [NEW] `server/package.json`
Fastify, TypeScript, Supabase SDK, Algolia, Upstash Redis, Cloudflare SDK, Zod, dotenv, firebase-admin.

#### [NEW] `server/src/index.ts`
Fastify server with CORS, JWT auth plugin, all route registrations, graceful shutdown.

#### [NEW] `server/src/config/env.ts`
Zod-validated env schema — fails fast on startup if required vars are missing.

#### [NEW] `server/src/lib/*.ts`
Singleton clients for Supabase, Algolia, Redis, Cloudflare.

#### [NEW] `server/src/plugins/auth.ts`
Fastify preHandler plugin that validates Supabase JWTs on protected routes.

#### [NEW] `server/src/routes/*.ts`
All route files as described in the API routes section above.

#### [NEW] `server/src/services/*.ts`
Business logic: feed algorithm, Algolia player indexing, Cloudflare Stream upload URLs, FCM push notifications.

#### [NEW] `server/supabase/migrations/*.sql`
7 migration files covering all tables + Row Level Security policies.

#### [NEW] `server/.env.example`
All required environment variables documented.

---

## Verification Plan

### Automated Tests
```bash
# Start the server
cd server && npm run dev

# Health check
curl http://localhost:3001/health

# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","user_type":"player"}'

# Run type checking
npm run typecheck

# Lint
npm run lint
```

### Manual Verification
- Server starts without errors
- `/health` endpoint returns `200 OK`  
- Auth routes work with Supabase (register, login, JWT returned)
- Protected routes return `401` without JWT
- Database migrations apply cleanly in Supabase dashboard
- Player search returns filtered results via Algolia/Postgres fallback

---

## Open Questions

> [!IMPORTANT]
> Do you already have a Supabase project created? If yes, please share the project URL and I'll tailor the migration files accordingly.

> [!IMPORTANT]
> Do you have an Algolia account? The search module will build with a Postgres full-text fallback so we can develop without it, but production search will need Algolia.

> [!IMPORTANT]
> Should I also set up a `server/` startup script in the root `package.json` so both frontend and backend can be started with `npm run dev:all`?
