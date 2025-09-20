# Verno - 去中心化科学研究平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.0-brightgreen.svg)](https://vuejs.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8+-blue.svg)](https://soliditylang.org)

## 📖 项目简介

Verno 是一个基于区块链技术的去中心化科学研究平台，旨在为科研工作者提供安全、透明、可信的数据共享和成果展示环境。平台集成了NFT铸造、隐私保护、零知识证明等先进技术，支持科研数据的安全共享和知识产权保护。

## ✨ 核心功能

### 🔬 科研管理
- **项目管理**: 创建和管理科研项目，支持多人协作
- **数据集管理**: 上传、存储和共享科研数据集
- **论文发布**: 发布科研论文，支持同行评议
- **影响力排名**: 基于贡献度的学者影响力评估

### 🛡️ 隐私保护
- **零知识证明**: 支持ZK-SNARK隐私验证
- **数据加密**: 敏感数据端到端加密
- **访问控制**: 细粒度的数据访问权限管理
- **隐私查询**: 在不暴露原始数据的情况下进行查询

### 🎯 NFT生态
- **成果铸造**: 将科研成果铸造为NFT
- **知识产权**: 保护和交易知识产权
- **激励机制**: 基于贡献的代币激励
- **市场交易**: 去中心化的科研成果交易市场

### 🏛️ 治理系统
- **同行评议**: 分布式的论文评审机制
- **社区治理**: 基于DAO的平台治理
- **声誉系统**: 科研声誉积累和评估
- **管理后台**: 平台活动监控和日志管理

## 🏗️ 技术架构

### 前端技术栈
- **Vue.js 3**: 响应式用户界面框架
- **Naive UI**: 现代化UI组件库
- **Vue Router**: 单页应用路由管理
- **Pinia**: 状态管理
- **Vite**: 快速构建工具

### 后端技术栈
- **Node.js**: 服务器运行环境
- **Express.js**: Web应用框架
- **SQLite**: 轻量级数据库
- **Multer**: 文件上传处理
- **CORS**: 跨域资源共享

### 区块链技术
- **Ethereum**: 主要区块链网络
- **Solidity**: 智能合约编程语言
- **Hardhat**: 开发和测试框架
- **OpenZeppelin**: 安全的合约库
- **Ethers.js**: 区块链交互库

### 智能合约模块
- **DeSciPlatform**: 平台核心合约
- **ResearchNFT**: NFT铸造和管理
- **DatasetManager**: 数据集管理合约
- **ZKPVerifier**: 零知识证明验证
- **InfluenceRanking**: 影响力排名系统

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd verno-desci-platform
```

2. **安装依赖**
```bash
# 安装根目录和前端依赖
npm run install-all
```

3. **启动区块链网络**
```bash
# 启动本地Hardhat网络
npm run start-blockchain
```

4. **部署智能合约**
```bash
# 在新终端中部署合约
npm run deploy-contracts
```

5. **启动开发服务器**
```bash
# 启动后端和前端开发服务器
npm run dev

# 或使用一键启动脚本
npm run start-full
```

### 访问应用

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **区块链网络**: http://localhost:8545

## 📝 使用指南

### 用户角色

1. **研究员 (Researcher)**
   - 创建和管理科研项目
   - 上传和共享数据集
   - 发布研究论文
   - 铸造研究成果NFT

2. **评审员 (Reviewer)**
   - 参与论文同行评议
   - 审核科研数据质量
   - 验证研究成果

3. **管理员 (Admin)**
   - 监控平台活动
   - 管理用户权限
   - 查看系统日志
   - 平台配置管理

### 主要工作流程

1. **连接钱包**: 使用MetaMask等Web3钱包连接平台
2. **创建项目**: 设置科研项目基本信息和协作者
3. **上传数据**: 上传科研数据集，设置访问权限
4. **发布论文**: 提交研究论文，等待同行评议
5. **铸造NFT**: 将重要成果铸造为NFT保护知识产权
6. **隐私查询**: 使用零知识证明进行隐私保护的数据查询

### 测试账户

平台提供测试账户方便体验：

```javascript
// 管理员账户
地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

// 研究员账户
地址: 0x7D3f2C3635418e7BeB03548278da20c1434c86CA
私钥: 通过前端测试模式切换身份
```

⚠️ **注意**: 这些是测试网络账户，请勿在主网使用！

## 🗂️ 项目结构

```
verno-desci-platform/
├── contracts/                 # 智能合约
│   ├── DeSciPlatform.sol     # 平台核心合约
│   ├── ResearchNFT.sol       # NFT合约
│   ├── DatasetManager.sol    # 数据管理合约
│   ├── ZKPVerifier.sol       # 零知识证明验证
│   └── ...
├── frontend/                  # Vue.js前端应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── views/           # 页面视图
│   │   ├── router/          # 路由配置
│   │   ├── composables/     # 组合式API
│   │   └── main.js          # 应用入口
│   ├── public/              # 静态资源
│   └── package.json         # 前端依赖
├── routes/                   # Express路由
│   ├── auth.js              # 用户认证
│   ├── datasets.js          # 数据集API
│   ├── nfts.js              # NFT API
│   └── ...
├── utils/                    # 工具函数
├── uploads/                  # 上传文件存储
├── artifacts/                # 编译后的合约
├── cache/                    # 构建缓存
├── index.js                  # 后端入口文件
├── database.js               # 数据库配置
├── hardhat.config.js         # Hardhat配置
├── deployEnhancedDeSci.js    # 合约部署脚本
└── package.json              # 项目依赖
```

## 🔧 开发指南

### 本地开发

1. **后端开发**
```bash
# 启动后端服务器
npm start

# 监听文件变化（需要安装nodemon）
npx nodemon index.js
```

2. **前端开发**
```bash
cd frontend
npm run dev
```

3. **智能合约开发**
```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到本地网络
npx hardhat run deployEnhancedDeSci.js --network localhost
```

### 数据库管理

平台使用SQLite数据库，主要表结构：

- **users**: 用户信息和钱包地址
- **projects**: 科研项目数据
- **datasets**: 数据集管理
- **nfts**: NFT元数据
- **reviews**: 论文评审记录
- **activity_logs**: 系统活动日志

### API接口

主要API端点：

- `GET /api/users/wallet/:address` - 获取用户信息
- `POST /api/projects` - 创建新项目
- `GET /api/datasets` - 获取数据集列表
- `POST /api/nfts/mint` - 铸造NFT
- `GET /api/reviews` - 获取评审任务
- `GET /api/logs` - 系统日志（管理员）

## 🧪 测试

### 前端测试
```bash
cd frontend
npm run test
```

### 智能合约测试
```bash
npx hardhat test
```

### 集成测试
```bash
./quick-test.sh
```

## 📦 部署

### 测试网部署

1. **配置网络**
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR-PROJECT-ID",
      accounts: ["YOUR-PRIVATE-KEY"]
    }
  }
};
```

2. **部署合约**
```bash
npx hardhat run deployEnhancedDeSci.js --network sepolia
```

### 生产环境部署

1. **环境配置**
```bash
# 设置环境变量
export NODE_ENV=production
export DATABASE_URL=your-production-db-url
export INFURA_PROJECT_ID=your-infura-id
```

2. **构建前端**
```bash
cd frontend
npm run build
```

3. **启动服务**
```bash
npm start
```

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 Vue.js 官方风格指南
- 智能合约遵循 Solidity 最佳实践
- 提交信息使用英文，格式：`type: description`

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目和社区：

- [Vue.js](https://vuejs.org/) - 前端框架
- [Hardhat](https://hardhat.org/) - 智能合约开发
- [OpenZeppelin](https://openzeppelin.com/) - 安全合约库
- [Naive UI](https://www.naiveui.com/) - UI组件库
- [Express.js](https://expressjs.com/) - 后端框架

## 📞 联系我们

- **项目维护者**: Verno Team
- **邮箱**: contact@verno.tech
- **官网**: https://verno.tech
- **文档**: https://docs.verno.tech

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！