import { useQuery } from '@tanstack/react-query';
import { Newspaper, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  link: string;
}

const fetchCryptoNews = async (): Promise<NewsItem[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return [
    {
      id: '1',
      title: 'Bitcoin ETF sees record inflows',
      source: 'CoinDesk',
      time: '2h ago',
      link: '#',
    },
    {
      id: '2',
      title: 'Ethereum upgrades complete successfully',
      source: 'Decrypt',
      time: '4h ago',
      link: '#',
    },
    {
      id: '3',
      title: 'DeFi TVL reaches new all-time high',
      source: 'The Block',
      time: '6h ago',
      link: '#',
    },
    {
      id: '4',
      title: 'Major exchange lists new token pairs',
      source: 'CryptoSlate',
      time: '8h ago',
      link: '#',
    },
    {
      id: '5',
      title: 'Regulatory clarity improves market sentiment',
      source: 'Cointelegraph',
      time: '10h ago',
      link: '#',
    },
  ];
};

export const CryptoNews = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['cryptoNews'],
    queryFn: fetchCryptoNews,
    refetchInterval: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Crypto News</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-accent" />
          Crypto News
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data?.map((item) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium mb-1 line-clamp-2 group-hover:text-accent transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
};
