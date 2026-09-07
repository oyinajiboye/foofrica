-- ============================================================
-- Migration 002: Profiles & User Types
-- Core profile tables for all 5 user types
-- ============================================================

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE user_type_enum AS ENUM ('player', 'club', 'scout', 'coach', 'fan');
CREATE TYPE verification_tier_enum AS ENUM ('professional', 'organization', 'player', 'contributor');
CREATE TYPE dominant_foot_enum AS ENUM ('left', 'right', 'both');
CREATE TYPE player_position_enum AS ENUM (
  'GK', 'CB', 'LB', 'RB',
  'CDM', 'CM', 'CAM',
  'LW', 'RW', 'ST', 'CF'
);
CREATE TYPE endorsement_skill_enum AS ENUM (
  'pace', 'acceleration', 'ball_control', 'first_touch',
  'shooting', 'finishing', 'passing', 'crossing',
  'dribbling', 'defending', 'tackling', 'heading',
  'positioning', 'vision', 'work_rate', 'leadership',
  'communication', 'goalkeeping'
);

-- ─── Base Profiles ─────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            TEXT NOT NULL UNIQUE,
  display_name        TEXT NOT NULL,
  bio                 TEXT,
  avatar_url          TEXT,
  cover_url           TEXT,
  user_type           user_type_enum NOT NULL,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin            BOOLEAN NOT NULL DEFAULT FALSE,
  verification_tier   verification_tier_enum,
  follower_count      INT NOT NULL DEFAULT 0,
  following_count     INT NOT NULL DEFAULT 0,
  post_count          INT NOT NULL DEFAULT 0,
  fcm_token           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,30}$')
);

-- Indexes for common lookups
CREATE INDEX idx_profiles_username ON profiles (username);
CREATE INDEX idx_profiles_user_type ON profiles (user_type);
CREATE INDEX idx_profiles_is_verified ON profiles (is_verified);
CREATE INDEX idx_profiles_created_at ON profiles (created_at DESC);

-- Full-text search on display_name + username
CREATE INDEX idx_profiles_search ON profiles
  USING gin(to_tsvector('english', display_name || ' ' || username));

-- Trigram index for LIKE searches
CREATE INDEX idx_profiles_display_name_trgm ON profiles
  USING gin(display_name gin_trgm_ops);

-- ─── Player Profiles ──────────────────────────────────────────────────────────

CREATE TABLE player_profiles (
  profile_id          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  full_name           TEXT,
  date_of_birth       DATE,
  nationality         TEXT,
  height_cm           SMALLINT CHECK (height_cm BETWEEN 100 AND 250),
  weight_kg           SMALLINT CHECK (weight_kg BETWEEN 30 AND 200),
  dominant_foot       dominant_foot_enum,
  primary_position    player_position_enum,
  secondary_positions player_position_enum[] NOT NULL DEFAULT '{}',
  playing_style_tags  TEXT[] NOT NULL DEFAULT '{}',
  current_club_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  jersey_number       SMALLINT CHECK (jersey_number BETWEEN 1 AND 99),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_profiles_primary_position ON player_profiles (primary_position);
CREATE INDEX idx_player_profiles_nationality ON player_profiles (nationality);
CREATE INDEX idx_player_profiles_current_club ON player_profiles (current_club_id);
CREATE INDEX idx_player_profiles_height ON player_profiles (height_cm);

-- ─── Player Stats (per season) ────────────────────────────────────────────────

CREATE TABLE player_stats (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season        TEXT NOT NULL,               -- e.g. '2024/25'
  club_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  club_name     TEXT NOT NULL DEFAULT '',
  appearances   SMALLINT NOT NULL DEFAULT 0,
  goals         SMALLINT NOT NULL DEFAULT 0,
  assists       SMALLINT NOT NULL DEFAULT 0,
  clean_sheets  SMALLINT NOT NULL DEFAULT 0,
  yellow_cards  SMALLINT NOT NULL DEFAULT 0,
  red_cards     SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (player_id, season)
);

CREATE INDEX idx_player_stats_player ON player_stats (player_id);

-- ─── Career History ───────────────────────────────────────────────────────────

CREATE TABLE career_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_name   TEXT NOT NULL,
  club_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  role        TEXT,                          -- e.g. 'Forward', 'Youth Player'
  is_current  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_career_history_player ON career_history (player_id);
CREATE INDEX idx_career_history_start_date ON career_history (start_date DESC);

-- ─── Club Profiles ────────────────────────────────────────────────────────────

CREATE TABLE club_profiles (
  profile_id    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  club_name     TEXT NOT NULL,
  founded_year  SMALLINT CHECK (founded_year BETWEEN 1800 AND 2100),
  country       TEXT,
  city          TEXT,
  league        TEXT,
  logo_url      TEXT,
  banner_url    TEXT,
  website_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_club_profiles_country ON club_profiles (country);
CREATE INDEX idx_club_profiles_league ON club_profiles (league);

-- ─── Club Verifications ───────────────────────────────────────────────────────

CREATE TABLE club_verifications (
  club_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (club_id, player_id)
);

-- ─── Scout Profiles ───────────────────────────────────────────────────────────

CREATE TABLE scout_profiles (
  profile_id       UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  organization     TEXT,
  license_number   TEXT,
  specialization   TEXT[] NOT NULL DEFAULT '{}',  -- e.g. ['youth', 'attacking']
  regions_covered  TEXT[] NOT NULL DEFAULT '{}',  -- e.g. ['Nigeria', 'Ghana']
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Coach Profiles ───────────────────────────────────────────────────────────

CREATE TABLE coach_profiles (
  profile_id      UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_level   TEXT,                            -- e.g. 'UEFA B', 'CAF A'
  specialization  TEXT[] NOT NULL DEFAULT '{}',    -- e.g. ['youth', 'goalkeeping']
  current_club_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Fan Profiles ─────────────────────────────────────────────────────────────

CREATE TABLE fan_profiles (
  profile_id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  favorite_club_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  favorite_club_name   TEXT,
  football_interests   TEXT[] NOT NULL DEFAULT '{}', -- e.g. ['tactics', 'grassroots']
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Endorsements ─────────────────────────────────────────────────────────────

CREATE TABLE endorsements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endorser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill       endorsement_skill_enum NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (endorser_id, player_id, skill)
);

CREATE INDEX idx_endorsements_player ON endorsements (player_id);
CREATE INDEX idx_endorsements_endorser ON endorsements (endorser_id);

-- ─── Stored Functions for atomic counter updates ──────────────────────────────

CREATE OR REPLACE FUNCTION increment_follower_count(profile_id UUID)
RETURNS VOID AS $$
  UPDATE profiles SET follower_count = follower_count + 1 WHERE id = profile_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_follower_count(profile_id UUID)
RETURNS VOID AS $$
  UPDATE profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = profile_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_following_count(profile_id UUID)
RETURNS VOID AS $$
  UPDATE profiles SET following_count = following_count + 1 WHERE id = profile_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_following_count(profile_id UUID)
RETURNS VOID AS $$
  UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = profile_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_post_count(profile_id UUID)
RETURNS VOID AS $$
  UPDATE profiles SET post_count = post_count + 1 WHERE id = profile_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_post_count(profile_id UUID)
RETURNS VOID AS $$
  UPDATE profiles SET post_count = GREATEST(0, post_count - 1) WHERE id = profile_id;
$$ LANGUAGE SQL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER player_profiles_updated_at BEFORE UPDATE ON player_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER club_profiles_updated_at BEFORE UPDATE ON club_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scout_profiles_updated_at BEFORE UPDATE ON scout_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER coach_profiles_updated_at BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
