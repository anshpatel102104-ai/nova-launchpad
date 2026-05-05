-- Fix SECURITY DEFINER views: enforce the querying user's RLS policies
-- instead of the view creator's, preventing unintended privilege escalation.
alter view public.users                    set (security_invoker = on);
alter view public.user_credit_balance      set (security_invoker = on);
alter view public.user_integrations_masked set (security_invoker = on);
alter view public.ai_operator_config       set (security_invoker = on);
