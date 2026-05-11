-- Add idempotency table for Stripe webhook events.
--
-- Stripe guarantees at-least-once delivery. Without this, a network retry
-- on a webhook that already succeeded would re-run syncSubscription and could
-- overwrite correct subscription state with stale event data.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id TEXT PRIMARY KEY,          -- Stripe event ID (evt_...)
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — this table is only written by service_role (edge functions).
-- Authenticated users have no reason to read or write it.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Auto-clean events older than 30 days to keep table lean.
-- Stripe's idempotency window is 24 hours; 30 days is generous.
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON public.stripe_webhook_events (processed_at);
