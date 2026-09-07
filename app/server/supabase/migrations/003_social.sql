-- ============================================================
-- Migration 003: Social Layer
-- Posts, likes, comments, reposts, follows, reports
-- ============================================================

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE post_type_enum AS ENUM ('text', 'video', 'image', 'poll');
CREATE TYPE post_visibility_enum AS ENUM ('public', 'followers');

-- ─── Posts ────────────────────────────────────────────────────────────────────

CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT CHECK (char_length(content) <= 2000),
  post_type       post_type_enum NOT NULL DEFAULT 'text',
  video_id        UUID,                          -- FK added after videos table
  image_urls      TEXT[] NOT NULL DEFAULT '{}',
  repost_of       UUID REFERENCES posts(id) ON DELETE SET NULL,
  hashtags        TEXT[] NOT NULL DEFAULT '{}',
  mentions        UUID[] NOT NULL DEFAULT '{}',  -- array of profile IDs
  likes_count     INT NOT NULL DEFAULT 0,
  comments_count  INT NOT NULL DEFAULT 0,
  reposts_count   INT NOT NULL DEFAULT 0,
  visibility      post_visibility_enum NOT NULL DEFAULT 'public',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts (author_id);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX idx_posts_visibility ON posts (visibility);
CREATE INDEX idx_posts_type ON posts (post_type);
CREATE INDEX idx_posts_hashtags ON posts USING gin(hashtags);
CREATE INDEX idx_posts_mentions ON posts USING gin(mentions);

-- Full-text search on post content
CREATE INDEX idx_posts_content_search ON posts
  USING gin(to_tsvector('english', coalesce(content, '')));

-- ─── Likes ────────────────────────────────────────────────────────────────────

CREATE TABLE likes (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_likes_post ON likes (post_id);
CREATE INDEX idx_likes_user ON likes (user_id);

-- ─── Comments ─────────────────────────────────────────────────────────────────

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 1000),
  likes_count INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments (post_id);
CREATE INDEX idx_comments_author ON comments (author_id);
CREATE INDEX idx_comments_created_at ON comments (created_at ASC);

-- ─── Reposts ──────────────────────────────────────────────────────────────────

CREATE TABLE reposts (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_reposts_post ON reposts (post_id);

-- ─── Follows ──────────────────────────────────────────────────────────────────

CREATE TABLE follows (
  follower_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows (follower_id);
CREATE INDEX idx_follows_following ON follows (following_id);
CREATE INDEX idx_follows_created_at ON follows (created_at DESC);

-- ─── Reports (Content Moderation) ─────────────────────────────────────────────

CREATE TYPE report_status_enum AS ENUM ('pending', 'approved', 'dismissed');
CREATE TYPE report_entity_enum AS ENUM ('post', 'comment', 'profile', 'video');

CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type       report_entity_enum NOT NULL,
  entity_id         UUID NOT NULL,
  reason            TEXT NOT NULL,
  status            report_status_enum NOT NULL DEFAULT 'pending',
  reviewed_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_note     TEXT,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_created_at ON reports (created_at DESC);

-- ─── Stored Functions for atomic post counters ────────────────────────────────

CREATE OR REPLACE FUNCTION increment_likes_count(post_id UUID)
RETURNS VOID AS $$
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_likes_count(post_id UUID)
RETURNS VOID AS $$
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_comments_count(post_id UUID)
RETURNS VOID AS $$
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_comments_count(post_id UUID)
RETURNS VOID AS $$
  UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_repost_count(post_id UUID)
RETURNS VOID AS $$
  UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_repost_count(post_id UUID)
RETURNS VOID AS $$
  UPDATE posts SET reposts_count = GREATEST(0, reposts_count - 1) WHERE id = post_id;
$$ LANGUAGE SQL;

-- Auto-update posts.updated_at
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
