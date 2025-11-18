import { useState, FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Lock, Shield, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import { fetchContributesWithStats } from "@/lib/contributes";
import { fetchTopAlphaUsers } from "@/lib/reputation";
import { supabase } from "@/lib/supabaseClient";
import BurnPanel from "./admin/BurnPanel";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { Skeleton } from "@/components/ui/skeleton";

type AdminOverview = {
  profiles: number;
  posts: number;
  pools: number;
  trades: number;
  volume: number;
};

const fetchAdminOverview = async (): Promise<AdminOverview | null> => {
  if (!supabase) return null;
  const [profilesRes, postsRes, tradesRes] = await Promise.all([
    supabase.from("social_profiles").select("*", { count: "exact", head: true }),
    supabase.from("social_posts").select("*", { count: "exact", head: true }),
    supabase.from("nop_trades").select("post_id, amount_nop"),
  ]);
  const trades = tradesRes.data ?? [];
  const volume = trades.reduce((sum, trade) => sum + Number(trade.amount_nop ?? 0), 0);
  const pools = new Set(trades.map((trade) => trade.post_id)).size;
  return {
    profiles: profilesRes.count ?? 0,
    posts: postsRes.count ?? 0,
    pools,
    trades: trades.length,
    volume,
  };
};

const AdminLogin = () => {
  const { login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = login(username.trim(), password.trim());
    if (success) {
      toast.success("Welcome back, selimarslan.");
      setError(null);
    } else {
      setError("Invalid credentials. Use the dev credentials shared for this milestone.");
    }
  };

  return (
    <Card className="max-w-xl border border-border bg-card shadow-card-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Lock className="h-5 w-5 text-indigo-400" />
          Admin login
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="admin-username">Username</Label>
            <Input
              id="admin-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="selimarslan"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
          <p className="text-xs text-muted-foreground">
            Preview-only auth. In production this screen is replaced by MPC + SafeAuth.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Shield }) => (
  <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-subtle">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">{label}</p>
        <p className="text-2xl font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchAdminOverview,
  });
  const poolsQuery = useQuery({
    queryKey: ["admin-pools"],
    queryFn: fetchContributesWithStats,
  });
  const alphaQuery = useQuery({
    queryKey: ["admin-alpha"],
    queryFn: () => fetchTopAlphaUsers({ limit: 5, withinDays: 14 }),
  });

  const overview = overviewQuery.data;

  return (
    <>
      <DashboardCard className="space-y-3">
        <DashboardSectionTitle label="Overview" title="Ops snapshot" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Profiles" value={overview ? overview.profiles.toString() : "—"} icon={Users} />
          <StatCard label="Posts" value={overview ? overview.posts.toString() : "—"} icon={Shield} />
          <StatCard label="Pools w/ trades" value={overview ? overview.pools.toString() : "—"} icon={TrendingUp} />
          <StatCard
            label="Total NOP volume"
            value={overview ? `${overview.volume.toFixed(2)} NOP` : "—"}
            icon={Coins}
          />
        </div>
        {!supabase ? (
          <p className="text-xs text-destructive">
            Supabase is not configured. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to unlock live metrics.
          </p>
        ) : null}
      </DashboardCard>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Pools" title="Top contributes" />
          {poolsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-2">
              {(poolsQuery.data ?? []).slice(0, 5).map((pool) => (
                <div
                  key={pool.id}
                  className="flex items-center justify-between rounded-2xl border border-border-subtle px-4 py-3 text-sm text-text-secondary"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-text-primary">{pool.title}</span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted">
                      #{pool.contractPostId ?? pool.id}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">7d volume</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {pool.weeklyVolumeNop?.toFixed(2) ?? "0"} NOP
                    </p>
                  </div>
                </div>
              ))}
              {!poolsQuery.data?.length ? (
                <p className="text-sm text-muted-foreground">No pools active yet. Seed data to monitor activity.</p>
              ) : null}
            </div>
          )}
        </DashboardCard>

        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Reputation" title="Top operators" />
          {alphaQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-2">
              {(alphaQuery.data ?? []).map((user, index) => (
                <div
                  key={user.walletAddress}
                  className="flex items-center justify-between rounded-2xl border border-border-subtle px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      #{index + 1} {user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {user.trades} trades • {user.volumeNop.toFixed(2)} NOP
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-400">α {user.score.toFixed(2)}</span>
                </div>
              ))}
              {!alphaQuery.data?.length ? (
                <p className="text-sm text-muted-foreground">No reputation data yet.</p>
              ) : null}
            </div>
          )}
        </DashboardCard>
      </div>

      <DashboardCard className="space-y-3">
        <DashboardSectionTitle label="Controls" title="Burn metrics" />
        <p className="text-sm text-muted-foreground">
          Preview-only admin UI. In production this panel signs requests via server-side MPC wallets.
        </p>
        <BurnPanel />
      </DashboardCard>
    </>
  );
};

export default function Admin() {
  usePageMetadata({
    title: "Admin Access — NOP Intelligence Layer",
    description: "Secure gateway for burn operations and analytics.",
  });
  const { isAdmin, logout } = useAuthStore();

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <div className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card-soft">
          <div className="flex items-center gap-3 text-text-primary">
            <Shield className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Restricted</p>
              <h1 className="text-2xl font-semibold">Admin console</h1>
            </div>
          </div>
          <p>Developer preview for the NOP Intelligence Layer ops team. Data is read-only except mock burn inputs.</p>
          {isAdmin ? (
            <Button variant="ghost" className="w-fit px-3 text-xs text-muted-foreground" onClick={logout}>
              Sign out
            </Button>
          ) : null}
        </div>

        {isAdmin ? <AdminDashboard /> : <AdminLogin />}
      </section>
    </StaticPageLayout>
  );
}
