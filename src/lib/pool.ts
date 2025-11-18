import { BrowserProvider, Contract, JsonRpcProvider, parseUnits } from "ethers";
import poolAbi from "@/abi/NOPSocialPool.json";
import erc20Abi from "@/abi/erc20.json";
import { FACTORY_ADDRESS, CHAIN_ID } from "./config";

const PUBLIC_ZKSYNC_RPC = import.meta.env.VITE_RPC_URL || "https://mainnet.era.zksync.io";
const POOL_ADDRESS = import.meta.env.VITE_NOP_POOL_ADDRESS as string | undefined;
const NOP_ADDRESS = import.meta.env.VITE_NOP_TOKEN_ADDRESS as string | undefined;

const FACTORY_ABI = [
  "function previewBuyCost(uint256,uint256) view returns (uint256)",
  "function previewSellPayout(uint256,uint256) view returns (uint256,uint256,uint256)",
  "function posts(uint256) view returns (address creator,address token,uint256 a,uint256 b,uint256 supply,uint256 reserve,bool active,uint256 minBuyCost,uint256 cap)",
] as const;

const SHARES_ABI = ["function balanceOf(address,uint256) view returns (uint256)"] as const;

type BrowserProviderSource = ConstructorParameters<typeof BrowserProvider>[0];
type ReadProvider = BrowserProvider | JsonRpcProvider;

let providerPromise: Promise<ReadProvider> | null = null;

const getInjectedSource = (): BrowserProviderSource | null => {
  if (typeof window === "undefined") return null;
  return ((window as Window & { ethereum?: unknown }).ethereum as BrowserProviderSource | undefined) ?? null;
};

const resolveProvider = (): Promise<ReadProvider> => {
  if (!providerPromise) {
    const injected = getInjectedSource();

    // Prefer wallet provider when available, otherwise fall back to public RPC.
    if (injected) {
      providerPromise = Promise.resolve(new BrowserProvider(injected, CHAIN_ID));
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

if (!POOL_ADDRESS) {
  console.warn("VITE_NOP_POOL_ADDRESS is not set");
}
if (!NOP_ADDRESS) {
  console.warn("VITE_NOP_TOKEN_ADDRESS is not set");
}

const requireConfiguredAddress = (value: string | undefined, label: string) => {
  if (!value) {
    throw new Error(`${label} is not configured`);
  }
  return value;
};

const getPoolContract = (signerOrProvider: any) => {
  const address = requireConfiguredAddress(POOL_ADDRESS, "Pool address");
  return new Contract(address, poolAbi as any, signerOrProvider);
};

const getNopTokenContract = (signerOrProvider: any) => {
  const address = requireConfiguredAddress(NOP_ADDRESS, "NOP token address");
  return new Contract(address, erc20Abi as any, signerOrProvider);
};

const getProviderAndSigner = async () => {
  const injected = getInjectedSource();
  if (!injected) {
    throw new Error("No injected wallet found");
  }
  const provider = new BrowserProvider(injected, CHAIN_ID);
  const signer = await provider.getSigner();
  return { provider, signer };
};

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

export const depositToContribute = async (postId: number | string | bigint, amount: string | number) => {
  const { signer } = await getProviderAndSigner();
  const parsedAmount = parseUnits(String(amount), 18);
  const poolAddress = requireConfiguredAddress(POOL_ADDRESS, "Pool address");

  const token = getNopTokenContract(signer);
  const approveTx = await token.approve(poolAddress, parsedAmount);
  await approveTx.wait();

  const pool = getPoolContract(signer);
  const tx = await pool.depositNOP(toBigInt(postId), parsedAmount);
  return tx.wait();
};

export const withdrawFromContribute = async (postId: number | string | bigint, amount: string | number) => {
  const { signer } = await getProviderAndSigner();
  const parsedAmount = parseUnits(String(amount), 18);
  const pool = getPoolContract(signer);
  const tx = await pool.withdrawNOP(toBigInt(postId), parsedAmount);
  return tx.wait();
};

export const getUserPosition = async (userAddress: string, postId: number | string | bigint): Promise<bigint> => {
  if (!userAddress) return 0n;
  const provider = await resolveProvider();
  const pool = getPoolContract(provider);
  return (await pool.getPosition(userAddress, toBigInt(postId))) as bigint;
};
