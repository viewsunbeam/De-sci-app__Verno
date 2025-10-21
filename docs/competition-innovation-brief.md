# Verno 平台创新亮点与安全隐私说明（CCF 竞赛补充资料）

本文件聚焦评委最关心的“创新点”“安全/隐私保障”“落地可行性”，配合设计/测试报告使用。

---

## 1. 竞赛定位与价值主张

- **可信科研基础设施**：将科研活动拆分为身份、数据、成果、评审、激励五大要素，分别映射到链上可验证的事件与合约状态，降低争议成本。
- **隐私可控的数据流通**：引入可配置的加密策略、零知识证明、差分隐私，示范“开放共享”和“隐私合规”并存的路径。
- **链上-链下协同示范**：以事件监听 + REST 代理构建“链上写、链下读”的闭环，可复用于高校联盟链、研究机构数据交换平台。

## 2. 功能矩阵速览

| 维度 | 能力清单 | 对应实现 |
| --- | --- | --- |
| 身份与信誉 | Web3 DID、ORCID 认证、声誉系统、角色门槛 | `contracts/DeSciRegistry.sol`、`routes/auth.js`、`frontend/src/views/Verify.vue` |
| 数据管理 | 多文件上传、隐私等级、权限授权、审计日志 | `routes/datasets.js`、`utils/logger.js`、`frontend/src/views/datasets/*` |
| 隐私计算 | 数据加密向导、ZK 生成/验证、差分隐私查询、私有分析 | `DatasetEncrypt.vue`、`Proof.vue`、`PrivateQuery.vue`、`contracts/ZKPVerifier.sol` |
| 成果确权 | NFT 铸造、授权合约、版税分成、市场挂牌 | `contracts/ResearchNFT.sol`、`routes/nfts.js`、`frontend/src/views/NFTDetail.vue` |
| 激励与治理 | 激励参数配置、链上奖励分发、影响力排行榜、DAO 议程 | `contracts/DeSciPlatform.sol`、`InfluenceRanking.sol`、`frontend/src/views/Influence.vue` |
| 监管与审计 | 链下事件追踪、REST 验证接口、日志看板、风控筛选 | `services/chain-api/internal/*`、`routes/chain.js`、`frontend/src/views/LogDashboard.vue` |

## 3. 安全与隐私策略

1. **最小化链上数据**：只存储指纹、元状态与奖励分配，原始数据和密钥保留在链下加密存储，降低泄露风险。
2. **可验证访问**：链下服务对每次敏感访问写入 `dataset_usage`、`activity_logs`（含 IP/UA），管理员可实时查询、导出。
3. **零知识与差分隐私并行**：ZK 证明用于证明“知道数据”但“不泄露内容”；差分隐私用于统计分析场景，前端提供开关以演示两种策略协同。
4. **多重身份验证**：钱包签名只是入门，结合 ORCID OAuth 和机构邮箱让科研身份具有现实背书。
5. **合约安全基线**：采用 OpenZeppelin 库、`ReentrancyGuard`、`Ownable`、权限 role 管理，部署脚本自动授予最小权限。
6. **事件重放防护**：链下监听服务维护最后处理的区块号 (`service/service.go` + `repository`)，重复事件会被忽略。

## 4. 可执行 Demo 建议顺序

1. **身份初始化**：钱包连接 → ORCID 认证 → Dashboard 展示声誉任务。
2. **项目协作**：创建项目 → 增加协作者 → 上传数据集（选“加密”）。
3. **隐私处理**：在 Dataset Encrypt 页面选择算法 → 触发加密 → 查看审计日志。
4. **零知识证明**：生成 ZK 证明 → 前端 Proof 页面显示状态 → 调用链下验证 API。
5. **成果铸造**：提交论文 → 铸造 NFT → Marketplace 查看上架信息。
6. **链上验证**：在 Admin/Log Dashboard 查看事件 → 调用 `/api/chain/research/latest` 验证哈希。
7. **影响力展示**：切换到 Influence 榜单，说明评分因子与奖励池。

> 每个步骤均可在前端“竞赛导览”提示中找到对应入口，实现 10-15 分钟内完整演示。

## 5. 商业/社会影响展望

- **科研诚信保障**：透明的评审与引用链路可快速识别造假与抄袭。
- **高校科研成果流通**: 支持以 NFT/加密数据形式授权给企业或合作院校，配合链上奖励激励更多开放共享。
- **多方协作模板**：链上/链下架构可迁移到医疗、药企、多机构联合研发场景，解决数据孤岛。
- **可持续生态**：治理代币 + 声誉体系为 DAO 管理打下基础，可吸引社区贡献者持续维护。

## 6. 对评审的 FAQ

| 问题 | 回答要点 |
| --- | --- |
| 如何保证数据隐私？ | 采用端到端加密、权限表、ZK 证明与差分隐私组合；链上仅记录哈希与状态。 |
| 评审如何验证 Demo 真实性？ | 提供 API Playbook、链下查询接口与日志看板，可现场比对哈希/事件。 |
| 是否依赖中心化服务？ | 数据存储与链下计算在本地或机构服务器，但事件与凭证链上留痕，可跨机构审计。 |
| 是否支持扩展到公链/联盟链？ | Hardhat 配置可无缝切换到 Sepolia/多链；合约未绑定特定网络。 |
| 未来演进方向？ | 自动化奖励、跨链数据市场、隐私计算服务化、与现有科研管理系统对接。 |

---

> 更多技术细节请查阅 `docs/competition-design-report.md`、`docs/competition-test-report.md` 与代码注释。
