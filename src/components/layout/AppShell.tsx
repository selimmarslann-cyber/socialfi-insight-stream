import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LeftRail } from "@/components/layout/LeftRail";
export const AppShell = () => {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <Header />
      <div className="px-4 pb-10 pt-6 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl gap-4 lg:gap-6">
          <div className="hidden w-[240px] shrink-0 md:block">
            <LeftRail />
          </div>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AppShell;
