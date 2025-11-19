import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { listMyPositionNfts } from "@/lib/positionNft";
import { getActiveChain } from "@/config/chains";
import { formatUnits } from "ethers";

type PositionNFTsCardProps = {
  walletAddress: string;
};

export function PositionNFTsCard({ walletAddress }: PositionNFTsCardProps) {
  const { data: nfts, isLoading, error } = useQuery({
    queryKey: ["position-nfts", walletAddress],
    queryFn: () => listMyPositionNfts(walletAddress),
    enabled: Boolean(walletAddress),
    staleTime: 60 * 1000, // 1 minute
  });

  const chain = getActiveChain();

  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Position NFTs</h2>
        <Skeleton className="h-32 w-full rounded-2xl" />
      </Card>
    );
  }

  if (error || !nfts || nfts.length === 0) {
    return (
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Position NFTs</h2>
        <div className="rounded-2xl border border-border-subtle bg-card/70 p-6 text-center text-sm text-text-secondary">
          {error ? "Failed to load position NFTs" : "No position NFTs found"}
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border bg-card p-6 shadow-card-soft">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Position NFTs</h2>
      <div className="space-y-3">
        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            className="rounded-2xl border border-border-subtle bg-card/70 p-4 transition hover:border-indigo-300 hover:bg-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full text-xs">
                    Token #{nft.tokenId}
                  </Badge>
                  {nft.tag && (
                    <span className="text-xs text-text-secondary">{nft.tag}</span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Pool:</span>
                    <a
                      href={`${chain.explorerUrl}/address/${nft.poolAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
                    >
                      {`${nft.poolAddress.slice(0, 6)}…${nft.poolAddress.slice(-4)}`}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Amount:</span>
                    <span className="font-semibold text-text-primary">
                      {formatUnits(nft.amount, 18)} NOP
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Created:</span>
                    <span className="text-text-secondary">
                      {new Date(nft.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

