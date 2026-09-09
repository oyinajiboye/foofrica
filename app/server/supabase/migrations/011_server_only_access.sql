-- Target only Footfrica application objects. Database defaults and other schemas remain unchanged.
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.unread_notification_counts SET (security_invoker = true);
-- The API checks identity and ownership. Browser roles cannot change admin flags,
-- verification status, counters or conversation membership through the Data API.
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
REVOKE ALL ON TABLE public.player_profiles FROM anon, authenticated;
GRANT ALL ON TABLE public.player_profiles TO service_role;
REVOKE ALL ON TABLE public.player_stats FROM anon, authenticated;
GRANT ALL ON TABLE public.player_stats TO service_role;
REVOKE ALL ON TABLE public.career_history FROM anon, authenticated;
GRANT ALL ON TABLE public.career_history TO service_role;
REVOKE ALL ON TABLE public.club_profiles FROM anon, authenticated;
GRANT ALL ON TABLE public.club_profiles TO service_role;
REVOKE ALL ON TABLE public.club_verifications FROM anon, authenticated;
GRANT ALL ON TABLE public.club_verifications TO service_role;
REVOKE ALL ON TABLE public.scout_profiles FROM anon, authenticated;
GRANT ALL ON TABLE public.scout_profiles TO service_role;
REVOKE ALL ON TABLE public.coach_profiles FROM anon, authenticated;
GRANT ALL ON TABLE public.coach_profiles TO service_role;
REVOKE ALL ON TABLE public.fan_profiles FROM anon, authenticated;
GRANT ALL ON TABLE public.fan_profiles TO service_role;
REVOKE ALL ON TABLE public.endorsements FROM anon, authenticated;
GRANT ALL ON TABLE public.endorsements TO service_role;
REVOKE ALL ON TABLE public.posts FROM anon, authenticated;
GRANT ALL ON TABLE public.posts TO service_role;
REVOKE ALL ON TABLE public.likes FROM anon, authenticated;
GRANT ALL ON TABLE public.likes TO service_role;
REVOKE ALL ON TABLE public.comments FROM anon, authenticated;
GRANT ALL ON TABLE public.comments TO service_role;
REVOKE ALL ON TABLE public.reposts FROM anon, authenticated;
GRANT ALL ON TABLE public.reposts TO service_role;
REVOKE ALL ON TABLE public.follows FROM anon, authenticated;
GRANT ALL ON TABLE public.follows TO service_role;
REVOKE ALL ON TABLE public.reports FROM anon, authenticated;
GRANT ALL ON TABLE public.reports TO service_role;
REVOKE ALL ON TABLE public.videos FROM anon, authenticated;
GRANT ALL ON TABLE public.videos TO service_role;
REVOKE ALL ON TABLE public.video_views FROM anon, authenticated;
GRANT ALL ON TABLE public.video_views TO service_role;
REVOKE ALL ON TABLE public.conversations FROM anon, authenticated;
GRANT ALL ON TABLE public.conversations TO service_role;
REVOKE ALL ON TABLE public.messages FROM anon, authenticated;
GRANT ALL ON TABLE public.messages TO service_role;
REVOKE ALL ON TABLE public.shortlists FROM anon, authenticated;
GRANT ALL ON TABLE public.shortlists TO service_role;
REVOKE ALL ON TABLE public.shortlist_players FROM anon, authenticated;
GRANT ALL ON TABLE public.shortlist_players TO service_role;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;
REVOKE ALL ON TABLE public.user_interest_scores FROM anon, authenticated;
GRANT ALL ON TABLE public.user_interest_scores TO service_role;
REVOKE ALL ON TABLE public.user_settings FROM anon, authenticated;
GRANT ALL ON TABLE public.user_settings TO service_role;
REVOKE ALL ON TABLE public.blocked_users FROM anon, authenticated;
GRANT ALL ON TABLE public.blocked_users TO service_role;
REVOKE ALL ON TABLE public.muted_users FROM anon, authenticated;
GRANT ALL ON TABLE public.muted_users TO service_role;
REVOKE ALL ON TABLE public.bookmarks FROM anon, authenticated;
GRANT ALL ON TABLE public.bookmarks TO service_role;
REVOKE ALL ON TABLE public.unread_notification_counts FROM anon, authenticated;
GRANT ALL ON TABLE public.unread_notification_counts TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_follower_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_follower_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_follower_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_follower_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_following_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_following_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_following_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_following_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_post_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_post_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_likes_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_likes_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_likes_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_likes_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_comments_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_comments_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_comments_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_comments_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_repost_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_repost_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_repost_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_repost_count(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_video_views(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_video_views(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.auth_uid() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_uid() TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_interest_score(UUID, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_interest_score(UUID, TEXT, NUMERIC) TO service_role;
REVOKE EXECUTE ON FUNCTION public.on_like_inserted() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.on_like_inserted() TO service_role;
REVOKE EXECUTE ON FUNCTION public.on_repost_inserted() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.on_repost_inserted() TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_trending_hashtags(INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_hashtags(INT, INT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.auto_create_user_settings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_create_user_settings() TO service_role;

-- Expanded recruitment features. This migration has not been applied.
CREATE TABLE public.opportunities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), club_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL, description text NOT NULL, country text NOT NULL, city text NOT NULL DEFAULT '',
 positions text[] NOT NULL DEFAULT '{}', min_age int NOT NULL DEFAULT 16 CHECK(min_age>=16), max_age int NOT NULL DEFAULT 50 CHECK(max_age>=min_age AND max_age<=50),
 deadline timestamptz NOT NULL, starts_at timestamptz, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opportunities_discovery ON public.opportunities(status,deadline,country);
CREATE TABLE public.applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
 player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, cover_note text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','shortlisted','invited','unsuccessful','withdrawn')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(opportunity_id,player_id)
);
CREATE INDEX applications_player ON public.applications(player_id,created_at DESC);
CREATE TABLE public.opportunity_alerts (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT true, country text NOT NULL DEFAULT '', position text NOT NULL DEFAULT ''
);
CREATE TABLE public.verification_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 organization text NOT NULL, evidence_url text NOT NULL, notes text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 review_note text, reviewed_by uuid REFERENCES public.profiles(id), reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX verification_one_pending ON public.verification_requests(user_id) WHERE status='pending';
CREATE TABLE public.squad_memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), club_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','ended')),
 updated_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(club_id<>player_id)
);
CREATE UNIQUE INDEX squad_one_active_club ON public.squad_memberships(player_id) WHERE status='accepted';
CREATE UNIQUE INDEX squad_one_pending_pair ON public.squad_memberships(club_id,player_id) WHERE status IN ('pending','accepted');
CREATE TABLE public.profile_views (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, view_day date NOT NULL DEFAULT current_date,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(profile_id,viewer_id,view_day)
);
CREATE INDEX profile_views_analytics ON public.profile_views(profile_id,created_at);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
-- These records are served by the existing API; no direct browser policies.
GRANT ALL ON public.opportunities,public.applications,public.opportunity_alerts,public.verification_requests,public.squad_memberships,public.profile_views TO service_role;

CREATE FUNCTION public.review_verification_request(request_id uuid, reviewer_id uuid, decision text, note text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE target uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=reviewer_id AND is_admin) THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 SELECT user_id INTO target FROM verification_requests WHERE id=request_id AND status='pending' FOR UPDATE;
 IF target IS NULL THEN RAISE EXCEPTION 'Request already reviewed'; END IF;
 UPDATE verification_requests SET status=decision,review_note=note,reviewed_by=reviewer_id,reviewed_at=now() WHERE id=request_id;
 IF decision='approved' THEN UPDATE profiles SET is_verified=true WHERE id=target; END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_verification_request(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_verification_request(uuid,uuid,text,text) TO service_role;
CREATE FUNCTION public.respond_squad_membership(membership_id uuid, actor_id uuid, decision text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE m squad_memberships;
BEGIN
 SELECT * INTO m FROM squad_memberships WHERE id=membership_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Membership not found'; END IF;
 IF decision IN ('accepted','declined') THEN
  IF m.player_id<>actor_id OR m.status<>'pending' THEN RAISE EXCEPTION 'Only invited player may respond'; END IF;
 ELSIF decision='ended' THEN
  IF actor_id NOT IN (m.player_id,m.club_id) OR m.status NOT IN ('pending','accepted') THEN RAISE EXCEPTION 'Unauthorized membership change'; END IF;
 ELSE RAISE EXCEPTION 'Invalid decision'; END IF;
 UPDATE squad_memberships SET status=decision,updated_at=now(),updated_by=actor_id WHERE id=membership_id;
 IF decision='accepted' THEN UPDATE player_profiles SET current_club_id=m.club_id WHERE profile_id=m.player_id;
 ELSIF decision='ended' THEN UPDATE player_profiles SET current_club_id=NULL WHERE profile_id=m.player_id AND current_club_id=m.club_id; END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.respond_squad_membership(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.respond_squad_membership(uuid,uuid,text) TO service_role;
CREATE TABLE public.polls (
 post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
 options text[] NOT NULL CHECK(cardinality(options) BETWEEN 2 AND 4), closes_at timestamptz NOT NULL
);
CREATE TABLE public.poll_votes (
 post_id uuid NOT NULL REFERENCES public.polls(post_id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 option_index int NOT NULL CHECK(option_index BETWEEN 0 AND 3), created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(post_id,user_id)
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.polls,public.poll_votes TO service_role;
CREATE FUNCTION public.vote_in_poll(target_post uuid,voter uuid,choice int) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE p polls;
BEGIN
 SELECT * INTO p FROM polls WHERE post_id=target_post FOR SHARE;
 IF NOT FOUND OR p.closes_at<=now() THEN RAISE EXCEPTION 'Poll is closed'; END IF;
 IF choice<0 OR choice>=cardinality(p.options) THEN RAISE EXCEPTION 'Invalid poll option'; END IF;
 INSERT INTO poll_votes(post_id,user_id,option_index) VALUES(target_post,voter,choice) ON CONFLICT(post_id,user_id) DO UPDATE SET option_index=excluded.option_index;
END $$;
REVOKE EXECUTE ON FUNCTION public.vote_in_poll(uuid,uuid,int) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vote_in_poll(uuid,uuid,int) TO service_role;

CREATE TABLE public.message_attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
 storage_path text NOT NULL UNIQUE,file_name text NOT NULL,mime_type text NOT NULL,file_size int NOT NULL CHECK(file_size BETWEEN 1 AND 5242880)
);
CREATE INDEX message_attachments_message ON public.message_attachments(message_id);
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.opportunities,public.applications,public.opportunity_alerts,public.verification_requests,public.squad_memberships,public.profile_views,public.polls,public.poll_votes,public.message_attachments FROM anon,authenticated;
GRANT ALL ON public.message_attachments TO service_role;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('message-attachments','message-attachments',false,5242880,ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO NOTHING;

ALTER TYPE public.notification_type_enum ADD VALUE IF NOT EXISTS 'opportunity';
ALTER TYPE public.notification_type_enum ADD VALUE IF NOT EXISTS 'application';
ALTER TYPE public.notification_type_enum ADD VALUE IF NOT EXISTS 'squad';
-- Functions run after migration commit; each notification is part of its business transaction.
CREATE FUNCTION public.notify_recruitment_event() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF TG_TABLE_NAME='opportunities' THEN
  INSERT INTO notifications(recipient_id,actor_id,type,entity_type,entity_id)
  SELECT a.user_id,NEW.club_id,'opportunity','opportunity',NEW.id FROM opportunity_alerts a
  WHERE a.enabled AND a.user_id<>NEW.club_id
   AND (a.country='' OR lower(a.country)=lower(NEW.country))
   AND (a.position='' OR cardinality(NEW.positions)=0 OR a.position=ANY(NEW.positions))
   AND NOT EXISTS(SELECT 1 FROM blocked_users b WHERE (b.blocker_id=a.user_id AND b.blocked_id=NEW.club_id) OR (b.blocker_id=NEW.club_id AND b.blocked_id=a.user_id));
 ELSIF TG_TABLE_NAME='applications' THEN
  IF TG_OP='INSERT' THEN
   INSERT INTO notifications(recipient_id,actor_id,type,entity_type,entity_id) SELECT club_id,NEW.player_id,'application','application',NEW.id FROM opportunities WHERE id=NEW.opportunity_id;
  ELSIF NEW.status<>OLD.status THEN
   INSERT INTO notifications(recipient_id,actor_id,type,entity_type,entity_id)
   SELECT CASE WHEN NEW.status='withdrawn' THEN club_id ELSE NEW.player_id END,
    CASE WHEN NEW.status='withdrawn' THEN NEW.player_id ELSE club_id END,'application','application',NEW.id FROM opportunities WHERE id=NEW.opportunity_id;
  END IF;
 ELSIF TG_TABLE_NAME='squad_memberships' THEN
  IF TG_OP='INSERT' THEN INSERT INTO notifications(recipient_id,actor_id,type,entity_type,entity_id) VALUES(NEW.player_id,NEW.club_id,'squad','squad',NEW.id);
  ELSIF NEW.status<>OLD.status THEN INSERT INTO notifications(recipient_id,actor_id,type,entity_type,entity_id) VALUES(CASE WHEN NEW.updated_by=NEW.club_id THEN NEW.player_id ELSE NEW.club_id END,coalesce(NEW.updated_by,NEW.player_id),'squad','squad',NEW.id); END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_recruitment_event() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.notify_recruitment_event() TO service_role;
CREATE TRIGGER opportunity_notifications AFTER INSERT ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.notify_recruitment_event();
CREATE TRIGGER application_notifications AFTER INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.notify_recruitment_event();
CREATE TRIGGER squad_notifications AFTER INSERT OR UPDATE ON public.squad_memberships FOR EACH ROW EXECUTE FUNCTION public.notify_recruitment_event();

-- Lock the opportunity while accepting an application so closure cannot race submission.
CREATE FUNCTION public.submit_application(opportunity uuid, applicant uuid, note text) RETURNS public.applications LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o opportunities; result applications; age_years int;
BEGIN
 SELECT * INTO o FROM opportunities WHERE id=opportunity FOR UPDATE;
 IF NOT FOUND OR o.status<>'open' OR o.deadline<=now() THEN RAISE EXCEPTION 'Opportunity is closed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=applicant AND user_type='player') THEN RAISE EXCEPTION 'Player required'; END IF;
 IF EXISTS(SELECT 1 FROM blocked_users WHERE (blocker_id=applicant AND blocked_id=o.club_id) OR (blocker_id=o.club_id AND blocked_id=applicant)) THEN RAISE EXCEPTION 'Opportunity unavailable'; END IF;
 SELECT date_part('year',age(date_of_birth))::int INTO age_years FROM player_profiles WHERE profile_id=applicant;
 IF age_years IS NULL OR age_years<o.min_age OR age_years>o.max_age THEN RAISE EXCEPTION 'Age requirements not met'; END IF;
 IF length(note)>2000 THEN RAISE EXCEPTION 'Application note too long'; END IF;
 INSERT INTO applications(opportunity_id,player_id,cover_note) VALUES(opportunity,applicant,note) RETURNING * INTO result;
 RETURN result;
END $$;
REVOKE EXECUTE ON FUNCTION public.submit_application(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_application(uuid,uuid,text) TO service_role;

CREATE INDEX poll_votes_option ON public.poll_votes(post_id,option_index);
CREATE INDEX opportunities_club ON public.opportunities(club_id,created_at DESC);
CREATE INDEX squad_memberships_club ON public.squad_memberships(club_id,created_at DESC);
CREATE INDEX squad_memberships_player ON public.squad_memberships(player_id,created_at DESC);
CREATE INDEX verification_requests_user ON public.verification_requests(user_id,created_at DESC);

CREATE FUNCTION public.profile_analytics(owner_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT jsonb_build_object(
  'profile_views_30d',(SELECT count(*) FROM profile_views WHERE profile_id=owner_id AND created_at>=now()-interval '30 days'),
  'likes',coalesce((SELECT sum(likes_count) FROM posts WHERE author_id=owner_id),0),
  'comments',coalesce((SELECT sum(comments_count) FROM posts WHERE author_id=owner_id),0),
  'reposts',coalesce((SELECT sum(reposts_count) FROM posts WHERE author_id=owner_id),0),
  'applications',(SELECT count(*) FROM applications a JOIN opportunities o ON o.id=a.opportunity_id WHERE a.player_id=owner_id OR o.club_id=owner_id)
 );
$$;
REVOKE EXECUTE ON FUNCTION public.profile_analytics(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.profile_analytics(uuid) TO service_role;

-- Recommendation state is server-only and bounded; no public activity histories.
CREATE TABLE public.feed_feedback (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('impression','interested','dismissed','profile_open')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id,kind)
);
CREATE INDEX feed_feedback_recent ON public.feed_feedback(user_id,created_at DESC);
CREATE TABLE public.feed_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 post_ids uuid[] NOT NULL CHECK(cardinality(post_ids)<=600), reasons jsonb NOT NULL DEFAULT '{}', algorithm_version text NOT NULL,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feed_sessions_expiry ON public.feed_sessions(user_id,expires_at);
ALTER TABLE public.feed_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feed_feedback,public.feed_sessions FROM anon,authenticated;
GRANT ALL ON public.feed_feedback,public.feed_sessions TO service_role;
-- Current-state reactions replace additive scores; toggling cannot inflate interests.
DROP TRIGGER IF EXISTS trg_like_interest_boost ON public.likes;
DROP TRIGGER IF EXISTS trg_repost_interest_boost ON public.reposts;
UPDATE public.posts SET tags=ARRAY(SELECT DISTINCT lower(trim(t)) FROM unnest(tags) t WHERE trim(t)<>'');

CREATE INDEX feed_sessions_global_expiry ON public.feed_sessions(expires_at);
