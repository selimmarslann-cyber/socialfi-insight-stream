import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet, Provider } from "zksync-ethers";
import { ethers } from "ethers";
import * as hre from "hardhat";

async function main() {
  console.log("🚀 Deploying to zkSync Era Mainnet...\n");

  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }

  // Create provider and deployer
  const provider = new Provider("https://mainnet.era.zksync.io");
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const deployer = new Deployer(hre, wallet);

  // Check balance
  const balance = await wallet.getBalance();
  console.log("Deployer address:", wallet.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH\n");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. You may need more ETH for gas fees.\n");
  }

  const NOP_TOKEN_ADDRESS =
    process.env.NOP_TOKEN_ADDRESS ||
    "0x941Fc398d9FAebdd9f311011541045A1d66c748E";

  console.log("Using NOP Token:", NOP_TOKEN_ADDRESS);
  console.log("Treasury address:", process.env.TREASURY_ADDRESS || wallet.address);
  console.log("");

  // Deploy Pool
  console.log("=== Deploying NOPSocialPool ===");
  const poolArtifact = await hre.artifacts.readArtifact("NOPSocialPool");
  const pool = await deployer.deploy(poolArtifact, [
    NOP_TOKEN_ADDRESS,
    process.env.TREASURY_ADDRESS || wallet.address,
  ]);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("✅ NOPSocialPool deployed:", poolAddress);
  console.log("   Explorer: https://explorer.zksync.io/address/" + poolAddress + "\n");

  // Deploy Position NFT
  console.log("=== Deploying NOPPositionNFT ===");
  // Use NOPPositionNFT_V2 (has authorizedMinters support)
  const nftArtifact = await hre.artifacts.readArtifact("contracts/NOPPositionNFT_V2.sol:NOPPositionNFT");
  const nft = await deployer.deploy(nftArtifact, []);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ Position NFT deployed:", nftAddress);
  console.log("   Explorer: https://explorer.zksync.io/address/" + nftAddress + "\n");

  // Authorize Pool as Minter
  console.log("=== Authorizing Pool as NFT Minter ===");
  try {
    const authorizeTx = await nft.authorizeMinter(poolAddress);
    console.log("   Transaction hash:", authorizeTx.hash);
    await authorizeTx.wait();
    console.log("✅ Pool authorized as minter for NFT.\n");
  } catch (error) {
    console.error("❌ Failed to authorize pool as minter:", error);
    console.log("   You can authorize manually later by calling:");
    console.log(`   nft.authorizeMinter("${poolAddress}")`);
  }

  console.log("=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network: zkSync Era Mainnet");
  console.log("Chain ID: 324");
  console.log("");
  console.log("Contract Addresses:");
  console.log(`  NOP Token:        ${NOP_TOKEN_ADDRESS}`);
  console.log(`  NOPSocialPool:    ${poolAddress}`);
  console.log(`  NOPPositionNFT:   ${nftAddress}`);
  console.log(`  Treasury:         ${process.env.TREASURY_ADDRESS || wallet.address}`);
  console.log("");
  console.log("=".repeat(60));
  console.log("📝 COPY THESE INTO YOUR FRONTEND .env FILE:");
  console.log("=".repeat(60));
  console.log(`VITE_CHAIN_ID=324`);
  console.log(`VITE_RPC_URL=https://mainnet.era.zksync.io`);
  console.log(`VITE_NOP_TOKEN_ADDRESS=${NOP_TOKEN_ADDRESS}`);
  console.log(`VITE_NOP_POOL_ADDRESS=${poolAddress}`);
  console.log(`VITE_NOP_POSITION_NFT_ADDRESS=${nftAddress}`);
  console.log("=".repeat(60));
  console.log("");
  console.log("✅ Deployment complete!");
  console.log("   Don't forget to update Vercel/Netlify environment variables.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
