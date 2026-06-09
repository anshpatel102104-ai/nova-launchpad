import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  approvalRequestsQuery,
  decideApprovalRequest,
  type ApprovalStatus,
  type ApprovalRequest,
  type ApprovalRequestType,
} from "@/lib/queries";
import { blockIfGuest } from "@/lib/guest";
import { CheckCircle2, XCircle, Clock, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/approvals")({
  component: ApprovalsPage,
});

const TABS: { key: ApprovalStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const TYPE_LABELS: Record<ApprovalRequestType, string> = {
  content_publish: "Content publish",
  automation_change: "Automation change",
  budget_spend: "Budget spend",
  client_communication: "Client communication",
};

function ApprovalsPage() {
  const { currentOrgId, user } = useAuth();
  const orgId = currentOrgId ?? "";
  const qc = useQueryClient();

  const [tab, setTab] = useState<ApprovalStatus | "all">("pending");
  const [deciding, setDeciding] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const approvalsQ = useQuery({
    ...approvalRequestsQuery(orgId),
    enabled: !!orgId,
  });
  const all = approvalsQ.data ?? [];
  const visible = tab === "all" ? all : all.filter((a) => a.status === tab);
  const pendingCount = all.filter((a) => a.status === "pending").length;

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDecide = async (req: ApprovalRequest, decision: "approved" | "rejected") => {
    if (blockIfGuest("Sign up to decide on approval requests.")) return;
    if (deciding) return;
    setDeciding(req.id);
    try {
      await decideApprovalRequest(req.id, decision, user?.id ?? "");
      await qc.invalidateQueries({ queryKey: ["approval_requests", orgId] });
      toast.success(decision === "approved" ? "Request approved" : "Request rejected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update request");
    } finally {
      setDeciding(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(125,211,252,0.04) 100%)",
          border: "1px solid rgba(167,139,250,0.18)",
        }}
      >
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-widest mb-1"
            style={{ color: "rgba(167,139,250,0.7)" }}
          >
            <ClipboardList className="h-3 w-3" />
            Approvals
          </div>
          <h1
            className="font-display text-[22px] font-bold leading-tight"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Approval queue
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            {pendingCount > 0
              ? `${pendingCount} request${pendingCount !== 1 ? "s" : ""} waiting for review`
              : "No pending requests — you're all caught up"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition",
              tab === t.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            )}
          >
            {t.label}
            {t.key === "pending" && pendingCount > 0 && (
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: "rgba(167,139,250,0.2)", color: "#A78BFA" }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {approvalsQ.isLoading ? (
        <div className="text-[13px] text-muted-foreground py-8 text-center">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="nova-card rounded-xl p-10 text-center">
          <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-[13px] text-muted-foreground">
            No {tab === "all" ? "" : tab + " "}requests yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((req) => {
            const isExpanded = expanded.has(req.id);
            const isDeciding = deciding === req.id;
            return (
              <div key={req.id} className="nova-card rounded-xl overflow-hidden">
                {/* Row header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => toggleExpanded(req.id)}
                >
                  <StatusIcon status={req.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium truncate">{req.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] font-medium rounded-md px-1.5 py-0.5"
                        style={{
                          background: "rgba(125,211,252,0.1)",
                          color: "#7DD3FC",
                        }}
                      >
                        {TYPE_LABELS[req.request_type]}
                      </span>
                      <span className="text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(req.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Pending actions (inline for quick access) */}
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => void handleDecide(req, "approved")}
                        disabled={!!deciding}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-50"
                        style={{
                          background: "rgba(52,211,153,0.1)",
                          color: "#34D399",
                          border: "1px solid rgba(52,211,153,0.2)",
                        }}
                      >
                        {isDeciding ? "…" : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => void handleDecide(req, "rejected")}
                        disabled={!!deciding}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-50"
                        style={{
                          background: "rgba(248,113,113,0.08)",
                          color: "#F87171",
                          border: "1px solid rgba(248,113,113,0.2)",
                        }}
                      >
                        {isDeciding ? "…" : <XCircle className="h-3.5 w-3.5" />}
                        Reject
                      </button>
                    </div>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4 pt-0 space-y-3 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {req.description && (
                      <p
                        className="text-[12.5px] leading-relaxed pt-3"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {req.description}
                      </p>
                    )}
                    {req.decision_note && (
                      <div
                        className="rounded-lg px-3 py-2 text-[12px]"
                        style={{
                          background:
                            req.status === "approved"
                              ? "rgba(52,211,153,0.06)"
                              : "rgba(248,113,113,0.06)",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        <span className="font-medium">Decision note:</span> {req.decision_note}
                      </div>
                    )}
                    {req.decided_at && (
                      <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        Decided{" "}
                        {new Date(req.decided_at).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: ApprovalStatus }) {
  if (status === "approved")
    return <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#34D399" }} />;
  if (status === "rejected")
    return <XCircle className="h-4 w-4 shrink-0" style={{ color: "#F87171" }} />;
  if (status === "expired")
    return <Clock className="h-4 w-4 shrink-0" style={{ color: "#F5A623" }} />;
  return <Clock className="h-4 w-4 shrink-0" style={{ color: "#A78BFA" }} />;
}
