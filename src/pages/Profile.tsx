import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { PostCard } from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletStore } from "@/lib/store";
import { fetchSocialFeed, fetchSocialProfile } from "@/lib/social";
import { fetchTopAlphaUsers } from "@/lib/reputation";
import { supabase } from "@/lib/supabaseClient";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WalletTrade = {
  postId: number;
  amount: number;
  side: string;
  executedAt: string;
  txHash?: string | null;
};

const fetchWalletTrades = async (walletAddress: string): Promise<WalletTrade[]> => {
  if (!supabase || !walletAddress) return [];
  const { data, error } = await supabase
    .from("nop_trades")
    .select("post_id, amount_nop, side, executed_at, tx_hash")
    .eq("wallet_address", walletAddress.toLowerCase())
    .order("executed_at", { ascending: false })
    .limit(25);
  if (error || !data) {
    console.warn("[profile] Failed to load wallet trades", error);
    return [];
  }
  return data.map((row) => ({
    postId: Number(row.post_id),
    amount: Number(row.amount_nop ?? 0),
    side: row.side ?? "buy",
    executedAt: row.executed_at ?? new Date().toISOString(),
    txHash: row.tx_hash,
  }));
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const ProfileStats = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-3 shadow-subtle/20">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">{label}</p>
    <p className="text-2xl font-semibold text-text-primary">{value}</p>
    {hint ? <p className="text-[11px] text-text-secondary">{hint}</p> : null}
  </div>
);

const EmptyCard = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-card-soft">
    {message}
  </div>
);

const Profile = () => {
  const params = useParams<{ address: string }>();
  const viewerAddress = useWalletStore((state) => state.address);
  const walletAddress = params.address?.toLowerCase() ?? "";

  usePageMetadata({
    title: walletAddress ? `Profile • ${walletAddress}` : "Profile",
    description: "Track historical contributions and social trading activity.",
  });

  const profileQuery = useQuery({
    queryKey: ["profile-metadata", walletAddress],
    queryFn: () => fetchSocialProfile(walletAddress),
    enabled: Boolean(walletAddress),
  });

  const postsQuery = useQuery({
    queryKey: ["profile-posts", walletAddress, viewerAddress ?? "anon"],
    queryFn: () => fetchSocialFeed({ authorWallet: walletAddress, viewerWallet: viewerAddress }),
    enabled: Boolean(walletAddress),
  });

  const tradesQuery = useQuery({
    queryKey: ["profile-trades", walletAddress],
    queryFn: () => fetchWalletTrades(walletAddress),
    enabled: Boolean(walletAddress),
  });

  const alphaQuery = useQuery({
    queryKey: ["profile-alpha", walletAddress],
    queryFn: async () => {
      const users = await fetchTopAlphaUsers({ limit: 50, withinDays: 14 });
      return users.find((user) => user.walletAddress === walletAddress) ?? null;
    },
    enabled: Boolean(walletAddress),
  });

  const posts = postsQuery.data ?? [];
  const trades = tradesQuery.data ?? [];
  const totalLikes = useMemo(
    () => (postsQuery.data ?? []).reduce((sum, post) => sum + (post.engagement.upvotes ?? 0), 0),
    [postsQuery.data],
  );
  const totalVolume = trades.reduce((sum, trade) => sum + trade.amount, 0);
  const alphaScore = alphaQuery.data?.score ?? 0;

  if (!walletAddress) {
    return <EmptyCard message="Provide a wallet address to view profile activity." />;
  }

  return (
    <div className="space-y-6">
      <DashboardCard className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-accent/10 text-2xl font-semibold text-accent">
              {walletAddress.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Profile</p>
              <h1 className="text-2xl font-semibold text-text-primary">
                {profileQuery.data?.display_name ?? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`}
              </h1>
              <p className="text-sm text-text-secondary">{walletAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="rounded-full border-border-subtle/70 text-xs text-text-secondary">
              Alpha score
            </Badge>
            <span className="text-3xl font-semibold text-text-primary">
              {alphaQuery.isLoading ? "—" : numberFormatter.format(alphaScore)}
            </span>
          </div>
        </div>
      </DashboardCard>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ProfileStats label="Posts" value={posts.length.toString()} hint="Published via NOP Intelligence" />
        <ProfileStats label="Likes" value={totalLikes.toString()} hint="Total reactions across posts" />
        <ProfileStats label="Trades" value={trades.length.toString()} hint="Logged via nop_trades" />
        <ProfileStats label="Volume (NOP)" value={numberFormatter.format(totalVolume)} hint="7d total volume" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1.1fr)]">
        <DashboardCard className="space-y-4">
          <DashboardSectionTitle label="Posts" title="On-chain contributions" />
          {postsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={`${post.id}-profile`} post={post} />
              ))}
            </div>
          ) : (
            <EmptyCard message="No posts yet. Once this wallet shares an insight, it will appear here." />
          )}
        </DashboardCard>

        <div className="space-y-4">
          <DashboardCard className="space-y-3">
            <DashboardSectionTitle label="Activity" title="Recent trades" />
            {tradesQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : trades.length > 0 ? (
              <ul className="space-y-2 text-sm text-text-secondary">
                {trades.map((trade) => (
                  <li
                    key={`${trade.txHash ?? trade.postId}-${trade.executedAt}`}
                    className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">
                        {trade.side.toUpperCase()} • #{trade.postId}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {new Date(trade.executedAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        trade.side === "buy" ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {numberFormatter.format(trade.amount)} NOP
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyCard message="No on-chain trades logged for this wallet." />
            )}
          </DashboardCard>
          <DashboardCard className="space-y-3">
            <DashboardSectionTitle label="Insights" title="Advanced analytics" />
            <p className="text-sm text-text-secondary">
              Cohort comparisons, drawdown stats, and predictive scores will surface here soon. For now, alpha score is
              driven by your trade volume and on-chain consistency.
            </p>
            <Badge variant="secondary" className="w-max rounded-full">
              Beta soon
            </Badge>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};

export default Profile;
