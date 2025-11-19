import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/store";
import { DEFAULT_CHAIN } from "@/config/chains";
import { toast } from "sonner";

export function NetworkStatus() {
  const { connected, chainId } = useWalletStore();
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);

  useEffect(() => {
    if (!connected || typeof window === "undefined" || !window.ethereum) {
      setCurrentChainId(null);
      return;
    }

    const updateChainId = async () => {
      try {
        const provider = window.ethereum;
        const network = await provider.request({ method: "eth_chainId" });
        const chainId = Number.parseInt(network as string, 16);
        setCurrentChainId(chainId);
      } catch (error) {
        console.warn("[NetworkStatus] Failed to get chain ID", error);
      }
    };

    updateChainId();

    // Listen for chain changes
    const handleChainChanged = () => {
      updateChainId();
    };

    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connected]);

  const expectedChainId = DEFAULT_CHAIN.id;
  const isCorrectNetwork = currentChainId === expectedChainId;

  if (!connected || currentChainId === null) {
    return null;
  }

  const handleSwitchNetwork = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
      });
      toast.success("Network switched successfully");
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${expectedChainId.toString(16)}`,
                chainName: DEFAULT_CHAIN.name,
                rpcUrls: [DEFAULT_CHAIN.rpcUrl],
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                blockExplorerUrls: [DEFAULT_CHAIN.explorerUrl],
              },
            ],
          });
          toast.success("Network added and switched");
        } catch (addError) {
          console.error("[NetworkStatus] Failed to add network", addError);
          toast.error("Failed to add network");
        }
      } else {
        console.error("[NetworkStatus] Failed to switch network", switchError);
        toast.error("Failed to switch network");
      }
    }
  };

  if (isCorrectNetwork) {
    return (
      <Badge
        variant="outline"
        className="hidden items-center gap-1.5 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 sm:flex"
      >
        <CheckCircle className="h-3 w-3" />
        {DEFAULT_CHAIN.name} bağlı
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Yanlış ağ. Lütfen {DEFAULT_CHAIN.name} ağına geçin.</span>
      <span className="sm:hidden">Yanlış ağ</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 rounded-full bg-amber-500/20 px-2 text-xs hover:bg-amber-500/30"
        onClick={handleSwitchNetwork}
      >
        Geç
      </Button>
    </div>
  );
}

