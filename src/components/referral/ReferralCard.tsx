/**
 * Referral Card Component
 * Displays referral code and statistics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateReferralCode, getReferralStats, type ReferralStats } from "@/lib/referral";
import { useWalletStore } from "@/lib/store";
import { Copy, Share2, Users, Coins, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function ReferralCard() {
  const { address } = useWalletStore();
  const [copied, setCopied] = useState(false);

  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ["referral-code", address],
    queryFn: () => (address ? getOrCreateReferralCode(address) : Promise.resolve("")),
    enabled: !!address,
    staleTime: 300_000, // 5 minutes
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["referral-stats", address],
    queryFn: () => (address ? getReferralStats(address) : Promise.resolve(null)),
    enabled: !!address,
    staleTime: 60_000,
  });

  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join NOP Intelligence Layer",
          text: "Check out this SocialFi platform!",
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>Connect your wallet to get your referral code</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Referral Program
        </CardTitle>
        <CardDescription>Invite friends and earn rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Your Referral Code</label>
          {codeLoading ? (
            <Skeleton className="h-12 w-full rounded-xl" />
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border-2 border-indigo-500 bg-indigo-50 p-3 text-center font-mono text-lg font-bold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                {referralCode || "Loading..."}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="rounded-xl"
              >
                <Copy className={`h-4 w-4 ${copied ? "text-green-500" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="rounded-xl"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Referral Link */}
        {referralLink && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Referral Link</label>
            <div className="rounded-xl border bg-muted/50 p-2 text-xs text-muted-foreground break-all">
              {referralLink}
            </div>
          </div>
        )}

        {/* Statistics */}
        {statsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Total Referrals</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.totalReferrals}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {stats.completedReferrals} completed
              </Badge>
            </div>
            <div className="rounded-xl border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>Total Rewards</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.totalRewards.toFixed(1)}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {stats.pendingRewards.toFixed(1)} pending
              </Badge>
            </div>
          </div>
        ) : null}

        {/* Info */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-300">
          <p className="font-semibold">How it works:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Share your referral link with friends</li>
            <li>When they sign up and complete their first action, you earn 10 NOP</li>
            <li>Track your referrals and rewards here</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

