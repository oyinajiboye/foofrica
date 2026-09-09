-- Apply after 009. API uploads use the service role; clients cannot write objects directly.
ALTER TABLE public.user_interest_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS interest_scores_owner ON public.user_interest_scores;
CREATE POLICY interest_scores_owner ON public.user_interest_scores
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('covers', 'covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('post-images', 'post-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;
