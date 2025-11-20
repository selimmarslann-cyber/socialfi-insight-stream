/**
 * Copy Trading Page
 * Manage copy trading settings and view statistics
 */

import { CopyTradingCard } from "@/components/copyTrading/CopyTradingCard";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Container } from "@/components/layout/Container";

export default function CopyTrading() {
  usePageMetadata({
    title: "Copy Trading — NOP Intelligence Layer",
    description: "Automatically copy trades from top traders",
  });

  return (
    <Container>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Copy Trading</h1>
          <p className="text-muted-foreground">
            Automatically copy trades from successful traders and build your portfolio
          </p>
        </div>
        <CopyTradingCard />
      </div>
    </Container>
  );
}

