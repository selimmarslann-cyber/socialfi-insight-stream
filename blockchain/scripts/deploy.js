const hre = require("hardhat");

async function main() {
  const Pool = await hre.ethers.getContractFactory("NOPSocialPool");
  const pool = await Pool.deploy();
  await pool.waitForDeployment();
  const address = await pool.getAddress();
  console.log("NOPSocialPool deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

