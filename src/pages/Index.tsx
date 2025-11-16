import { useState } from 'react';
import { Search, Settings } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { LeftRail } from '@/components/layout/LeftRail';
import { AIMarketBar } from '@/components/ai/AIMarketBar';
import CryptoNews from '@/components/CryptoNews';
import TokenBurn from '@/components/TokenBurn';
import TopUsersCard from '@/components/TopUsersCard';
import { PostComposer } from '@/components/post/PostComposer';
import { FeedList } from '@/components/feed/FeedList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { NopCounter } from '@/components/wallet/NopCounter';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="bg-[#F5F8FF]">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <LeftRail />
          <div className="min-w-0">
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-0">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                    NOP Intelligence Layer
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">AI Market Scanner</div>
                </div>

                <div className="flex w-full flex-col gap-3 lg:flex-1 lg:max-w-xl lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search assets, creators, chains…"
                      className="h-11 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <NopCounter />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900"
                    aria-label="Open settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <WalletConnectButton />
                </div>
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
