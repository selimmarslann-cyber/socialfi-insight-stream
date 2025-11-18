const hre = require("hardhat");

async function main() {
  // Constructor parametreleri: NOP token adresi ve treasury adresi
  const nopToken = process.env.NOP_TOKEN_ADDRESS || "0x941Fc398d9FAebdd9f311011541045A1d66c748E";
  
  // Treasury adresi: eğer TREASURY_ADDRESS yoksa, PRIVATE_KEY'den hesapla
  let treasury = process.env.TREASURY_ADDRESS;
  if (!treasury && process.env.PRIVATE_KEY) {
    const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY);
    treasury = wallet.address;
  }
  
  if (!nopToken || !treasury) {
    throw new Error("NOP_TOKEN_ADDRESS and TREASURY_ADDRESS (or PRIVATE_KEY) must be set in .env");
  }

  console.log("Deploying NOPSocialPool with:");
  console.log("  NOP Token:", nopToken);
  console.log("  Treasury:", treasury);

  const Pool = await hre.ethers.getContractFactory("NOPSocialPool");
  const pool = await Pool.deploy(nopToken, treasury);
  await pool.waitForDeployment();
  const address = await pool.getAddress();
  console.log("NOPSocialPool deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

