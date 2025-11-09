import { useQuery } from '@tanstack/react-query';
import { Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchBoostEvents } from '@/lib/mock-api';

export const EventsBoost = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['boostEvents'],
    queryFn: fetchBoostEvents,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Boosted Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          Boosted Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data?.map((event) => (
          <div
            key={event.id}
            className="p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium">{event.title}</h4>
              <Badge variant="secondary" className="text-xs">
                {event.multiplier}x
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {event.description}
            </p>
            <Button size="sm" className="w-full" variant="outline">
              Start Task
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
