import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from './PostCard';
import { fetchFeed } from '@/lib/mock-api';
import { useFeedStore } from '@/lib/store';

export const FeedList = () => {
  const userPosts = useFeedStore((state) => state.userPosts);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load feed</p>
      </div>
    );
  }

  const remotePosts = data?.pages.flatMap((page) => page.items) ?? [];
  const posts = [...userPosts, ...remotePosts];

  return (
    <div className="space-y-5">
      {posts.length === 0 ? (
        <div className="rounded-3xl border border-indigo-500/10 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">No contributions yet. Be the first to publish an analysis.</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasNextPage && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
