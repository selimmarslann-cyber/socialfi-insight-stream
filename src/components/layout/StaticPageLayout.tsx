import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import Footer from "@/components/layout/Footer";

interface StaticPageLayoutProps {
  children: ReactNode;
}

export const StaticPageLayout = ({ children }: StaticPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#F5F8FF] text-[#475569]">
      <div className="border-b border-slate-200 bg-white/85 backdrop-blur">
        <Container>
          <div className="flex flex-col gap-3 py-4 text-sm text-[#475569] md:flex-row md:items-center md:justify-between">
            <Link
              to="/"
              className="text-lg font-semibold tracking-tight text-[#0F172A]"
            >
              NOP Intelligence Layer
            </Link>
            <nav className="flex flex-wrap items-center gap-4">
              <Link className="transition hover:text-[#0F172A]" to="/explore">
                Explore
              </Link>
              <Link className="transition hover:text-[#0F172A]" to="/contributes">
                Contribute
              </Link>
              <Link className="transition hover:text-[#0F172A]" to="/games">
                Games
              </Link>
              <Link className="transition hover:text-[#0F172A]" to="/wallet">
                Wallet
              </Link>
              <Link className="transition hover:text-[#0F172A]" to="/support">
                Support
              </Link>
            </nav>
          </div>
        </Container>
      </div>

      <main className="py-16">
        <Container>
          <div className="mx-auto max-w-5xl">{children}</div>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default StaticPageLayout;
