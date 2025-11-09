import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { FACTORY_ADDRESS, CHAIN_ID } from "./config";

const PUBLIC_ZKSYNC_RPC = "https://mainnet.era.zksync.io";

const FACTORY_ABI = [
  "function previewBuyCost(uint256,uint256) view returns (uint256)",
  "function previewSellPayout(uint256,uint256) view returns (uint256,uint256,uint256)",
  "function posts(uint256) view returns (address creator,address token,uint256 a,uint256 b,uint256 supply,uint256 reserve,bool active,uint256 minBuyCost,uint256 cap)",
] as const;

const SHARES_ABI = ["function balanceOf(address,uint256) view returns (uint256)"] as const;

type ReadProvider = BrowserProvider | JsonRpcProvider;

let providerPromise: Promise<ReadProvider> | null = null;

const resolveProvider = (): Promise<ReadProvider> => {
  if (!providerPromise) {
    // Prefer wallet provider when available, otherwise fall back to public RPC.
    if (typeof window !== "undefined" && (window as Window & { ethereum?: unknown }).ethereum) {
      providerPromise = Promise.resolve(new BrowserProvider((window as Window & { ethereum?: any }).ethereum, CHAIN_ID));
    } else {
      providerPromise = Promise.resolve(new JsonRpcProvider(PUBLIC_ZKSYNC_RPC, CHAIN_ID));
    }
  }
  return providerPromise;
};

const getFactoryContract = async () => {
  const provider = await resolveProvider();
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
};

const toBigInt = (value: number | string | bigint): bigint => BigInt(value);

export const getPostState = async (postId: number | string | bigint) => {
  const factory = await getFactoryContract();
  const [, token, , , supply, reserve, active, minBuyCost] = await factory.posts(toBigInt(postId));
  // Return minimal state needed for guards.
  return {
    token: token as string,
    reserve: reserve as bigint,
    supply: supply as bigint,
    minBuyCost: minBuyCost as bigint,
    active: Boolean(active),
  };
};

export const getPreviewBuyCost = async (postId: number | string | bigint, shares: bigint): Promise<bigint> => {
  if (shares <= 0n) return 0n;
  const factory = await getFactoryContract();
  return (await factory.previewBuyCost(toBigInt(postId), shares)) as bigint;
};

export const getPreviewSell = async (postId: number | string | bigint, shares: bigint) => {
  if (shares <= 0n) {
    return { gross: 0n, fee: 0n, net: 0n };
  }
  const factory = await getFactoryContract();
  const [gross, fee, net] = (await factory.previewSellPayout(toBigInt(postId), shares)) as [bigint, bigint, bigint];
  return { gross, fee, net };
};

export const getUserShares = async (user: string, postId: number | string | bigint): Promise<bigint> => {
  if (!user) return 0n;
  const { token } = await getPostState(postId);
  const provider = await resolveProvider();
  const sharesContract = new Contract(token, SHARES_ABI, provider);
  return (await sharesContract.balanceOf(user, toBigInt(postId))) as bigint;
};
