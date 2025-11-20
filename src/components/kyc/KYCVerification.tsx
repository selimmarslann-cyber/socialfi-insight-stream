/**
 * KYC Verification Component
 * UI for KYC verification submission and status
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getKYCStatus,
  submitKYCVerification,
  isKYCVerified,
  type KYCVerification,
  type KYCLevel,
} from "@/lib/kyc";
import { useWalletStore } from "@/lib/store";
import { Shield, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    label: "Pending Review",
  },
  verified: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    label: "Verified",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    label: "Rejected",
  },
  expired: {
    icon: AlertCircle,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    label: "Expired",
  },
};

export function KYCVerification() {
  const { address } = useWalletStore();
  const queryClient = useQueryClient();
  const [level, setLevel] = useState<KYCLevel>("basic");
  const [documentHash, setDocumentHash] = useState("");

  const { data: kycStatus, isLoading } = useQuery({
    queryKey: ["kyc-status", address],
    queryFn: () => (address ? getKYCStatus(address) : Promise.resolve(null)),
    enabled: !!address,
    staleTime: 60_000,
  });

  const { data: isVerified } = useQuery({
    queryKey: ["kyc-verified", address],
    queryFn: () => (address ? isKYCVerified(address) : Promise.resolve(false)),
    enabled: !!address,
    staleTime: 60_000,
  });

  const submitMutation = useMutation({
    mutationFn: (data: { level: KYCLevel; documentHash?: string }) =>
      address
        ? submitKYCVerification(address, data.level, data.documentHash)
        : Promise.reject("No address"),
    onSuccess: () => {
      toast.success("KYC verification submitted");
      queryClient.invalidateQueries({ queryKey: ["kyc-status", address] });
      setDocumentHash("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit KYC verification");
    },
  });

  const handleSubmit = () => {
    if (!level) {
      toast.error("Please select a verification level");
      return;
    }
    submitMutation.mutate({
      level,
      documentHash: documentHash.trim() || undefined,
    });
  };

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
          <CardDescription>Connect your wallet to verify your identity</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const status = kycStatus?.verificationStatus || "none";
  const StatusIcon = status !== "none" ? STATUS_CONFIG[status].icon : Shield;
  const statusConfig = status !== "none" ? STATUS_CONFIG[status] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-500" />
          KYC Verification
        </CardTitle>
        <CardDescription>
          Verify your identity to access advanced features and higher limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {kycStatus && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              statusConfig?.bg || "bg-muted/50"
            }`}
          >
            <StatusIcon className={`h-6 w-6 ${statusConfig?.color || "text-muted-foreground"}`} />
            <div className="flex-1">
              <p className="font-semibold">{statusConfig?.label || "Not Verified"}</p>
              <p className="text-sm text-muted-foreground">
                Level: {kycStatus.verificationLevel}
                {kycStatus.verifiedAt && (
                  <> • Verified: {new Date(kycStatus.verifiedAt).toLocaleDateString()}</>
                )}
                {kycStatus.expiresAt && (
                  <> • Expires: {new Date(kycStatus.expiresAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
            {isVerified && (
              <Badge variant="default" className="bg-green-500">
                Verified
              </Badge>
            )}
          </div>
        )}

        {/* Submission Form */}
        {(!kycStatus || kycStatus.verificationStatus === "rejected" || kycStatus.verificationStatus === "expired") && (
          <div className="space-y-4 rounded-xl border bg-muted/50 p-4">
            <div className="space-y-2">
              <Label htmlFor="kyc-level">Verification Level</Label>
              <Select value={level} onValueChange={(value) => setLevel(value as KYCLevel)}>
                <SelectTrigger id="kyc-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic - Email & Phone</SelectItem>
                  <SelectItem value="intermediate">Intermediate - ID Document</SelectItem>
                  <SelectItem value="advanced">Advanced - Full KYC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-hash">Document Hash (Optional)</Label>
              <input
                id="document-hash"
                type="text"
                placeholder="0x..."
                value={documentHash}
                onChange={(e) => setDocumentHash(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Upload your document and paste the hash here (for advanced verification)
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !level}
              className="w-full"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Verification"}
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-300">
          <p className="font-semibold">Why verify?</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Access to higher trading limits</li>
            <li>Withdrawal capabilities</li>
            <li>Enhanced account security</li>
            <li>Compliance with regulations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

