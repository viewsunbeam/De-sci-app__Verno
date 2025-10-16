const fs = require("fs");
const path = require("path");

const DEFAULT_CONTRACTS_PATH = path.join(
  __dirname,
  "..",
  "frontend",
  "src",
  "contracts.json"
);

function resolveContractsPath() {
  const customPath = process.env.CONTRACTS_CONFIG_PATH;
  if (customPath && customPath.trim().length > 0) {
    return path.resolve(customPath);
  }
  return DEFAULT_CONTRACTS_PATH;
}

let contractsPath = resolveContractsPath();

let cachedConfig = null;
let cachedMtime = null;

function loadContractsConfig() {
  contractsPath = resolveContractsPath();

  if (!fs.existsSync(contractsPath)) {
    return null;
  }

  try {
    const stats = fs.statSync(contractsPath);
    if (!cachedConfig || cachedMtime !== stats.mtimeMs) {
      const raw = fs.readFileSync(contractsPath, "utf8");
      cachedConfig = JSON.parse(raw);
      cachedMtime = stats.mtimeMs;
    }
    return cachedConfig;
  } catch (error) {
    console.error("Failed to load contracts config:", error.message);
    return null;
  }
}

function getNetworkConfig() {
  const config = loadContractsConfig();
  return config && config.network ? config.network : null;
}

function getContracts() {
  const config = loadContractsConfig();
  return config && config.contracts ? config.contracts : {};
}

function isBlockchainConfigured() {
  const contracts = getContracts();
  return Object.values(contracts).some(
    (cfg) => cfg && cfg.address && cfg.abi && cfg.address !== ""
  );
}

function getRpcUrl() {
  const network = getNetworkConfig();
  return (
    process.env.BLOCKCHAIN_RPC_URL ||
    (network && network.rpcUrl) ||
    "http://127.0.0.1:8545"
  );
}

function getChainApiBaseUrl() {
  return process.env.CHAIN_API_BASE_URL || "http://localhost:8088";
}

module.exports = {
  loadContractsConfig,
  getContracts,
  getNetworkConfig,
  getChainApiBaseUrl,
  getRpcUrl,
  isBlockchainConfigured,
  resolveContractsPath,
};
