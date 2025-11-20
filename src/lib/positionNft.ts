import type { ContractRunner } from "ethers";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { getActiveChain } from "@/config/chains";

// Minimal ERC721 ABI for position NFT
const POSITION_NFT_ABI = [
  "function mintPosition(address to, address pool, uint256 amount, string memory tag) external returns (uint256)",
  "function getPosition(uint256 tokenId) external view returns (tuple(address pool, uint256 amount, uint64 createdAt, string tag))",
  "function walletTokens(address owner) external view returns (uint256[])",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
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
  postId?: number | null; // Optional: parsed from tag
};

/**
 * Gets the Position NFT contract instance.
 */
export async function getPositionNftContract(runner?: ContractRunner): Promise<Contract> {
  const chain = getActiveChain();
  
  // Try chain config first
  let address = chain.nopPositionNftAddress;
  
  // Fallback to environment variables
  if (!address) {
    address = import.meta.env.VITE_NOP_POSITION_NFT_ADDRESS || 
              import.meta.env.VITE_POSITION_NFT_ADDRESS ||
              import.meta.env.VITE_NFT_ADDRESS;
  }

  if (!address) {
    throw new Error("Position NFT address is not configured. Set VITE_NOP_POSITION_NFT_ADDRESS or deploy contract and update chains.ts");
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
    const contract = getPositionNftContract(signer);

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
    const contract = getPositionNftContract();
    const tokenIds = await contract.walletTokens(walletAddress);

    const positions: PositionNFT[] = [];

    for (const tokenId of tokenIds) {
      try {
        const position = await contract.getPosition(tokenId);
        const postId = extractPostIdFromTag(position.tag);
        positions.push({
          tokenId: tokenId.toString(),
          poolAddress: position.pool,
          amount: position.amount.toString(),
          createdAt: new Date(Number(position.createdAt) * 1000).toISOString(),
          tag: position.tag,
          postId,
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

/**
 * Transfers a position NFT to another address (e.g., cold wallet).
 * Uses safeTransferFrom for better security (checks if recipient can handle ERC721).
 * 
 * @param tokenId The token ID to transfer
 * @param toAddress The destination address (can be any wallet, including cold wallets)
 * @returns Transaction hash on success, null on failure
 */
export async function transferPositionNft(
  tokenId: string,
  toAddress: string
): Promise<string | null> {
  try {
    const signer = await getSigner();
    const fromAddress = await signer.getAddress();
    const contract = getPositionNftContract(signer);

    // Verify ownership
    const owner = await contract.ownerOf(tokenId);
    if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
      throw new Error("You are not the owner of this NFT");
    }

    // Validate recipient address
    if (!toAddress || !toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid recipient address");
    }

    // Use safeTransferFrom (safer - checks if recipient can handle ERC721)
    const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId);
    const receipt = await tx.wait();

    console.log("[positionNft] NFT transferred successfully:", {
      tokenId,
      from: fromAddress,
      to: toAddress,
      txHash: tx.hash,
    });

    return tx.hash;
  } catch (error) {
    console.error("[positionNft] Failed to transfer NFT", error);
    
    if (error instanceof Error) {
      if (error.message.includes("not the owner")) {
        throw new Error("You are not the owner of this NFT");
      }
      if (error.message.includes("Invalid recipient")) {
        throw new Error("Invalid recipient address");
      }
      if (error.message.includes("ERC721Receiver")) {
        throw new Error("Recipient cannot receive ERC721 tokens");
      }
    }
    
    throw error;
  }
}

/**
 * Checks if an address can receive ERC721 tokens (for cold wallets, this is usually true).
 */
export async function canReceiveNft(address: string): Promise<boolean> {
  try {
    // Most wallets (including cold wallets) can receive ERC721 tokens
    // This is a simple check - in practice, safeTransferFrom will handle errors
    return address.match(/^0x[a-fA-F0-9]{40}$/) !== null;
  } catch {
    return false;
  }
}

/**
 * Extracts postId from NFT tag.
 * Tag format: "#{postId}-{title}" or "Pool-{postId}"
 * @param tag The tag string from NFT
 * @returns postId if found, null otherwise
 */
export function extractPostIdFromTag(tag: string): number | null {
  if (!tag) return null;
  
  try {
    // Try format: "#{postId}-{title}"
    const hashMatch = tag.match(/^#(\d+)-/);
    if (hashMatch) {
      const postId = Number.parseInt(hashMatch[1], 10);
      if (Number.isFinite(postId) && postId > 0) {
        return postId;
      }
    }
    
    // Try format: "Pool-{postId}"
    const poolMatch = tag.match(/^Pool-(\d+)$/);
    if (poolMatch) {
      const postId = Number.parseInt(poolMatch[1], 10);
      if (Number.isFinite(postId) && postId > 0) {
        return postId;
      }
    }
    
    // Try format: just a number
    const numMatch = tag.match(/^(\d+)$/);
    if (numMatch) {
      const postId = Number.parseInt(numMatch[1], 10);
      if (Number.isFinite(postId) && postId > 0) {
        return postId;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Gets position NFT data including parsed postId.
 * @param tokenId The NFT token ID
 * @returns Position data with postId, or null if not found
 */
export async function getPositionNftData(tokenId: string): Promise<(PositionNFT & { postId: number | null }) | null> {
  try {
    const contract = await getPositionNftContract();
    const position = await contract.getPosition(tokenId);
    
    const postId = extractPostIdFromTag(position.tag);
    
    return {
      tokenId,
      poolAddress: position.pool,
      amount: position.amount.toString(),
      createdAt: new Date(Number(position.createdAt) * 1000).toISOString(),
      tag: position.tag,
      postId,
    };
  } catch (error) {
    console.error("[positionNft] Failed to get NFT data", error);
    return null;
  }
}

