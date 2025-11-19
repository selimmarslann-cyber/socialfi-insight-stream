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
  sepolia: {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: import.meta.env.VITE_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
    explorerUrl: "https://sepolia.etherscan.io",
    nopTokenAddress: import.meta.env.VITE_NOP_TOKEN_ADDRESS,
    nopPoolAddress: import.meta.env.VITE_NOP_POOL_ADDRESS,
    nopPositionNftAddress: import.meta.env.VITE_NOP_POSITION_NFT_ADDRESS,
  },
  // Example future chain
  // zksync: {
  //   id: 324,
  //   name: "zkSync Era",
  //   rpcUrl: import.meta.env.VITE_ZKSYNC_RPC_URL,
  //   explorerUrl: "https://explorer.zksync.io",
  //   nopTokenAddress: import.meta.env.VITE_ZKSYNC_NOP_TOKEN_ADDRESS,
  //   nopPoolAddress: import.meta.env.VITE_ZKSYNC_NOP_POOL_ADDRESS,
  //   nopPositionNftAddress: import.meta.env.VITE_ZKSYNC_NOP_POSITION_NFT_ADDRESS,
  // },
};

export const DEFAULT_CHAIN_KEY = "sepolia";
export const DEFAULT_CHAIN = CHAINS[DEFAULT_CHAIN_KEY];

/**
 * Gets the active chain configuration.
 * Currently always returns DEFAULT_CHAIN, but can be extended to support chain switching.
 */
export function getActiveChain(): ChainConfig {
  return DEFAULT_CHAIN;
}

