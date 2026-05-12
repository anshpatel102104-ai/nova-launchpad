-- Fix 403 on POST /rest/v1/organizations?select=id
--
-- Root cause: PostgREST applies the SELECT policy to RETURNING rows immediately
-- after INSERT, before the organization_members row is created. The old policy
-- only checked is_org_member(), which returns false at that point → 403.
--
-- Fix: add owner_id = auth.uid() as the primary check so org owners can always
-- see their own org row, even before they appear in organization_members.

drop policy if exists "org_member_select" on public.organizations;

create policy "org_member_select"
  on public.organizations
  for select
  to authenticated
  using (
    owner_id = auth.uid()                          -- fast path: owner always sees their org
    or public.is_org_member(id, auth.uid())        -- members invited to the org
    or public.has_role('admin'::public.app_role, auth.uid())  -- platform admins
  );

-- Also fix organization_members INSERT policy.
-- The FOR ALL policy's USING clause is used as WITH CHECK for INSERT when no
-- explicit WITH CHECK is set. is_org_owner() returns false before the first member
-- row exists. Splitting into explicit INSERT + other ops avoids the chicken-and-egg.

drop policy if exists "members_owner_write" on public.organization_members;

-- New members can insert themselves; org owners/admins can insert others.
create policy "members_insert"
  on public.organization_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id                                         -- self-join
    or public.is_org_owner(organization_id, auth.uid())         -- owner adds others
  );

-- Updates and deletes: only org owners/admins.
create policy "members_owner_update_delete"
  on public.organization_members
  for all
  to authenticated
  using (public.is_org_owner(organization_id, auth.uid()));
