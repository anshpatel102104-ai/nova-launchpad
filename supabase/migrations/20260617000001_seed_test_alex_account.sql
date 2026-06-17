-- ════════════════════════════════════════════════════════════════════
-- Seed: TEST (ALEX) account — platform demo / "scale" filler data
-- ════════════════════════════════════════════════════════════════════
-- Purpose
--   Provision a single, clearly-tagged test founder account ("Alex Rivera
--   (TEST)") with realistic workspaces, subscriptions, CRM pipeline, and
--   tool-run activity. The platform admin (ansh.patel102104@gmail.com) sees
--   all of this in the Admin Hub via the existing platform-wide RLS policies
--   (profiles / organizations / subscriptions / tool_runs / leads "admins
--   view all"), so the dashboards render populated "at scale" for testing
--   and demos without standing up a real signup.
--
-- Safety
--   * Idempotent — fixed UUIDs + guards; safe to replay.
--   * Self-contained — does not depend on the admin user existing, so it is a
--     clean seed on preview branches too.
--   * Schema-portable — only references columns that exist on both the
--     squash-defined schema and the live (drifted) project: it omits
--     leads.user_id, organizations.website_url, and tool_runs.surface
--     (each is nullable / has a default on whichever side it exists), and it
--     upserts the subscription so it wins over the starter row that the
--     handle_new_organization() trigger auto-creates.
--   * Everything is tagged "(TEST)" and uses the reserved .test domain so it
--     is trivial to identify and remove (removal SQL at the bottom of file).
--
-- Test login (rotate before relying on it for anything sensitive)
--   email:    alex.tester@novaops.test
--   password: NovaTest!2026
-- ════════════════════════════════════════════════════════════════════

do $$
declare
  v_alex     uuid := 'a1ec0000-0000-4000-8000-000000000001';
  v_email    text := 'alex.tester@novaops.test';
  v_name     text := 'Alex Rivera (TEST)';
  v_password text := 'NovaTest!2026';

  v_org1 uuid := 'a1ec0000-0000-4000-8000-0000000000a1'; -- Northwind Studio  · launch
  v_org2 uuid := 'a1ec0000-0000-4000-8000-0000000000a2'; -- Atlas Analytics   · operate
  v_org3 uuid := 'a1ec0000-0000-4000-8000-0000000000a3'; -- Vertex Labs       · scale
begin
  -- ── 1. Auth user (the on_auth_user_created trigger creates profile + role) ──
  if not exists (select 1 from auth.users where id = v_alex) then
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_alex, 'authenticated', 'authenticated', v_email,
      crypt(v_password, gen_salt('bf')), now() - interval '45 days',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_name),
      now() - interval '45 days', now(),
      '', '', '', ''
    );
  end if;

  -- Email identity (required for email/password sign-in)
  if not exists (
    select 1 from auth.identities where user_id = v_alex and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      created_at, updated_at, last_sign_in_at
    ) values (
      v_alex::text, v_alex,
      jsonb_build_object(
        'sub', v_alex::text, 'email', v_email,
        'email_verified', true, 'phone_verified', false
      ),
      'email', now() - interval '45 days', now(), now() - interval '2 days'
    );
  end if;

  -- Mark the profile onboarded so it counts as an activated founder.
  update public.profiles
     set full_name = v_name, email = v_email, onboarding_complete = true
   where id = v_alex;

  -- ── 2. Workspaces (three founder stages → populated plan distribution) ──────
  insert into public.organizations
    (id, owner_id, name, business_type, niche, location, target_customer, offer, goal, stage, created_at)
  values
    (v_org1, v_alex, 'Northwind Studio (TEST)', 'Agency', 'Brand & web design',
     'Austin, TX', 'Bootstrapped DTC brands', 'Done-for-you brand sprints',
     'Land 5 retainer clients', 'Validate', now() - interval '44 days'),
    (v_org2, v_alex, 'Atlas Analytics (TEST)', 'SaaS', 'Product analytics',
     'Remote', 'Seed-stage PLG startups', 'Self-serve analytics platform',
     'Hit $10k MRR', 'Launch', now() - interval '30 days'),
    (v_org3, v_alex, 'Vertex Labs (TEST)', 'SaaS', 'AI workflow automation',
     'San Francisco, CA', 'Mid-market ops teams', 'AI automation platform',
     'Scale to $1M ARR', 'Scale', now() - interval '20 days')
  on conflict (id) do nothing;

  -- Alex owns all three workspaces.
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org1, v_alex, 'owner'), (v_org2, v_alex, 'owner'), (v_org3, v_alex, 'owner')
  on conflict (organization_id, user_id) do nothing;

  -- ── 3. Subscriptions (launch $49 / operate $149 / scale $299 → MRR $497) ───
  -- Upsert: handle_new_organization() auto-inserts a starter/trialing row on
  -- org create, so override it with the intended paid plan.
  insert into public.subscriptions
    (organization_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, created_at)
  values
    (v_org1, 'launch',  'active', 'cus_TEST_alex_northwind', 'sub_TEST_alex_northwind', now() + interval '18 days', now() - interval '44 days'),
    (v_org2, 'operate', 'active', 'cus_TEST_alex_atlas',     'sub_TEST_alex_atlas',     now() + interval '12 days', now() - interval '30 days'),
    (v_org3, 'scale',   'active', 'cus_TEST_alex_vertex',    'sub_TEST_alex_vertex',    now() + interval '25 days', now() - interval '20 days')
  on conflict (organization_id) do update set
    plan                   = excluded.plan,
    status                 = excluded.status,
    stripe_customer_id     = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    current_period_end     = excluded.current_period_end;

  -- ── 4. CRM pipeline (only seed once per workspace) ─────────────────────────
  if not exists (select 1 from public.leads where organization_id = v_org1) then
    insert into public.leads
      (organization_id, name, email, phone, company, stage, source, notes, value, probability, score, priority, created_at)
    values
      (v_org1, 'Maya Chen',     'maya@brightside.test',  '+1 512 555 0101', 'Brightside Goods',  'Won',       'Referral',      'Closed brand sprint retainer.',        9000,  100, 92, 'high',   now() - interval '40 days'),
      (v_org1, 'Devon Wright',  'devon@looplabs.test',   '+1 512 555 0102', 'Loop Labs',         'Proposal',  'Cold email',    'Sent SOW, awaiting signature.',        7500,  70,  78, 'high',   now() - interval '9 days'),
      (v_org1, 'Priya Nair',    'priya@verdant.test',    '+1 512 555 0103', 'Verdant Co',        'Qualified', 'Inbound',       'Budget confirmed, scheduling call.',   6000,  45,  66, 'medium', now() - interval '6 days'),
      (v_org1, 'Liam Foster',   'liam@casacraft.test',   '+1 512 555 0104', 'CasaCraft',         'Contacted', 'LinkedIn',      'Replied, exploring fit.',              4000,  25,  41, 'medium', now() - interval '3 days'),
      (v_org1, 'Sara Imani',    'sara@dunesurf.test',    null,              'Dune Surf',         'New',       'Referral',      'Warm intro from Maya.',                3500,  15,  30, 'low',    now() - interval '1 day'),
      (v_org1, 'Tomas Reyes',   'tomas@finlux.test',     null,              'Finlux',            'Lost',      'Cold email',    'Went with an in-house designer.',      5000,  0,   12, 'low',    now() - interval '22 days');

    insert into public.leads
      (organization_id, name, email, phone, company, stage, source, notes, value, probability, score, priority, created_at)
    values
      (v_org2, 'Nina Park',     'nina@cohortly.test',    '+1 415 555 0201', 'Cohortly',          'Won',       'Product Hunt',  'Annual plan, paid upfront.',           24000, 100, 95, 'high',   now() - interval '26 days'),
      (v_org2, 'Owen Blake',    'owen@signalq.test',     '+1 415 555 0202', 'SignalQ',           'Proposal',  'Inbound',       'Pricing approved, legal review.',      18000, 75,  84, 'high',   now() - interval '8 days'),
      (v_org2, 'Hana Suzuki',   'hana@plotline.test',    null,              'Plotline',          'Qualified', 'Webinar',       'Strong PLG fit, trial active.',        12000, 50,  71, 'high',   now() - interval '5 days'),
      (v_org2, 'Marcus Lee',    'marcus@stackpad.test',  '+1 415 555 0204', 'StackPad',          'Contacted', 'Cold email',    'Booked discovery call.',               9000,  30,  52, 'medium', now() - interval '4 days'),
      (v_org2, 'Ava Romano',    'ava@brewmetric.test',   null,              'BrewMetric',        'New',       'Inbound',       'Signed up for trial today.',           7000,  15,  34, 'low',    now() - interval '12 hours');

    insert into public.leads
      (organization_id, name, email, phone, company, stage, source, notes, value, probability, score, priority, created_at)
    values
      (v_org3, 'Grace Okafor',  'grace@meridianops.test','+1 628 555 0301', 'Meridian Ops',      'Won',       'Outbound',      'Enterprise pilot converted.',          60000, 100, 98, 'high',   now() - interval '18 days'),
      (v_org3, 'Ethan Wu',      'ethan@harborflow.test', '+1 628 555 0302', 'HarborFlow',        'Won',       'Referral',      'Multi-seat annual contract.',          42000, 100, 96, 'high',   now() - interval '11 days'),
      (v_org3, 'Lena Vogel',    'lena@northgate.test',   '+1 628 555 0303', 'Northgate',         'Proposal',  'Conference',    'MSA in procurement.',                  55000, 80,  90, 'high',   now() - interval '7 days'),
      (v_org3, 'Raj Malhotra',  'raj@quantatech.test',   null,              'Quanta Tech',       'Qualified', 'Inbound',       'Security review in progress.',         38000, 55,  77, 'high',   now() - interval '5 days'),
      (v_org3, 'Chloe Dupont',  'chloe@axiomlabs.test',  '+1 628 555 0305', 'Axiom Labs',        'Contacted', 'Outbound',      'Champion identified.',                 30000, 35,  60, 'medium', now() - interval '2 days'),
      (v_org3, 'Ben Carter',    'ben@trailhead.test',    null,              'Trailhead',         'New',       'Webinar',       'Requested a demo.',                    25000, 20,  44, 'medium', now() - interval '6 hours');
  end if;

  -- ── 5. Tool-run activity (spread across the last 14 days for the charts) ───
  if not exists (select 1 from public.tool_runs where organization_id = v_org1) then
    insert into public.tool_runs (organization_id, user_id, tool_key, status, input, output, created_at)
    values
      (v_org1, v_alex, 'validate-idea',               'succeeded', '{}', '{"ok":true}', now() - interval '13 days'),
      (v_org1, v_alex, 'generate-offer',              'succeeded', '{}', '{"ok":true}', now() - interval '12 days'),
      (v_org1, v_alex, 'analyze-website',             'succeeded', '{}', '{"ok":true}', now() - interval '10 days'),
      (v_org1, v_alex, 'competitor-scanner',          'succeeded', '{}', '{"ok":true}', now() - interval '8 days'),
      (v_org1, v_alex, 'generate-pitch',              'failed',    '{}', null,          now() - interval '6 days'),
      (v_org1, v_alex, 'generate-followup-sequence',  'succeeded', '{}', '{"ok":true}', now() - interval '4 days'),
      (v_org1, v_alex, 'land-first-customers',        'succeeded', '{}', '{"ok":true}', now() - interval '2 days'),
      (v_org1, v_alex, 'generate-offer',              'succeeded', '{}', '{"ok":true}', now() - interval '20 hours'),

      (v_org2, v_alex, 'create-pitch',                'succeeded', '{}', '{"ok":true}', now() - interval '13 days'),
      (v_org2, v_alex, 'generate-pitch',              'succeeded', '{}', '{"ok":true}', now() - interval '11 days'),
      (v_org2, v_alex, 'competitor-scanner',          'succeeded', '{}', '{"ok":true}', now() - interval '9 days'),
      (v_org2, v_alex, 'analyze-website',             'succeeded', '{}', '{"ok":true}', now() - interval '7 days'),
      (v_org2, v_alex, 'automate-followup',           'succeeded', '{}', '{"ok":true}', now() - interval '5 days'),
      (v_org2, v_alex, 'generate-followup-sequence',  'running',   '{}', null,          now() - interval '3 days'),
      (v_org2, v_alex, 'build-growth-system',         'succeeded', '{}', '{"ok":true}', now() - interval '1 day'),
      (v_org2, v_alex, 'generate-offer',              'succeeded', '{}', '{"ok":true}', now() - interval '8 hours'),

      (v_org3, v_alex, 'build-playbook',              'succeeded', '{}', '{"ok":true}', now() - interval '12 days'),
      (v_org3, v_alex, 'optimize-growth',             'succeeded', '{}', '{"ok":true}', now() - interval '10 days'),
      (v_org3, v_alex, 'connect-systems',             'succeeded', '{}', '{"ok":true}', now() - interval '8 days'),
      (v_org3, v_alex, 'generate-pitch',              'succeeded', '{}', '{"ok":true}', now() - interval '6 days'),
      (v_org3, v_alex, 'competitor-scanner',          'succeeded', '{}', '{"ok":true}', now() - interval '4 days'),
      (v_org3, v_alex, 'automate-process',            'succeeded', '{}', '{"ok":true}', now() - interval '3 days'),
      (v_org3, v_alex, 'generate-followup-sequence',  'succeeded', '{}', '{"ok":true}', now() - interval '2 days'),
      (v_org3, v_alex, 'analyze-website',             'succeeded', '{}', '{"ok":true}', now() - interval '1 day'),
      (v_org3, v_alex, 'build-custom-workflow',       'succeeded', '{}', '{"ok":true}', now() - interval '5 hours');
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- To remove this test account and all its data later, run:
--
--   delete from auth.users where id = 'a1ec0000-0000-4000-8000-000000000001';
--
-- (organizations / members / subscriptions / leads / tool_runs / profile /
--  user_roles all cascade from the auth.users + organizations foreign keys.)
-- ════════════════════════════════════════════════════════════════════
