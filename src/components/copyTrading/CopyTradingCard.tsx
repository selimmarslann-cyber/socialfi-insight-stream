/**
 * Copy Trading Card Component
 * UI for managing copy trading
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  enableCopyTrading,
  disableCopyTrading,
  getCopyTrades,
  getCopyTradeStats,
  type CopyTrade,
} from "@/lib/copyTrading";
import { useWalletStore } from "@/lib/store";
import { Copy, Users, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function CopyTradingCard() {
  const { address } = useWalletStore();
  const queryClient = useQueryClient();
  const [copiedAddress, setCopiedAddress] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [autoSell, setAutoSell] = useState(false);

  const { data: copyTrades, isLoading: tradesLoading } = useQuery({
    queryKey: ["copy-trades", address],
    queryFn: () => (address ? getCopyTrades(address) : Promise.resolve([])),
    enabled: !!address,
    staleTime: 60_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["copy-trade-stats", address],
    queryFn: () => (address ? getCopyTradeStats(address) : Promise.resolve(null)),
    enabled: !!address,
    staleTime: 60_000,
  });

  const enableMutation = useMutation({
    mutationFn: (data: { copiedAddress: string; maxAmount?: number; autoSell: boolean }) =>
      address ? enableCopyTrading(address, data.copiedAddress, data) : Promise.reject("No address"),
    onSuccess: () => {
      toast.success("Copy trading enabled");
      queryClient.invalidateQueries({ queryKey: ["copy-trades", address] });
      setCopiedAddress("");
      setMaxAmount("");
      setAutoSell(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to enable copy trading");
    },
  });

  const disableMutation = useMutation({
    mutationFn: (copiedAddress: string) => (address ? disableCopyTrading(address, copiedAddress) : Promise.reject("No address")),
    onSuccess: () => {
      toast.success("Copy trading disabled");
      queryClient.invalidateQueries({ queryKey: ["copy-trades", address] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disable copy trading");
    },
  });

  const handleEnable = () => {
    if (!copiedAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }
    enableMutation.mutate({
      copiedAddress: copiedAddress.trim(),
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      autoSell,
    });
  };

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Copy Trading</CardTitle>
          <CardDescription>Connect your wallet to enable copy trading</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-indigo-500" />
            Copy Trading
          </CardTitle>
          <CardDescription>Automatically copy trades from top traders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Copy Trading */}
          <div className="space-y-4 rounded-xl border bg-muted/50 p-4">
            <div className="space-y-2">
              <Label htmlFor="copied-address">Trader Wallet Address</Label>
              <Input
                id="copied-address"
                placeholder="0x..."
                value={copiedAddress}
                onChange={(e) => setCopiedAddress(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-amount">Max Amount Per Trade (NOP, optional)</Label>
              <Input
                id="max-amount"
                type="number"
                placeholder="1000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sell">Auto-sell when trader sells</Label>
              <Switch id="auto-sell" checked={autoSell} onCheckedChange={setAutoSell} />
            </div>
            <Button
              onClick={handleEnable}
              disabled={enableMutation.isPending || !copiedAddress.trim()}
              className="w-full"
            >
              {enableMutation.isPending ? "Enabling..." : "Enable Copy Trading"}
            </Button>
          </div>

          {/* Active Copy Trades */}
          {tradesLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : copyTrades && copyTrades.length > 0 ? (
            <div className="space-y-2">
              <Label>Active Copy Trades</Label>
              {copyTrades
                .filter((ct) => ct.active)
                .map((ct) => (
                  <div
                    key={ct.id}
                    className="flex items-center justify-between rounded-xl border bg-card p-3"
                  >
                    <div className="flex-1">
                      <p className="font-mono text-sm font-semibold">
                        {ct.copiedAddress.slice(0, 6)}...{ct.copiedAddress.slice(-4)}
                      </p>
                      {ct.maxAmountPerTrade && (
                        <p className="text-xs text-muted-foreground">
                          Max: {ct.maxAmountPerTrade} NOP
                        </p>
                      )}
                      {ct.autoSell && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Auto-sell
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => disableMutation.mutate(ct.copiedAddress)}
                      disabled={disableMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          ) : null}

          {/* Statistics */}
          {statsLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/50 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Copied</p>
                <p className="text-xl font-bold">{stats.totalCopied}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-xl font-bold">{stats.winRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Profit</p>
                <p className="text-xl font-bold">{stats.totalProfit.toFixed(2)} NOP</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Copies</p>
                <p className="text-xl font-bold">{stats.activeCopies}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

