export type ChainConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nopTokenAddress?: string;
  nopPoolAddress?: string;
  nopPositionNftAddress?: string;
};

export const CHAINS: Record<string, ChainConfig> = {
  zksync: {
    id: 324,
    name: "zkSync Era Mainnet",
    rpcUrl: import.meta.env.VITE_RPC_URL || "https://mainnet.era.zksync.io",
    explorerUrl: "https://explorer.zksync.io",
    nopTokenAddress: import.meta.env.VITE_NOP_TOKEN_ADDRESS || "0x941Fc398d9FAebdd9f311011541045A1d66c748E",
    nopPoolAddress: import.meta.env.VITE_NOP_POOL_ADDRESS || import.meta.env.VITE_POOL_ADDRESS,
    nopPositionNftAddress: import.meta.env.VITE_NOP_POSITION_NFT_ADDRESS || import.meta.env.VITE_POSITION_NFT_ADDRESS,
  },
  sepolia: {
    id: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: import.meta.env.VITE_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
    explorerUrl: "https://sepolia.etherscan.io",
    nopTokenAddress: import.meta.env.VITE_NOP_TOKEN_ADDRESS,
    nopPoolAddress: import.meta.env.VITE_NOP_POOL_ADDRESS,
    nopPositionNftAddress: import.meta.env.VITE_NOP_POSITION_NFT_ADDRESS,
  },
};

// Default to zkSync Era Mainnet
export const DEFAULT_CHAIN_KEY = "zksync";
export const DEFAULT_CHAIN = CHAINS[DEFAULT_CHAIN_KEY] || CHAINS.sepolia;

/**
 * Gets the active chain configuration based on environment or default.
 * Checks VITE_CHAIN_ID environment variable first, then falls back to DEFAULT_CHAIN.
 */
export function getActiveChain(): ChainConfig {
  const chainId = Number(import.meta.env.VITE_CHAIN_ID || 324);
  
  // Find chain by ID
  const chain = Object.values(CHAINS).find((c) => c.id === chainId);
  if (chain) return chain;
  
  // Fallback to default
  return DEFAULT_CHAIN;
}

