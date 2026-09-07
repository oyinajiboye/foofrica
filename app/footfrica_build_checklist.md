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
