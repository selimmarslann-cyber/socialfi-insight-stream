import { ethers } from "hardhat";

async function main() {
  const nopToken = process.env.NOP_TOKEN_ADDRESS;
  const treasury = process.env.TREASURY_ADDRESS;

  if (!nopToken || !treasury) {
    throw new Error("NOP_TOKEN_ADDRESS or TREASURY_ADDRESS missing in .env");
  }

  const Pool = await ethers.getContractFactory("NOPSocialPool");
  const pool = await Pool.deploy(nopToken, treasury);
  await pool.waitForDeployment();

  console.log("NOPSocialPool deployed to:", await pool.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
