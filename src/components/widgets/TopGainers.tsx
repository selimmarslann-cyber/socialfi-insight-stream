import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTopGainers } from '@/lib/mock-api';

export const TopGainers = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['topGainers'],
    queryFn: fetchTopGainers,
    refetchInterval: 30000, // 30s
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Gainers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Gainers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-positive" />
          Top Gainers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data?.gainers.map((gainer) => (
          <div
            key={gainer.symbol}
            className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{gainer.symbol}</p>
              <p className="text-xs text-muted-foreground">
                ${gainer.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex items-center gap-1 text-positive">
              <TrendingUp className="h-3 w-3" />
              <span className="text-sm font-semibold">
                +{gainer.changePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
