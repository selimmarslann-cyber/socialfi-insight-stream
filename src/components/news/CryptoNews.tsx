import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, ExternalLink, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const DECRYPT_NEWS_URL =
  'https://decrypt.co/wp-json/wp/v2/posts?per_page=6&_embed=1';

interface NewsItem {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

interface DecryptPost {
  id: number;
  link: string;
  date_gmt: string;
  title: {
    rendered: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
      media_details?: {
        sizes?: Record<string, { source_url: string }>;
      };
    }>;
  };
}

const decodeHtml = (input: string) => {
  if (typeof window === 'undefined') {
    return input;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');
  return doc.documentElement.textContent ?? input;
};

const extractImage = (post: DecryptPost) => {
  const featured = post._embedded?.['wp:featuredmedia']?.[0];
  if (!featured) {
    return undefined;
  }

  const sizes = featured.media_details?.sizes;
  if (sizes) {
    const preferredOrder = ['medium_large', 'large', 'medium', 'full'];
    for (const key of preferredOrder) {
      const candidate = sizes[key];
      if (candidate?.source_url) {
        return candidate.source_url;
      }
    }
  }

  return featured.source_url;
};

const fetchCryptoNews = async (): Promise<NewsItem[]> => {
  const response = await fetch(DECRYPT_NEWS_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Decrypt news');
  }

  const posts: DecryptPost[] = await response.json();

  return posts.map((post) => ({
    id: post.id,
    title: decodeHtml(post.title.rendered),
    url: post.link,
    publishedAt: post.date_gmt,
    imageUrl: extractImage(post),
  }));
};

export const CryptoNews = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['cryptoNews'],
    queryFn: fetchCryptoNews,
    refetchInterval: 5 * 60_000, // 5 minutes
    staleTime: 2 * 60_000,
  });

  const now = useMemo(() => new Date(), [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Crypto News</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-16 w-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Crypto News
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Decrypt haber akışı yüklenemedi. Lütfen tekrar deneyin.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-accent underline-offset-2 hover:underline"
          >
            {isRefetching ? 'Yenileniyor...' : 'Tekrar dene'}
          </button>
          {error instanceof Error && (
            <p className="text-xs text-muted-foreground/80">{error.message}</p>
          )}
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
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-accent/5"
          >
            <div className="h-16 w-20 overflow-hidden rounded-md border bg-muted/40">
              <img
                src={item.imageUrl || '/placeholder.svg'}
                alt={item.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="line-clamp-2 text-sm font-medium transition-colors hover:text-accent">
                {item.title}
              </h4>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Decrypt</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(item.publishedAt), {
                    addSuffix: true,
                    baseDate: now,
                  })}
                </span>
              </div>
            </div>
            <ExternalLink className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
};
