import type { ContractRunner } from "ethers";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { DEFAULT_CHAIN, getActiveChain } from "@/config/chains";

// Minimal ERC721 ABI for position NFT
const POSITION_NFT_ABI = [
  "function mintPosition(address to, address pool, uint256 amount, string memory tag) external returns (uint256)",
  "function getPosition(uint256 tokenId) external view returns (tuple(address pool, uint256 amount, uint64 createdAt, string tag))",
  "function walletTokens(address owner) external view returns (uint256[])",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
] as const;

const RPC_URL = import.meta.env.VITE_RPC_URL;
const rpcProvider = RPC_URL ? new JsonRpcProvider(RPC_URL) : null;

let browserProvider: BrowserProvider | null = null;

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

export type PositionNFT = {
  tokenId: string;
  poolAddress: string;
  amount: string;
  createdAt: string;
  tag: string;
};

/**
 * Gets the Position NFT contract instance.
 */
export async function getPositionNftContract(runner?: ContractRunner): Promise<Contract> {
  const chain = getActiveChain();
  const address = chain.nopPositionNftAddress;

  if (!address) {
    throw new Error("Position NFT address is not configured");
  }

  const provider = getDefaultRunner(runner);
  return new Contract(address, POSITION_NFT_ABI, provider);
}

/**
 * Mints a position NFT.
 * Requires the caller to be the contract owner (or have minting permissions).
 */
export async function mintPositionNft(params: {
  walletAddress: string;
  poolAddress: string;
  amount: bigint;
  tag: string;
}): Promise<string | null> {
  try {
    const signer = await getSigner();
    const contract = await getPositionNftContract(signer);

    const tx = await contract.mintPosition(
      params.walletAddress,
      params.poolAddress,
      params.amount,
      params.tag,
    );

    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("[positionNft] Failed to mint NFT", error);
    return null;
  }
}

/**
 * Lists all position NFTs owned by a wallet.
 */
export async function listMyPositionNfts(walletAddress: string): Promise<PositionNFT[]> {
  try {
    const contract = await getPositionNftContract();
    const tokenIds = await contract.walletTokens(walletAddress);

    const positions: PositionNFT[] = [];

    for (const tokenId of tokenIds) {
      try {
        const position = await contract.getPosition(tokenId);
        positions.push({
          tokenId: tokenId.toString(),
          poolAddress: position.pool,
          amount: position.amount.toString(),
          createdAt: new Date(Number(position.createdAt) * 1000).toISOString(),
          tag: position.tag,
        });
      } catch (error) {
        console.warn(`[positionNft] Failed to fetch position ${tokenId}`, error);
      }
    }

    return positions;
  } catch (error) {
    console.error("[positionNft] Failed to list position NFTs", error);
    return [];
  }
}

