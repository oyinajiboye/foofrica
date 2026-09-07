-- ============================================================
-- Migration 007: Row Level Security (RLS) Policies
-- Supabase RLS — enforces data access at the database level
-- The backend uses service_role which bypasses RLS,
-- but RLS protects direct DB access from client SDKs.
-- ============================================================

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── Helper Function ──────────────────────────────────────────────────────────

-- Returns current authenticated user's ID
CREATE OR REPLACE FUNCTION auth_uid()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL STABLE;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

-- Anyone can read public profiles
CREATE POLICY "Public profiles are readable"
  ON profiles FOR SELECT
  USING (TRUE);

-- Users can only update their own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth_uid());

-- Profiles are created via service role (after auth.users creation)
-- No direct INSERT policy needed for client SDK

-- ─── Player Profiles ──────────────────────────────────────────────────────────

CREATE POLICY "Public player profiles readable"
  ON player_profiles FOR SELECT USING (TRUE);

CREATE POLICY "Players update own player profile"
  ON player_profiles FOR UPDATE
  USING (profile_id = auth_uid());

-- ─── Player Stats ─────────────────────────────────────────────────────────────

CREATE POLICY "Public player stats readable"
  ON player_stats FOR SELECT USING (TRUE);

CREATE POLICY "Players manage own stats"
  ON player_stats FOR ALL
  USING (player_id = auth_uid());

-- ─── Career History ───────────────────────────────────────────────────────────

CREATE POLICY "Public career history readable"
  ON career_history FOR SELECT USING (TRUE);

CREATE POLICY "Players manage own career"
  ON career_history FOR ALL
  USING (player_id = auth_uid());

-- ─── Club Profiles ────────────────────────────────────────────────────────────

CREATE POLICY "Public club profiles readable"
  ON club_profiles FOR SELECT USING (TRUE);

CREATE POLICY "Clubs update own profile"
  ON club_profiles FOR UPDATE
  USING (profile_id = auth_uid());

-- ─── Scout Profiles ───────────────────────────────────────────────────────────

CREATE POLICY "Public scout profiles readable"
  ON scout_profiles FOR SELECT USING (TRUE);

CREATE POLICY "Scouts update own profile"
  ON scout_profiles FOR UPDATE
  USING (profile_id = auth_uid());

-- ─── Coach Profiles ───────────────────────────────────────────────────────────

CREATE POLICY "Public coach profiles readable"
  ON coach_profiles FOR SELECT USING (TRUE);

CREATE POLICY "Coaches update own profile"
  ON coach_profiles FOR UPDATE
  USING (profile_id = auth_uid());

-- ─── Fan Profiles ─────────────────────────────────────────────────────────────

CREATE POLICY "Fans read own profile"
  ON fan_profiles FOR SELECT USING (TRUE);

CREATE POLICY "Fans update own profile"
  ON fan_profiles FOR UPDATE
  USING (profile_id = auth_uid());

-- ─── Endorsements ─────────────────────────────────────────────────────────────

CREATE POLICY "Endorsements are public"
  ON endorsements FOR SELECT USING (TRUE);

CREATE POLICY "Coaches and scouts can endorse"
  ON endorsements FOR INSERT
  WITH CHECK (
    endorser_id = auth_uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth_uid()
      AND user_type IN ('coach', 'scout')
    )
  );

CREATE POLICY "Endorsers delete own endorsements"
  ON endorsements FOR DELETE
  USING (endorser_id = auth_uid());

-- ─── Posts ────────────────────────────────────────────────────────────────────

-- Public posts visible to all; followers-only posts visible to followers
CREATE POLICY "Public posts are readable"
  ON posts FOR SELECT
  USING (
    visibility = 'public' OR
    author_id = auth_uid() OR
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id = auth_uid()
      AND following_id = author_id
    )
  );

CREATE POLICY "Authenticated users create posts"
  ON posts FOR INSERT
  WITH CHECK (author_id = auth_uid() AND auth_uid() IS NOT NULL);

CREATE POLICY "Authors delete own posts"
  ON posts FOR DELETE
  USING (author_id = auth_uid());

-- ─── Likes ────────────────────────────────────────────────────────────────────

CREATE POLICY "Likes are public"
  ON likes FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users like posts"
  ON likes FOR INSERT
  WITH CHECK (user_id = auth_uid() AND auth_uid() IS NOT NULL);

CREATE POLICY "Users unlike own likes"
  ON likes FOR DELETE
  USING (user_id = auth_uid());

-- ─── Comments ─────────────────────────────────────────────────────────────────

CREATE POLICY "Comments are public"
  ON comments FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users comment"
  ON comments FOR INSERT
  WITH CHECK (author_id = auth_uid() AND auth_uid() IS NOT NULL);

CREATE POLICY "Authors delete own comments"
  ON comments FOR DELETE
  USING (author_id = auth_uid());

-- ─── Follows ──────────────────────────────────────────────────────────────────

CREATE POLICY "Follows are public"
  ON follows FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users follow"
  ON follows FOR INSERT
  WITH CHECK (follower_id = auth_uid() AND auth_uid() IS NOT NULL);

CREATE POLICY "Users unfollow"
  ON follows FOR DELETE
  USING (follower_id = auth_uid());

-- ─── Videos ───────────────────────────────────────────────────────────────────

CREATE POLICY "Ready videos are public"
  ON videos FOR SELECT
  USING (status = 'ready' OR uploader_id = auth_uid());

CREATE POLICY "Uploaders manage own videos"
  ON videos FOR ALL
  USING (uploader_id = auth_uid());

-- ─── Conversations ────────────────────────────────────────────────────────────

CREATE POLICY "Users see own conversations"
  ON conversations FOR SELECT
  USING (auth_uid() = ANY(participant_ids));

CREATE POLICY "Users create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth_uid() = ANY(participant_ids) AND auth_uid() IS NOT NULL);

CREATE POLICY "Participants update conversations"
  ON conversations FOR UPDATE
  USING (auth_uid() = ANY(participant_ids));

-- ─── Messages ─────────────────────────────────────────────────────────────────

CREATE POLICY "Participants read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth_uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Participants send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth_uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth_uid() = ANY(participant_ids)
    )
  );

-- ─── Shortlists ───────────────────────────────────────────────────────────────

CREATE POLICY "Scouts see own shortlists"
  ON shortlists FOR SELECT
  USING (scout_id = auth_uid());

CREATE POLICY "Scouts manage own shortlists"
  ON shortlists FOR ALL
  USING (scout_id = auth_uid());

CREATE POLICY "Scouts manage shortlist players"
  ON shortlist_players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shortlists
      WHERE id = shortlist_id
      AND scout_id = auth_uid()
    )
  );

-- ─── Notifications ────────────────────────────────────────────────────────────

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth_uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (recipient_id = auth_uid());

CREATE POLICY "Users delete own notifications"
  ON notifications FOR DELETE
  USING (recipient_id = auth_uid());

-- ─── Reports ──────────────────────────────────────────────────────────────────

CREATE POLICY "Authenticated users submit reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth_uid() AND auth_uid() IS NOT NULL);

CREATE POLICY "Users see own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth_uid());
