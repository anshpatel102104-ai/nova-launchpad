-- Admin read access across operational tables
CREATE POLICY "admin_read_all_subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_read_all_tool_runs" ON public.tool_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_read_all_leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_read_all_usage" ON public.usage_tracking
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_read_all_org_members" ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));