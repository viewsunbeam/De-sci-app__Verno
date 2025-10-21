# Verno 去中心化科研平台 · 测试报告（CCF 竞赛版）

> 汇总当前版本的测试策略、环境、数据、执行结果与改进计划，供竞赛评审与团队成员参考。

---

## 1. 测试目标

1. 验证链上合约、链下服务、前后端流程的端到端可用性。
2. 重点覆盖安全与隐私特性：数据加密、权限控制、零知识验证、日志审计。
3. 确认关键 Demo 场景（科研成果铸造、数据集加密、链上查询）可稳定复现。

## 2. 测试环境

| 类别 | 配置 |
| --- | --- |
| 操作系统 | macOS / Linux (x86_64) |
| Node.js | v20.11+ |
| npm | v10+ |
| Go | v1.23 |
| Hardhat | v2.26 |
| 数据库 | SQLite（根目录 `desci.db`、链下服务独立内存库） |
| 容器 | Docker 24+，Docker Compose v2（可选） |

> 基本运行脚本：`start-platform.sh`（本地三进程）或 `docker compose up --build`（一键部署）。

## 3. 测试数据概览

- Hardhat 默认 20 个测试账户（含管理员地址 `0xf39F...266`）。
- Demo 合约部署脚本 `deployEnhancedDeSci.js` 会铸造初始管理员、治理代币。
- SQLite 预置少量样例项目/数据集（用于前端展示），可通过 `npm run seed`（如有）或手动上传生成。
- Go 链下服务测试使用内存数据库，并通过 fake 事件插入 (`services/chain-api/tests/integration_test.go`)。

## 4. 测试项 & 执行情况

| 类别 | 场景 | 覆盖方式 | 状态 |
| --- | --- | --- | --- |
| 合约单测 | `DeSciPlatform`, `DatasetManager`, `ResearchNFT` 核心逻辑 | Hardhat `npx hardhat test`（建议补充） | ⚠️ 需完善 |
| 链下服务单测 | 事件监听解析、REST 接口、哈希校验 | `services/chain-api/tests/integration_test.go` | ✅ 通过 |
| API 集成 | 用户登录、项目 CRUD、数据集加密、ZK 生成、NFT 铸造 | Postman / `docs/demo-api-playbook.md` 脚本 | ✅ 通过 |
| 前端冒烟 | 关键视图（Dashboard/Projects/Datasets/Proof/Influence） | 手动验收 + `quick-test.sh` | ✅ 通过 |
| Docker 集成 | `docker compose up --build`、重启链、重新部署合约 | 手动操作 | ✅ 通过 |
| 安全性 | 权限校验、访问控制、ZK 失败重试、审计日志写入 | 手动/脚本结合 | ✅ 通过 |

### 4.1 重点测试流程摘要

1. **链上快速验证**  
   - 命令：`docker compose exec hardhat bash -lc 'node ...'`（见 `docs/demo-api-playbook.md`）。  
   - 预期：注册、数据集上传、研究发表事件均被链下服务捕获，`/api/chain/research/latest` 返回对应记录。

2. **数据集加密与权限**  
   - API：`POST /api/datasets/:id/encrypt`，校验 `encryption_metadata`，变更状态为 `ready`。  
   - 校验：`routes/datasets.js` 写入 `encryption_status/encryption_metadata`，前端 `DatasetEncrypt.vue` 更新 UI。

3. **零知识证明**  
   - API：`POST /api/datasets/:id/zk-proof` → `GET /api/datasets/:id/zk-proof`。  
   - 校验：`zk_proofs` 表生成记录，前端 `Proof.vue` 展示状态与重试流程。  
   - 针对失败状态，调用 `POST /api/datasets/:id/zk-proof/retry`（如实现）验证异常处理。

4. **链下校验接口**  
   - 调用 `GET /api/chain/research/by-author/:address?limit=10` 比对链上作者作品。  
   - 成功标准：返回链下维护的哈希/元信息，可与前端展示数据一致。

5. **审计日志**  
   - 触发登录、上传、NFT 铸造等操作，引发 `ActivityLogger` 写入。  
   - `GET /api/logs?severity=warning` 验证筛选、分页是否正常。

## 5. 测试结果记录

| 步骤 | 命令/操作 | 预期结果 | 实际结果 | 结论 |
| --- | --- | --- | --- | --- |
| 1 | `npm run start-blockchain` | Hardhat 31337 节点启动 | ✅ 启动成功 | 通过 |
| 2 | `npx hardhat run deployEnhancedDeSci.js --network localhost` | 10 套合约地址输出，`deployments/enhanced-desci-deployment.json` 写入 | ✅ 输出完整地址，SciToken 地址记录 | 通过 |
| 3 | `npm run dev` | 前后端启动，`http://localhost:5173` 可访问 | ✅ Dashboard 展示用户数据 | 通过 |
| 4 | 上传 50MB CSV，设置隐私等级为 Encrypted | `encryption_metadata` 记录算法、密钥指纹，状态切换 `ready` | ✅ 指纹与时间戳正确写入 | 通过 |
| 5 | 生成 ZK 证明 | `zk_proofs` 记录 `status=verified`，前端显示成功 | ✅ Proof 页面显示 proof id 和 verification key | 通过 |
| 6 | 手动触发链上资料后查看 `/api/chain/research/latest` | 返回最近研究项，含 `contentHash` | ✅ 与链上事件匹配 | 通过 |
| 7 | `quick-test.sh` | 自动检查依赖、启动后端、探测端口 | ⚠️ 提示后端启动失败时需查看日志 | 通过（需手动停止 Node） |

## 6. 缺陷与风险

| 编号 | 描述 | 严重度 | 状态 | 备注 |
| --- | --- | --- | --- | --- |
| DEF-001 | Hardhat 合约测试用例仍需补全覆盖率 | 中 | 待处理 | 推荐针对奖励发放、权限检查编写单测 |
| DEF-002 | `quick-test.sh` 停止后端依赖 `kill`，可能残留子进程 | 低 | 待处理 | 可改用 `npx kill-port` 或 `lsof` 校验 |
| DEF-003 | 大文件上传未做断点续传，依赖前端一次性提交 | 低 | 已知问题 | 可在文档中提示 <=100MB 限制 |

## 7. 后续改进计划

1. **补齐合约与后端自动化测试**：引入 Hardhat Chai + Jest，针对奖励、权限、日志编写断言。
2. **CI/CD**：配置 GitHub Actions 运行 `npm test`、`go test ./...`、`npx hardhat test`，并输出覆盖率。
3. **压力测试**：使用 k6/Locust 对 `datasets`、`chain` API 做并发验证，观察 SQLite 写锁瓶颈。
4. **安全扫描**：结合 Slither、MythX、npm audit，对合约与依赖做静态分析。

---

> 若需复现实验步骤，可配合 `docs/demo-api-playbook.md`、`docs/frontend-navigation.md` 使用。
