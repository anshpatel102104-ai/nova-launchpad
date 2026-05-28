// Cross-tool handoff config — purely client-side query-string prefill.
// No backend behavior changes; downstream tool reads ?context= / ?title= from URL.

export const HANDOFFS: Record<string, { to: string; toolKey: string; label: string }[]> = {
  "idea-validator": [
    { to: "/app/launchpad/pitch-generator", toolKey: "pitch-generator", label: "Generate pitch" },
    { to: "/app/launchpad/gtm-strategy", toolKey: "gtm-strategy", label: "Build GTM" },
    { to: "/app/launchpad/funding-score", toolKey: "funding-score", label: "Score funding" },
  ],
  "pitch-generator": [
    {
      to: "/app/launchpad/investor-emails",
      toolKey: "investor-emails",
      label: "Draft investor emails",
    },
    {
      to: "/app/launchpad/business-plan",
      toolKey: "business-plan",
      label: "Generate business plan",
    },
  ],
  "gtm-strategy": [
    {
      to: "/app/launchpad/first-10-customers",
      toolKey: "first-10-customers",
      label: "First 10 customers",
    },
    { to: "/app/launchpad/landing-page", toolKey: "landing-page", label: "Generate landing page" },
  ],
  offer: [
    { to: "/app/launchpad/landing-page", toolKey: "landing-page", label: "Generate landing page" },
    { to: "/app/launchpad/pitch-generator", toolKey: "pitch-generator", label: "Generate pitch" },
  ],
  "first-10-customers": [
    { to: "/app/nova/leads", toolKey: "leads", label: "Capture leads in Nova" },
    { to: "/app/nova/crm", toolKey: "crm", label: "Open pipeline" },
  ],
  "landing-page": [{ to: "/app/nova/leads", toolKey: "leads", label: "Wire to Lead Capture" }],
  "ops-plan": [
    { to: "/app/nova/workflows", toolKey: "workflows", label: "Configure automations" },
    { to: "/app/nova/clients", toolKey: "clients", label: "Open client onboarding" },
  ],
  followup: [{ to: "/app/nova/workflows", toolKey: "workflows", label: "Run as automation" }],
  "website-audit": [
    { to: "/app/launchpad/landing-page", toolKey: "landing-page", label: "Rebuild landing page" },
  ],
  "kill-my-idea": [
    {
      to: "/app/launchpad/idea-validator",
      toolKey: "idea-validator",
      label: "Re-validate refined idea",
    },
  ],
  "funding-score": [
    {
      to: "/app/launchpad/investor-emails",
      toolKey: "investor-emails",
      label: "Draft investor emails",
    },
  ],
  "business-plan": [
    { to: "/app/launchpad/gtm-strategy", toolKey: "gtm-strategy", label: "Build GTM" },
  ],
  "investor-emails": [
    { to: "/app/launchpad/pitch-generator", toolKey: "pitch-generator", label: "Sharpen pitch" },
  ],
  "idea-vs-idea": [
    { to: "/app/launchpad/idea-validator", toolKey: "idea-validator", label: "Validate winner" },
  ],
  blog: [
    { to: "/app/launchpad/landing-page", toolKey: "landing-page", label: "Generate landing page" },
    { to: "/app/launchpad/social", toolKey: "social", label: "Create social posts" },
  ],
  social: [
    { to: "/app/launchpad/blog", toolKey: "blog", label: "Write full blog post" },
    { to: "/app/launchpad/ad-creative", toolKey: "ad-creative", label: "Create ad creative" },
  ],
  "email-sequence": [
    { to: "/app/launchpad/sales-script", toolKey: "sales-script", label: "Generate sales script" },
  ],
  "sales-script": [
    {
      to: "/app/launchpad/email-sequence",
      toolKey: "email-sequence",
      label: "Build email sequence",
    },
  ],
  "ad-creative": [
    { to: "/app/launchpad/vsl", toolKey: "vsl", label: "Write VSL script" },
    { to: "/app/launchpad/landing-page", toolKey: "landing-page", label: "Generate landing page" },
  ],
  vsl: [
    {
      to: "/app/launchpad/ad-creative",
      toolKey: "ad-creative",
      label: "Write ad creative",
    },
  ],
  "cold-email": [
    { to: "/app/launchpad/icp", toolKey: "icp", label: "Refine ICP" },
    { to: "/app/launchpad/sales-script", toolKey: "sales-script", label: "Write sales script" },
  ],
  "niche-validator": [
    { to: "/app/launchpad/icp", toolKey: "icp", label: "Build ICP" },
    {
      to: "/app/launchpad/idea-validator",
      toolKey: "idea-validator",
      label: "Validate business idea",
    },
  ],
  icp: [
    { to: "/app/launchpad/cold-email", toolKey: "cold-email", label: "Write cold emails" },
    { to: "/app/launchpad/gtm-strategy", toolKey: "gtm-strategy", label: "Build GTM" },
  ],
  "pitch-deck": [
    {
      to: "/app/launchpad/investor-emails",
      toolKey: "investor-emails",
      label: "Draft investor emails",
    },
    { to: "/app/launchpad/funding-score", toolKey: "funding-score", label: "Score funding" },
  ],
  "lead-magnet": [
    { to: "/app/launchpad/email-sequence", toolKey: "email-sequence", label: "Build email funnel" },
    { to: "/app/launchpad/landing-page", toolKey: "landing-page", label: "Generate landing page" },
  ],
  automation: [{ to: "/app/nova/workflows", toolKey: "workflows", label: "Configure in Nova" }],
  "client-report": [{ to: "/app/nova/clients", toolKey: "clients", label: "View client list" }],
};
