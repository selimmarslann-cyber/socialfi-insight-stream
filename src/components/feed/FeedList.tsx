import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from './PostCard';
import { fetchFeed } from '@/lib/mock-api';
import { useAppStore } from '@/lib/store';

export const FeedList = () => {
  const { setPostComposerOpen } = useAppStore();
  
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
        <Button className="w-full" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          New Contribution
        </Button>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
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

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-4">
      <Button
        className="w-full"
        size="lg"
        onClick={() => setPostComposerOpen(true)}
      >
        <Plus className="h-5 w-5 mr-2" />
        New Contribution
      </Button>

      {posts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">No contributions yet</p>
          <Button onClick={() => setPostComposerOpen(true)}>
            Be the first to contribute
          </Button>
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
