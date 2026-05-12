-- Add idempotency table for Stripe webhook events.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON public.stripe_webhook_events (processed_at);
