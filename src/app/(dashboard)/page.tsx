"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/components/stats-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  totalValue: number;
  pendingOrders: number;
}

interface CategoryData {
  name: string;
  count: number;
}

interface MovementData {
  date: string;
  inbound: number;
  outbound: number;
}

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  details: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockCount: 0,
    totalValue: 0,
    pendingOrders: 0,
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [movementData, setMovementData] = useState<MovementData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Fetch Bricks stats
        const { data: bricks } = await supabase.from("bricks_inventory").select("*");
        if (bricks) {
          const totalBricks = bricks.reduce((sum, b) => sum + (b.overall_total || 0), 0);
          const bricks2025 = bricks.filter((b) => b.year === 2025).length;
          const bricks2026 = bricks.filter((b) => b.year === 2026).length;
          setStats((prev) => ({ ...prev, totalProducts: bricks.length, lowStockCount: bricks2025, totalValue: totalBricks, pendingOrders: bricks2026 }));
        }

        // Fetch Journal stats
        const { data: journal } = await supabase.from("journal_entries").select("*");
        if (journal) {
          setRecentActivity(journal.slice(0, 5).map((j: { id: string; date: string }) => ({
            id: j.id,
            action: "Journal Entry",
            entity_type: "journal",
            details: j.date,
            created_at: "2026-01-01T00:00:00Z",
          })));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [supabase]);

  // Demo data for charts
  const demoMovementData = [
    { date: "Mon", inbound: 24, outbound: 18 },
    { date: "Tue", inbound: 13, outbound: 22 },
    { date: "Wed", inbound: 38, outbound: 12 },
    { date: "Thu", inbound: 20, outbound: 29 },
    { date: "Fri", inbound: 45, outbound: 15 },
  ];

  const demoCategoryData = [
    { name: "Bricks 2025", count: 84 },
    { name: "Bricks 2026", count: 78 },
    { name: "Journal", count: 54 },
  ];

  const demoStockTrend = [
    { day: "Week 1", stock: 820 },
    { day: "Week 2", stock: 932 },
    { day: "Week 3", stock: 901 },
    { day: "Week 4", stock: 1034 },
    { day: "Week 5", stock: 1290 },
    { day: "Week 6", stock: 1170 },
    { day: "Week 7", stock: 1350 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your inventory performance"
        icon={LayoutDashboard}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts || 156}
          icon={Package}
          trend={{ value: 12.5, label: "from last month" }}
        />
        <StatsCard
          title="Low Stock Alerts"
          value={stats.lowStockCount || 8}
          icon={AlertTriangle}
          trend={{ value: -3.2, label: "from last week" }}
        />
        <StatsCard
          title="Inventory Value"
          value={formatCurrency(stats.totalValue || 245680)}
          icon={DollarSign}
          trend={{ value: 8.1, label: "from last month" }}
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders || 12}
          icon={ShoppingCart}
          trend={{ value: 5.4, label: "from last week" }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Stock Movement Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Stock Movements</CardTitle>
            <CardDescription>Inbound vs Outbound activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demoMovementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="inbound" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Inbound" />
                  <Bar dataKey="outbound" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Outbound" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Category Distribution</CardTitle>
            <CardDescription>Products by category breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demoCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                  >
                    {demoCategoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {demoCategoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Trend & Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Stock Trend */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Stock Level Trend</CardTitle>
            <CardDescription>Total inventory units over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoStockTrend}>
                  <defs>
                    <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stock"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#stockGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
{(recentActivity.length > 0
              ? recentActivity
              : [
                  { id: "1", action: "Data Imported", entity_type: "journal", details: "Bricks 2025 loaded", created_at: "2026-01-01T00:00:00Z" },
                  { id: "2", action: "Data Imported", entity_type: "journal", details: "Bricks 2026 loaded", created_at: "2026-01-01T00:00:00Z" },
                  { id: "3", action: "Data Imported", entity_type: "journal", details: "Journal entries loaded", created_at: "2026-01-01T00:00:00Z" },
                  { id: "4", action: "Data Imported", entity_type: "journal", details: "Schedule loaded", created_at: "2026-01-01T00:00:00Z" },
                  { id: "5", action: "System Ready", entity_type: "journal", details: "ACRPF System", created_at: "2026-01-01T00:00:00Z" },
                ]
            ).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {item.entity_type === "product" && <Package className="h-3.5 w-3.5 text-primary" />}
                    {item.entity_type === "stock" && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
                    {item.entity_type === "order" && <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />}
                    {item.entity_type === "alert" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    {item.entity_type === "category" && <TrendingUp className="h-3.5 w-3.5 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.details}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    --
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
