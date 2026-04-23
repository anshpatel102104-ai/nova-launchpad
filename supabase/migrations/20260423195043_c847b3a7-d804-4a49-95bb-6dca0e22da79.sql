-- Block privilege escalation on user_roles.
-- The previous "admin_roles_write" ALL policy was PERMISSIVE, which means
-- without any other INSERT policy, PostgREST evaluates the row against the
-- single permissive policy — but if no permissive INSERT policy grants
-- access, no inserts are allowed at all. However, to be defense-in-depth
-- explicit (and to block any future policy from granting non-admin
-- insert/update/delete), add a RESTRICTIVE policy that requires admin role
-- for any write.

-- First drop and recreate admin_roles_write split per command for clarity
DROP POLICY IF EXISTS admin_roles_write ON public.user_roles;

-- Only admins can INSERT roles
CREATE POLICY admin_roles_insert
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins can UPDATE roles
CREATE POLICY admin_roles_update
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins can DELETE roles
CREATE POLICY admin_roles_delete
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Defense in depth: RESTRICTIVE policy that blocks any write unless admin.
-- Restrictive policies are AND-ed with permissive ones, so this prevents
-- any future permissive policy from accidentally granting self-promotion.
CREATE POLICY no_self_role_assignment
  ON public.user_roles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
