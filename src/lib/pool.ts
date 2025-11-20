import type { ContractRunner, InterfaceAbi } from "ethers";
import { BrowserProvider, Contract, JsonRpcProvider, formatUnits, parseUnits } from "ethers";
import poolArtifact from "@/abi/NOPSocialPool.json";
import erc20Abi from "@/abi/erc20.json";
import { apiClient } from "@/lib/axios";
import { logTrade } from "@/lib/reputation";
import { logBuyPosition, logSellPosition } from "@/lib/positions";
import { mintPositionNft } from "@/lib/positionNft";
import { calculateFairFeeDistribution } from "@/lib/fairFeeDistribution";
import { recordCreatorEarnings } from "@/lib/creatorRewards";
import { getContributeAuthor, getBuyerCount } from "@/lib/contributeHelpers";
import { validateUserAction } from "@/lib/fairData";
import { checkAndAwardBadges } from "@/lib/badges";

const poolAbi = ((poolArtifact as { abi?: InterfaceAbi }).abi ?? (poolArtifact as InterfaceAbi)) as InterfaceAbi;
const tokenAbi = erc20Abi as InterfaceAbi;
const RPC_URL = import.meta.env.VITE_RPC_URL;
const rpcProvider = RPC_URL ? new JsonRpcProvider(RPC_URL) : null;

let browserProvider: BrowserProvider | null = null;

export function getPoolAddress(): string {
  // First try chain config
  try {
    const { getActiveChain } = await import("@/config/chains");
    const chain = getActiveChain();
    if (chain.nopPoolAddress) {
      return chain.nopPoolAddress;
    }
  } catch {
    // Fallback to env vars
  }
  
  // Fallback to environment variables
  const addr =
    import.meta.env.VITE_NOP_POOL_ADDRESS ||
    import.meta.env.VITE_POOL_ADDRESS ||
    import.meta.env.VITE_NEXT_PUBLIC_POOL_ADDRESS;
  if (!addr) throw new Error("Pool address is not configured. Set VITE_NOP_POOL_ADDRESS or deploy contract and update chains.ts");
  return addr;
}

function getTokenAddress(): string {
  // First try chain config
  try {
    const { getActiveChain } = require("@/config/chains");
    const chain = getActiveChain();
    if (chain.nopTokenAddress) {
      return chain.nopTokenAddress;
    }
  } catch {
    // Fallback to env vars
  }
  
  // Fallback to environment variables
  const addr = import.meta.env.VITE_NOP_TOKEN_ADDRESS || import.meta.env.VITE_TOKEN_ADDRESS;
  if (!addr) throw new Error("NOP token address is not configured. Set VITE_NOP_TOKEN_ADDRESS or update chains.ts");
  return addr;
}

function getDefaultRunner(runner?: ContractRunner): ContractRunner {
  if (runner) return runner;
  if (rpcProvider) return rpcProvider;
  if (browserProvider) return browserProvider;
  if (typeof window !== "undefined" && window.ethereum) {
    browserProvider = new BrowserProvider(window.ethereum);
    return browserProvider;
  }
  throw new Error("No RPC provider configured");
}

async function getSigner() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No Ethereum provider");
  }
  if (!browserProvider) {
    browserProvider = new BrowserProvider(window.ethereum);
  }
  return browserProvider.getSigner();
}

function getPoolContractInstance(signerOrProvider?: ContractRunner) {
  return new Contract(getPoolAddress(), poolAbi, getDefaultRunner(signerOrProvider));
}

function getTokenContractInstance(signerOrProvider?: ContractRunner) {
  return new Contract(getTokenAddress(), tokenAbi, getDefaultRunner(signerOrProvider));
}

function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string" && value.length > 0) return BigInt(value);
  if (value && typeof value === "object" && "toString" in value) {
    return BigInt((value as { toString(): string }).toString());
  }
  return 0n;
}

export async function getAllowance(owner: string): Promise<bigint> {
  if (!owner) return 0n;
  const signer = await getSigner();
  const token = getTokenContractInstance(signer);
  const result = await token.allowance(owner, getPoolAddress());
  return toBigInt(result);
}

export async function approveToken(maxAmount?: string | bigint) {
  const signer = await getSigner();
  const token = getTokenContractInstance(signer);
  const amount =
    typeof maxAmount === "bigint" ? maxAmount : parseUnits(maxAmount ?? "1000000", 18);
  const tx = await token.approve(getPoolAddress(), amount);
  return tx.wait();
}

export async function buyShares(postId: number, amountNop: number, contributeTitle?: string) {
  const signer = await getSigner();
  const user = await signer.getAddress();
  
  // Validate action (fair data, prevent inflation)
  const validation = await validateUserAction(user, "trade", amountNop);
  if (!validation.allowed) {
    throw new Error(validation.reason || "Action not allowed");
  }
  
  // Use normalized value if provided
  const normalizedAmount = validation.normalizedValue ?? amountNop;
  const pool = getPoolContractInstance(signer);
  const amount = parseUnits(String(normalizedAmount), 18);
  const tx = await pool.depositNOP(postId, amount);
  const receipt = await tx.wait();

  // Get buyer count for early buyer bonus
  const buyerCount = await getBuyerCount(postId);
  
  // Calculate fair fee distribution
  const feeBreakdown = calculateFairFeeDistribution(amount, true, buyerCount);

  try {
    await logTrade({
      walletAddress: user,
      postId,
      side: "buy",
      amountNop: amount,
      txHash: tx.hash,
    });
  } catch (error) {
    console.warn("[pool] Failed to log BUY trade", error);
  }

  try {
    // Look up contribute_id by contractPostId
    const { getContributeByPostId } = await import("@/lib/contributeHelpers");
    const contribute = await getContributeByPostId(postId);
    
    await logBuyPosition({
      wallet: user,
      contributeId: contribute?.id || null,
      amount: amount,
      txHash: tx.hash,
    });
  } catch (error) {
    console.warn("[pool] Failed to log BUY position", error);
  }

  // Record creator earnings (fair distribution)
  try {
    const creatorWallet = await getContributeAuthor(postId);
    if (creatorWallet && feeBreakdown.creatorShare > 0n) {
      // Find contribute ID
      const { getContributeByPostId } = await import("@/lib/contributeHelpers");
      const contribute = await getContributeByPostId(postId);
      
      if (contribute) {
        await recordCreatorEarnings({
          creatorWallet,
          contributeId: contribute.id,
          buyAmount: Number(amount) / 1e18,
          txHash: tx.hash,
        });
      }
    }
  } catch (error) {
    console.warn("[pool] Failed to record creator earnings (non-critical):", error);
  }

  // Auto-mint NFT on successful buy
  try {
    const poolAddress = getPoolAddress();
    const tag = contributeTitle ? `#${postId}-${contributeTitle.slice(0, 20)}` : `Pool-${postId}`;
    const nftTxHash = await mintPositionNft({
      walletAddress: user,
      poolAddress,
      amount,
      tag,
    });
    if (nftTxHash) {
      console.log("[pool] Position NFT minted:", nftTxHash);
    }
  } catch (error) {
    // NFT mint is optional, don't fail the buy if it fails
    console.warn("[pool] Failed to mint position NFT (non-critical):", error);
  }

  return receipt;
}

export async function sellShares(postId: number, amountNop: number) {
  const signer = await getSigner();
  const user = await signer.getAddress();
  const pool = getPoolContractInstance(signer);
  const amount = parseUnits(String(amountNop), 18);
  const tx = await pool.withdrawNOP(postId, amount);
  const receipt = await tx.wait();

  try {
    await logTrade({
      walletAddress: user,
      postId,
      side: "sell",
      amountNop: amount,
      txHash: tx.hash,
    });
  } catch (error) {
    console.warn("[pool] Failed to log SELL trade", error);
  }

  try {
    await logSellPosition({
      wallet: user,
      contributeId: null, // TODO: Look up contribute_id by contractPostId
      amount: amount,
      txHash: tx.hash,
    });
  } catch (error) {
    console.warn("[pool] Failed to log SELL position", error);
  }

  return receipt;
}

export async function depositToContribute(postId: number, amount: number) {
  return buyShares(postId, amount);
}

export async function withdrawFromContribute(postId: number, amount: number) {
  return sellShares(postId, amount);
}

export async function getUserPosition(postId: number, ownerAddress?: string) {
  try {
    let signer: Awaited<ReturnType<typeof getSigner>> | undefined;
    let address = ownerAddress;
    if (!address) {
      signer = await getSigner();
      address = await signer.getAddress();
    }
    if (!address) {
      throw new Error("Wallet address unavailable");
    }
    const pool = getPoolContractInstance(signer);
    const raw = await pool.getPosition(address, postId);
    const shares = toBigInt(raw);
    return {
      shares,
      sharesFormatted: formatUnits(shares, 18),
      address,
    };
  } catch (error) {
    console.warn("[pool] Failed to fetch user position", error);
    return {
      shares: 0n,
      sharesFormatted: "0.0",
    };
  }
}

/**
 * Get user shares for a specific post
 */
export async function getUserShares(
  walletAddress: string,
  postId: string | number
): Promise<bigint> {
  try {
    const postIdNum = typeof postId === "string" ? Number.parseInt(postId, 10) : postId;
    if (!Number.isFinite(postIdNum)) return 0n;

    const pool = getPoolContractInstance();
    const raw = await pool.getPosition(walletAddress, postIdNum);
    return toBigInt(raw);
  } catch (error) {
    console.warn("[pool] Failed to get user shares", error);
    return 0n;
  }
}

export type PostState = {
  active: boolean;
  reserve: bigint;
};

// Legacy type for backward compatibility
export type PoolPostState = {
  token: string;
  reserve: bigint;
  supply: bigint;
  minBuyCost: bigint;
  active: boolean;
};

// Keep existing implementation for internal use
async function getPostStateInternal(postId: string): Promise<PostState> {
  const postIdNum = Number.parseInt(postId, 10);
  if (Number.isNaN(postIdNum)) {
    return { active: false, reserve: 0n };
  }

  try {
    // Try API first
    try {
      const { data } = await apiClient.get(`/pool/${postId}/state`);
      return {
        active: Boolean(data?.active),
        reserve: BigInt(data?.reserve?.toString() ?? "0"),
      };
    } catch (apiError) {
      // Fallback to contract
        const contract = getPoolContractInstance();
      const active = await contract.postEnabled(postIdNum);
      
      // For reserve, we might need to sum all positions or use a different method
      // For now, return 0 if API fails
      return {
        active: Boolean(active),
        reserve: 0n,
      };
    }
  } catch (error) {
    console.error("[pool] Failed to get post state", error);
    return { active: false, reserve: 0n };
  }
}

/**
 * getPostState
 * Minimal stub: returns "inactive" state so usePoolAccess can safely
 * redirect when pools are not actually active yet.
 */
export const getPostState = async (
  _postId: number | string | bigint,
): Promise<PoolPostState> => {
  return {
    token: "",
    reserve: 0n,
    supply: 0n,
    minBuyCost: 0n,
    active: false,
  };
};

/**
 * getPreviewBuyCost
 * Calculate buy cost using bonding curve
 */
export const getPreviewBuyCost = async (
  postId: number | string | bigint,
  shares: bigint,
): Promise<bigint> => {
  try {
    const postIdNum = typeof postId === "string" ? Number.parseInt(postId, 10) : Number(postId);
    if (!Number.isFinite(postIdNum)) return 0n;
    
    // Get pool state
    const state = await getPostStateInternal(String(postIdNum));
    if (!state.active) return 0n;
    
    // Use bonding curve to calculate cost
    const { getBuyQuote, initBondingCurve } = await import("@/lib/bondingCurve");
    const curveState = initBondingCurve(state.reserve, 0n); // Supply will be calculated
    
    // For now, use simple calculation: cost = shares * price
    // TODO: Implement full bonding curve with supply tracking
    const price = state.reserve > 0n ? (state.reserve * 10n ** 18n) / (1000n * 10n ** 18n) : 10n ** 15n;
    return (shares * price) / 10n ** 18n;
  } catch (error) {
    console.warn("[pool] Failed to calculate buy cost", error);
    return 0n;
  }
};

/**
 * getPreviewSell
 * Calculate sell payout using bonding curve
 */
export const getPreviewSell = async (
  postId: number | string | bigint,
  shares: bigint,
): Promise<{ gross: bigint; fee: bigint; net: bigint }> => {
  try {
    const postIdNum = typeof postId === "string" ? Number.parseInt(postId, 10) : Number(postId);
    if (!Number.isFinite(postIdNum)) {
      return { gross: 0n, fee: 0n, net: 0n };
    }
    
    // Get pool state
    const state = await getPostStateInternal(String(postIdNum));
    if (!state.active || state.reserve === 0n) {
      return { gross: 0n, fee: 0n, net: 0n };
    }
    
    // Calculate gross payout using bonding curve
    const { getSellQuote, initBondingCurve } = await import("@/lib/bondingCurve");
    const curveState = initBondingCurve(state.reserve, 0n); // Supply will be calculated
    
    // For now, use simple calculation: gross = shares * price
    // TODO: Implement full bonding curve with supply tracking
    const price = state.reserve > 0n ? (state.reserve * 10n ** 18n) / (1000n * 10n ** 18n) : 10n ** 15n;
    const gross = (shares * price) / 10n ** 18n;
    
    // Calculate fee (1%)
    const fee = (gross * 100n) / 10000n;
    const net = gross - fee;
    
    return { gross, fee, net };
  } catch (error) {
    console.warn("[pool] Failed to calculate sell payout", error);
    return { gross: 0n, fee: 0n, net: 0n };
  }
};

