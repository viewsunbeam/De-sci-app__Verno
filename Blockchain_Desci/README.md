# De-sci-app__Verno / Blockchain_Desci

去中心化科学（DeSci）应用的单仓（monorepo）中的核心应用模块，包含一个完整的前后端实现：

- `backend/` — Node.js + Express + SQLite 的后端 API 与数据处理
- `frontend/` — Vue 3 + Vite + Naive UI 的前端 Web 应用

本 README 提供项目结构、快速启动、开发调试、关键 API、常见问题与注意事项。

---

## 目录

- 项目结构
- 技术栈
- 快速开始
- 后端说明（运行、环境变量、数据库、路由总览）
- 前端说明（运行、路由、与后端交互）
- 开发与调试建议
- 常见问题（FAQ）与注意事项

---

## 项目结构

```
Blockchain_Desci/
├─ backend/
│  ├─ index.js                 # Express 入口
│  ├─ database.js              # better-sqlite3 封装与表结构初始化/迁移
│  ├─ routes/                  # 业务路由（auth, users, projects, datasets, nfts 等）
│  ├─ uploads/                 # 上传文件目录（静态服务 /uploads）
│  ├─ package.json             # 后端依赖与启动脚本
│  └─ desci.db                 # 本地 SQLite 数据库文件（自动创建/迁移）
└─ frontend/
   ├─ src/
   │  ├─ main.js               # Vue 应用入口，注册 router
   │  ├─ router/index.js       # 前端路由表（Dashboard/Projects/Datasets/NFT 等）
   │  └─ composables/useWeb3.js# Web3 钱包连接与后端登录
   ├─ package.json             # 前端依赖与脚本（Vite）
   └─ vite.config.js
```

---

## 技术栈

- 后端：Node.js、Express、better-sqlite3、Multer、CORS、dotenv、axios、ethers（v5）
- 前端：Vue 3、Vite、Naive UI、vue-router、axios、web3modal、ethers（v5）
- 数据库：SQLite（本地文件 `desci.db`）

---

## 快速开始

准备条件：

- Node.js 18+（推荐 20.x）
- npm 或 pnpm（任选）

1) 启动后端

```
cd Blockchain_Desci/backend
npm install
# 可选：创建 .env
# PORT=3000
npm start
# 服务器将监听 http://localhost:3000
```

2) 启动前端

```
cd Blockchain_Desci/frontend
npm install
npm run dev
# Vite 默认运行在 http://localhost:5173 （或控制台显示的端口）
```

3) 浏览器访问前端地址，并在需要的页面尝试连接钱包、浏览数据集/项目等功能。

---

## 后端说明

- 入口：`backend/index.js`
  - 默认端口 `PORT=3000`
  - 静态资源：`/uploads`（目录：`backend/uploads/`）
  - 路由前缀：`/api/*`

- 环境变量（`.env` 可选）：

```
# Blockchain_Desci/backend/.env
PORT=3000
```

- 数据库初始化：
  - `backend/database.js` 在启动时使用 better-sqlite3 打开 `./desci.db` 并自动创建/迁移表结构。
  - 主要表：`users`、`projects`、`iterations`、`kanban_columns`、`kanban_cards`、`project_collaborators`、`project_files`、`proofs`、`nfts`、`milestones`、`datasets`、`dataset_files`、`dataset_permissions`、`dataset_usage`、`zk_proofs`、`reviews`、`citations`、`publications` 等。

- 典型路由（部分）：
  - 用户：`GET /api/users/wallet/:walletAddress`、`GET /api/users/username/:username`、`GET /api/users/:userId/dashboard-stats`
  - 数据集：
    - `GET /api/datasets?wallet_address=...` 查询我的数据集
    - `GET /api/datasets/explore` 浏览公共数据集
    - `GET /api/datasets/:id` 读取单个数据集（含权限校验/usage 记录）
    - `POST /api/datasets/upload` 多文件上传（字段名 `datasets`，单文件≤100MB）
    - `PUT /api/datasets/:id`、`DELETE /api/datasets/:id`
    - 权限：`GET/POST/DELETE /api/datasets/:id/permissions...`
    - 加密与 ZK：`POST /api/datasets/:id/encrypt`、`POST /api/datasets/:id/zk-proof`、`POST /api/datasets/zk-proof/:proofId/verify`
  - NFT：
    - `GET /api/nfts/user/:walletAddress`
    - `POST /api/nfts/mint`（本地模拟 mint，生成 `tokenId/contractAddress/metadata`）
    - `POST /api/nfts/:nftId/list`（本地模拟上架）
    - `GET /api/nfts`（市场视图）
    - `POST /api/nfts/marketplace/purchase`（本地事务模拟）

> 提示：生产部署时建议将上传文件迁移到对象存储（如 S3/OSS），并在 `index.js` 中收紧 CORS 白名单。

---

## 前端说明

- 入口：`frontend/src/main.js`
  - 启动 Vue 应用并注册路由；为 `ethers.js` 添加 `Buffer` polyfill。

- 路由：`frontend/src/router/index.js`
  - 覆盖模块：Dashboard、Profile、Verify、Explore、Projects（含 Repository/Collaborators/Proof/Funding/NFT/My Items/Roadmap）、Datasets（列表/上传/详情/编辑/权限/分析/加密/私密查询）、Publications、Papers（提交/导入/详情/编辑/预览/发布）、Reviews（任务/详情/表单）、NFT（列表/铸造/详情）、公共用户档案等。

- Web3 登录：`frontend/src/composables/useWeb3.js`
  - 使用 `web3modal` 连接钱包，`ethers` 创建 `Web3Provider` 与 `signer`。
  - 连接成功后调用后端 `POST http://localhost:3000/api/auth/login` 完成登录。

> 建议：将后端基础地址提取为前端可配置的 `API_BASE_URL`，避免硬编码 `http://localhost:3000`。

---

## 开发与调试建议

- 后端开发
  - 使用 REST 客户端（curl、Postman、VSCode REST）联调 `http://localhost:3000/api/*`。
  - 注意 `routes/nfts.js` 中 `GET /api/nfts/:nftId` 存在 `...metadata` 未定义的问题，运行前建议修复，否则会抛错。
  - 如需更大文件上传，调整 `routes/datasets.js` 中的 `limits.fileSize`。

- 前端开发
  - 使用 `npm run dev` 启动 Vite 开发服务器，配合浏览器调试。
  - 钱包事件（`accountsChanged/chainChanged/disconnect`）已在 `useWeb3.js` 订阅，调试链切换时需注意页面会 reload。

- 数据库
  - SQLite 文件为 `backend/desci.db`。
  - 若需要重置，可在停止服务器后备份/删除该文件（请谨慎操作）。

---

## 常见问题（FAQ）

1. 运行 `git add` 时提示“嵌入式 git 仓库”怎么办？
   - 本模块所在目录已被扁平化纳入上层仓库（非子模块），无需将其视作子模块；若未来需要拆分，可改为 `git submodule`。

2. `GET /api/nfts/:nftId` 报错 `metadata` 未定义？
   - 请修复 `routes/nfts.js` 中该路由的返回数据，去除 `...metadata` 或从 `metadata_uri` 解析后再展开。

3. 前端无法连接后端？
   - 确保后端监听 `http://localhost:3000`，并前端请求地址与之匹配；必要时设置代理或将地址提取为环境变量。

---

## 许可证

未指定，请根据项目需求补充（例如 MIT/Apache-2.0 等）。

---

## 贡献指南（可选）

欢迎提交 Issue/PR。建议在提交前：

- 保持代码风格一致（lint 与格式化）
- 更新对应文档与注释
- 附带最小复现或截图/录屏
