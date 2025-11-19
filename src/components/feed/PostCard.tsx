import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Clock, Heart, MessageCircle, Share2, Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Post } from "@/types/feed";
import { ImageGrid } from "@/components/post/ImageGrid";
import { AIInsightStrip } from "@/components/ai/AIInsightStrip";
import { toast } from "sonner";
import { TradeActions } from "@/components/pool/TradeActions";
import { createPostComment } from "@/lib/social";
import { useWalletStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/lib/likes";

interface PostCardProps {
  post: Post;
}

const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const PostCard = ({ post }: PostCardProps) => {
  const hashtags = useMemo(() => post.tags ?? [], [post.tags]);
    const media = useMemo(
      () => (post.attachments?.length ? post.attachments : post.images ?? []),
      [post.attachments, post.images],
    );
    const contractPostId =
      post.poolEnabled === true && typeof post.contractPostId === "number"
        ? post.contractPostId
        : null;
  const funded = (post.contributedAmount ?? 0) > 0;
  const walletAddress = post.walletAddress;
  const viewerAddress = useWalletStore((state) => state.address);
  const [liked, setLiked] = useState(post.likedByViewer ?? false);
  const [isLiking, setIsLiking] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [engagement, setEngagement] = useState(post.engagement);
  const [comments, setComments] = useState(post.comments ?? []);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const numericPostId = Number(post.id);
  const canMutatePost = Number.isFinite(numericPostId) && !Number.isNaN(numericPostId);

  const focusCommentBox = () => {
    commentInputRef.current?.focus();
  };

  const shortenWallet = (addressValue?: string) => {
    if (!addressValue) return "Anon";
    return `${addressValue.slice(0, 6)}…${addressValue.slice(-4)}`;
  };

    const handleLike = async () => {
      if (!viewerAddress) {
        toast.error("Connect your wallet to like posts.");
        return;
      }
      if (!canMutatePost) {
        toast.info("Demo posts cannot record likes.");
        return;
      }
      try {
        setIsLiking(true);
        const { liked: next, total } = await toggleLike(post.id);
        setLiked(next);
        setEngagement((prev) => ({
          ...prev,
          upvotes: total,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update like at the moment.";
        toast.error(message);
        console.error(error);
      } finally {
        setIsLiking(false);
      }
    };

  const handleCommentSubmit = async () => {
    const value = commentValue.trim();
    if (!value) {
      toast.error("Write a quick note before sending.");
      return;
    }
    if (!viewerAddress) {
      toast.error("Connect your wallet to comment.");
      return;
    }
    if (!canMutatePost) {
      toast.info("Demo posts cannot record comments.");
      return;
    }
    try {
      setIsCommenting(true);
      const created = await createPostComment({
        postId: numericPostId,
        walletAddress: viewerAddress,
        content: value,
      });
      if (created) {
        setComments((prev) => [...prev, created]);
        setEngagement((prev) => ({
          ...prev,
          comments: prev.comments + 1,
        }));
        setCommentValue("");
      }
    } catch (error) {
      toast.error("Unable to add comment right now.");
      console.error(error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleSecondaryAction = (action: "share" | "tip") => {
    const labels: Record<typeof action, string> = {
      share: "Shares",
      tip: "Tips",
    };
    toast.info(`${labels[action]} will sync to on-chain interactions soon.`);
  };

    return (
      <article className="rounded-2xl bg-[color:var(--bg-card)] p-6 text-[color:var(--text-primary)] shadow-lg ring-1 ring-[color:var(--ring)] transition will-change-transform hover:translate-y-[1px] hover:ring-indigo-500/30">
        <header className="flex items-start justify-between gap-4">
          <Link
            to={`/u/${post.walletAddress ?? post.author.username}`}
            className="flex flex-1 items-start gap-3 text-left no-underline"
          >
            <Avatar className="h-12 w-12 border border-indigo-500/10">
              {post.author.avatar ? (
                <AvatarImage src={post.author.avatar} alt={post.author.displayName} />
              ) : null}
              <AvatarFallback className="bg-indigo-500/10 text-sm font-semibold text-indigo-600">
                {post.author.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1 text-sm">
                <span className="font-semibold text-[color:var(--text-primary)]">{post.author.displayName}</span>
                {post.author.verified && <BadgeCheck className="h-4 w-4 text-cyan-500" />}
                <span className="text-[color:var(--text-secondary)]">@{post.author.username}</span>
                <span className="text-[color:var(--text-secondary)]">·</span>
                <span className="flex items-center gap-1 text-xs text-[color:var(--text-secondary)]">
                  <Clock className="h-3 w-3" />
                  {timeAgo(post.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-[color:var(--text-secondary)]/80">
                {post.author.refCode}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {post.sentimentLabel && (
              <Badge
                className={cn(
                  "rounded-full text-xs font-semibold shadow-sm",
                  post.sentimentLabel === "bullish" &&
                    "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400",
                  post.sentimentLabel === "bearish" &&
                    "bg-rose-500/20 text-rose-600 dark:bg-rose-500/30 dark:text-rose-400",
                  post.sentimentLabel === "neutral" &&
                    "bg-slate-500/20 text-slate-600 dark:bg-slate-500/30 dark:text-slate-400",
                )}
              >
                {post.sentimentLabel.charAt(0).toUpperCase() + post.sentimentLabel.slice(1)}
              </Badge>
            )}
            {funded ? (
              <Badge className="rounded-full bg-[color:rgba(245,199,106,0.18)] text-xs font-semibold uppercase tracking-wide text-[color:var(--color-chip-gold)] shadow-sm">
                Funded
              </Badge>
            ) : null}
          </div>
      </header>

        <div className="mt-4 space-y-4">
          <p className="whitespace-pre-wrap text-sm text-[color:var(--text-primary)]">{post.content}</p>

          {media.length > 0 && <ImageGrid images={media} />}

          {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs text-accent">
            {hashtags.map((tag) => (
                <span key={tag} className="rounded-full bg-accent/10 px-3 py-1 font-semibold">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

        <footer className="mt-5 space-y-4 text-xs text-[color:var(--text-secondary)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 gap-2 rounded-full text-[color:var(--text-secondary)] hover:bg-accent/10",
                    liked && "bg-accent/10 text-accent",
                  )}
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                  {engagement.upvotes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-full text-[color:var(--text-secondary)] hover:bg-accent/10"
                  onClick={focusCommentBox}
                >
                  <MessageCircle className="h-4 w-4" />
                  {engagement.comments}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-full text-[color:var(--text-secondary)] hover:bg-accent/10"
                  onClick={() => handleSecondaryAction("share")}
                >
                  <Share2 className="h-4 w-4" />
                  {post.engagement.shares}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-full text-[color:var(--text-secondary)] hover:bg-accent/10"
                  onClick={() => handleSecondaryAction("tip")}
                >
                  <Coins className="h-4 w-4 text-[color:var(--color-chip-gold)]" />
                  {post.engagement.tips}
                </Button>
          </div>
              <div className="text-xs font-semibold text-indigo-400">+{post.score} pts</div>
        </div>
        <AIInsightStrip
          signal={post.aiSignal}
          volatility={post.aiVolatility}
          mmActivity={post.aiMmActivity}
          score={post.aiScore}
        />
          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
            {comments.length > 0 ? (
              <div className="space-y-2">
                {comments.slice(-3).map((comment) => (
                  <div key={comment.id} className="rounded-xl bg-card/60 px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{shortenWallet(comment.walletAddress)}</span>
                    <span className="mx-2 text-muted-foreground/60">•</span>
                    <span>{comment.content}</span>
                  </div>
                ))}
                {engagement.comments > comments.length ? (
                  <p className="text-[11px] text-muted-foreground">
                    +{engagement.comments - comments.length} more comments
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">Be the first to comment on this alpha.</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea
                ref={commentInputRef}
                placeholder="Add your market note…"
                value={commentValue}
                onChange={(event) => setCommentValue(event.target.value)}
                className="min-h-[70px] flex-1 bg-transparent text-sm"
              />
              <Button
                size="sm"
                className="rounded-full px-6"
                onClick={handleCommentSubmit}
                disabled={isCommenting || commentValue.trim().length === 0}
              >
                {isCommenting ? "Posting…" : "Comment"}
              </Button>
            </div>
          </div>
            {contractPostId !== null ? (
                <TradeActions contractPostId={contractPostId} className="bg-card/90" />
            ) : null}
      </footer>
    </article>
  );
};
