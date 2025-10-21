# Verno 去中心化科研平台 · 设计框架

> 该文档提供参赛材料的整体设计框架，便于团队成员在后续阶段按模块补充细节、图示与案例。请在标记为「待补充」的部分纳入最新成果或讨论结论。

---

## 0. 快速索引

- 核心代码参考：
  - 平台总线与激励：`contracts/DeSciPlatform.sol`
  - 身份与角色：`contracts/DeSciRegistry.sol`
  - 数据集治理：`contracts/DatasetManager.sol`
  - 科研 NFT：`contracts/ResearchNFT.sol`
  - 零知识体系：`contracts/ZKPVerifier.sol`、`contracts/ZKProof.sol`
  - 链下监听：`services/chain-api/internal/listener/listener.go`
  - 安全代理：`routes/chain.js`
  - 前端隐私流程：`frontend/src/views/datasets/DatasetEncrypt.vue`

> 建议贡献者在填充内容时同时引用具体文件/行号或截图，确保评审可追溯。

---

## 1. 项目叙事框架（Narrative Canvas）

| 维度 | 说明 | 待补充 |
| --- | --- | --- |
| 赛题背景 | 简述科研可信性、隐私矛盾的痛点。 | [待补充：结合外部数据或案例] |
| 目标用户 | 研究员、评审员、管理者等角色及诉求。 | [待补充：用户画像/使用场景] |
| 价值主张 | “链上可信 + 链下高效”“隐私可控数据流通”。 | [待补充：差异化优势] |
| 创新点 | 模块化合约群、事件驱动审计、ZK + 加密联动。 | [待补充：与竞品对比] |

提示：可以参考 `docs/competition-innovation-brief.md` 中的重点信息，提炼成 PPT 级别的摘要。

---

## 2. 架构蓝图（Architecture Blueprint）

### 2.1 逻辑分层

```
前端 (Vue3 + Naive UI)
   │ REST / Web3
Node/Express + SQLite
   │ 事件流
Go 链下服务 (监听 + 混合查询)
   │ 合约交互
Solidity 合约群 (Hardhat)
```

- 参考实现：
  - 链上事件入口：`services/chain-api/internal/listener/listener.go`
  - 链上配置加载：`config/blockchain.js`
  - 前端数据加密流程：`frontend/src/views/datasets/DatasetEncrypt.vue`

**待补充项：**
- [ ] 以图示形式呈现网络与数据流向。
- [ ] 说明容器化部署（`docker-compose.yml`）在比赛演示中的作用。
- [ ] 标注关键安全边界与供应链依赖。

### 2.2 模块责任矩阵

| 层级 | 子模块 | 代码入口 | 说明 | 待补充 |
| --- | --- | --- | --- | --- |
| 合约层 | DeSciPlatform / SciToken | `contracts/DeSciPlatform.sol` | 激励、协作、统计 | [待补充：奖励参数调优策略] |
| 合约层 | DatasetManager | `contracts/DatasetManager.sol` | 数据 NFT、访问订单 | [待补充：收益分成流程图] |
| 合约层 | ResearchNFT | `contracts/ResearchNFT.sol` | 多作者 NFT、引用网络 | [待补充：评审状态机图] |
| 合约层 | ZKPVerifier / ZKProof | `contracts/ZKPVerifier.sol` | Groth16 参数管理 | [待补充：证明类型清单] |
| 链下服务 | Listener + Service | `services/chain-api/internal` | 事件落库、哈希校验 | [待补充：数据库模式图] |
| 后端 API | Datasets / Chain | `routes/datasets.js`, `routes/chain.js` | 权限、加密、验证代理 | [待补充：安全策略要点] |
| 前端 | Proof / Encrypt | `frontend/src/views` | 用户体验编排 | [待补充：关键 UI 流程截图] |

---

## 3. 设计原则与约束（Principles & Constraints）

1. **链上可信**  
   - 核心事实上链（身份、成果、哈希、奖励）。  
   - 参考：`DeSciRegistry`, `ResearchNFT`, `DeSciPlatform`.

2. **链下高效**  
   - 大文件、复杂计算链下执行，事件回写 SQLite。  
   - 参考：`services/chain-api/internal/service/service.go`.

3. **隐私优先**  
   - 加密 + ZK + 差分隐私配合，按需开启（页面：`DatasetEncrypt.vue`, `PrivateQuery.vue`).  

4. **开放扩展**  
   - 合约/服务可替换，部署脚本 `deployEnhancedDeSci.js` 提供一键安装。  

**待补充项：**
- [ ] 明确性能指标（TPS、响应时间、并发目标）。
- [ ] 制定安全威胁模型（STRIDE 或 LINDDUN 框架）。
- [ ] 说明数据主权合规（例如隐私条例映射）。

---

## 4. 核心流程模板（Process Templates）

> 以下为示例模板，建议贡献者针对每个流程补充「泳道图 + 调用栈 + 关键接口」。

### 4.1 科研成果登记 → NFT 铸造

1. 前端上传成果元数据与文件。
2. Node API 持久化文件 (`routes/publications.js`) 与数据库记录。
3. 调用 `ResearchNFT.mintResearch`，触发 `ResearchMinted` 事件。
4. 链下服务监听写入 `research_data` 表。
5. 前端展示链上/链下状态，并提供校验链接。

**待补充：**
- [ ] 成果元数据字段说明。
- [ ] 铸造失败/回滚策略。
- [ ] 审计日志示例。

### 4.2 数据集加密 → 权限授权 → ZK 验证

1. 数据集上传后，创建加密任务（`route/datasets.js:encrypt`）。  
2. 生成 `encryption_metadata`，状态切换为 `ready`。  
3. 执行 `POST /api/datasets/:id/zk-proof`，生成证明并持久化。  
4. 通过 `/api/chain/research/:id` 或 `/api/dataset/:id` 进行跨服务验证。  

**待补充：**
- [ ] 真正使用的加密算法与密钥托管方案（若切换为真实实现）。  
- [ ] 权限策略枚举（访问、下载、再分享）。  
- [ ] ZK 生成流程所需的 CLI 或脚本指引。  

### 4.3 影响力计算 → 激励分发

1. 链上事件更新 `InfluenceRanking` 中的指标（发表、评审、数据贡献）。  
2. 链下可扩展计算更多维度，计划写回链上。  
3. 根据 `PlatformConfig` 分发奖励（可由管理员触发）。  

**待补充：**
- [ ] 影响力公式细节与示例数据。  
- [ ] 激励发放执行脚本（或管理后台操作流程）。  
- [ ] 声誉与治理之间的耦合解释。  

---

## 5. 竞赛材料准备 Checklist

| 项目 | 负责人 | 截止时间 | 状态 |
| --- | --- | --- | --- |
| 架构总览图 | [待指派] | [待定] | [待补充] |
| 模块说明书 | [待指派] | [待定] | [待补充] |
| 数据/隐私策略文案 | [待指派] | [待定] | [待补充] |
| Demo 脚本与拍摄 | [待指派] | [待定] | [待补充] |

> 可结合 `docs/competition-demo-storyboard.md` 与本框架同步推进。

---

## 6. 附录占位（Appendix Slots）

- **A. 术语表** — [待补充]
- **B. 接口清单** — [待补充]
- **C. 部署参数** — [待补充]
- **D. 风险评估** — [待补充]

请在补充信息后移除「待补充」标记，并注明作者与日期。

---

> 如需查看完整测试结果或运行脚本，可参考 `tests/verno-complete-tests/COMPLETE_TEST_REPORT.md` 与 `run_complete_tests.sh`。设计框架内容建议与测试框架保持一致性。
