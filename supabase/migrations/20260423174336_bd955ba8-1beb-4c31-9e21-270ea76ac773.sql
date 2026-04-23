-- Allow the org's owner_id to insert their own membership row (signup bootstrap).
-- This does NOT let arbitrary users self-join — only the user listed as owner_id on the org.
CREATE POLICY "members_owner_bootstrap_insert" ON public.organization_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.owner_id = auth.uid()
    )
  );