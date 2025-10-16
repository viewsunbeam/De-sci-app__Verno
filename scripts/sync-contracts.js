#!/usr/bin/env node
/**
 * Synchronize Hardhat contract artifacts and deployment metadata
 * into the locations required by the frontend and Go chain API.
 *
 * This script should be executed after contracts are compiled/deployed.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function resolveOptionalPath(envValue, fallback) {
  if (envValue !== undefined) {
    const trimmed = envValue.trim();
    if (trimmed.length === 0) {
      return null;
    }
    return path.resolve(trimmed);
  }
  if (!fallback) {
    return null;
  }
  return path.resolve(fallback);
}

const ARTIFACTS_DIR = resolveOptionalPath(
  process.env.ARTIFACTS_DIR,
  path.join(ROOT, "artifacts", "contracts")
);
const DEPLOYMENT_PATH = resolveOptionalPath(
  process.env.DEPLOYMENT_INFO_PATH,
  path.join(ROOT, "deployments", "enhanced-desci-deployment.json")
);
const FRONTEND_CONFIG_PATH = resolveOptionalPath(
  process.env.FRONTEND_CONTRACTS_PATH,
  path.join(ROOT, "frontend", "src", "contracts.json")
);
const GO_CONTRACTS_DIR = resolveOptionalPath(
  process.env.GO_CONTRACTS_DIR,
  path.join(ROOT, "services", "chain-api", "internal", "contracts")
);
const SHARED_CONTRACTS_PATH = resolveOptionalPath(
  process.env.SHARED_CONTRACTS_PATH,
  process.env.CONTRACTS_CONFIG_PATH // allow reuse
);

const CONTRACTS = [
  {
    name: "DeSciRegistry",
    artifact: "DeSciRegistry.sol/DeSciRegistry.json",
    addressKey: "userRegistry",
  },
  {
    name: "DatasetManager",
    artifact: "DatasetManager.sol/DatasetManager.json",
    addressKey: "datasetManager",
  },
  {
    name: "ResearchNFT",
    artifact: "ResearchNFT.sol/ResearchNFT.json",
    addressKey: "researchNFT",
  },
  {
    name: "InfluenceRanking",
    artifact: "InfluenceRanking.sol/InfluenceRanking.json",
    addressKey: "influenceRanking",
  },
  {
    name: "DeSciPlatform",
    artifact: "DeSciPlatform.sol/DeSciPlatform.json",
    addressKey: "platform",
  },
  {
    name: "SciToken",
    artifact: "DeSciPlatform.sol/SciToken.json",
    addressKey: "sciToken",
  },
  {
    name: "ZKPVerifier",
    artifact: "ZKPVerifier.sol/ZKPVerifier.json",
    addressKey: "zkpVerifier",
  },
  {
    name: "ZKProof",
    artifact: "ZKProof.sol/ZKProof.json",
    addressKey: "zkProof",
  },
  {
    name: "ConstraintManager",
    artifact: "ConstraintManager.sol/ConstraintManager.json",
    addressKey: "constraintManager",
  },
  {
    name: "DataFeatureExtractor",
    artifact: "DataFeatureExtractor.sol/DataFeatureExtractor.json",
    addressKey: "dataFeatureExtractor",
  },
  {
    name: "ResearchDataVerifier",
    artifact: "ResearchDataVerifier.sol/ResearchDataVerifier.json",
    addressKey: "researchDataVerifier",
  },
];

function ensurePathExists(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function main() {
  if (!ARTIFACTS_DIR) {
    console.error("❌ No artifacts directory configured.");
    process.exit(1);
  }

  if (!fs.existsSync(ARTIFACTS_DIR)) {
    console.error(`❌ Artifacts directory not found: ${ARTIFACTS_DIR}`);
    process.exit(1);
  }

  if (!DEPLOYMENT_PATH) {
    console.error("❌ Deployment info path not configured.");
    process.exit(1);
  }

  if (!fs.existsSync(DEPLOYMENT_PATH)) {
    console.error(`❌ Deployment file not found: ${DEPLOYMENT_PATH}`);
    process.exit(1);
  }

  const deployment = readJSON(DEPLOYMENT_PATH);
  const addresses = deployment.contracts || {};

  if (GO_CONTRACTS_DIR) {
    ensurePathExists(GO_CONTRACTS_DIR);
  }
  if (FRONTEND_CONFIG_PATH) {
    ensurePathExists(path.dirname(FRONTEND_CONFIG_PATH));
  }
  if (SHARED_CONTRACTS_PATH) {
    ensurePathExists(path.dirname(SHARED_CONTRACTS_PATH));
  }

  const frontendConfig = {
    network: {
      name: deployment.network || "localhost",
      chainId: deployment.chainId || 31337,
      rpcUrl: (deployment.networkConfig && deployment.networkConfig.rpcUrl) || "http://127.0.0.1:8545",
    },
    contracts: {},
    generatedAt: new Date().toISOString(),
  };

  CONTRACTS.forEach(({ name, artifact, addressKey }) => {
    const artifactPath = path.join(ARTIFACTS_DIR, artifact);
    if (!fs.existsSync(artifactPath)) {
      console.warn(`⚠️  Artifact missing for ${name}: ${artifactPath}`);
      return;
    }

    const artifactJson = readJSON(artifactPath);
    const targetAddress = addresses[addressKey] || null;

    // Copy artifact for Go service consumption
    if (GO_CONTRACTS_DIR) {
      const goTargetPath = path.join(GO_CONTRACTS_DIR, `${name}.json`);
      writeJSON(goTargetPath, artifactJson);
    }

    frontendConfig.contracts[name] = {
      address: targetAddress,
      abi: artifactJson.abi,
      artifactPath: `artifacts/contracts/${artifact}`,
    };
  });

  if (FRONTEND_CONFIG_PATH) {
    writeJSON(FRONTEND_CONFIG_PATH, frontendConfig);
  }
  if (SHARED_CONTRACTS_PATH) {
    writeJSON(SHARED_CONTRACTS_PATH, frontendConfig);
  }

  console.log("✅ Contracts synchronized successfully.");
  if (FRONTEND_CONFIG_PATH) {
    console.log(`   → Frontend config: ${FRONTEND_CONFIG_PATH}`);
  }
  if (GO_CONTRACTS_DIR) {
    console.log(`   → Go artifacts dir: ${GO_CONTRACTS_DIR}`);
  }
  if (SHARED_CONTRACTS_PATH) {
    console.log(`   → Shared config: ${SHARED_CONTRACTS_PATH}`);
  }
}

main();
