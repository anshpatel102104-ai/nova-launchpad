import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { stageFunnel, responseTimeSeries, revenueSeries } from "@/lib/mock";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from "recharts";

export const Route = createFileRoute("/app/nova/reports")({
  component: Reports,
});

function Reports() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Reports"
        description="The numbers that matter — funnel, response time, revenue."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KPI label="MRR" value="$14.2K" delta="+21%" />
        <KPI label="New leads (30d)" value="142" delta="+12%" />
        <KPI label="Avg response" value="63s" delta="-9s" good />
        <KPI label="Win rate" value="22%" delta="+3pt" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Funnel">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stageFunnel}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--nova)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Response time (s)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={responseTimeSeries}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="seconds" stroke="var(--launchpad)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="MRR (6w)" full>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="mrr" stroke="var(--chart-3)" fill="url(#mrr)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, good }: { label: string; value: string; delta: string; good?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-2xl font-semibold">{value}</div>
        <div className={good ? "text-xs text-success" : "text-xs text-muted-foreground"}>{delta}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${full ? "lg:col-span-2" : ""}`}>
      <div className="mb-3 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}
