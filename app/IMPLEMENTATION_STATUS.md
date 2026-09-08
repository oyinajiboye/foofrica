# Footfrica implementation status

Branch: `codex/complete-footfrica` · Updated September 8, 2026.

The branch includes implementations for the ten proposed features plus repairs to unfinished core flows. Supabase migrations 001–011 have been applied with explicit user approval. The code has not been deployed. Build success and stubbed API tests do not certify live end-to-end behavior.

## Proposed features implemented in code

| Feature | Routes and behavior |
| --- | --- |
| Opportunities and trials | `/opportunities`: verified clubs publish and close listings; players filter country, position and age, then apply before the deadline. |
| Verification | `/verification`: official evidence links, request history, moderator-only review and atomic badge approval. A trusted administrator must be provisioned before review can operate. |
| Football CV | `/cv`: own profile, career, season statistics and highlights; print/save to PDF and copy the profile link. Profile links currently require app sign-in. |
| Advanced talent search | `/players`: name, position, nationality, dominant foot and age filters applied before database pagination. Other roles have their own directories. |
| Player comparison | `/compare`: compare 2–4 players, attributes and aggregate recorded season statistics. |
| Applications | `/applications`: applicants track/withdraw; listing owners shortlist, invite or reject; terminal statuses cannot be reopened. Submission locks the listing to prevent a close/submission race. |
| Profile analytics | `/analytics`: signed-in profile views over 30 days, lifetime post engagement and own/received application counts. Views deduplicate per viewer/day; self-visits are excluded. |
| Squad management | `/squad`: invitations require player acceptance; either party can end membership. Legacy club endpoints now use the same consent workflow. |
| Opportunity alerts | `/alerts`: saved country/position preferences, matching listings and database-triggered in-app notifications for newly published listings. Email/push delivery of recruitment alerts is not implemented. |
| Safety centre | `/safety`: report history, block/unblock and mute/unmute; `/moderation` provides administrator report decisions. Private data and blocked accounts are checked in relevant API reads and interactions. |

## Additional completed code work

- Authenticated onboarding for all roles, real route protection, refresh-token renewal and isolated auth clients.
- Google/Apple PKCE sign-in, callback handling, password-reset requests and password updates. Recovery links must open in the same browser that requested them. Provider credentials, callback allowlists and SMTP still need configuration.
- Real profile editing, photo uploads, career entries, season statistics and coach/scout endorsements. Settings save privacy, notifications, account details and interests.
- Text/photo/poll posting; vote totals and one vote per account, with closed-poll validation in SQL.
- Cloudflare direct video uploads (200 MB / 10 minutes), ownership validation, manual processing refresh and embedded playback. The unsigned webhook endpoint is disabled. Uploaders refresh status and publish after processing completes.
- Inbox polling, read receipts, new conversations, profile sharing, leaving conversations, and private PDF/photo attachments (5 MB) with participant-checked, 60-second download URLs.
- Real notifications, saved posts, highlight browsing, comments and persistent scout shortlists/notes. Replaced prototype polls, video players, messages, notifications and profiles that displayed fabricated results or inactive controls.
- Browser roles do not receive admin or push-token fields from public-profile API responses. Privacy checks cover profile subresources, direct posts/comments/reactions, directory/search results, saved posts, legacy role routes and messaging.

## Validation performed

- Frontend production build passes; Vite still reports a bundle-size warning.
- Backend TypeScript build passes.
- 21 in-process tests pass. External fetch is explicitly disabled in tests. Coverage includes onboarding, validation, role preservation, ownership, private-profile subresources, blocked post access, message restrictions, private attachments, application transitions, squad consent, video ownership, and per-request PKCE verifier/challenge correctness.
- JSX binding scan found no unresolved component references; whitespace diff check passes.
- Live schema checks were performed. Browser QA and authenticated external-provider end-to-end testing remain outstanding.
- Existing ESLint debt remains, including unused declarations and React effect/compiler rules. It is not a passing release gate yet.

Local commands from repository root: `npm --prefix app run build` and `npm --prefix app/server test`.

## Supabase activation

Connected project: `footfrica` (`oxdnavtmnwfwquyserhy`). Migrations 001–011 applied successfully. Live SQL verification confirmed 39 public tables with RLS enabled, three public image buckets (`avatars`, `covers`, `post-images`) and a private `message-attachments` bucket. Recommendation tables are present; authenticated browser access to feed sessions is disabled and service-role access is enabled.

Application data is accessed through the authenticated Fastify backend. Supabase Auth remains available. Full live multi-account testing is still required.

## Remaining release work

1. Run live integration checks for functions, triggers and storage policies against the activated schema.
2. Configure the API host with real Supabase environment values. Set `VITE_API_URL`, or a same-origin `/api` reverse proxy. Configure `FRONTEND_URL` and Supabase callback allowlists for `/auth/callback` and `/reset-password`.
3. Configure Google/Apple OAuth providers and production email delivery in Supabase, Cloudflare Stream credentials/subdomain, and trusted moderator accounts. Do not put service-role/provider secrets in frontend files or GitHub source.
4. Run live multi-account tests: all-role onboarding, sign-in/recovery, privacy/block changes, file uploads/downloads, expired trials, duplicate applications, concurrent squad acceptance, verification and voting. Confirm notification triggers after migration commit.
5. Finish release hardening: lint cleanup, responsive/accessibility browser QA, load testing, batching repeated privacy lookups, and feed pagination where privacy filtering can shorten a page. Legacy search parameters beyond the exposed directory filters are not supported by the canonical directory redirect.
6. Voice/video calls, push/email recruitment delivery, rich threaded comment replies, attachment malware scanning/retention cleanup and production monitoring are not implemented. They are not presented as completed features.
7. Deploy only after configuration, review and live verification. The draft has not been merged or deployed.

## Recommendation update

The local football-v2 implementation replaces page-local For You sorting with candidate retrieval, weighted and decaying signals, creator diversity, negative feedback, exposure tracking and owned expiring snapshots. See RECOMMENDATION_ALGORITHM.md for exact behavior, limits and rollout requirements. The latest suite has 32 passing tests. The recommendation schema is activated.
