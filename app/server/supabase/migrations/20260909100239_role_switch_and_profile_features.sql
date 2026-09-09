-- One active role; historical profile details are retained without granting permissions.
CREATE TABLE public.role_switch_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 previous_role public.user_type_enum NOT NULL, next_role public.user_type_enum NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.role_switch_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.role_switch_history FROM anon, authenticated;
GRANT ALL ON public.role_switch_history TO service_role;
CREATE INDEX ON public.role_switch_history(user_id,created_at DESC);
CREATE FUNCTION public.switch_account_role(actor uuid, expected_role public.user_type_enum, next_role public.user_type_enum)
RETURNS public.profiles LANGUAGE plpgsql SET search_path='' AS $$
DECLARE p public.profiles;
BEGIN
 SELECT * INTO p FROM public.profiles WHERE id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
 IF p.user_type<>expected_role THEN RAISE EXCEPTION 'Account role changed; refresh and retry'; END IF;
 IF p.user_type=next_role THEN RETURN p; END IF;
 IF EXISTS(SELECT 1 FROM public.squad_memberships WHERE (player_id=actor OR club_id=actor) AND status IN ('pending','accepted')) THEN RAISE EXCEPTION 'End or decline squad memberships before switching roles'; END IF;
 IF EXISTS(SELECT 1 FROM public.opportunities WHERE club_id=actor AND status='open') THEN RAISE EXCEPTION 'Close open opportunities before switching roles'; END IF;
 IF EXISTS(SELECT 1 FROM public.applications a JOIN public.opportunities o ON o.id=a.opportunity_id WHERE (a.player_id=actor OR o.club_id=actor) AND a.status IN ('submitted','shortlisted','invited')) THEN RAISE EXCEPTION 'Resolve active applications before switching roles'; END IF;
 CASE next_role
 WHEN 'player' THEN INSERT INTO public.player_profiles(profile_id) VALUES(actor) ON CONFLICT DO NOTHING;
 WHEN 'club' THEN INSERT INTO public.club_profiles(profile_id,club_name) VALUES(actor,p.display_name) ON CONFLICT DO NOTHING;
 WHEN 'coach' THEN INSERT INTO public.coach_profiles(profile_id) VALUES(actor) ON CONFLICT DO NOTHING;
 WHEN 'scout' THEN INSERT INTO public.scout_profiles(profile_id) VALUES(actor) ON CONFLICT DO NOTHING;
 WHEN 'fan' THEN INSERT INTO public.fan_profiles(profile_id) VALUES(actor) ON CONFLICT DO NOTHING;
 END CASE;
 UPDATE public.verification_requests SET status='rejected',review_note='Closed because account role changed' WHERE user_id=actor AND status='pending';
 UPDATE public.profiles SET user_type=next_role,is_verified=false,verification_tier=NULL,updated_at=now() WHERE id=actor RETURNING * INTO p;
 INSERT INTO public.role_switch_history(user_id,previous_role,next_role) VALUES(actor,expected_role,next_role);
 DELETE FROM public.feed_sessions WHERE user_id=actor;
 RETURN p;
END $$;
REVOKE ALL ON FUNCTION public.switch_account_role(uuid,public.user_type_enum,public.user_type_enum) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.switch_account_role(uuid,public.user_type_enum,public.user_type_enum) TO service_role;
ALTER TABLE public.player_profiles ADD COLUMN availability text NOT NULL DEFAULT 'not_specified' CHECK(availability IN ('not_specified','open_to_trials','open_to_transfer','unavailable')),
 ADD COLUMN willing_to_relocate boolean NOT NULL DEFAULT false, ADD COLUMN preferred_location text CHECK(length(preferred_location)<=120), ADD COLUMN available_from date;
ALTER TABLE public.comments ADD COLUMN parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;
CREATE INDEX ON public.comments(parent_id);
CREATE TABLE public.comment_likes(comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(comment_id,user_id));
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.comment_likes FROM anon,authenticated;
GRANT ALL ON public.comment_likes TO service_role;
CREATE FUNCTION public.update_comment_like_count() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' THEN UPDATE public.comments SET likes_count=likes_count+1 WHERE id=NEW.comment_id; RETURN NEW;
 ELSE UPDATE public.comments SET likes_count=greatest(0,likes_count-1) WHERE id=OLD.comment_id; RETURN OLD; END IF;
END $$;
CREATE TRIGGER comment_like_count AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_comment_like_count();
REVOKE ALL ON FUNCTION public.update_comment_like_count() FROM PUBLIC,anon,authenticated;
CREATE TABLE public.conversation_preferences(conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,pinned boolean NOT NULL DEFAULT false,muted boolean NOT NULL DEFAULT false,PRIMARY KEY(conversation_id,user_id));
CREATE TABLE public.conversation_presence(conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,last_seen_at timestamptz NOT NULL DEFAULT now(),typing_until timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(conversation_id,user_id));
ALTER TABLE public.conversation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_presence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.conversation_preferences,public.conversation_presence FROM anon,authenticated;
GRANT ALL ON public.conversation_preferences,public.conversation_presence TO service_role;
