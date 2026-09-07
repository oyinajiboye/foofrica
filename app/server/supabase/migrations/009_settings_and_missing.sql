-- ============================================================
-- Migration 009: Settings, Blocks, Mutes, Bookmarks & Missing Columns
-- Completes the backend schema for all frontend features
-- ============================================================

-- ─── 1. Add missing columns to profiles ───────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- ─── 2. User Settings (privacy, notifications, messaging, discovery) ──────────

CREATE TABLE IF NOT EXISTS user_settings (
  user_id                 UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Privacy & Visibility
  profile_visibility      TEXT NOT NULL DEFAULT 'public'
                            CHECK (profile_visibility IN ('public', 'private')),
  who_can_dm              TEXT NOT NULL DEFAULT 'everyone'
                            CHECK (who_can_dm IN ('everyone', 'followers', 'nobody')),
  show_online_status      BOOLEAN NOT NULL DEFAULT TRUE,
  show_location           BOOLEAN NOT NULL DEFAULT TRUE,
  show_age                BOOLEAN NOT NULL DEFAULT TRUE,

  -- Messaging Preferences
  message_requests        BOOLEAN NOT NULL DEFAULT TRUE,
  auto_accept_verified    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Notification Preferences (per type toggles)
  notify_likes            BOOLEAN NOT NULL DEFAULT TRUE,
  notify_comments         BOOLEAN NOT NULL DEFAULT TRUE,
  notify_follows          BOOLEAN NOT NULL DEFAULT TRUE,
  notify_messages         BOOLEAN NOT NULL DEFAULT TRUE,
  notify_mentions         BOOLEAN NOT NULL DEFAULT TRUE,
  notify_endorsements     BOOLEAN NOT NULL DEFAULT TRUE,
  notify_shortlists       BOOLEAN NOT NULL DEFAULT TRUE,
  notify_push_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  notify_email_enabled    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Discovery Preferences (scouts/clubs)
  discovery_positions     player_position_enum[] NOT NULL DEFAULT '{}',
  discovery_min_age       SMALLINT CHECK (discovery_min_age BETWEEN 14 AND 50),
  discovery_max_age       SMALLINT CHECK (discovery_max_age BETWEEN 14 AND 50),
  discovery_countries     TEXT[] NOT NULL DEFAULT '{}',

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 3. Blocked Users ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users (blocked_id);

-- ─── 4. Muted Users ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS muted_users (
  muter_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  muted_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (muter_id, muted_id),
  CHECK (muter_id != muted_id)
);

CREATE INDEX IF NOT EXISTS idx_muted_users_muter ON muted_users (muter_id);

-- ─── 5. Bookmarks ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON bookmarks (post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks (user_id, created_at DESC);

-- ─── 6. Trending Hashtags RPC ─────────────────────────────────────────────────
-- Returns the most-used hashtags from posts created in the last N hours.

CREATE OR REPLACE FUNCTION get_trending_hashtags(
  hours_back INT DEFAULT 24,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  hashtag TEXT,
  count   BIGINT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      unnest(p.hashtags) AS hashtag,
      COUNT(*)           AS count
    FROM posts p
    WHERE p.created_at >= NOW() - (hours_back || ' hours')::INTERVAL
      AND p.visibility = 'public'
      AND array_length(p.hashtags, 1) > 0
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── 7. Auto-create user_settings row on profile creation ─────────────────────

CREATE OR REPLACE FUNCTION auto_create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_settings ON profiles;
CREATE TRIGGER trg_auto_create_settings
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_create_user_settings();
