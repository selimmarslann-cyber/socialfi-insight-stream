import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/layout/Container";

interface StaticPageLayoutProps {
  children: ReactNode;
}

export const StaticPageLayout = ({ children }: StaticPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-secondary)]">
      <div className="border-b border-[color:var(--ring)] bg-[color:var(--bg-card)]/85 backdrop-blur md:sticky md:top-16 md:z-40 md:shadow-sm">
        <Container>
          <div className="flex flex-col gap-3 py-4 text-sm md:flex-row md:items-center md:justify-between">
            <Link
              to="/"
              className="text-lg font-semibold tracking-tight text-[color:var(--text-primary)]"
            >
              NOP Intelligence Layer
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-[color:var(--text-secondary)]">
              <Link className="transition hover:text-[color:var(--text-primary)]" to="/explore">
                Explore
              </Link>
              <Link className="transition hover:text-[color:var(--text-primary)]" to="/contributes">
                Contribute
              </Link>
              <Link className="transition hover:text-[color:var(--text-primary)]" to="/wallet">
                Wallet
              </Link>
              <Link className="transition hover:text-[color:var(--text-primary)]" to="/support">
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
    </div>
  );
};

export default StaticPageLayout;
