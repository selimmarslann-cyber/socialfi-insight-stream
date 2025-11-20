import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const config = {
  zksolc: {
    version: "1.4.0",
    compilerSource: "binary",
    settings: {
      optimizer: { enabled: true },
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  defaultNetwork: "zkSyncMainnet",
  networks: {
    zkSyncMainnet: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: process.env.ETH_MAINNET_RPC || "https://eth-mainnet.g.alchemy.com/v2/demo", // Ethereum mainnet RPC for bridging
      zksync: true,
      chainId: 324,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    deploy: ["deploy"],
  },
};

export default config;
