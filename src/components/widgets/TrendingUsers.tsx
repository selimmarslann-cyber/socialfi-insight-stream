import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTrendingUsers } from '@/lib/mock-api';

interface TrendingUsersProps {
  limit?: number;
}

export const TrendingUsers = ({ limit = 10 }: TrendingUsersProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['trendingUsers'],
    queryFn: fetchTrendingUsers,
  });

  const displayUsers = data?.slice(0, limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Trending Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-positive" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-negative" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" />
          {limit === 5 ? 'Top 5 Users' : 'Top 10 Users'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayUsers?.map((user) => (
          <div
            key={user.username}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-secondary/50 ${
              user.rank <= 3 ? 'bg-accent/5 border border-accent/20' : ''
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.rank <= 3 && (
                  <Trophy className="absolute -top-1 -right-1 h-4 w-4 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">@{user.username}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{user.score.toLocaleString()} pts</span>
                  {getTrendIcon(user.trend)}
                </div>
              </div>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              #{user.rank}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
