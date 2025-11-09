import { Header } from '@/components/layout/Header';
import { Container } from '@/components/layout/Container';
import { TopGainers } from '@/components/widgets/TopGainers';
import { EventsBoost } from '@/components/widgets/EventsBoost';
import { TrendingUsers } from '@/components/widgets/TrendingUsers';
import { BurnCounter } from '@/components/widgets/BurnCounter';
import { FeedList } from '@/components/feed/FeedList';
import { PostComposer } from '@/components/feed/PostComposer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-6">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-6">
            {/* Left Rail */}
            <aside className="space-y-6 order-3 lg:order-1">
              <TopGainers />
              <EventsBoost />
            </aside>

            {/* Main Feed */}
            <section className="order-1 lg:order-2">
              <FeedList />
              <PostComposer />
            </section>

            {/* Right Rail */}
            <aside className="space-y-6 order-2 lg:order-3">
              <TrendingUsers />
              <BurnCounter />
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
};

export default Index;
