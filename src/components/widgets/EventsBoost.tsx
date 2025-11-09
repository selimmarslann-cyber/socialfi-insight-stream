import { Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { boostEvents } from '@/data/boost';
import type { BoostConfig } from '@/types/rewards';
import { hasClaimed } from '@/lib/rewards';
import { useWalletStore } from '@/lib/store';

export const EventsBoost = () => {
  const { address } = useWalletStore();
  const userId = address ?? 'guest';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          Boosted Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {boostEvents.map((event: BoostConfig) => {
          const claimed = hasClaimed(userId, event.key);
          return (
            <div
              key={event.key}
              className="p-3 rounded-md border bg-card transition-colors hover:bg-accent/5"
            >
              <div className="mb-2 flex items-start justify-between">
                <h4 className="text-sm font-medium">{event.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  +{event.reward.toLocaleString('tr-TR')} NOP
                </Badge>
              </div>
              <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-warning" />
                Tek seferlik ödül · {claimed ? 'Alındı' : 'Bekliyor'}
              </p>
              <Button
                size="sm"
                className="w-full"
                variant={claimed ? 'secondary' : 'outline'}
              >
                {claimed ? 'İlerlemeyi görüntüle' : 'Göreve git'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
