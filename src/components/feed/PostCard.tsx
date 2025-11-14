import { useMemo } from 'react';
import {
  BadgeCheck,
  Clock,
  Heart,
  MessageCircle,
  Share2,
  Coins,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Post } from '@/types/feed';
import { ImageGrid } from '@/components/post/ImageGrid';
import { AIInsightStrip } from '@/components/ai/AIInsightStrip';

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
  const funded = (post.contributedAmount ?? 0) > 0;

  return (
    <article className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-indigo-500/10 transition will-change-transform hover:translate-y-[1px] hover:ring-indigo-500/20">
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
              <span className="font-semibold text-slate-900">{post.author.displayName}</span>
              {post.author.verified && <BadgeCheck className="h-4 w-4 text-cyan-500" />}
              <span className="text-slate-500">@{post.author.username}</span>
              <span className="text-slate-400">·</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {timeAgo(post.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
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
        <p className="whitespace-pre-wrap text-sm text-slate-800">{post.content}</p>

        {post.images && post.images.length > 0 && <ImageGrid images={post.images} />}

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-indigo-600">
            {hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 font-semibold">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-5 space-y-4 text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 rounded-full text-slate-600 hover:bg-indigo-50"
            >
              <Heart className="h-4 w-4" />
              {post.engagement.upvotes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 rounded-full text-slate-600 hover:bg-indigo-50"
            >
              <MessageCircle className="h-4 w-4" />
              {post.engagement.comments}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 rounded-full text-slate-600 hover:bg-indigo-50"
            >
              <Share2 className="h-4 w-4" />
              {post.engagement.shares}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 rounded-full text-slate-600 hover:bg-indigo-50"
            >
              <Coins className="h-4 w-4 text-[#F5C76A]" />
              {post.engagement.tips}
            </Button>
          </div>
          <div className="text-xs font-semibold text-indigo-600">+{post.score} pts</div>
        </div>
        <AIInsightStrip
          signal={post.aiSignal}
          volatility={post.aiVolatility}
          mmActivity={post.aiMmActivity}
          score={post.aiScore}
        />
      </footer>
    </article>
  );
};
