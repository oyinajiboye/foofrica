-- ============================================================
-- Migration 008: Interests & Post Tags
-- Adds interest-based personalisation to the feed algorithm
-- ============================================================

-- ─── 1. Add interests to base profiles (all user types) ───────────────────────
--
-- Stores the topics a user selected during onboarding (and can update later).
-- e.g. ['Grassroots football', 'Nigerian football', 'Transfer news']

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS interests TEXT[] NOT NULL DEFAULT '{}';

-- GIN index for fast array-overlap queries (&&)
CREATE INDEX IF NOT EXISTS idx_profiles_interests
  ON profiles USING gin(interests);

-- ─── 2. Add tags to posts (content categorisation) ────────────────────────────
--
-- Authors (or the system) can tag posts with relevant topic labels.
-- Feed algorithm will match post.tags against user.interests for scoring.
-- e.g. ['Grassroots football', 'Player highlights']

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- GIN index — allows fast: WHERE tags && ARRAY['Grassroots football']
CREATE INDEX IF NOT EXISTS idx_posts_tags
  ON posts USING gin(tags);

-- ─── 3. Add user_type to profiles onboarding path ────────────────────────────
-- user_type already exists as NOT NULL so this is a no-op guard
-- (keeping here for documentation purposes)

-- ─── 4. User interest_scores — behavioural signal table (Phase 2 readiness) ──
--
-- Tracks implicit interest strength per user per tag.
-- Updated when a user likes (+1), comments (+3), or reposts (+5) a tagged post.
-- Not used in Phase 1 scoring yet, but the table is ready so we can start
-- accumulating data from day one.

CREATE TABLE IF NOT EXISTS user_interest_scores (
  user_id     UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag         TEXT    NOT NULL,
  score       NUMERIC NOT NULL DEFAULT 0 CHECK (score >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_user_interest_scores_user
  ON user_interest_scores (user_id);

CREATE INDEX IF NOT EXISTS idx_user_interest_scores_tag
  ON user_interest_scores (tag);

-- ─── 5. Function to update interest scores on engagement ──────────────────────

CREATE OR REPLACE FUNCTION update_interest_score(
  p_user_id UUID,
  p_tag     TEXT,
  p_delta   NUMERIC
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_interest_scores (user_id, tag, score, updated_at)
    VALUES (p_user_id, p_tag, GREATEST(0, p_delta), NOW())
  ON CONFLICT (user_id, tag)
    DO UPDATE SET
      score      = GREATEST(0, user_interest_scores.score + p_delta),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ─── 6. Trigger: when a like is inserted, boost scores for post tags ──────────

CREATE OR REPLACE FUNCTION on_like_inserted()
RETURNS TRIGGER AS $$
DECLARE
  post_tag TEXT;
BEGIN
  FOR post_tag IN
    SELECT unnest(tags) FROM posts WHERE id = NEW.post_id
  LOOP
    PERFORM update_interest_score(NEW.user_id, post_tag, 1);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_like_interest_boost ON likes;
CREATE TRIGGER trg_like_interest_boost
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION on_like_inserted();

-- ─── 7. Trigger: when a repost is inserted, boost scores more strongly ────────

CREATE OR REPLACE FUNCTION on_repost_inserted()
RETURNS TRIGGER AS $$
DECLARE
  post_tag TEXT;
BEGIN
  FOR post_tag IN
    SELECT unnest(tags) FROM posts WHERE id = NEW.post_id
  LOOP
    PERFORM update_interest_score(NEW.user_id, post_tag, 5);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_repost_interest_boost ON reposts;
CREATE TRIGGER trg_repost_interest_boost
  AFTER INSERT ON reposts
  FOR EACH ROW EXECUTE FUNCTION on_repost_inserted();
