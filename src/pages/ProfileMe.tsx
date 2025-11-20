import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/feed/PostCard";
import { ComingSoonCard } from "@/components/ComingSoonCard";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { AlphaScoreCard } from "@/components/profile/AlphaScoreCard";
import { TopPositions } from "@/components/profile/TopPositions";
import { PositionNFTsCard } from "@/components/profile/PositionNFTsCard";
import { useWalletStore } from "@/lib/store";
import {
  isProfileBanned,
  listUserPosts,
  listUserLikes,
  type Profile as ProfileType,
} from "@/lib/profile";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const formatWallet = (wallet?: string | null) =>
  wallet && wallet.length > 10 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet ?? "—";

const StatsGrid = ({
  profile,
  postsCount,
  likesCount,
}: {
  profile: ProfileType;
  postsCount: number;
  likesCount: number;
}) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Posts</p>
      <p className="text-2xl font-semibold text-text-primary">{postsCount}</p>
      <p className="text-xs text-text-secondary">Authored via SocialFi console</p>
    </div>
    <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Likes</p>
      <p className="text-2xl font-semibold text-text-primary">{likesCount}</p>
      <p className="text-xs text-text-secondary">Signals you amplified</p>
    </div>
    <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">NOP ID</p>
      <p className="text-xl font-semibold text-text-primary">{profile.nop_id ?? "pending"}</p>
      <p className="text-xs text-text-secondary">Preview identifier</p>
    </div>
    <div className="rounded-2xl border border-border-subtle bg-card/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Status</p>
      <p className="text-2xl font-semibold text-text-primary">
        {isProfileBanned(profile) ? "Restricted" : "Active"}
      </p>
      <p className="text-xs text-text-secondary">Ops-level visibility</p>
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
    {message}
  </div>
);

export default function ProfileMe() {
  const walletAddress = useWalletStore((state) => state.address);
  const { profile, isLoading: profileLoading, refetch } = useCurrentProfile();
  const banned = isProfileBanned(profile);

  usePageMetadata({
    title: "My Profile — NOP Intelligence Layer",
    description: "Manage your SocialFi presence, activity, and liked posts.",
  });

  const postsQuery = useQuery({
    queryKey: ["profile-posts", profile?.id ?? "me", walletAddress ?? "anon"],
    queryFn: () => listUserPosts(profile!.id, walletAddress ?? undefined),
    enabled: Boolean(profile?.id),
  });

  const likesQuery = useQuery({
    queryKey: ["profile-liked-posts", profile?.id ?? "me", walletAddress ?? "anon"],
    queryFn: () => listUserLikes(profile!.id, walletAddress ?? undefined),
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

  if (!walletAddress) {
    return (
      <Card className="rounded-3xl border border-border bg-card p-8 text-center shadow-card-soft">
        <h2 className="text-xl font-semibold text-text-primary">Connect your wallet</h2>
        <p className="text-sm text-text-secondary">
          Profiles attach to wallets in this preview. Connect your wallet from the header to continue.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-border">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ""} /> : null}
              <AvatarFallback className="text-lg font-semibold">
                {(profile?.display_name ?? walletAddress).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">My profile</p>
              <h1 className="text-2xl font-semibold text-text-primary">
                {profile?.display_name ?? formatWallet(walletAddress)}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <span>{profile?.handle ? `@${profile.handle}` : "Handle pending"}</span>
                <span>•</span>
                <span>{formatWallet(walletAddress)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {banned ? (
              <Badge variant="destructive" className="rounded-full">
                Restricted
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full">
                {profile?.nop_id ?? "NOP preview"}
              </Badge>
            )}
            {profile ? (
              <ProfileEditDialog profile={profile} onUpdated={() => refetch()} />
            ) : (
              <Skeleton className="h-9 w-28 rounded-full" />
            )}
          </div>
        </div>
        {profile?.bio ? (
          <p className="mt-4 text-sm text-text-secondary">{profile.bio}</p>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            Add a short bio so other operators know what edge you bring.
          </p>
        )}
      </div>

      {profile ? (
        <StatsGrid profile={profile} postsCount={stats.posts} likesCount={stats.likes} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      )}

      {walletAddress ? (
        <div className="grid gap-6 md:grid-cols-2">
          <AlphaScoreCard walletAddress={walletAddress} />
          <TopPositions walletAddress={walletAddress} />
        </div>
      ) : null}

      {walletAddress ? (
        <PositionNFTsCard walletAddress={walletAddress} />
      ) : null}

      {walletAddress ? (
        <DashboardCard className="space-y-4">
          <DashboardSectionTitle label="Achievements" title="Badges" />
          <BadgeList walletAddress={walletAddress} />
        </DashboardCard>
      ) : null}

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/40 p-1 text-sm">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="likes">Liked posts</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          {postsQuery.isLoading || profileLoading ? (
            <>
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </>
          ) : posts.length > 0 ? (
            posts.map((post) => <PostCard key={`my-${post.id}`} post={post} />)
          ) : (
            <EmptyState message="You haven't shared any contributions yet." />
          )}
        </TabsContent>

        <TabsContent value="likes" className="space-y-4">
          {likesQuery.isLoading ? (
            <>
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </>
          ) : likedPosts.length > 0 ? (
            likedPosts.map((post) => <PostCard key={`liked-${post.id}`} post={post} />)
          ) : (
            <EmptyState message="Posts you like will appear here." />
          )}
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          {walletAddress ? (
            <TopPositions walletAddress={walletAddress} limit={20} />
          ) : (
            <ComingSoonCard
              title="On-chain positions"
              description="Connect your wallet to view your positions."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
