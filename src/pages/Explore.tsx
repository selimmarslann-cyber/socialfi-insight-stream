import { useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const mockTags = [
  { name: '#Bitcoin', posts: 1523 },
  { name: '#Ethereum', posts: 1204 },
  { name: '#DeFi', posts: 892 },
  { name: '#NFT', posts: 745 },
  { name: '#Web3', posts: 623 },
];

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore</h1>
          <p className="text-muted-foreground">
            Discover trending topics, tags, and people in the NOP community
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for topics, tags, or people..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="tags" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold">Trending Tags</h2>
            </div>
            <div className="space-y-3">
              {mockTags.map((tag) => (
                <Card
                  key={tag.name}
                  className="hover:bg-accent/5 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-accent">{tag.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tag.posts.toLocaleString()} posts
                      </p>
                    </div>
                    <Badge variant="secondary">{tag.posts}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4 mt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Search for posts using the search bar above
              </p>
            </div>
          </TabsContent>

          <TabsContent value="people" className="space-y-4 mt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Search for people using the search bar above
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
}
