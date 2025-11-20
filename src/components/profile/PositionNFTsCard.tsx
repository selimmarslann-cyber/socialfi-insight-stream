import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExternalLink, Send, Wallet } from "lucide-react";
import { listMyPositionNfts, transferPositionNft } from "@/lib/positionNft";
import { getActiveChain } from "@/config/chains";
import { formatUnits } from "ethers";
import { toast } from "sonner";
import { useWalletStore } from "@/lib/store";

type PositionNFTsCardProps = {
  walletAddress: string;
};

export function PositionNFTsCard({ walletAddress }: PositionNFTsCardProps) {
  const { address: connectedAddress } = useWalletStore();
  const queryClient = useQueryClient();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const { data: nfts, isLoading, error } = useQuery({
    queryKey: ["position-nfts", walletAddress],
    queryFn: () => listMyPositionNfts(walletAddress),
    enabled: Boolean(walletAddress),
    staleTime: 60 * 1000, // 1 minute
  });

  const chain = getActiveChain();
  const isOwner = connectedAddress?.toLowerCase() === walletAddress.toLowerCase();

  const handleTransfer = async () => {
    if (!selectedTokenId || !transferToAddress) {
      toast.error("Please enter a valid recipient address");
      return;
    }

    setIsTransferring(true);
    try {
      const txHash = await transferPositionNft(selectedTokenId, transferToAddress);
      if (txHash) {
        toast.success("NFT transferred successfully!", {
          description: `Transaction: ${txHash.slice(0, 10)}...`,
        });
        setTransferDialogOpen(false);
        setTransferToAddress("");
        setSelectedTokenId(null);
        // Refresh NFT list
        queryClient.invalidateQueries({ queryKey: ["position-nfts"] });
      }
    } catch (error) {
      console.error("[PositionNFTsCard] Transfer failed", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to transfer NFT"
      );
    } finally {
      setIsTransferring(false);
    }
  };

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
              {isOwner && (
                <Dialog
                  open={transferDialogOpen && selectedTokenId === nft.tokenId}
                  onOpenChange={(open) => {
                    setTransferDialogOpen(open);
                    if (!open) {
                      setSelectedTokenId(null);
                      setTransferToAddress("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setSelectedTokenId(nft.tokenId);
                        setTransferDialogOpen(true);
                      }}
                    >
                      <Send className="h-4 w-4" />
                      Transfer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transfer Position NFT</DialogTitle>
                      <DialogDescription>
                        Transfer this NFT to another wallet or cold wallet. The recipient will own the NFT and can view it in their wallet.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="tokenId">Token ID</Label>
                        <Input
                          id="tokenId"
                          value={nft.tokenId}
                          disabled
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient Address</Label>
                        <Input
                          id="recipient"
                          placeholder="0x..."
                          value={transferToAddress}
                          onChange={(e) => setTransferToAddress(e.target.value)}
                          className="font-mono"
                        />
                        <p className="text-xs text-text-muted">
                          Enter the wallet address (hot or cold wallet) to receive this NFT
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                        <strong>Note:</strong> This will transfer ownership of the NFT. The recipient will be able to view and transfer it from their wallet.
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTransferDialogOpen(false);
                          setSelectedTokenId(null);
                          setTransferToAddress("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleTransfer}
                        disabled={isTransferring || !transferToAddress}
                      >
                        {isTransferring ? "Transferring..." : "Transfer NFT"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

