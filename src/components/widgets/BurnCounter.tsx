import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchBurnStats } from '@/lib/mock-api';

export const BurnCounter = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['burnStats'],
    queryFn: fetchBurnStats,
    refetchInterval: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Token Burn</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-negative/5 to-warning/5 border-negative/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-negative" />
          Token Burn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Burned</p>
          <p className="text-2xl font-bold font-mono">
            {data?.totalBurned.toLocaleString()}
          </p>
        </div>
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-1">Last 24 Hours</p>
          <p className="text-lg font-semibold text-negative font-mono">
            +{data?.last24h.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
