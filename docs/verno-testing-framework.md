# Verno 去中心化科研平台 · 测试文档框架

> 本文提供竞赛阶段的测试组织框架：先明确现有基线与自动化能力，再规划需补齐的前端真实场景测试与证据收集。请在「待补充」区块记录实际执行结果（含截图、日志、链上交易哈希）。

---

## 1. 测试目标与范围

| 目标 | 说明 | 关联文档/脚本 | 待补充 |
| --- | --- | --- | --- |
| 核心能力回归 | 确保合约、链下服务、API 基本可用 | `tests/verno-complete-tests/COMPLETE_TEST_REPORT.md` | 持续维护 |
| 前端真实场景 | 覆盖用户主流程（身份 → 项目 → 数据 → ZK → NFT → 验证） | 本框架第 3 节 | [待补充：执行记录] |
| 性能与稳定性 | 关键接口的响应时间、并发能力 | `tests/verno-complete-tests/run_complete_tests.sh` | [待补充：更多压力测试数据] |
| 安全与隐私 | 权限、审计、ZK 校验 | 合约/后端代码审阅 | [待补充：威胁模型 & 复核结果] |

---

## 2. 自动化基线（已实现）

### 2.1 Complete Test Suite 概览

- 目录：`tests/verno-complete-tests`
- 关键产物：
  - `COMPLETE_TEST_REPORT.md`：最新一次全量测试报告（示例结论：前端页面、Go API、合约结构检查全部通过）。
  - `run_complete_tests.sh`：执行入口脚本，自动收集页面可达性、API 状态、数据库一致性等。
  - `test_verno_complete.py`：基于 Pytest 的具体检查逻辑。
  - `test_config.json`：可扩展的测试目标配置。
- 推荐流程：
  ```bash
  cd tests/verno-complete-tests
  ./run_complete_tests.sh            # 触发全量测试
  cat COMPLETE_TEST_REPORT.md        # 查看自动生成报告
  ```

> 若脚本输出 WARN/FAIL，请在本框架第 4 节「缺陷记录」中登记，并同步修复进展。

### 2.2 已覆盖检查点

| 类别 | 代表检查 | 参考实现 |
| --- | --- | --- |
| 前端路由 | `/`, `/dashboard`, `/projects`, `/datasets`, `/proof`, `/influence` 可访问 | `test_verno_complete.py` |
| Go API | `/health`, `/api/hybrid/stats`, `/api/hybrid/verify/:tokenId` | `services/chain-api/internal/api` |
| 数据库 | `desci.db` 表结构、记录数一致性 | `run_complete_tests.sh` 输出 |
| 合约结构 | `contracts/*.sol` 与 `artifacts` 是否存在 | 同上 |
| 性能采样 | Go API 平均响应 < 1ms（本地） | `COMPLETE_TEST_REPORT.md` |

> 自动化未覆盖 Node/Express 后端的所有路由以及真实钱包交互，需在后续手动测试中补齐。

---

## 3. 前端真实场景测试模板（待补充截图与结果）

> 以下流程需使用实际前端（`http://localhost:5173`）与测试钱包（Hardhat 账户或 MetaMask）操作完成。请在每个步骤记录执行人、日期、截图、链上哈希等证据。

### 3.1 身份初始化与 Dashboard

- **准备条件**：本地环境启动（`start-platform.sh` 或 Docker Compose）。
- **步骤**：
  1. 连接测试钱包。
  2. 补充个人档案（邮箱、研究兴趣）。
  3. 完成 ORCID / 学术邮箱验证流程。
- **待补充**：
  - 执行日期：
  - 使用账号：
  - 截图占位：  
    `![Dashboard 待补充截图](TODO)`
  - 备注（异常或改进建议）：

### 3.2 项目协作与数据上传

- **步骤**：
  1. 创建新项目，添加协作者。
  2. 上传数据集（含多文件），设置隐私等级为 `encrypted`。
  3. 在 Dataset Detail 页面确认状态为 `processing → ready`。
- **待补充**：
  - 截图：`![Dataset Upload 待补充](TODO)`
  - 相关后端日志：
  - 备注：

### 3.3 数据加密与权限控制

- **步骤**（参考 `frontend/src/views/datasets/DatasetEncrypt.vue`）：
  1. 进入加密页面，选择算法、密钥策略。
  2. 触发加密并观察进度条。
  3. 为某个钱包授予访问权限，验证数据库表 `dataset_permissions`。
- **待补充**：
  - 截图：`![Encrypt Flow 待补充](TODO)`
  - 访问控制验证：  
    - 正例（授权用户下载成功）：  
    - 反例（未授权用户被拒绝）：

### 3.4 零知识证明与隐私查询

- **步骤**：
  1. `POST /api/datasets/:id/zk-proof`（通过前端按钮触发）。
  2. 在 Proof 页面查看状态从 `pending`→`verified`。
  3. 在 Private Query 页面执行一次差分隐私查询。
- **待补充**：
  - 截图：`![ZK Proof 待补充](TODO)`
  - 链下日志片段：
  - 改进建议：

### 3.5 科研成果 NFT 铸造

- **步骤**：
  1. 在 Publications/NFT 页面提交成果信息。
  2. 铸造 NFT 并记录交易哈希。
  3. 在 Marketplace 查看上架信息。
- **待补充**：
  - 截图：`![NFT Mint 待补充](TODO)`
  - 交易哈希：
  - 分润/作者份额验证：

### 3.6 链上验证与审计

- **步骤**：
  1. 调用 `/api/chain/research/latest`、`/api/chain/dataset/:id` 验证链下记录。
  2. 查看 `Log Dashboard`（管理员）了解审计日志。
  3. 对照 Go 服务日志 (`services/chain-api`)。
- **待补充**：
  - 截图：`![Log Dashboard 待补充](TODO)`
  - 对应日志文件：
  - 结论：

---

## 4. 缺陷与改进项登记

| 编号 | 描述 | 来源 | 状态 | 负责人 | 备注 |
| --- | --- | --- | --- | --- | --- |
| DEF-### | [待补充] | 自动化 / 手动 | 待办 | [待指派] | [待补充] |

> 参考 `COMPLETE_TEST_REPORT.md` 的建议（例如 `.env.example` 缺失）填入此表，确保统一跟踪。

---

## 5. 测试数据与环境准备

| 项目 | 当前做法 | 待补充 |
| --- | --- | --- |
| 测试账户 | Hardhat 默认账户（`0xf39F...266` 等） | [待补充：更多角色分配] |
| 合约部署 | `deployEnhancedDeSci.js` 单点执行 | [待补充：远程/多节点部署脚本] |
| Mock 数据 | 自行上传或脚本生成 | [待补充：标准数据集/自动填充脚本] |
| 截图管理 | 临时保存 | [待补充：集中存储方案（如 Notion 或图床）] |

---

## 6. 后续扩展计划

- [ ] **CI 集成**：将 `run_complete_tests.sh` 并入 GitHub Actions，生成工件报告。
- [ ] **性能扩展**：采用 k6 / Locust 对 `/api/chain/**`、`/api/datasets/**` 做压测。
- [ ] **安全审计**：引入 Slither / MythX，对合约进行自动化检查。
- [ ] **端到端脚本**：使用 Playwright / Cypress 复现关键前端流程，并自动截图。

---

> 维护提示：完成任一测试后，请更新本框架中的对应区块，并在 PR/提交说明引用位置。例如「补充 3.2 Dataset 上传截图 @ docs/verno-testing-framework.md」。
