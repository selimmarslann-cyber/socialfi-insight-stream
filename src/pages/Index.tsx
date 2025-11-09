import { Header } from '@/components/layout/Header';
import { LeftRail } from '@/components/layout/LeftRail';
import { Container } from '@/components/layout/Container';
import { TrendingUsers } from '@/components/widgets/TrendingUsers';
import { BurnCounter } from '@/components/widgets/BurnCounter';
import { CryptoNews } from '@/components/news/CryptoNews';
import { FeedList } from '@/components/feed/FeedList';
import { PostComposer } from '@/components/post/PostComposer';

const Index = () => {
  return (
    <>
      <Header />
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
            <BurnCounter />
          </aside>
        </div>
      </Container>
    </>
  );
};

export default Index;
