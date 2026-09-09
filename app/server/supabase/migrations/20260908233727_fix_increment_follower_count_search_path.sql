CREATE OR REPLACE FUNCTION public.increment_follower_count(profile_id uuid)
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $function$
  UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = profile_id;
$function$;
