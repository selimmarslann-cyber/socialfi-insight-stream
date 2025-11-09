import { Header } from '@/components/layout/Header';
import { LeftRail } from '@/components/layout/LeftRail';
import { Container } from '@/components/layout/Container';
import { TrendingUsers } from '@/components/widgets/TrendingUsers';
import { BurnCounter } from '@/components/widgets/BurnCounter';
import { CryptoNews } from '@/components/news/CryptoNews';
import { FeedList } from '@/components/feed/FeedList';
import { PostComposer } from '@/components/feed/PostComposer';

const Index = () => {
  return (
    <>
      <Header />
      <Container>
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-6">
          {/* Left Rail */}
          <LeftRail />

          {/* Main Feed */}
          <main className="min-w-0">
            <FeedList />
          </main>

          {/* Right Rail */}
          <aside className="hidden lg:block space-y-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto pb-8">
            <TrendingUsers limit={5} />
            <CryptoNews />
            <BurnCounter />
          </aside>
        </div>
      </Container>
      <PostComposer />
    </>
  );
};

export default Index;
