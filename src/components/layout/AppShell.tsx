import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LeftRail } from "@/components/layout/LeftRail";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
export const AppShell = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <div className="px-3 pb-20 pt-4 sm:px-4 sm:pb-12 sm:pt-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl gap-4 lg:gap-6">
          <aside className="hidden w-[240px] shrink-0 md:flex md:flex-col lg:w-64">
            <LeftRail />
          </aside>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default AppShell;
