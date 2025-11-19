import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/lib/store";
import { followCreator, unfollowCreator, isFollowing, getFollowersCount } from "@/lib/follow";

type FollowButtonProps = {
  creatorAddress: string;
  className?: string;
  showCount?: boolean;
};

export function FollowButton({ creatorAddress, className, showCount = false }: FollowButtonProps) {
  const { address, connected } = useWalletStore();
  const queryClient = useQueryClient();
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);

  const followingQuery = useQuery({
    queryKey: ["is-following", address, creatorAddress],
    queryFn: () => isFollowing(address ?? "", creatorAddress),
    enabled: Boolean(address && connected && creatorAddress),
  });

  const followersCountQuery = useQuery({
    queryKey: ["followers-count", creatorAddress],
    queryFn: () => getFollowersCount(creatorAddress),
    enabled: Boolean(creatorAddress),
  });

  const isCurrentlyFollowing = localFollowing !== null ? localFollowing : (followingQuery.data ?? false);

  const followMutation = useMutation({
    mutationFn: () => followCreator(address ?? "", creatorAddress),
    onSuccess: () => {
      setLocalFollowing(true);
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      queryClient.invalidateQueries({ queryKey: ["followers-count"] });
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
      toast.success("Following creator!");
    },
    onError: () => {
      toast.error("Failed to follow creator");
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowCreator(address ?? "", creatorAddress),
    onSuccess: () => {
      setLocalFollowing(false);
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      queryClient.invalidateQueries({ queryKey: ["followers-count"] });
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
      toast.success("Unfollowed creator");
    },
    onError: () => {
      toast.error("Failed to unfollow creator");
    },
  });

  const handleClick = () => {
    if (!connected || !address) {
      toast.info("Please connect your wallet to follow creators");
      return;
    }

    if (isCurrentlyFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending || followingQuery.isLoading;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isCurrentlyFollowing ? "secondary" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={isLoading || !connected}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isCurrentlyFollowing ? (
          <UserCheck className="mr-2 h-4 w-4" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        {isCurrentlyFollowing ? "Following" : "Follow"}
      </Button>
      
      {showCount && followersCountQuery.data !== undefined && (
        <span className="text-sm text-text-muted">
          {followersCountQuery.data} followers
        </span>
      )}
    </div>
  );
}

