import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  Gauge,
  Lock,
  Settings,
  Shield,
  ToggleLeft,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchContributesWithStats } from "@/lib/contributes";
import { fetchTopAlphaUsers } from "@/lib/reputation";
import { supabase } from "@/lib/supabaseClient";
import BurnPanel from "./admin/BurnPanel";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { isAdminLoggedIn, loginAsAdmin, logoutAdmin } from "@/lib/adminAuth";

const formatWallet = (wallet?: string | null) =>
  wallet && wallet.length > 10 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet ?? "—";

type AdminOverview = {
  profiles: number;
  posts: number;
  pools: number;
  trades: number;
  volume: number;
};

type AdminTab = "overview" | "users" | "posts" | "pools" | "system";

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

const AdminLogin = ({ onSuccess }: { onSuccess: () => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = loginAsAdmin(username.trim(), password.trim());
    if (success) {
      toast.success("Welcome back, ops.");
      setError(null);
      onSuccess();
    } else {
      setError("Invalid credentials. Use the preview credentials shared for this milestone.");
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
    </>
  );
};

const fetchAdminUsers = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("social_profiles")
    .select("id, display_name, wallet_address, handle, nop_id, is_banned, created_at, total_posts")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
};

const fetchAdminPosts = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("social_posts")
    .select("id, wallet_address, content, is_hidden, is_featured, created_at")
    .order("created_at", { ascending: false })
    .limit(150);
  if (error) throw error;
  return data ?? [];
};

const AdminUsersTab = () => {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
  });

  const toggleBan = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.from("social_profiles").update({ is_banned: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Status updated.");
    },
    onError: () => toast.error("Unable to update status."),
  });

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-indigo-400" />
          Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        {usersQuery.isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersQuery.data ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="space-y-1">
                      <p className="font-semibold text-text-primary">{user.display_name ?? "Anon"}</p>
                      <p className="text-xs text-text-secondary">{user.handle ? `@${user.handle}` : "no-handle"}</p>
                    </TableCell>
                    <TableCell className="text-sm text-text-secondary">{formatWallet(user.wallet_address)}</TableCell>
                    <TableCell className="text-sm text-text-secondary">{user.total_posts ?? 0}</TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive" className="rounded-full">
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleBan.mutate({ id: user.id, next: !user.is_banned })}
                      >
                        {user.is_banned ? "Unban" : "Ban"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!usersQuery.data?.length ? (
              <p className="mt-4 text-sm text-muted-foreground">No profiles yet. Connect a wallet to seed data.</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminPostsTab = () => {
  const queryClient = useQueryClient();
  const postsQuery = useQuery({
    queryKey: ["admin-posts"],
    queryFn: fetchAdminPosts,
  });

  const updatePost = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: Partial<{ is_hidden: boolean; is_featured: boolean }>;
    }) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.from("social_posts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success("Post updated.");
    },
    onError: () => toast.error("Unable to update post."),
  });

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ToggleLeft className="h-5 w-5 text-indigo-400" />
          Posts moderation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {postsQuery.isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <div className="space-y-3">
            {(postsQuery.data ?? []).map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-border-subtle bg-card px-4 py-3 text-sm text-text-secondary"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-text-primary">
                      {post.content.slice(0, 120)}
                      {post.content.length > 120 ? "…" : ""}
                    </p>
                    <p className="text-xs text-text-muted">
                      #{post.id} • {formatWallet(post.wallet_address)} •{" "}
                      {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span>Hidden</span>
                      <Switch
                        checked={post.is_hidden}
                        onCheckedChange={(next) =>
                          updatePost.mutate({ id: post.id, patch: { is_hidden: next } })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Featured</span>
                      <Switch
                        checked={post.is_featured}
                        onCheckedChange={(next) =>
                          updatePost.mutate({ id: post.id, patch: { is_featured: next } })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!postsQuery.data?.length ? (
              <p className="text-sm text-muted-foreground">No posts found.</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminPoolsTab = () => {
  const poolsQuery = useQuery({
    queryKey: ["admin-pools"],
    queryFn: fetchContributesWithStats,
  });

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5 text-indigo-400" />
          Pools
        </CardTitle>
      </CardHeader>
      <CardContent>
        {poolsQuery.isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : poolsQuery.data?.length ? (
          <div className="space-y-3">
            {poolsQuery.data.map((pool) => (
              <div
                key={pool.id}
                className="rounded-2xl border border-border-subtle px-4 py-3 text-sm text-text-secondary"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">{pool.title}</p>
                    <p className="text-xs text-text-muted">#{pool.contractPostId ?? pool.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">TVL</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {pool.weeklyVolumeNop?.toFixed(2) ?? "0"} NOP
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No pools yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

const AdminSystemTab = () => (
  <div className="space-y-4">
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Settings className="h-5 w-5 text-indigo-400" />
          System controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-text-secondary">
        <p>
          System parameters (burn widget, boosted tasks, demo flags) are exposed via Supabase tables. This client-side
          admin is for preview purposes only. Production controls live behind MPC wallets and Safe modules.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Burn widget updates are mocked via the form below.</li>
          <li>Boosted tasks & rewards are visible but immutable in this phase.</li>
          <li>Feature flags (AI signals, pools) ship via environment variables.</li>
        </ul>
      </CardContent>
    </Card>
    <Card className="border border-border">
      <CardHeader>
        <CardTitle>Burn panel (preview)</CardTitle>
      </CardHeader>
      <CardContent>
        <BurnPanel />
      </CardContent>
    </Card>
  </div>
);

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "users", label: "Users", icon: Users },
  { id: "posts", label: "Posts", icon: ToggleLeft },
  { id: "pools", label: "Pools", icon: TrendingUp },
  { id: "system", label: "System", icon: Settings },
];

export default function Admin() {
  usePageMetadata({
    title: "Admin Access — NOP Intelligence Layer",
    description: "Secure gateway for burn operations and analytics.",
  });
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isAuthed, setAuthed] = useState(isAdminLoggedIn());

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <AdminDashboard />;
      case "users":
        return <AdminUsersTab />;
      case "posts":
        return <AdminPostsTab />;
      case "pools":
        return <AdminPoolsTab />;
      case "system":
        return <AdminSystemTab />;
      default:
        return null;
    }
  };

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
          {isAuthed ? (
            <Button
              variant="ghost"
              className="w-fit px-3 text-xs text-muted-foreground"
              onClick={() => {
                logoutAdmin();
                setAuthed(false);
              }}
            >
              Sign out
            </Button>
          ) : null}
        </div>

        {isAuthed ? (
          <div className="flex flex-col gap-6 lg:flex-row">
            <aside className="w-full rounded-3xl border border-border bg-card p-4 text-sm shadow-card-soft lg:w-64">
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left ${
                      activeTab === item.id
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-text-secondary hover:bg-muted/40"
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-semibold">{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
            <div className="flex-1 space-y-6">{renderTab()}</div>
          </div>
        ) : (
          <AdminLogin onSuccess={() => setAuthed(true)} />
        )}
      </section>
    </StaticPageLayout>
  );
}
