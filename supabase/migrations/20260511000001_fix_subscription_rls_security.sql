-- SECURITY FIX: Restrict subscription writes to service_role only.
--
-- The previous policy "sub_owner_write" allowed any authenticated org owner to
-- write directly to their subscriptions row — including changing the plan field.
-- This meant any user could self-upgrade to Scale ($299/mo) without paying by
-- calling supabase.from("subscriptions").update({ plan: "scale" }).
--
-- Plan and status must only be changed by:
--   1. The payments-webhook edge function (runs with service_role)
--   2. The manage-subscription edge function (runs with service_role)
-- Both already use SUPABASE_SERVICE_ROLE_KEY and bypass RLS.

-- Drop the permissive owner write policy
DROP POLICY IF EXISTS "sub_owner_write" ON public.subscriptions;

-- Retain read access for org members (needed by the billing page UI)
-- The SELECT policy "sub_member_read" already exists and is correct.

-- Org owners may only update non-billing fields (e.g. nothing on this table
-- that a user controls directly — all writes come via edge functions).
-- No INSERT or UPDATE policy for authenticated role means the table is
-- effectively read-only from the client. Edge functions with service_role
-- still have full write access.

-- Verify the read policy still exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
    AND policyname = 'sub_member_read'
  ) THEN
    -- Recreate read policy if somehow missing
    EXECUTE $pol$
      CREATE POLICY "sub_member_read" ON public.subscriptions
      FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
    $pol$;
  END IF;
END $$;
