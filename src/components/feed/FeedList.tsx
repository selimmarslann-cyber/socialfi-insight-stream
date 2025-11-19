import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "./PostCard";
import { useFeedStore, useWalletStore } from "@/lib/store";
import { fetchSocialFeed } from "@/lib/social";

export const FeedList = () => {
  const userPosts = useFeedStore((state) => state.userPosts);
  const address = useWalletStore((state) => state.address);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["social-feed", address?.toLowerCase() ?? "anon"],
    queryFn: () => fetchSocialFeed({ viewerWallet: address }),
    refetchOnWindowFocus: true,
  });

  const posts = useMemo(() => {
    const remote = data ?? [];
    const combined = [...userPosts, ...remote];
    const getTimestamp = (post: (typeof combined)[number]) => {
      const created =
        (post as { createdAt?: string }).createdAt ??
        (post as { timestamp?: string }).timestamp;
      if (!created) return 0;
      const ms = new Date(created).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };
    const sorted = combined
      .filter((post, index, arr) => arr.findIndex((item) => item.id === post.id) === index)
      .sort((a, b) => getTimestamp(b) - getTimestamp(a));
    return sorted;
  }, [userPosts, data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Failed to load feed</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {posts.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-card-soft">
          <p className="text-sm text-muted-foreground">
            No contributions yet. Be the first to publish an analysis.
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <div className="text-center text-xs text-muted-foreground">
            {isFetching ? "Refreshing feed…" : "Auto-refresh active"}
          </div>
        </>
      )}
    </div>
  );
};
