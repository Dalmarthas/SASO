import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useApps } from "@/hooks/use-apps";
import { useKeywords } from "@/hooks/use-keywords";
import { Smartphone, KeyRound, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock historic data for the beautiful chart
const mockChartData = [
  { name: 'Mon', rank: 45 },
  { name: 'Tue', rank: 42 },
  { name: 'Wed', rank: 38 },
  { name: 'Thu', rank: 39 },
  { name: 'Fri', rank: 35 },
  { name: 'Sat', rank: 32 },
  { name: 'Sun', rank: 28 },
];

export default function Dashboard() {
  const { data: apps = [] } = useApps();
  const { data: keywords = [] } = useKeywords();

  const totalVolume = keywords.reduce((acc, kw) => acc + (kw.searchVolume || 0), 0);
  const avgRank = keywords.length ? 
    (keywords.reduce((acc, kw) => acc + (kw.currentRank || 0), 0) / keywords.length).toFixed(1) : 
    "N/A";

  const stats = [
    { label: "Tracked Apps", value: apps.length.toString(), icon: Smartphone, trend: "+12%" },
    { label: "Active Keywords", value: keywords.length.toString(), icon: KeyRound, trend: "+5%" },
    { label: "Average Rank", value: avgRank, icon: TrendingUp, trend: "-2.4", trendUp: true }, // Lower rank is better
    { label: "Total Volume", value: totalVolume.toLocaleString(), icon: Activity, trend: "+18%" },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-lg">Your ASO performance at a glance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
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
                  <span className={`font-medium ${stat.trend.startsWith('+') || stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-muted-foreground ml-2">vs last week</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Area */}
        <Card className="border-border/40 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border/40 flex justify-between items-center bg-card">
            <div>
              <h3 className="text-xl font-display font-bold">Average Keyword Rank</h3>
              <p className="text-sm text-muted-foreground">Global rank progression across all tracked keywords</p>
            </div>
            <select className="bg-muted/30 border border-border/50 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <CardContent className="p-6 h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  reversed={true} // Lower rank is better, so put 1 at top
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 600 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rank" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  dot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
