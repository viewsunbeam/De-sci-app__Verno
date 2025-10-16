# Verno 前端路由与导航逻辑说明

> 本文基于 `frontend/src/router/index.js` 与当前 UI 设计，对整体导航结构、页面职责与链上动作进行梳理，方便团队成员与评审快速理解应用故事线。

---

## 1. 核心布局

- **Home (`/`)**：登陆页 / 竞赛说明，提供进入控制台与探索入口。
- **MainLayout**：侧边导航 + 顶部用户栏，所有业务页面作为子路由挂载在该布局下。
- **侧边菜单（见 UI 截图）**：顺序对应 Dashboard、Profile、Projects、Datasets、Proof、Publications、Explore、NFTs、Reviews、Console 等分类。

---

## 2. 路由总览

| 菜单 | 路径 | 组件 | 说明 / 链接 |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | `Dashboard.vue` | 显示竞赛提醒、项目/评审统计、链上影响力得分（调用 `/api/chain/research`）。 |
| Profile | `/profile` | `Profile.vue` | 管理学术身份、链上 DID，与 `/api/auth/profile` 对接。 |
| Projects | `/projects` | `Projects.vue` | 我的项目列表；点击进入 `ProjectLayout` 子页（仓库、协作、Proof、Funding、NFT、迭代路线等）。 |
| Datasets | `/datasets` | `Datasets.vue` | 数据集列表；`Upload`、`Edit`、`Permissions`、`Analytics` 等子路由走完整个上传→隐私配置→ZK 证明链路。 |
| Proof | `/proof` | `Proof.vue` | ZK 证明总览；`Generate`、`ProofDetails` 等子页用于生成 / 演示零知识校验。 |
| Publications | `/publications` | `Publications.vue` | 论文/成果管理；`/papers/*` 下提供提交、导入、编辑、发布等流程，与 NFT 铸造衔接。 |
| Explore | `/explore` | `Explore.vue` | 浏览全平台内容：项目 / 数据集 / 成果；点击进入 `ExploreProjectDetail` 等详情页。 |
| NFTs | `/nfts` | `NFT.vue` | 我的 NFT 列表；`/nft/mint` 用于铸造新 NFT（调用 `ResearchNFT` 合约）。 |
| Reviews | `/reviews` | `Reviews.vue` | 评审任务与详情；`ReviewForm` 支持提交评审意见。 |
| Console | `/admin/logs` | `LogDashboard.vue` | 管理员日志台，通过路由守卫 `requiresAdmin` 保护，展示系统事件（可与链上事件对照）。 |
| Influence | `/influence` | `Influence.vue` | 影响力榜单，调用链下聚合接口 `/api/chain/research/by-author/:address`。 |

> 详细子路由（例如 `/projects/:projectId/repository`、`/datasets/:dataset_id/encrypt`）用于承载具体分步操作。路由守卫会在访问 `/admin/*` 时校验当前用户是否为管理员。

---

## 3. 典型用户故事线

1. **注册 / 补档案**：Home → Wallet connect → `/profile` 填写信息 → `/verify` 发起 ORCID 校验 → 链上 `UserRegistered` 事件被监听。
2. **项目与数据集管理**：`/projects` 创建项目 → `/datasets/upload` 提交数据 → 设置隐私 / 加密 / zk-proof → `/proof` 查看生成的证明。
3. **科研成果发布**：`/papers/submit` 上传 PDF → `/publications` 管理审稿状态 → `/nft/mint` 将成果铸造为 NFT → 影响力榜实时更新。
4. **评审与协作**：`/reviews` 接收评审任务 → 填写表单 → 评审结果写入链下并等待链上积分同步。
5. **探索与展示**：`/explore` 展示所有公开内容，演示链上确权、链下访问控制；`/nfts` 展示已铸造成果。
6. **运营监控**：管理员访问 `/admin/logs`，对照链下日志与链上事件，确保审计链闭环。

---

## 4. 与链上 / 链下交互的路由

| 页面 | 触发点 | 后端 API | 链上合约 / 事件 |
| --- | --- | --- | --- |
| Profile → Verify | ORCID 按钮 | `/api/auth/orcid` → `/api/auth/orcid/callback` | `DeSciRegistry.registerUserWithReward` |
| Datasets → Upload | 上传 & 权限设置 | `/api/datasets/upload` / `/permissions` | `DatasetManager.uploadDatasetWithReward` → `DatasetUploaded` |
| Proof → Generate | 生成 ZK 证明 | `/api/datasets/:id/zk-proof` | `ResearchDataVerifier` / `ProofSubmitted` |
| Publications → Submit | 上传论文 | `/api/publications/submit` | `ResearchNFT.mintResearch`（通过 `/api/nfts/mint` 链接） |
| NFTs → Mint | 铸造 NFT | `/api/nfts/mint` | `ResearchNFT` 合约事件 `ResearchMinted` |
| Influence | 刷新影响力 | `/api/chain/research/*` | 链下聚合 `DeSciPlatform`/`InfluenceRanking` 事件 |

---

## 5. 导航设计要点

- 所有路由均使用惰性加载（`import()`）以减小首屏体积。
- 侧边栏与顶部按钮已经翻译并面向竞赛场景（如“完善竞赛档案”、“竞赛影响力榜单”）。
- 管理端口（`/admin/logs`）通过路由守卫保护，只有链上 `user_role = admin` 的地址可访问。
- 若需要在 Demo 中 URL 跳转，可直接访问文档中列出的路径，或使用左侧菜单快速切换。

---

## 6. 后续可优化项

1. 将 `/explore` 与 `/nfts` 的筛选条件同步到 URL query，便于分享。
2. 在 `Influence.vue` 中增加按地址跳转功能，直接查询某位研究员的链上贡献。
3. 对 `/reviews` 等页面加入链上积分发放的实时提示，强化 Web3 叙事效果。

---

如需结合 API 流程演示，请配合 `docs/demo-api-playbook.md` 与 `docs/web3-architecture-story.md`，展示从页面操作到链上事件的全链路故事。***
