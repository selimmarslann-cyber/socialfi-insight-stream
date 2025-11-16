import { Container } from '@/components/layout/Container';
import { LeftRail } from '@/components/layout/LeftRail';
import { AIMarketBar } from '@/components/ai/AIMarketBar';
import CryptoNews from '@/components/CryptoNews';
import TokenBurn from '@/components/TokenBurn';
import TopUsersCard from '@/components/TopUsersCard';
import { PostComposer } from '@/components/post/PostComposer';
import { FeedList } from '@/components/feed/FeedList';

const Index = () => {
  return (
    <div className="bg-[#F5F8FF]">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <LeftRail />
          <div className="min-w-0">
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-0">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  NOP Intelligence Layer
                </div>
                <div className="text-2xl font-semibold text-slate-900">
                  AI Market Scanner
                </div>
                <p className="text-sm text-slate-500">
                  Live intelligence spanning chains, wallets, and creators.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <AIMarketBar />
                <div className="h-full">
                  <TopUsersCard title="Top 5 Users" period="weekly" limit={5} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <PostComposer />
                <CryptoNews className="h-full" />
              </div>
            </div>

            <div className="mx-auto max-w-5xl space-y-6 px-4 pb-12 lg:px-0">
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">Live SocialFi feed</h2>
                  <span className="text-xs text-slate-500">Powered by the community</span>
                </div>
                <FeedList />
              </section>
              <TokenBurn />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Index;
