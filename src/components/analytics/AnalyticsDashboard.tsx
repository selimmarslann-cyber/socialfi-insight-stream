/**
 * Analytics Dashboard Component
 * Displays user analytics with charts and metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getUserAnalyticsSummary, type UserAnalyticsSummary } from "@/lib/analytics";
import { useWalletStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, MessageSquare, Heart, Coins, Users, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AnalyticsDashboard() {
  const { address } = useWalletStore();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["user-analytics-summary", address],
    queryFn: () => (address ? getUserAnalyticsSummary(address) : Promise.resolve(null)),
    enabled: !!address,
    staleTime: 60_000,
  });

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Connect your wallet to view your analytics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>No analytics data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = [
    {
      label: "Total Posts",
      value: summary.totalPosts,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Total Trades",
      value: summary.totalTrades,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Total Volume",
      value: `${summary.totalVolume.toFixed(2)} NOP`,
      icon: Coins,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Win Rate",
      value: `${summary.winRate.toFixed(1)}%`,
      icon: Target,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  // Mock chart data (in real app, fetch from getUserAnalytics)
  const chartData = [
    { date: "Mon", posts: summary.totalPosts / 7, trades: summary.totalTrades / 7 },
    { date: "Tue", posts: summary.totalPosts / 7, trades: summary.totalTrades / 7 },
    { date: "Wed", posts: summary.totalPosts / 7, trades: summary.totalTrades / 7 },
    { date: "Thu", posts: summary.totalPosts / 7, trades: summary.totalTrades / 7 },
    { date: "Fri", posts: summary.totalPosts / 7, trades: summary.totalTrades / 7 },
    { date: "Sat", posts: summary.totalPosts / 7, trades: summary.totalTrades / 7 },
    { date: "Sun", posts: summary.totalPosts / 7, trades: summary.totalTrades / 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                  </div>
                  <div className={`rounded-full p-2 ${metric.bg}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Posts and trades over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="posts" fill="#4F46E5" name="Posts" />
                <Bar dataKey="trades" fill="#06B6D4" name="Trades" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total PnL</span>
              <Badge variant={summary.totalPnl >= 0 ? "default" : "destructive"}>
                {summary.totalPnl >= 0 ? "+" : ""}
                {summary.totalPnl.toFixed(2)} NOP
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Daily Posts</span>
              <span className="font-semibold">{summary.averageDailyPosts.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Daily Volume</span>
              <span className="font-semibold">{summary.averageDailyVolume.toFixed(2)} NOP</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Followers</span>
              <span className="font-semibold">{summary.totalFollowers}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

