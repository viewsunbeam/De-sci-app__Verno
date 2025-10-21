<div align="center">
  <br/>
  <img src="https://img.alicdn.com/imgextra/i1/O1CN01QMMdMT1DfTbTJSNjl_!!6000000000227-2-tps-400-400.png" alt="Verno Logo" width="120">
  <h1>Verno · 去中心化科研平台</h1>
  <p><strong>Chain the Truth of Science — 链上可信 · 链下高效</strong></p>

  <p>
    <em>科研者连接世界，区块链见证每一次求索。</em>
  </p>

  <p>
    <strong>🏆 CCF 第四届大学生区块链技术与创新应用竞赛参赛项目</strong>
  </p>

  <p>
    <a href="docs/demo-api-playbook.md"><strong>⚡ API 通关指引</strong></a> •
    <a href="docs/frontend-navigation.md"><strong>前端导航</strong></a> •
    <a href="docs/web3-architecture-story.md"><strong>Web3 架构叙事</strong></a> •
    <a href="#-快速开始"><strong>快速开始</strong></a> •
    <a href="#-核心功能"><strong>功能亮点</strong></a>
  </p>

  <p>
    <a href="https://opensource.org/licenses/MIT">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen.svg" alt="Node">
    </a>
    <a href="https://hardhat.org/">
      <img src="https://img.shields.io/badge/Hardhat-^2.26-yellow.svg" alt="Hardhat">
    </a>
    <a href="https://go.dev/">
      <img src="https://img.shields.io/badge/Go-%3E%3D1.23-00ADD8.svg" alt="Golang">
    </a>
    <a href="https://github.com/viewsunbeam/De-sci-app__Verno">
      <img src="https://img.shields.io/github/stars/viewsunbeam/De-sci-app__Verno?style=social" alt="Stars">
    </a>
  </p>
</div>


---

## 📖 项目简介

Verno 是一个面向去中心化科研生态的区块链平台，提供可信的数据共享、科研成果溯源与隐私保护能力。系统兼容链上写、链下读的混合架构，结合 NFT 与零知识证明，帮助科研团队在公开透明的同时维护数据主权。

## 🎯 赛事背景

- **参赛赛事**：中国计算机学会（CCF）第四届大学生区块链技术与创新应用竞赛  
- **作品名称**：Verno 去中心化科研平台  
- **参赛成员**：周子为、张家畅、朱妍琦、李佳凝  
- **核心亮点**：以“链上可信 · 链下高效”为主题，演示科研成果登记、隐私校验、激励结算的全流程闭环，凸显 Web3 在科研审查与成果确权中的价值。

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

### 首选：一键本地演示（Docker Compose）

```bash
git clone https://github.com/viewsunbeam/De-sci-app__Verno.git
cd De-sci-app__Verno
cp .env.example .env
docker compose up --build --detach
```

启动完成后：

- 前端演示台：<http://localhost:5173>
- 后端 API：<http://localhost:3000>
- 链下监听服务：<http://localhost:8088/health>
- Hardhat RPC：<http://localhost:8545>

重新部署合约与同步 ABI：

```bash
docker compose run --rm contracts
docker compose restart backend
```

如需停止并清理环境：

```bash
docker compose down
```

> NOTES：合约部署产物与 ABI 会保存在 `contracts-data` 卷中，方便前端与链下服务共享。

### 手动部署（开发模式）

**环境要求**

- Node.js 20+
- npm（或兼容的 pnpm / yarn）
- Git

**步骤**

```bash
git clone https://github.com/viewsunbeam/De-sci-app__Verno.git
cd De-sci-app__Verno
npm run install-all          # 安装根目录与前端依赖

npm run start-blockchain     # 终端1：Hardhat 节点
npm run deploy-contracts     # 终端2：部署并同步 ABI
npm run dev                  # 终端3：启动前端与后端
```

开发时亦可使用 `npm run chain-api:start` 在本机直接运行 Go 链下服务。


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
├── services/
│   └── chain-api/          # Go 链下监听 + REST 服务
├── routes/                   # Express路由
│   ├── auth.js              # 用户认证
│   ├── datasets.js          # 数据集API
│   ├── nfts.js              # NFT API
│   └── ...
├── config/                  # 区块链与服务端配置加载
├── scripts/                 # 开发运维脚本（ABI同步等）
├── utils/                    # 工具函数
├── uploads/                  # 上传文件存储
├── artifacts/                # 编译后的合约
├── cache/                    # 构建缓存
├── index.js                  # 后端入口文件
├── database.js               # 数据库配置（支持 SQLITE_DB_PATH）
├── hardhat.config.js         # Hardhat配置
├── deployEnhancedDeSci.js    # 合约部署脚本
└── package.json              # 项目依赖
```

## 🔧 开发指南

### 本地开发

启动前请复制环境变量模板，根据需要修改端口、链上服务地址等配置：

```bash
cp .env.example .env
```

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

# 部署到本地网络（包含 ABI 同步）
npm run deploy-contracts

# 如需单独同步 ABI，可执行
npm run sync-contracts
```

4. **链下监听服务（Go）**
```bash
cd services/chain-api
cp .env.example .env   # 首次运行时填写合约地址/数据库配置
go run cmd/server/main_simple.go

# 或使用脚本
./start.sh
# 或在仓库根目录执行
cd .. && npm run chain-api:start
```

### Docker 快速启动

```bash
cp .env.example .env
docker compose up --build
```

容器启动后：

- 前端：<http://localhost:5173>
- 后端：<http://localhost:3000>
- 链下服务健康检查：<http://localhost:8088/health>
- Hardhat RPC：<http://localhost:8545>

如需重新部署合约，可在容器环境中执行：

```bash
docker compose run --rm contracts
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

更多 API 调试与 Demo 步骤详见 `docs/demo-api-playbook.md`。

### 参考文档

- `docs/demo-api-playbook.md`：端到端 API 操作指南  
- `docs/web3-architecture-story.md`：竞赛叙事与 Web3 架构取舍说明  
- `docs/frontend-navigation.md`：前端路由结构与页面职责  
- `docs/integration-plan.md`：合并两个代码仓库的整体策略

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
