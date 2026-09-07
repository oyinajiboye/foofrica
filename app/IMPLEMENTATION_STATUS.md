# Footfrica implementation status

Review branch: `codex/complete-footfrica` (September 7, 2026).

This branch repairs core integration problems. It is not a production-completion certification. The July checklist predates many existing screens and should not be used to infer current runtime readiness.

## Changes delivered

- Real route protection, including authenticated onboarding; removed default demo bypass.
- New accounts can create their initial profile without already having a profile. Club onboarding supplies the required club name, retries preserve counters and verification, and role switching is rejected.
- Refresh-token persistence and shared, single-flight renewal with request retry. Logout prevents an in-flight refresh from restoring the session. Auth calls use isolated clients rather than changing the shared database client's session.
- Onboarding uses the real avatar endpoint, checks upload failures, and saves the returned profile ID. Multipart requests preserve browser-generated boundaries.
- Messaging reads and writes the correct conversation endpoints, starts conversations by username, removes failed optimistic messages, and persists conversation removal. Profile/trial quick actions now prepare editable text rather than pretending to send sample records.
- Image post creation uploads photos, saves their URLs and exposes failures. Post tags and profile interests are persisted.
- Feed/highlights no longer replace request failures with sample posts. Highlights map the API's nested video data, load/post comments and persist bookmarks.
- Player, club, scout and coach directories with search and pagination.
- Scout shortlist creation, adding/removing players and saving notes with an ownership-checked endpoint.
- Profile editing calls the correct endpoint, career/stat reads exist, sample suggestions that crashed the page are replaced by API results, and profile follow state is no longer shared between viewers through a cache.
- Settings imports its missing hook. API validation returns 400 rather than 500.
- Migration 010 enables interest-score RLS and provisions image storage buckets.

## Verification

- Frontend production build passes.
- Backend TypeScript build passes.
- Eight API regression tests pass using an in-process Fastify server and stubbed Supabase operations. These test fresh-account onboarding, rejected authentication, profile-required access, validation, role preservation, post tags, directory pagination and private shortlist ownership.
- No live database migrations or authenticated external-service calls were made. Browser QA was not performed.
- Existing lint debt remains (unused declarations and React hook/compiler rules); lint is not a passing release gate. Generated server output and the separate Apps Script now have the appropriate exclusion from frontend lint.

## Required before production

1. Connect the actual Supabase project, inspect applied migrations, and apply only missing migrations in order. Migration 009 supplies profile location/settings fields used by this branch; 010 provisions image storage and score policies.
2. Configure the API host using `server/.env.example`. Set frontend `VITE_API_URL` to that host, or configure a same-origin `/api` reverse proxy. Server secrets belong only in the API host's environment.
3. Run live signup, onboarding for all five roles, session-expiry, image upload, messaging and cross-account access tests against a test project.
4. Complete remaining product placeholders: Google/Apple OAuth and password recovery, video-upload/processing/player integration, poll storage/voting, parts of club/profile presentation and trial workflows, messaging attachment/call/report/mute controls, and settings/privacy enforcement. The composer exposes working text/photo posting; incomplete poll/video actions are not presented as working uploads.
5. Audit service-role-backed read routes for privacy/block enforcement and ensure video webhooks are authenticated before public release.
6. Resolve remaining lint debt, perform mobile/desktop browser QA, and configure deployment. This branch has not been merged or deployed.

## Local verification commands

From `app`: `npm ci` then `npm run build`.
From `app/server`: `npm ci` then `npm test`.

The tests supply dummy environment values internally and do not require or contact a real Supabase project.
