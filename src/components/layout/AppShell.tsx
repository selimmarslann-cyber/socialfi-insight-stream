import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LeftRail } from "@/components/layout/LeftRail";
import BoostedTasks from "@/components/BoostedTasks";
import TokenBurn from "@/components/TokenBurn";
import CryptoNews from "@/components/CryptoNews";
import { TrendingUsers } from "@/components/widgets/TrendingUsers";

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <Header />
      <div className="px-4 pb-10 pt-6 md:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.8fr)_minmax(0,1.2fr)] lg:gap-5 xl:gap-6">
          <div className="space-y-4 lg:space-y-5">
            <LeftRail />
          </div>
          <main className="space-y-4 lg:space-y-5">
            <Outlet />
          </main>
          <aside className="space-y-4 lg:space-y-5">
            <TrendingUsers limit={4} />
            <CryptoNews />
            <TokenBurn />
            <BoostedTasks />
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AppShell;
