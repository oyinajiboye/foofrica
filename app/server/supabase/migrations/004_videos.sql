-- ============================================================
-- Migration 004: Videos
-- Cloudflare Stream-backed video storage
-- ============================================================

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE video_status_enum AS ENUM ('processing', 'ready', 'failed');
CREATE TYPE video_match_type_enum AS ENUM ('match', 'training', 'highlight');

-- ─── Videos ───────────────────────────────────────────────────────────────────

CREATE TABLE videos (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cloudflare_uid          TEXT NOT NULL UNIQUE,   -- Cloudflare Stream video UID
  cloudflare_playback_url TEXT,                   -- Populated after processing
  title                   TEXT CHECK (char_length(title) <= 200),
  description             TEXT CHECK (char_length(description) <= 2000),
  match_type              video_match_type_enum,
  position_played         player_position_enum,
  key_actions             TEXT[] NOT NULL DEFAULT '{}',  -- e.g. ['goal', 'assist', 'save']
  thumbnail_url           TEXT,
  duration_seconds        SMALLINT CHECK (duration_seconds > 0),
  status                  video_status_enum NOT NULL DEFAULT 'processing',
  views_count             INT NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_videos_uploader ON videos (uploader_id);
CREATE INDEX idx_videos_status ON videos (status);
CREATE INDEX idx_videos_created_at ON videos (created_at DESC);
CREATE INDEX idx_videos_views ON videos (views_count DESC);
CREATE INDEX idx_videos_cloudflare_uid ON videos (cloudflare_uid);
CREATE INDEX idx_videos_key_actions ON videos USING gin(key_actions);

-- Full-text search on title + description
CREATE INDEX idx_videos_search ON videos
  USING gin(to_tsvector('english',
    coalesce(title, '') || ' ' || coalesce(description, '')
  ));

-- ─── Link posts to videos ─────────────────────────────────────────────────────
-- (was deferred until videos table was created)

ALTER TABLE posts
  ADD CONSTRAINT posts_video_id_fkey
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL;

-- ─── View tracking (lightweight) ─────────────────────────────────────────────

CREATE TABLE video_views (
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  viewer_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_hash     TEXT,        -- hashed IP for anonymous view dedup
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_views_video ON video_views (video_id);
CREATE INDEX idx_video_views_viewer ON video_views (viewer_id);

-- ─── Stored Functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS VOID AS $$
  UPDATE videos SET views_count = views_count + 1 WHERE id = video_id;
$$ LANGUAGE SQL;

-- Auto-update updated_at
CREATE TRIGGER videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
