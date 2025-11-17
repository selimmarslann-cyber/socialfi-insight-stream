import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Clock,
  Heart,
  MessageCircle,
  Share2,
  Star,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Post } from '@/types/feed';
import { ImageGrid } from '@/components/post/ImageGrid';
import { AIInsightStrip } from '@/components/ai/AIInsightStrip';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PostComments } from '@/components/feed/PostComments';
import { togglePostLike } from '@/lib/feed-service';
import { ratePost } from '@/lib/actions';

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
  const [engagement, setEngagement] = useState(post.engagement);
  const [viewerState, setViewerState] = useState({
    liked: post.viewerState?.liked ?? false,
    rating: post.viewerState?.rating ?? null,
  });
  const [ratingSummary, setRatingSummary] = useState(
    post.ratingSummary ?? { average: 0, count: 0 },
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingPending, setRatingPending] = useState(false);
  const ratingScale = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
  const isLocal = post.id.startsWith("local-");

  const handleShare = () => {
    toast.info("Shares will sync to on-chain interactions soon.");
  };

  const handleLike = async () => {
    if (isLocal) {
      toast.info("Bu gonderi henuz senkronize edilmedi.");
      return;
    }
    try {
      setLikePending(true);
      const target = !viewerState.liked;
      await togglePostLike(post.id, target);
      setViewerState((prev) => ({ ...prev, liked: target }));
      setEngagement((prev) => ({
        ...prev,
        upvotes: Math.max(0, prev.upvotes + (target ? 1 : -1)),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update like.";
      toast.error(message);
    } finally {
      setLikePending(false);
    }
  };

  const toggleComments = () => {
    if (isLocal) {
      toast.info("Gonderi senkronize edilmeden yorum acilamaz.");
      return;
    }
    setCommentsOpen((prev) => !prev);
  };

  const handleRate = async (value: number) => {
    if (isLocal) {
      toast.info("Bu gonderi henuz senkronize edilmedi.");
      return;
    }
    if (viewerState.rating === value) {
      setRatingOpen(false);
      return;
    }
    try {
      setRatingPending(true);
      const previousRating = viewerState.rating ?? null;
      await ratePost(post.id, value);
      setViewerState((prev) => ({ ...prev, rating: value }));
      setRatingSummary((prev) => {
        const summary = prev ?? { average: 0, count: 0 };
        if (previousRating == null) {
          const total = summary.average * summary.count + value;
          const count = summary.count + 1;
          return { average: total / count, count };
        }
        const count = Math.max(1, summary.count);
        const total = summary.average * summary.count - previousRating + value;
        return { average: total / count, count };
      });
        toast.success("Puanin kaydedildi.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Puanlama basarisiz.";
      toast.error(message);
    } finally {
      setRatingPending(false);
      setRatingOpen(false);
    }
  };

  const funded = (post.contributedAmount ?? 0) > 0;
  const ratingLabel =
    ratingSummary.count > 0
      ? `${ratingSummary.average.toFixed(1)}/10`
      : "Rate";
  const ratingMeta =
    ratingSummary.count > 0
      ? `${ratingSummary.count} oy`
      : "Ilk puani sen ver";
  const ratingDescription =
    ratingSummary.count > 0
      ? `Avg ${ratingSummary.average.toFixed(1)}/10 · ${ratingSummary.count} oy`
      : `+${post.score} pts`;

  return (
    <article className="rounded-2xl bg-[color:var(--bg-card)] p-6 text-[color:var(--text-primary)] shadow-lg ring-1 ring-[color:var(--ring)] transition will-change-transform hover:translate-y-[1px] hover:ring-indigo-500/30">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
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
        </div>
        {funded && (
          <Badge className="rounded-full bg-[#F5C76A] text-xs font-semibold uppercase tracking-wide text-slate-800 shadow-sm">
            Funded
          </Badge>
        )}
      </header>

        <div className="mt-4 space-y-4">
          <p className="whitespace-pre-wrap text-sm text-[color:var(--text-primary)]">{post.content}</p>

          {media.length > 0 && <ImageGrid images={media} />}

        {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-indigo-400">
            {hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 font-semibold">
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
              className={`h-9 gap-2 rounded-full hover:bg-indigo-500/10 ${
                viewerState.liked ? "text-rose-500" : "text-[color:var(--text-secondary)]"
              }`}
              onClick={handleLike}
              disabled={likePending}
            >
              <Heart
                className={`h-4 w-4 ${viewerState.liked ? "fill-rose-500" : ""}`}
              />
              {engagement.upvotes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-2 rounded-full hover:bg-indigo-500/10 ${
                commentsOpen ? "text-indigo-600" : "text-[color:var(--text-secondary)]"
              }`}
              onClick={toggleComments}
            >
              <MessageCircle className="h-4 w-4" />
              {engagement.comments}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 rounded-full text-[color:var(--text-secondary)] hover:bg-indigo-500/10"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              {engagement.shares}
            </Button>
            <Popover open={ratingOpen} onOpenChange={setRatingOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-full text-[color:var(--text-secondary)] hover:bg-indigo-500/10"
                >
                  <Star
                    className={`h-4 w-4 ${
                      viewerState.rating ? "fill-amber-400 text-amber-500" : ""
                    }`}
                  />
                  {ratingLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-64 rounded-2xl border border-indigo-100 bg-white p-4 shadow-xl"
              >
                <div className="text-xs font-semibold text-slate-600">
                  Skor sec (1-10)
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {ratingScale.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRate(value)}
                      disabled={ratingPending}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        viewerState.rating === value
                          ? "border-amber-400 bg-amber-50 text-amber-600"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">{ratingMeta}</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-xs font-semibold text-indigo-400">{ratingDescription}</div>
        </div>
        <AIInsightStrip
          signal={post.aiSignal}
          volatility={post.aiVolatility}
          mmActivity={post.aiMmActivity}
          score={post.aiScore}
        />
        <PostComments
          postId={post.id}
          open={commentsOpen}
          onSyncCount={(count) =>
            setEngagement((prev) => ({
              ...prev,
              comments: count,
            }))
          }
          onIncrement={() =>
            setEngagement((prev) => ({ ...prev, comments: prev.comments + 1 }))
          }
        />
      </footer>
    </article>
  );
};
