// 区块链合约服务：统一管理合约实例以及网络信息
const { Contract, JsonRpcProvider } = require("ethers");
const {
  getContracts,
  getNetworkConfig,
  getRpcUrl,
  isBlockchainConfigured,
} = require("./config/blockchain");

class ContractService {
  constructor() {
    this.provider = null;
    this.contracts = {};
    this.network = null;
    this.isInitialized = false;
  }

  async init() {
    if (!isBlockchainConfigured()) {
      console.log("ℹ️  未检测到链上配置，跳过合约初始化");
      return false;
    }

    this.network = getNetworkConfig();
    const rpcUrl = getRpcUrl();

    try {
      this.provider = new JsonRpcProvider(rpcUrl);
      await this.provider.getNetwork();
    } catch (error) {
      console.error("❌ 无法连接区块链网络:", error.message);
      this.provider = null;
      return false;
    }

    const contractMap = getContracts();
    Object.entries(contractMap).forEach(([name, cfg]) => {
      if (!cfg || !cfg.address || !cfg.abi) {
        console.warn(`⚠️  合约 ${name} 缺少地址或ABI，跳过实例化`);
        return;
      }

      try {
        let abi = cfg.abi;
        
        // 如果ABI是文件路径字符串，则加载实际的ABI
        if (typeof abi === 'string' && abi.includes('artifacts/')) {
          const fs = require('fs');
          const path = require('path');
          const artifactPath = path.resolve(abi);
          
          if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            abi = artifact.abi;
          } else {
            console.warn(`⚠️  合约 ${name} ABI文件不存在: ${artifactPath}`);
            return;
          }
        }
        
        this.contracts[name] = new Contract(cfg.address, abi, this.provider);
      } catch (error) {
        console.warn(`⚠️  合约 ${name} 初始化失败: ${error.message}`);
      }
    });

    const initialized = Object.keys(this.contracts).length > 0;
    this.isInitialized = initialized;

    if (initialized) {
      console.log(
        `✅ 区块链服务已启用，加载 ${Object.keys(this.contracts).length} 个合约`
      );
    } else {
      console.log("⚠️  未能加载任何合约实例，将使用传统模式");
    }

    return initialized;
  }

  isBlockchainAvailable() {
    return this.isInitialized;
  }

  getContract(name) {
    return this.contracts[name];
  }

  getNetwork() {
    return this.network;
  }
}

module.exports = ContractService;
