-- ============================================================
-- Migration 006: Notifications
-- In-app notification records + push token storage
-- ============================================================

-- ─── Enum ─────────────────────────────────────────────────────────────────────

CREATE TYPE notification_type_enum AS ENUM (
  'like',
  'comment',
  'follow',
  'mention',
  'message',
  'endorsement',
  'verification',
  'shortlist'
);

-- ─── Notifications ────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          notification_type_enum NOT NULL,
  entity_type   TEXT,                   -- e.g. 'post', 'comment', 'video'
  entity_id     UUID,                   -- ID of the entity (polymorphic)
  read_at       TIMESTAMPTZ,            -- NULL = unread
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core query indexes
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (recipient_id) WHERE read_at IS NULL;

-- Prevent duplicate notifications (same actor-recipient-type-entity within 1 minute)
-- Handled at application level to avoid complexity

-- ─── Notification Aggregation View ───────────────────────────────────────────
-- Useful for badge counts

CREATE VIEW unread_notification_counts AS
  SELECT
    recipient_id,
    COUNT(*) AS unread_count
  FROM notifications
  WHERE read_at IS NULL
  GROUP BY recipient_id;
