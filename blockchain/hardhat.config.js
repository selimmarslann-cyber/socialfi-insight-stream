require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const networks = {};

// Only add sepolia network if env vars are provided
if (process.env.SEPOLIA_RPC && process.env.PRIVATE_KEY) {
  networks.sepolia = {
    url: process.env.SEPOLIA_RPC,
    accounts: [process.env.PRIVATE_KEY]
  };
}

module.exports = {
  solidity: "0.8.20",
  networks
};

