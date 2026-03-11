import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "@/hooks/use-dashboard";
import { Activity, KeyRound, Smartphone, TrendingUp, type LucideIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StatTone = "positive" | "negative" | "neutral";

type DashboardStat = {
  label: string;
  value: string;
  icon: LucideIcon;
  note: string;
  tone: StatTone;
};

function toneClass(tone: StatTone) {
  if (tone === "positive") {
    return "text-emerald-500";
  }

  if (tone === "negative") {
    return "text-red-500";
  }

  return "text-muted-foreground";
}

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const rankHistory = data?.rankHistory ?? [];

  const latestDelta = (() => {
    if (rankHistory.length < 2) {
      return null;
    }

    const previous = rankHistory[rankHistory.length - 2]?.averageRank;
    const current = rankHistory[rankHistory.length - 1]?.averageRank;
    if (previous === null || previous === undefined || current === null || current === undefined) {
      return null;
    }

    return Number((previous - current).toFixed(1));
  })();

  const stats: DashboardStat[] = [
    {
      label: "Tracked Apps",
      value: data ? data.stats.trackedApps.toString() : "-",
      icon: Smartphone,
      note: "Apps in catalog",
      tone: "neutral",
    },
    {
      label: "Active Keywords",
      value: data ? data.stats.activeKeywords.toString() : "-",
      icon: KeyRound,
      note: "Tracked across markets",
      tone: "neutral",
    },
    {
      label: "Average Rank",
      value:
        data?.stats.averageRank !== null && data?.stats.averageRank !== undefined
          ? data.stats.averageRank.toFixed(1)
          : "N/A",
      icon: TrendingUp,
      note:
        latestDelta === null
          ? "Need more snapshots"
          : `${latestDelta > 0 ? "+" : ""}${latestDelta} vs previous`,
      tone:
        latestDelta === null
          ? "neutral"
          : latestDelta > 0
            ? "positive"
            : latestDelta < 0
              ? "negative"
              : "neutral",
    },
    {
      label: "Total Volume",
      value: data ? data.stats.totalVolume.toLocaleString() : "-",
      icon: Activity,
      note: "Latest captured volume",
      tone: "neutral",
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-lg">Your ASO performance at a glance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-display font-bold text-foreground">{stat.value}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className={`font-medium ${toneClass(stat.tone)}`}>{stat.note}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/40 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border/40 flex justify-between items-center bg-card">
            <div>
              <h3 className="text-xl font-display font-bold">Average Keyword Rank</h3>
              <p className="text-sm text-muted-foreground">Recent progression across tracked keywords</p>
            </div>
            <select className="bg-muted/30 border border-border/50 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" defaultValue="last-7-days">
              <option value="last-7-days">Last 7 Days</option>
            </select>
          </div>
          <CardContent className="p-6 h-[400px] w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Loading dashboard data...
              </div>
            ) : rankHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Add tracked keywords to start building rank history.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rankHistory} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    reversed={true}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    dx={-10}
                    allowDecimals={true}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageRank"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff" }}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
