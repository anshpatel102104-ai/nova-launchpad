-- 1) usage_tracking: allow org members to insert/update usage rows
CREATE POLICY "usage_org_insert" ON public.usage_tracking
  FOR INSERT
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "usage_org_update" ON public.usage_tracking
  FOR UPDATE
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- 2) organization_members: prevent self-join and self-promotion
DROP POLICY IF EXISTS "members_owner_write" ON public.organization_members;

-- Only org owners/admins can insert or update members
CREATE POLICY "members_owner_write" ON public.organization_members
  FOR INSERT
  WITH CHECK (public.is_org_owner(organization_id, auth.uid()));

CREATE POLICY "members_owner_update" ON public.organization_members
  FOR UPDATE
  USING (public.is_org_owner(organization_id, auth.uid()))
  WITH CHECK (public.is_org_owner(organization_id, auth.uid()));

CREATE POLICY "members_owner_delete" ON public.organization_members
  FOR DELETE
  USING (public.is_org_owner(organization_id, auth.uid()));

-- Members can leave the org (delete their own row)
CREATE POLICY "members_self_leave" ON public.organization_members
  FOR DELETE
  USING (auth.uid() = user_id);