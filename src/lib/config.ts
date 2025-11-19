export const NOP_TOKEN_ADDRESS = "0x941Fc398d9FAebdd9f311011541045A1d66c748E";
export const FACTORY_ADDRESS = "0xFACTORY_TO_FILL";
export const CHAIN_ID = 324;
export const MIN_BUY_NOP = 12000n;
export const BUY_SLIPPAGE = 1.02;
export const SELL_SLIPPAGE = 0.98;
export const SELL_FEE_BPS_UI = 100;
export const CREATOR_BPS_UI = 2000;

export type SupportedChain = {
  id: number;
  label: string;
  rpcUrl: string;
  explorerUrl: string;
  factoryAddress?: string;
  nopTokenAddress?: string;
};

export const SUPPORTED_CHAINS: Record<string, SupportedChain> = {
  zksync: {
    id: 324,
    label: "zkSync Era",
    rpcUrl: import.meta.env.VITE_RPC_URL || "https://mainnet.era.zksync.io",
    explorerUrl: "https://explorer.zksync.io",
    factoryAddress: FACTORY_ADDRESS,
    nopTokenAddress: NOP_TOKEN_ADDRESS,
  },
  sepolia: {
    id: 11155111,
    label: "Ethereum Sepolia",
    rpcUrl: import.meta.env.VITE_RPC_URL || "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
    factoryAddress: FACTORY_ADDRESS,
    nopTokenAddress: NOP_TOKEN_ADDRESS,
  },
};

export const DEFAULT_CHAIN = "zksync";

export function getChainConfig(chainKey: string = DEFAULT_CHAIN): SupportedChain {
  return SUPPORTED_CHAINS[chainKey] ?? SUPPORTED_CHAINS[DEFAULT_CHAIN];
}
