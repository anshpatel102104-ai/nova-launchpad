-- Fix onboarding_responses schema and user_credit_balance view
ALTER TABLE public.onboarding_responses
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS offer TEXT,
  ADD COLUMN IF NOT EXISTS stage TEXT,
  ADD COLUMN IF NOT EXISTS biggest_blocker TEXT,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
