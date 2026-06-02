-- Enable RLS and add user-isolation policies on operator_sessions and operator_memory.
-- These tables store sensitive AI chat state and long-term memory per user.
-- Also creates the admin_audit_log table that types.ts references but was never migrated.

-- ── operator_sessions ────────────────────────────────────────────────────────

ALTER TABLE operator_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_sessions_select_own"
  ON operator_sessions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "operator_sessions_insert_own"
  ON operator_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "operator_sessions_update_own"
  ON operator_sessions FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "operator_sessions_delete_own"
  ON operator_sessions FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ── operator_memory ──────────────────────────────────────────────────────────

ALTER TABLE operator_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_memory_select_own"
  ON operator_memory FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "operator_memory_insert_own"
  ON operator_memory FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "operator_memory_update_own"
  ON operator_memory FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "operator_memory_delete_own"
  ON operator_memory FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ── tool_outputs (legacy, align with operator_sessions pattern) ──────────────

ALTER TABLE tool_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tool_outputs_select_own"
  ON tool_outputs FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "tool_outputs_insert_own"
  ON tool_outputs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- ── notifications (legacy) ───────────────────────────────────────────────────

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- ── admin_audit_log ──────────────────────────────────────────────────────────
-- Tracks admin-initiated changes to platform data for compliance and debugging.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  target_table  text,
  target_id     text,
  before_data   jsonb,
  after_data    jsonb,
  ip_address    text,
  created_at    timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs; writes are service-role only
CREATE POLICY "admin_audit_log_admin_select"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Index for time-range queries
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_user_idx
  ON admin_audit_log (admin_user_id);

-- ── analytics performance indexes ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS activation_events_org_event_idx
  ON activation_events (workspace_id, event_name);

CREATE INDEX IF NOT EXISTS usage_tracking_user_period_idx
  ON usage_tracking (organization_id, period);

CREATE INDEX IF NOT EXISTS failed_jobs_status_next_retry_idx
  ON failed_jobs (status, next_retry_at)
  WHERE status IN ('pending', 'retrying');
