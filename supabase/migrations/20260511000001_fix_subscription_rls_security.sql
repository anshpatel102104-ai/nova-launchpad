-- SECURITY FIX: Restrict subscription writes to service_role only.
--
-- The previous policy "sub_owner_write" allowed any authenticated org owner to
-- write directly to their subscriptions row — including changing the plan field.
-- This meant any user could self-upgrade to Scale ($299/mo) without paying by
-- calling supabase.from("subscriptions").update({ plan: "scale" }).

DROP POLICY IF EXISTS "sub_owner_write" ON public.subscriptions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
    AND policyname = 'sub_member_read'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "sub_member_read" ON public.subscriptions
      FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
    $pol$;
  END IF;
END $$;
