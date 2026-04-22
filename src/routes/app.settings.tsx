import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { organizationQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const { user, profile, currentOrgId, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [orgName, setOrgName] = useState("");
  const [niche, setNiche] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [target, setTarget] = useState("");
  const [offer, setOffer] = useState("");

  useEffect(() => { if (profile?.full_name) setFullName(profile.full_name); }, [profile]);
  useEffect(() => {
    if (orgQ.data) {
      setOrgName(orgQ.data.name ?? "");
      setNiche(orgQ.data.niche ?? "");
      setBusinessType(orgQ.data.business_type ?? "");
      setLocation(orgQ.data.location ?? "");
      setTarget(orgQ.data.target_customer ?? "");
      setOffer(orgQ.data.offer ?? "");
    }
  }, [orgQ.data]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    if (error) toast.error(error.message); else { toast.success("Profile saved"); refreshProfile(); }
  };

  const saveOrg = async () => {
    if (!currentOrgId) return;
    const { error } = await supabase.from("organizations").update({
      name: orgName, niche, business_type: businessType, location, target_customer: target, offer,
    }).eq("id", currentOrgId);
    if (error) toast.error(error.message); else { toast.success("Company saved"); qc.invalidateQueries({ queryKey: ["organization", currentOrgId] }); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="Settings" description="Profile and company." />

      <Section title="Profile">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="Email"><Input value={user?.email ?? ""} disabled /></Field>
        </div>
        <div className="mt-3"><Button size="sm" onClick={saveProfile}>Save profile</Button></div>
      </Section>

      <Section title="Company">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} /></Field>
          <Field label="Business type"><Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} /></Field>
          <Field label="Niche"><Input value={niche} onChange={(e) => setNiche(e.target.value)} /></Field>
          <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
          <Field label="Target customer"><Input value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
          <Field label="Offer"><Input value={offer} onChange={(e) => setOffer(e.target.value)} /></Field>
        </div>
        <div className="mt-3"><Button size="sm" onClick={saveOrg}>Save company</Button></div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card p-5"><div className="mb-4 text-sm font-semibold">{title}</div>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>{children}</label>;
}
