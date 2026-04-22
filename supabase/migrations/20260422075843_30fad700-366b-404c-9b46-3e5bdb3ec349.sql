
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.business_stage AS ENUM ('Idea', 'Validate', 'Launch', 'Operate', 'Scale');
CREATE TYPE public.plan_tier AS ENUM ('starter', 'launch', 'operate', 'scale');
CREATE TYPE public.tool_run_status AS ENUM ('running', 'succeeded', 'failed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- ============ ORGANIZATIONS (businesses) ============
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_type TEXT,
  niche TEXT,
  location TEXT,
  target_customer TEXT,
  offer TEXT,
  goal TEXT,
  stage business_stage NOT NULL DEFAULT 'Idea',
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============ ORGANIZATION_MEMBERS ============
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org_id AND user_id = _user_id) $$;

CREATE OR REPLACE FUNCTION public.is_org_owner(_org_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org_id AND user_id = _user_id AND role IN ('owner','admin')) $$;

-- ============ PLAN_ENTITLEMENTS ============
CREATE TABLE public.plan_entitlements (
  plan plan_tier PRIMARY KEY,
  price_usd INTEGER NOT NULL,
  monthly_generation_limit INTEGER, -- NULL = unlimited
  allowed_tools TEXT[] NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan plan_tier NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============ ONBOARDING_RESPONSES ============
CREATE TABLE public.onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_key)
);
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- ============ TOOL_RUNS (ai_generations) ============
CREATE TABLE public.tool_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_key TEXT NOT NULL,
  status tool_run_status NOT NULL DEFAULT 'running',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.tool_runs (organization_id, created_at DESC);

-- ============ GENERATED_ASSETS (saved_assets) ============
CREATE TABLE public.generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_run_id UUID REFERENCES public.tool_runs(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  kind TEXT,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  storage_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.generated_assets (organization_id, created_at DESC);

-- ============ WEBSITE_ANALYSES ============
CREATE TABLE public.website_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  snapshot_path TEXT,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  opportunities JSONB NOT NULL DEFAULT '[]'::jsonb,
  ux_notes TEXT,
  seo_notes TEXT,
  suggested_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.website_analyses ENABLE ROW LEVEL SECURITY;

-- ============ AUTOMATION_SETTINGS ============
CREATE TABLE public.automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, key)
);
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

-- ============ USAGE_TRACKING ============
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  tool_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period, tool_key)
);
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_runs_updated BEFORE UPDATE ON public.tool_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_autom_updated BEFORE UPDATE ON public.automation_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "own_roles_read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_roles_write" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- organizations
CREATE POLICY "org_member_select" ON public.organizations FOR SELECT USING (public.is_org_member(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "org_owner_insert" ON public.organizations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "org_owner_update" ON public.organizations FOR UPDATE USING (public.is_org_owner(id, auth.uid()));
CREATE POLICY "org_owner_delete" ON public.organizations FOR DELETE USING (auth.uid() = owner_id);

-- organization_members
CREATE POLICY "members_self_read" ON public.organization_members FOR SELECT USING (auth.uid() = user_id OR public.is_org_owner(organization_id, auth.uid()));
CREATE POLICY "members_owner_write" ON public.organization_members FOR ALL USING (public.is_org_owner(organization_id, auth.uid()) OR auth.uid() = user_id);

-- plan_entitlements (read-only for everyone authenticated)
CREATE POLICY "plans_read" ON public.plan_entitlements FOR SELECT TO authenticated USING (true);

-- subscriptions
CREATE POLICY "sub_member_read" ON public.subscriptions FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "sub_owner_write" ON public.subscriptions FOR ALL USING (public.is_org_owner(organization_id, auth.uid()));

-- onboarding_responses
CREATE POLICY "onboard_own" ON public.onboarding_responses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tool_runs
CREATE POLICY "runs_org_read" ON public.tool_runs FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "runs_org_insert" ON public.tool_runs FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "runs_own_update" ON public.tool_runs FOR UPDATE USING (auth.uid() = user_id);

-- generated_assets
CREATE POLICY "assets_org_read" ON public.generated_assets FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "assets_org_insert" ON public.generated_assets FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "assets_org_update" ON public.generated_assets FOR UPDATE USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "assets_org_delete" ON public.generated_assets FOR DELETE USING (public.is_org_member(organization_id, auth.uid()));

-- website_analyses
CREATE POLICY "wa_org_read" ON public.website_analyses FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "wa_org_write" ON public.website_analyses FOR ALL USING (public.is_org_member(organization_id, auth.uid()));

-- automation_settings
CREATE POLICY "auto_org_read" ON public.automation_settings FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "auto_org_write" ON public.automation_settings FOR ALL USING (public.is_org_owner(organization_id, auth.uid()));

-- usage_tracking
CREATE POLICY "usage_org_read" ON public.usage_tracking FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('uploads', 'uploads', false),
  ('generated-assets', 'generated-assets', false),
  ('website-snapshots', 'website-snapshots', false),
  ('brand-assets', 'brand-assets', true),
  ('exports', 'exports', false);

-- Storage policies: path = {organization_id}/{user_id}/{filename}
CREATE POLICY "private_buckets_org_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('uploads','generated-assets','website-snapshots','exports')
    AND public.is_org_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "private_buckets_org_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('uploads','generated-assets','website-snapshots','exports')
    AND public.is_org_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "private_buckets_org_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('uploads','generated-assets','website-snapshots','exports')
    AND public.is_org_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "private_buckets_org_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('uploads','generated-assets','website-snapshots','exports')
    AND public.is_org_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "brand_assets_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

CREATE POLICY "brand_assets_org_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets'
    AND public.is_org_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "brand_assets_org_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets'
    AND public.is_org_member((storage.foldername(name))[1]::uuid, auth.uid()));

-- ============ SEED PLAN ENTITLEMENTS ============
INSERT INTO public.plan_entitlements (plan, price_usd, monthly_generation_limit, allowed_tools, features) VALUES
  ('starter', 0, 5, ARRAY['validate-idea','generate-pitch'],
   '{"label":"Starter","tagline":"Validate your idea","highlights":["Idea Validator","Pitch Generator","5 generations/mo"]}'::jsonb),
  ('launch', 49, 50, ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer'],
   '{"label":"Launch","tagline":"Build and launch","highlights":["All Launchpad tools","50 generations/mo","Landing page export"]}'::jsonb),
  ('operate', 149, 200, ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer','generate-ops-plan','generate-followup-sequence'],
   '{"label":"Operate","tagline":"Run on autopilot","highlights":["Everything in Launch","Full Nova OS","200 generations/mo","Automations"]}'::jsonb),
  ('scale', 299, NULL, ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer','generate-ops-plan','generate-followup-sequence','analyze-website'],
   '{"label":"Scale","tagline":"Advanced and custom","highlights":["Unlimited generations","Website analysis","Multi-seat","Priority support"]}'::jsonb);
