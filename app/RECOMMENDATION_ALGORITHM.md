# Footfrica recommendations: football-v2

Implemented locally on September 8, 2026. This is a transparent first-generation model, not a trained model or a claim of optimal retention. It optimizes football relevance, useful discovery and variety. It does not optimize session duration or reward compulsive use.

## Request flow

`GET /api/feed?limit=10` builds a snapshot from up to 600 distinct posts in the last 60 days: 200 recent public posts, 200 matching positive topic interests, and 200 network posts from up to 1,000 recently followed accounts. ID queries are batched to keep REST request URLs bounded. All pools have deterministic timestamp/ID ordering. Private profiles, blocks, mutes, follower-only permissions and unprocessed videos are filtered before ranking.

The snapshot stores ordered IDs and recommendation explanations for 30 minutes. The response contains `data`, `hasMore`, `next_cursor`, and `algorithm_version`. Subsequent requests send the opaque cursor. Ownership and expiry are checked, and access permissions and dismissals are rechecked on every page. Removed/private posts are skipped while filling the page. The cursor advances past consumed candidates, so filtering does not falsely end the feed. Exhaustion means this bounded snapshot is exhausted; Refresh builds another one.

## Learning and scoring

- Topics are normalized and deduplicated; the composer now submits explicit tags. Hashtags supplied to the API become topics, and video posts receive `player highlights` automatically.
- Stated topics and own profile location/position/nationality seed interests. These contextual values only help where they match content tags; they are not geospatial targeting.
- Current likes weigh 0.6, saves 2, reposts 1.2 and comments 0.4 per distinct post. Removing a like/save/repost removes its contribution at the next refresh. Repeated comments on the same post do not accumulate.
- Explicit More like this weighs 2; Not interested weighs -2 and excludes that post. Opening a creator profile weighs 0.5. These events are upserted once per account/post/kind; repeating an event renews its timestamp but does not add event rows.
- Signals decay with a 21-day half-life and are capped per topic. Up to 200 recent records per reaction source and 1,000 recent feedback records are considered. These caps bound requests and mean very active users have a sampled recent history.
- Post score combines capped topic relevance, role affinity for all five account types, followed creators, freshness, a small verification bonus, and capped popularity. Previously viewed posts receive a penalty.
- With alternatives available, consecutive posts from the same creator are avoided and creators get at most two places in a rolling ten. Every fifth slot seeks unseen, unfollowed creators with a positive score. This is a flexible exploration rule, not an exposure guarantee.
- The display explains whether a post matches interests, comes from a followed account, or introduces a creator.

## Feedback, user control and privacy

Qualified impressions require at least half a post to remain visible for two seconds while the document is visible. These are exposure signals, not video-completion events. The Cloudflare iframe does not supply watch-duration telemetry in this implementation; no inferred watch time is recorded.

Users can select More like this, Not interested, Refresh feed or Reset feed feedback. Reset deletes that user's recommendation feedback and snapshots; it preserves their likes, saved posts and declared interests, as the UI explains. Existing Following and other feed tabs remain available and retain their existing ranking/pagination behavior.

The new tables have RLS and server-only grants, with ownership enforced by the authenticated API. Expired snapshots are cleaned when feeds are created. A scheduled cleanup and a defined retention policy for feedback are still required for production operations. No external tracking service was added.

## Validation and release requirements

32 local regression tests pass, including role priorities, weak-popularity/new-talent ranking, decay, normalization, duplicate suppression, creator diversity, bounded weights, unauthorized feedback, cursor ownership/expiry and filling pages after privacy changes. Existing app regression tests remain included. Frontend and backend production builds pass.

Migration 011 has been applied to the connected Footfrica project, including recommendation tables, indexes, old additive-trigger removal and existing-tag normalization. Live SQL checks confirmed the recommendation tables and server-only feed-session access.

Before production: test live recommendation behavior, run multi-account/browser QA, measure database query cost at realistic scale, and configure retention cleanup. This version is not an A/B-tested optimum. Choose weights using qualified saves, useful profile discovery, successful applications, returning users and satisfaction, alongside reports and repetitive-content rates. Application outcomes and video completion are not yet ranking inputs; they need reliable attribution and measurement before being added. Other feed tabs still need the new pagination approach if they are retained as independent experiences.
