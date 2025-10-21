# Verno 去中心化科研平台 · 设计报告（CCF 竞赛版）

> 面向中国计算机学会第四届大学生区块链技术与创新应用竞赛评审与项目团队，梳理 Verno 平台的动机、架构、实现与创新点。

---

## 1. 应用背景

- 科研协同的关键行为（项目立项、数据共享、成果发表、评审记录、激励发放）缺乏可追溯与不可篡改的证据链，导致确权争议与激励失衡。
- 隐私与开放的矛盾突出：高价值科研数据无法直接公示，但评审/复现又需要可信验证。
- 传统平台多依赖中心化数据库，缺乏跨主体的透明日志，审计门槛高。

## 2. 拟解决的问题

1. **可信确权**：通过智能合约固化用户身份、成果 NFT、哈希与声誉指标，实现“何时、由谁、提交了什么”的链上可证。
2. **隐私友好的数据共享**：支持加密存储、零知识证明、可编程访问控制，兼顾安全性与可用性。
3. **公平透明的评审与激励**：将评审记录、影响力计算、奖励规则转化为可审计逻辑，缓解“黑箱评审”和“贡献难量化”的痛点。
4. **链上-链下协同**：为大体量数据设计链下托管 + 链上指纹与事件监听的混合架构，提升体验与吞吐。

## 3. 设计思路与总体方案

### 3.1 分层架构

```
前端 (Vue3 + Naive UI) ── REST / Web3 ── Node/Express + SQLite ──▶ 合约事件 (Hardhat/EVM)
         │                       │                   │
         ▼                       ▼                   ▼
体验编排 + Demo引导      权限、文件、审计日志         DeSciPlatform & 子合约
         │                       │                   │
         └──────▶ Go 链下监听服务 (services/chain-api) ◀──────┘
```

- **前端**：以竞赛叙事为导向，覆盖数据加密、ZK 证明、DAO 治理、影响力榜单等关键流程（如 `frontend/src/views/datasets/DatasetEncrypt.vue`、`frontend/src/views/Proof.vue`）。
- **Node/Express 后端**：提供 REST API、文件上传、权限管理、NFT 营销、链上数据代理 (`index.js`, `routes/datasets.js`, `routes/nfts.js`)。
- **Go 链下服务**：监听合约事件写入高性能查询库，提供哈希验证接口与零知识校验网关（`services/chain-api/internal`）。
- **智能合约群**：包含身份注册、数据集 NFT、科研成果 NFT、影响力评分、ZK 验证、治理代币等模块（`contracts/*.sol`）。
- **自动化部署脚本**：`deployEnhancedDeSci.js` 一次性部署 10 套合约并配置权限，`start-platform.sh` 启动链+前后端联调环境。

### 3.2 关键链上模块

| 模块 | 主要职责 | 特色功能 |
| --- | --- | --- |
| `DeSciPlatform` | 平台核心调度 | 奖励发放、协作网络、引用关系图、与 NFT/数据合约联动 |
| `DeSciRegistry` | DID/角色管理 | 角色审查、信誉门槛、链上暂停机制、管理员授权 |
| `DatasetManager` | 数据集 NFT | 隐私等级、付费访问、引用记录、收益分成、质量验证 |
| `ResearchNFT` | 科研成果 NFT | 多作者份额、评审轨迹、引用统计、影响力评分、授权评审员 |
| `InfluenceRanking` | 声誉量化 | 多维度得分、时间衰减、领域/机构排名、ZK 结果预留 |
| `ZKPVerifier` / `ZKProof` / `ResearchDataVerifier` | 零知识证明 | Groth16 参数管理、证明登记、统计约束验证、支持差分隐私扩展 |

### 3.3 链下创新

- **事件监听闭环**：Go 服务将 `ResearchMinted`、`DatasetUploaded` 等事件解析后入库 (`services/chain-api/internal/listener/listener.go`)，把链上事实同步到 REST 查询层 (`service/service.go`)。
- **安全代理与风控**：`routes/chain.js` 统一转发链下验证接口并做超时处理，`utils/logger.js` 记录带 IP/UA 的审计日志，支持过滤统计 (`routes/logs.js`)。
- **隐私工具链**：`routes/datasets.js` 内建数据加密流程（算法选择、密钥指纹、访问控制）、ZK 证明生成/验证、细粒度权限表 `dataset_permissions`。
- **身份增强**：Web3 登录外，支持 ORCID OAuth (`routes/auth.js`) 与 DID (`database.js`)，前端引导多种认证方式 (`frontend/src/views/Verify.vue`)。

## 4. 实现功能与核心指标

1. **科研项目全流程**
   - 项目/看板/协作管理 (`routes/projects.js`, `routes/kanban.js`)。
   - 数据集上传、版本、引用、受控访问、兴趣推荐 (`routes/datasets.js` + `frontend/src/views/datasets/*`)。
   - 科研成果 NFT 铸造、NFT 市场、版权收益 (`routes/nfts.js`, `frontend/src/views/NFT.vue`)。
2. **隐私&安全能力**
   - 数据加密计划、密钥托管选项、访问审计、违规清除。
   - 零知识证明生命周期：生成、校验、复核、历史查询。
   - 审计日志可视化、风险分级告警 (`frontend/src/views/LogDashboard.vue`)。
3. **激励与声誉**
   - 平台治理代币 `SciToken`、奖励开关与倍数 (`contracts/DeSciPlatform.sol`)。
   - 影响力榜单、同行评审贡献、机构热力图 (`frontend/src/views/Influence.vue`)。
4. **链上-链下验证**
   - `/api/chain/health`、`/api/chain/research/by-author/:address` 等接口，用于评委复核链上哈希 (`routes/chain.js`)。
   - `Proof` 页面可视化展示 ZK 验证、失败重试、差分隐私开关。

### 关键量化指标（当前实现可演示）

| 指标 | 描述 | 产出方式 |
| --- | --- | --- |
| 注册/上传奖励 | 每行为触发链上奖励事件 | `config.PlatformConfig` 参数 |
| 数据访问审计 | 访问计数 + `dataset_usage` 表 | REST + 前端图表 |
| 影响力得分 | 发表/评审/数据贡献多权重 | `InfluenceRanking.calculate*` |
| ZK 成功率 | 生成、验证成功计数 | `zk_proofs` 表字段 `verification_count` |

## 5. 软件流程（示例：科研成果登记）

1. 研究员在前端上传论文与元数据 → Node API 保存文件至 `uploads/`，写入 SQLite (`routes/publications.js`)。
2. 后端调用 `ResearchNFT.mintResearch` → 链上铸造 + 触发 `ResearchMinted` 事件。
3. Go 链下服务捕获事件，写入 `research_data` 表，暴露 `/api/research/:id` 查询。
4. 前端 `ProjectNFT` 页面从 REST 拉取链下信息、从 Web3 读取合约状态（作者份额、访问价格），同步展示。
5. 如需验证内容，评委可调用 `/api/chain/research/:id`，对比前端提供的哈希值，确保文件未被篡改。

其他关键流程（数据集加密、零知识查询、激励发放）均遵循“链上记录事实 + 链下高效计算 + 前端可视化闭环”的设计。

## 6. 创新与核心亮点

1. **多合约可组合治理**：平台合约将注册、数据、NFT、影响力、ZK 模块解耦，支持替换与独立升级。
2. **隐私友好型数据市场**：引入加密策略、密钥托管、ZK 证明、差分隐私查询，实现“看得见的可信 + 控得住的隐私”。
3. **事件驱动的合规审计**：链下 Go 微服务监听日志，结合 `ActivityLogger` 的风控指标，提供细粒度追踪链路。
4. **跨域身份体系**：将 DID、ORCID、机构邮箱三种认证方式纳入统一流程，提升科研身份可信度。
5. **竞赛导向体验**：前端提供 Demo 引导、分角色看板、Proof/Verify 等模块，使评审能顺序复现链上-链下协同。

## 7. 关键技术栈

- **智能合约**：Solidity 0.8.20、Hardhat、OpenZeppelin、Groth16 验证框架。
- **后端**：Node.js 20、Express、Better-SQLite3、Multer、Axios、Ethers.js。
- **链下服务**：Go 1.23、Gin、Gorm、go-ethereum、SQLite、Docker。
- **前端**：Vue 3、Vite、Pinia、Naive UI、ECharts、Web3Modal。
- **DevOps**：Docker Compose、Shell 启动脚本、`quick-test.sh` 自动化验收。

## 8. 部署与运行

### 开发者模式

```bash
cp .env.example .env
npm run install-all      # 安装根目录 + 前端依赖
npm run start-blockchain # Hardhat 节点
npm run deploy-contracts # 部署智能合约并同步 ABI
npm run dev              # 前端 + 后端一站式启动
```

### Docker 一键演示

```bash
docker compose up --build -d
# 前端 http://localhost:5173
# 后端 http://localhost:3000
# 链下服务 http://localhost:8088
# Hardhat RPC http://localhost:8545
```

## 9. 演进计划（赛后展望）

- **自动化奖惩闭环**：将链下计算的影响力排名回写合约，触发代币奖励。
- **高阶隐私协议**：接入多方安全计算、门限加密，实现分布式密钥控制。
- **多链部署**：适配 L2 与跨链桥，支持高校联盟链与公链双部署。
- **可验证计算服务**：扩展 ZK 支持的计算类型，引入证明即服务（Proof-as-a-Service）。

---

> 本报告配套的测试报告、补充材料、Demo 分镜脚本见 `docs/competition-test-report.md`、`docs/competition-innovation-brief.md`、`docs/competition-demo-storyboard.md`。
