-- Add missing UNIQUE constraint on user_id so upsert onConflict: 'user_id' works
ALTER TABLE public.onboarding_responses
  ADD CONSTRAINT IF NOT EXISTS onboarding_responses_user_id_key UNIQUE (user_id);
