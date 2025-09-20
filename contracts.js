// 简单的智能合约集成模块
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class ContractService {
    constructor() {
        this.provider = null;
        this.contracts = {};
        this.isInitialized = false;
    }

    async init() {
        try {
            // 检查contracts.json是否存在（不尝试连接区块链）
            const contractsPath = path.join(__dirname, 'frontend/src/contracts.json');
            if (fs.existsSync(contractsPath)) {
                console.log('📝 已找到合约配置文件');

                // 延迟初始化provider，只在需要时连接
                setTimeout(async () => {
                    try {
                        this.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
                        await this.provider.getNetwork();
                        console.log('✅ 区块链网络连接成功');
                        this.isInitialized = true;
                    } catch (error) {
                        console.log('⚠️  区块链网络暂未可用，将稍后重试');
                    }
                }, 10000); // 10秒后尝试连接

                return true;
            } else {
                console.log('⚠️  合约配置文件不存在，将使用传统模式');
                return false;
            }
        } catch (error) {
            console.log('⚠️  初始化失败，使用传统模式:', error.message);
            return false;
        }
    }

    // 检查是否可以使用区块链功能
    isBlockchainAvailable() {
        return this.isInitialized && this.provider;
    }
}

module.exports = ContractService;