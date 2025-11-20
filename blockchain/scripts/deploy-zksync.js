/**
 * Deploy script for zkSync Era Mainnet
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-zksync.js --network zkSyncEra
 * 
 * Required environment variables:
 *   - PRIVATE_KEY: Deploy wallet private key
 *   - TREASURY_ADDRESS: Treasury address for fees (optional, defaults to deployer)
 *   - NOP_TOKEN_ADDRESS: NOP token address (if already deployed)
 */

const { deploy } = require("@matterlabs/hardhat-zksync-deploy");
const { Wallet } = require("zksync-web3");
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts to zkSync Era Mainnet...\n");

  // Check private key
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }

  // Deploy wallet
  const deployer = new Wallet(process.env.PRIVATE_KEY);
  console.log("Deployer address:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("Deployer balance:", hre.ethers.utils.formatEther(balance), "ETH\n");

  if (balance.lt(hre.ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️  Warning: Low balance. You may need more ETH for gas fees.");
  }

  // 1. NOP Token Address
  const NOP_TOKEN_ADDRESS = process.env.NOP_TOKEN_ADDRESS || "0x941Fc398d9FAebdd9f311011541045A1d66c748E";
  console.log("Using NOP Token:", NOP_TOKEN_ADDRESS);

  // 2. Treasury Address
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("Treasury address:", TREASURY_ADDRESS);
  console.log("");

  // 3. Deploy NOPSocialPool
  console.log("=== Deploying NOPSocialPool ===");
  const poolArtifact = await hre.artifacts.readArtifact("NOPSocialPool");
  const poolContract = await deploy(deployer, poolArtifact, [
    NOP_TOKEN_ADDRESS,
    TREASURY_ADDRESS,
  ]);
  await poolContract.deployed();
  console.log("✅ NOPSocialPool deployed to:", poolContract.address);
  console.log("   Explorer:", `https://explorer.zksync.io/address/${poolContract.address}\n`);

  // 4. Deploy NOPPositionNFT_V2
  console.log("=== Deploying NOPPositionNFT_V2 ===");
  const nftArtifact = await hre.artifacts.readArtifact("NOPPositionNFT");
  const nftContract = await deploy(deployer, nftArtifact, []);
  await nftContract.deployed();
  console.log("✅ NOPPositionNFT deployed to:", nftContract.address);
  console.log("   Explorer:", `https://explorer.zksync.io/address/${nftContract.address}\n`);

  // 5. Authorize Pool as Minter
  console.log("=== Authorizing Pool as NFT Minter ===");
  try {
    const authorizeTx = await nftContract.authorizeMinter(poolContract.address);
    console.log("   Transaction hash:", authorizeTx.hash);
    await authorizeTx.wait();
    console.log("✅ Pool authorized as minter\n");
  } catch (error) {
    console.error("❌ Failed to authorize pool as minter:", error.message);
    console.log("   You can authorize manually later by calling:");
    console.log(`   nftContract.authorizeMinter("${poolContract.address}")`);
  }

  // 6. Deployment Summary
  console.log("=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network: zkSync Era Mainnet");
  console.log("Chain ID: 324");
  console.log("");
  console.log("Contract Addresses:");
  console.log(`  NOP Token:        ${NOP_TOKEN_ADDRESS}`);
  console.log(`  NOPSocialPool:    ${poolContract.address}`);
  console.log(`  NOPPositionNFT:   ${nftContract.address}`);
  console.log(`  Treasury:         ${TREASURY_ADDRESS}`);
  console.log("");
  console.log("=".repeat(60));
  console.log("📝 Add these to your .env file:");
  console.log("=".repeat(60));
  console.log(`VITE_CHAIN_ID=324`);
  console.log(`VITE_RPC_URL=https://mainnet.era.zksync.io`);
  console.log(`VITE_NOP_TOKEN_ADDRESS=${NOP_TOKEN_ADDRESS}`);
  console.log(`VITE_NOP_POOL_ADDRESS=${poolContract.address}`);
  console.log(`VITE_NOP_POSITION_NFT_ADDRESS=${nftContract.address}`);
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

