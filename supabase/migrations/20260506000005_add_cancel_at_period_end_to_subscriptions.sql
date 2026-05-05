-- Add cancel_at_period_end column to subscriptions (used by billing UI)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
