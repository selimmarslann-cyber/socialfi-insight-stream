import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/PostCard";
import { ComingSoonCard } from "@/components/ComingSoonCard";
import { AlphaScoreCard } from "@/components/profile/AlphaScoreCard";
import { TopPositions } from "@/components/profile/TopPositions";
import {
  getProfileByHandle,
  getProfileById,
  getProfileByWallet,
  isProfileBanned,
  listUserLikes,
  listUserPosts,
  type Profile as ProfileType,
} from "@/lib/profile";
import { useWalletStore } from "@/lib/store";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const formatWallet = (wallet?: string | null) =>
  wallet && wallet.length > 10 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet ?? "—";

const resolveProfileSlug = async (slug: string): Promise<ProfileType | null> => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("nop-")) {
    return getProfileByHandle(normalized);
  }
  if (normalized.startsWith("0x") && normalized.length === 42) {
    return getProfileByWallet(normalized);
  }
  return (await getProfileById(normalized)) ?? getProfileByHandle(normalized);
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
    {message}
  </div>
);

export default function ProfilePublic() {
  const { slug = "" } = useParams<{ slug: string }>();
  const viewerWallet = useWalletStore((state) => state.address);

  const profileQuery = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: () => resolveProfileSlug(slug),
    enabled: Boolean(slug),
  });

  const profile = profileQuery.data ?? null;
  const banned = isProfileBanned(profile);

  usePageMetadata({
    title: profile ? `${profile.display_name ?? formatWallet(profile.wallet_address)} — NOP Profile` : "Profile",
    description: "View profile activity across the NOP Intelligence Layer.",
  });

  const postsQuery = useQuery({
    queryKey: ["public-posts", profile?.id ?? "unknown", viewerWallet ?? "anon"],
    queryFn: () => listUserPosts(profile!.id, viewerWallet ?? undefined),
    enabled: Boolean(profile?.id),
  });

  const likesQuery = useQuery({
    queryKey: ["public-liked-posts", profile?.id ?? "unknown", viewerWallet ?? "anon"],
    queryFn: () => listUserLikes(profile!.id, viewerWallet ?? undefined),
    enabled: Boolean(profile?.id),
  });

  const posts = postsQuery.data ?? [];
  const likedPosts = likesQuery.data ?? [];

  const stats = useMemo(
    () => ({
      posts: posts.length,
      likes: likedPosts.length,
    }),
    [posts.length, likedPosts.length],
  );

  if (!slug) {
    return <EmptyState message="Missing profile slug. Try /u/nop-alpha or /u/0xabc…" />;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return <EmptyState message="Profile not found. Double-check the handle or wallet you entered." />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-border">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ""} /> : null}
              <AvatarFallback className="text-lg font-semibold">
                {(profile.display_name ?? profile.wallet_address ?? "").slice(0, 2).toUpperCase() || "OP"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Profile</p>
              <h1 className="text-2xl font-semibold text-text-primary">
                {profile.display_name ?? formatWallet(profile.wallet_address)}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <span>{profile.handle ? `@${profile.handle}` : "Handle pending"}</span>
                <span>•</span>
                <span>{formatWallet(profile.wallet_address)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {banned ? (
              <Badge variant="destructive" className="rounded-full">
                Restricted
              </Badge>
            ) : null}
            <Badge variant="outline" className="rounded-full">
              {profile.nop_id ?? "NOP preview"}
            </Badge>
          </div>
        </div>
        {profile.bio ? <p className="mt-4 text-sm text-text-secondary">{profile.bio}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Posts</p>
          <p className="text-2xl font-semibold text-text-primary">{stats.posts}</p>
          <p className="text-xs text-text-secondary">On-chain contributions</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Liked</p>
          <p className="text-2xl font-semibold text-text-primary">{stats.likes}</p>
          <p className="text-xs text-text-secondary">Signals they backed</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">NOP ID</p>
          <p className="text-xl font-semibold text-text-primary">{profile.nop_id ?? "pending"}</p>
          <p className="text-xs text-text-secondary">Preview identifier</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Status</p>
          <p className="text-2xl font-semibold text-text-primary">
            {banned ? "Restricted" : "Active"}
          </p>
          <p className="text-xs text-text-secondary">Ops visibility</p>
        </div>
      </div>

      {profile.wallet_address ? (
        <div className="grid gap-6 md:grid-cols-2">
          <AlphaScoreCard walletAddress={profile.wallet_address} />
          <TopPositions walletAddress={profile.wallet_address} />
        </div>
      ) : null}

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/40 p-1 text-sm">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="likes">Liked posts</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          {postsQuery.isLoading ? (
            <>
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </>
          ) : posts.length > 0 ? (
            posts.map((post) => <PostCard key={`public-${post.id}`} post={post} />)
          ) : (
            <EmptyState message="No posts yet. Once this operator shares an insight, it will appear here." />
          )}
        </TabsContent>

        <TabsContent value="likes" className="space-y-4">
          {likesQuery.isLoading ? (
            <>
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </>
          ) : likedPosts.length > 0 ? (
            likedPosts.map((post) => <PostCard key={`public-liked-${post.id}`} post={post} />)
          ) : (
            <EmptyState message="Posts this profile likes will appear once they start reacting." />
          )}
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          {profile.wallet_address ? (
            <TopPositions walletAddress={profile.wallet_address} limit={10} />
          ) : (
            <ComingSoonCard
              title="Positions"
              description="No wallet address associated with this profile."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
