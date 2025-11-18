import { BrowserProvider, JsonRpcProvider, Contract, parseUnits } from "ethers";
import poolAbi from "@/abi/NOPSocialPool.json";
import { SELL_FEE_BPS_UI, CREATOR_BPS_UI } from "@/lib/config";
import { applyBps } from "@/lib/math";
import { apiClient } from "@/lib/axios";

const RPC_URL = import.meta.env.VITE_RPC_URL;
const POOL_ADDRESS =
  import.meta.env.VITE_NOP_POOL_ADDRESS ||
  import.meta.env.VITE_POOL_ADDRESS;
const TOKEN_ADDRESS = import.meta.env.VITE_NOP_TOKEN_ADDRESS;

const provider = new JsonRpcProvider(RPC_URL);

let wallet: BrowserProvider | null = null;

async function getWallet() {
  if (!wallet) {
    if (!window.ethereum) throw new Error("MetaMask not available");
    wallet = new BrowserProvider(window.ethereum);
  }
  return wallet;
}

async function getPoolContract(signer = false) {
  if (!POOL_ADDRESS) throw new Error("Pool address missing in ENV");
  if (signer) {
    const w = await getWallet();
    const signerInstance = await w.getSigner();
    return new Contract(POOL_ADDRESS, poolAbi.abi, signerInstance);
  }
  return new Contract(POOL_ADDRESS, poolAbi.abi, provider);
}

export async function depositToContribute(postId: number, amount: number) {
  const contract = await getPoolContract(true);
  const normalized = parseUnits(String(amount), 18);
  const tx = await contract.depositNOP(postId, normalized);
  return await tx.wait();
}

export async function withdrawFromContribute(postId: number, amount: number) {
  const contract = await getPoolContract(true);
  const normalized = parseUnits(String(amount), 18);
  const tx = await contract.withdrawNOP(postId, normalized);
  return await tx.wait();
}

export async function getUserPosition(userAddress: string, postId: number) {
  const contract = await getPoolContract();
  return await contract.getPosition(userAddress, postId);
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
      const contract = await getPoolContract();
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
 * Minimal stub: always returns 0n so UI can render without crashing.
 */
export const getPreviewBuyCost = async (
  _postId: number | string | bigint,
  _shares: bigint,
): Promise<bigint> => {
  return 0n;
};

/**
 * getPreviewSell
 * Minimal stub: always returns zero values.
 */
export const getPreviewSell = async (
  _postId: number | string | bigint,
  _shares: bigint,
): Promise<{ gross: bigint; fee: bigint; net: bigint }> => {
  return {
    gross: 0n,
    fee: 0n,
    net: 0n,
  };
};

/**
 * getUserShares
 * Minimal stub: always returns 0n (no shares).
 */
export const getUserShares = async (
  _user: string,
  _postId: number | string | bigint,
): Promise<bigint> => {
  return 0n;
};
