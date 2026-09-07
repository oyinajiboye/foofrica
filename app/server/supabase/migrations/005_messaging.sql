-- ============================================================
-- Migration 005: Messaging
-- Direct messaging — conversations + messages
-- ============================================================

-- ─── Conversations ────────────────────────────────────────────────────────────

CREATE TABLE conversations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids   UUID[] NOT NULL,           -- always 2 participants for DMs
  last_message      TEXT,
  last_message_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast participant lookups
CREATE INDEX idx_conversations_participants ON conversations USING gin(participant_ids);
CREATE INDEX idx_conversations_last_message_at ON conversations (last_message_at DESC NULLS LAST);

-- Ensure no duplicate conversations between the same two users
-- (handled in application layer by sorting participant IDs before insert)

-- ─── Messages ─────────────────────────────────────────────────────────────────

CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content           TEXT NOT NULL CHECK (char_length(content) <= 5000),
  read_at           TIMESTAMPTZ,              -- NULL = unread
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id);
CREATE INDEX idx_messages_sender ON messages (sender_id);
CREATE INDEX idx_messages_created_at ON messages (created_at ASC);
CREATE INDEX idx_messages_unread ON messages (conversation_id) WHERE read_at IS NULL;

-- ─── Shortlists (scouts) ──────────────────────────────────────────────────────
-- Placed here because they're a secondary social feature

CREATE TABLE shortlists (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scout_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK (char_length(name) <= 100),
  description  TEXT CHECK (char_length(description) <= 500),
  player_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shortlists_scout ON shortlists (scout_id);

CREATE TABLE shortlist_players (
  shortlist_id  UUID NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notes         TEXT CHECK (char_length(notes) <= 500),
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (shortlist_id, player_id)
);

CREATE INDEX idx_shortlist_players_player ON shortlist_players (player_id);

-- Auto-update shortlists.updated_at
CREATE TRIGGER shortlists_updated_at BEFORE UPDATE ON shortlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
