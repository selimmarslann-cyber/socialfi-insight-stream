import { Container } from '@/components/layout/Container';
import { LeftRail } from '@/components/layout/LeftRail';
import { FeedList } from '@/components/feed/FeedList';
import { PostComposer } from '@/components/post/PostComposer';
import CryptoNews from '@/components/CryptoNews';
import TokenBurn from '@/components/TokenBurn';
import { TrendingUsers } from '@/components/widgets/TrendingUsers';

const Index = () => {
    return (
      <Container>
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <LeftRail />

          <main className="min-w-0 space-y-6">
            <PostComposer />
            <FeedList />
          </main>

          <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] space-y-6 overflow-y-auto pb-10 lg:block">
            <TrendingUsers limit={5} />
            <CryptoNews />
            <TokenBurn />
          </aside>

          <div className="space-y-6 lg:hidden">
            <TrendingUsers limit={5} />
            <CryptoNews />
            <TokenBurn />
          </div>
        </div>
      </Container>
    );
};

export default Index;
