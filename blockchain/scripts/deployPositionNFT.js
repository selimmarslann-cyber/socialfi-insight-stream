const hre = require("hardhat");

async function main() {
  console.log("Deploying NOPPositionNFT...");

  const PositionNFT = await hre.ethers.getContractFactory("NOPPositionNFT");
  const nft = await PositionNFT.deploy();
  await nft.waitForDeployment();
  const address = await nft.getAddress();
  
  console.log("NOPPositionNFT deployed to:", address);
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_NOP_POSITION_NFT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

