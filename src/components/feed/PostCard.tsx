import { ArrowUp, MessageCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Post } from '@/types/feed';

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card className="hover:bg-accent/5 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback>
              {post.author.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
              <div>
                <p className="font-medium text-sm">@{post.author.username}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {post.author.refCode}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {timeAgo(post.createdAt)}
              </span>
              {post.taskId && (
                <Badge variant="secondary" className="text-xs">
                  Task #{post.taskId}
                </Badge>
              )}
            </div>
            <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
            {post.imageUrl && (
              <div className="mb-3 rounded-lg border bg-muted/30 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={`Contribution visual from ${post.author.username}`}
                  className="w-full h-full object-cover max-h-72"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex items-center gap-4 text-muted-foreground">
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <ArrowUp className="h-4 w-4" />
                <span className="text-xs">{post.engagement.upvotes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{post.engagement.comments}</span>
              </Button>
              <div className="flex-1" />
              <span className="text-xs font-semibold text-accent">
                +{post.score} pts
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
