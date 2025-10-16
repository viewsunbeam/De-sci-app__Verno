require("@nomicfoundation/hardhat-toolbox");

const LOCAL_RPC_URL = process.env.LOCALHOST_RPC_URL || "http://127.0.0.1:8545";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    localhost: {
      url: LOCAL_RPC_URL,
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts"
  }
};
