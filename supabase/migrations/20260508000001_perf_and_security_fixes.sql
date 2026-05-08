-- =============================================================================
-- Performance & security fixes
--
-- 1. Replace bare auth.uid() with (select auth.uid()) in all hot RLS policies
--    → PostgreSQL evaluates the function once per statement, not per row.
-- 2. Add missing indexes on two unindexed FK columns.
-- 3. Collapse four redundant SELECT/INSERT/UPDATE policies on ai_operator_configs
--    into a single ALL policy.
-- 4. Drop two provably-unused indexes.
--
-- Live function signatures confirmed:
--   is_org_member(_org_id uuid, _user_id uuid)
--   is_org_admin(_org_id uuid, _user_id uuid)   ← replaces the old is_org_owner
--   has_role(_role app_role, _user_id uuid)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: read own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;

CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "orgs: members read"   ON public.organizations;
DROP POLICY IF EXISTS "orgs: admins update"  ON public.organizations;
DROP POLICY IF EXISTS "orgs: admins delete"  ON public.organizations;
DROP POLICY IF EXISTS "orgs: creator insert" ON public.organizations;

CREATE POLICY "orgs: members read"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id, (select auth.uid())));

CREATE POLICY "orgs: creator insert"
  ON public.organizations FOR INSERT
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "orgs: admins update"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(id, (select auth.uid())));

CREATE POLICY "orgs: admins delete"
  ON public.organizations FOR DELETE
  USING (public.is_org_admin(id, (select auth.uid())));

-- ─────────────────────────────────────────────────────────────────────────────
-- organization_members
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members: read own org"      ON public.organization_members;
DROP POLICY IF EXISTS "members: self insert owner" ON public.organization_members;
DROP POLICY IF EXISTS "members: admins manage"     ON public.organization_members;
DROP POLICY IF EXISTS "members: admins delete"     ON public.organization_members;

CREATE POLICY "members: read own org"
  ON public.organization_members FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR public.is_org_member(organization_id, (select auth.uid()))
  );

CREATE POLICY "members: self insert owner"
  ON public.organization_members FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "members: admins manage"
  ON public.organization_members FOR UPDATE
  USING (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "members: admins delete"
  ON public.organization_members FOR DELETE
  USING (public.is_org_admin(organization_id, (select auth.uid())));

-- ─────────────────────────────────────────────────────────────────────────────
-- subscriptions
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "subs: members read"  ON public.subscriptions;
DROP POLICY IF EXISTS "subs: admins write"  ON public.subscriptions;
DROP POLICY IF EXISTS "subs: admins update" ON public.subscriptions;

CREATE POLICY "subs: members read"
  ON public.subscriptions FOR SELECT
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "subs: admins write"
  ON public.subscriptions FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id, (select auth.uid())));

CREATE POLICY "subs: admins update"
  ON public.subscriptions FOR UPDATE
  USING (public.is_org_admin(organization_id, (select auth.uid())));

-- ─────────────────────────────────────────────────────────────────────────────
-- tool_runs
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "runs: members read"   ON public.tool_runs;
DROP POLICY IF EXISTS "runs: members insert" ON public.tool_runs;
DROP POLICY IF EXISTS "runs: members update" ON public.tool_runs;
DROP POLICY IF EXISTS "runs: members delete" ON public.tool_runs;

CREATE POLICY "runs: members read"
  ON public.tool_runs FOR SELECT
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "runs: members insert"
  ON public.tool_runs FOR INSERT
  WITH CHECK (
    user_id = (select auth.uid())
    AND public.is_org_member(organization_id, (select auth.uid()))
  );

CREATE POLICY "runs: members update"
  ON public.tool_runs FOR UPDATE
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "runs: members delete"
  ON public.tool_runs FOR DELETE
  USING (public.is_org_member(organization_id, (select auth.uid())));

-- ─────────────────────────────────────────────────────────────────────────────
-- generated_assets
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "assets: members read"   ON public.generated_assets;
DROP POLICY IF EXISTS "assets: members insert" ON public.generated_assets;
DROP POLICY IF EXISTS "assets: members update" ON public.generated_assets;
DROP POLICY IF EXISTS "assets: members delete" ON public.generated_assets;

CREATE POLICY "assets: members read"
  ON public.generated_assets FOR SELECT
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "assets: members insert"
  ON public.generated_assets FOR INSERT
  WITH CHECK (
    user_id = (select auth.uid())
    AND public.is_org_member(organization_id, (select auth.uid()))
  );

CREATE POLICY "assets: members update"
  ON public.generated_assets FOR UPDATE
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "assets: members delete"
  ON public.generated_assets FOR DELETE
  USING (public.is_org_member(organization_id, (select auth.uid())));

-- ─────────────────────────────────────────────────────────────────────────────
-- leads
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "leads_org_member" ON public.leads;

CREATE POLICY "leads_org_member"
  ON public.leads FOR ALL
  USING (public.is_org_member(organization_id, (select auth.uid())))
  WITH CHECK (public.is_org_member(organization_id, (select auth.uid())));

-- ─────────────────────────────────────────────────────────────────────────────
-- onboarding_responses
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "onboarding: members read"   ON public.onboarding_responses;
DROP POLICY IF EXISTS "onboarding: members write"  ON public.onboarding_responses;
DROP POLICY IF EXISTS "onboarding: members update" ON public.onboarding_responses;

CREATE POLICY "onboarding: members read"
  ON public.onboarding_responses FOR SELECT
  USING (public.is_org_member(organization_id, (select auth.uid())));

CREATE POLICY "onboarding: members write"
  ON public.onboarding_responses FOR INSERT
  WITH CHECK (
    user_id = (select auth.uid())
    AND public.is_org_member(organization_id, (select auth.uid()))
  );

CREATE POLICY "onboarding: members update"
  ON public.onboarding_responses FOR UPDATE
  USING (public.is_org_member(organization_id, (select auth.uid())));

-- ─────────────────────────────────────────────────────────────────────────────
-- user_integrations
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "integrations_own" ON public.user_integrations;

CREATE POLICY "integrations_own"
  ON public.user_integrations FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ai_operator_configs — collapse 4 overlapping policies into 1
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ai_operator_configs_owner_select" ON public.ai_operator_configs;
DROP POLICY IF EXISTS "ai_operator_configs_owner_modify" ON public.ai_operator_configs;
DROP POLICY IF EXISTS "own_rows_read"                    ON public.ai_operator_configs;
DROP POLICY IF EXISTS "own_rows_insert"                  ON public.ai_operator_configs;
DROP POLICY IF EXISTS "own_rows_update"                  ON public.ai_operator_configs;

CREATE POLICY "ai_operator_configs_owner_all"
  ON public.ai_operator_configs FOR ALL TO authenticated
  USING     ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Missing FK indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_generated_assets_user_id
  ON public.generated_assets (user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user_id
  ON public.onboarding_responses (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Drop provably unused indexes (zero scans since project creation)
-- ─────────────────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_organizations_created_by;
DROP INDEX IF EXISTS public.idx_org_members_org;
