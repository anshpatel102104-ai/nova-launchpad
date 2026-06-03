import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { generatedAssetsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { blockIfGuest } from "@/lib/guest";
import { toast } from "sonner";
import { Star, Plus, CalendarDays, Mail } from "lucide-react";

export const Route = createFileRoute("/app/nova/reputation")({ component: Reputation });

const PLATFORMS = ["Google", "Trustpilot", "G2", "Yelp", "Capterra"] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_COLORS: Record<Platform, string> = {
  Google: "bg-blue-500/10 text-blue-400",
  Trustpilot: "bg-emerald-500/10 text-emerald-400",
  G2: "bg-orange-500/10 text-orange-400",
  Yelp: "bg-red-500/10 text-red-400",
  Capterra: "bg-purple-500/10 text-purple-400",
};

const DEFAULT_MESSAGE =
  "Hi {name}, I'd love to hear your feedback! Could you take 2 minutes to leave us a review?";

function Reputation() {
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    ...generatedAssetsQuery(currentOrgId ?? "", "review-request"),
    enabled: !!currentOrgId,
  });
  const items = q.data ?? [];

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientName, setClientName] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [email, setEmail] = useState("");

  const distinctPlatforms = new Set(
    items.map((a) => (a.metadata as Record<string, unknown>)?.platform as string).filter(Boolean),
  ).size;

  const resetForm = () => {
    setClientName("");
    setPlatform("");
    setMessage(DEFAULT_MESSAGE);
    setEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockIfGuest("Sign up to send review requests.")) return;
    if (!platform) {
      toast.error("Please select a platform.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("generated_assets").insert({
        organization_id: currentOrgId,
        user_id: user?.id,
        category: "marketing",
        kind: "review-request",
        title: `Review Request · ${clientName}`,
        content: {},
        metadata: {
          client_name: clientName,
          platform,
          message,
          email: email || null,
          status: "sent",
          sent_at: new Date().toISOString(),
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Review request recorded.");
        qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId, "review-request"] });
        setOpen(false);
        resetForm();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Reputation"
        description="Send review requests, collect social proof, build trust."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Send review request
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <KPI label="Requests Sent" value={items.length.toString()} accent />
        <KPI label="Platforms" value={distinctPlatforms.toString()} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No review requests yet"
          description="Send a personalised review request to happy clients to build your reputation."
          action={
            <Button onClick={() => setOpen(true)}>Send first request</Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((asset) => {
            const meta = (asset.metadata ?? {}) as Record<string, unknown>;
            const name = meta.client_name as string | undefined;
            const plat = meta.platform as Platform | undefined;
            const addr = meta.email as string | undefined;
            const sentAt = meta.sent_at as string | undefined;
            const colorClass =
              plat && PLATFORM_COLORS[plat] ? PLATFORM_COLORS[plat] : "bg-muted text-muted-foreground";

            return (
              <div
                key={asset.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-soft"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Star className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[14px] font-semibold tracking-tight">
                      {name ?? asset.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                      {plat && (
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
                            colorClass
                          }
                        >
                          {plat}
                        </span>
                      )}
                      {addr && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
                          <Mail className="h-2.5 w-2.5" />
                          {addr}
                        </span>
                      )}
                      {sentAt && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
                          <CalendarDays className="h-2.5 w-2.5" />
                          {new Date(sentAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Send Review Request</SheetTitle>
            <SheetDescription>
              Send a personalised review request to a happy client.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="client_name">Client name *</Label>
              <Input
                id="client_name"
                placeholder="Jane Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={platform}
                onValueChange={(v) => setPlatform(v as Platform)}
                required
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Client email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <SheetFooter className="pt-2">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Sending…" : "Send request"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-1 font-display text-xl font-semibold tracking-tight " + (accent ? "text-accent" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}
