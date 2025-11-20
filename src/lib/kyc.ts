/**
 * KYC/AML System
 * Basic KYC verification for compliance
 */

import { supabase } from "@/lib/supabaseClient";

export type KYCVerification = {
  id: string;
  walletAddress: string;
  verificationStatus: "pending" | "verified" | "rejected" | "expired";
  verificationLevel: "basic" | "intermediate" | "advanced";
  documentType?: string;
  documentHash?: string;
  verifiedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type KYCLevel = "basic" | "intermediate" | "advanced";

const KYC_EXPIRY_DAYS = 365; // 1 year

/**
 * Submit KYC verification request
 */
export async function submitKYCVerification(
  walletAddress: string,
  level: KYCLevel,
  documentHash?: string,
  documentType?: string
): Promise<KYCVerification> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalized = walletAddress.toLowerCase().trim();

  // Check if already exists
  const { data: existing } = await supabase
    .from("kyc_verifications")
    .select("id, verification_status")
    .eq("wallet_address", normalized)
    .single();

  if (existing && existing.verification_status === "verified") {
    throw new Error("Already verified");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + KYC_EXPIRY_DAYS);

  const { data: verification, error } = await supabase
    .from("kyc_verifications")
    .upsert(
      {
        wallet_address: normalized,
        verification_status: "pending",
        verification_level: level,
        document_type: documentType,
        document_hash: documentHash,
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: "wallet_address",
      }
    )
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: verification.id,
    walletAddress: verification.wallet_address,
    verificationStatus: verification.verification_status,
    verificationLevel: verification.verification_level,
    documentType: verification.document_type,
    documentHash: verification.document_hash,
    verifiedAt: verification.verified_at,
    expiresAt: verification.expires_at,
    metadata: verification.metadata as Record<string, unknown> | undefined,
    createdAt: verification.created_at,
    updatedAt: verification.updated_at,
  };
}

/**
 * Get KYC status for a wallet
 */
export async function getKYCStatus(walletAddress: string): Promise<KYCVerification | null> {
  if (!supabase) {
    return null;
  }

  const normalized = walletAddress.toLowerCase().trim();

  const { data: verification, error } = await supabase
    .from("kyc_verifications")
    .select("*")
    .eq("wallet_address", normalized)
    .single();

  if (error || !verification) {
    return null;
  }

  // Check if expired
  if (verification.expires_at && new Date(verification.expires_at) < new Date()) {
    // Update status to expired
    await supabase
      .from("kyc_verifications")
      .update({ verification_status: "expired" })
      .eq("id", verification.id);

    return {
      ...verification,
      verificationStatus: "expired",
    } as KYCVerification;
  }

  return {
    id: verification.id,
    walletAddress: verification.wallet_address,
    verificationStatus: verification.verification_status,
    verificationLevel: verification.verification_level,
    documentType: verification.document_type,
    documentHash: verification.document_hash,
    verifiedAt: verification.verified_at,
    expiresAt: verification.expires_at,
    metadata: verification.metadata as Record<string, unknown> | undefined,
    createdAt: verification.created_at,
    updatedAt: verification.updated_at,
  };
}

/**
 * Check if wallet is KYC verified
 */
export async function isKYCVerified(walletAddress: string): Promise<boolean> {
  const status = await getKYCStatus(walletAddress);
  return status?.verificationStatus === "verified" && status.verificationLevel !== undefined;
}

/**
 * Get KYC level for a wallet
 */
export async function getKYCLevel(walletAddress: string): Promise<KYCLevel | null> {
  const status = await getKYCStatus(walletAddress);
  if (status?.verificationStatus === "verified") {
    return status.verificationLevel;
  }
  return null;
}

/**
 * Verify KYC (admin/service role only)
 */
export async function verifyKYC(
  walletAddress: string,
  status: "verified" | "rejected",
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const normalized = walletAddress.toLowerCase().trim();

  const updateData: Record<string, unknown> = {
    verification_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === "verified") {
    updateData.verified_at = new Date().toISOString();
  }

  if (metadata) {
    updateData.metadata = metadata;
  }

  const { error } = await supabase
    .from("kyc_verifications")
    .update(updateData)
    .eq("wallet_address", normalized);

  if (error) throw error;

  // Update profile KYC status
  await supabase
    .from("social_profiles")
    .update({
      kyc_verified: status === "verified",
      kyc_level: status === "verified" ? "basic" : null,
    })
    .eq("wallet_address", normalized);
}

/**
 * Check if action requires KYC
 */
export function requiresKYC(action: "trade" | "withdraw" | "create_pool"): boolean {
  // Basic implementation - can be customized based on requirements
  switch (action) {
    case "trade":
      return false; // Trading doesn't require KYC for now
    case "withdraw":
      return true; // Withdrawals require KYC
    case "create_pool":
      return false; // Creating pools doesn't require KYC
    default:
      return false;
  }
}

/**
 * Validate KYC before action
 */
export async function validateKYCForAction(
  walletAddress: string,
  action: "trade" | "withdraw" | "create_pool"
): Promise<{ allowed: boolean; reason?: string }> {
  if (!requiresKYC(action)) {
    return { allowed: true };
  }

  const isVerified = await isKYCVerified(walletAddress);

  if (!isVerified) {
    return {
      allowed: false,
      reason: "KYC verification required for this action",
    };
  }

  return { allowed: true };
}

