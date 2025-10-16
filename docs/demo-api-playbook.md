# Verno API 演示手册（CCF 竞赛版）

本文面向评审与团队成员，给出在本地环境下通过 REST API 走通「用户 → 项目 → 数据集 → 科研成果 → 链上查询」的完整流程。按照指引可快速复现竞赛 Demo，验证链上 / 链下协同效果，并定位日志。

---

## 1. 环境准备

```bash
# 克隆仓库并进入根目录
git clone https://github.com/viewsunbeam/De-sci-app__Verno.git
cd De-sci-app__Verno

# 准备环境变量
cp .env.example .env

# 首选 Docker Compose 一键启动（约 1~2 分钟）
docker compose up --build --detach

# 查看容器状态
docker compose ps
```

> 主要服务端口  
> - 前端：<http://localhost:5173>  
> - Node/Express API：<http://localhost:3000>  
> - 链下 Go API：<http://localhost:8088>  
> - Hardhat RPC：<http://localhost:8545>

如需停机清理：

```bash
docker compose down
```

---

## 2. 账号与测试地址

Hardhat 默认提供 20 个测试账户，可在任何终端查询：

```bash
npx hardhat accounts
```

本文示例使用下列地址：

| 角色 | 钱包地址 | 私钥 | 说明 |
| --- | --- | --- | --- |
| 研究员（示例） | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` | 同 Hardhat 默认 deployer |
| 评审员（示例） | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f094538c...` | 用于演示多身份交互 |

> 所有交互均在本地链上完成，严禁将示例私钥用于主网。

---

## 3. API 通关流程

以下命令默认在仓库根目录执行，环境变量设置：

```bash
export API=http://localhost:3000
export CHAIN_API=http://localhost:8088
export WALLET=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### 3.1 用户注册与档案完善

```bash
# 1️⃣ 登录 / 自动注册
curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"'"$WALLET"'"}'

# 2️⃣ 补全档案信息
curl -s -X PUT "$API/api/auth/profile" \
  -H "Content-Type: application/json" \
  -d '{
        "walletAddress": "'"$WALLET"'",
        "email": "researcher@example.com",
        "username": "Alice Zhang",
        "github_username": "vernolab",
        "personal_website": "https://verno.example",
        "organization": "Verno R&D Center",
        "research_interests": "链上治理, 去中心化科研"
      }'
```

验证：查看用户表 / 日志

```bash
sqlite3 desci.db "SELECT id, wallet_address, username, organization FROM users;"
docker compose logs backend | tail
```

### 3.2 创建竞赛项目

```bash
curl -s -X POST "$API/api/projects" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "CCF Demo 项目",
        "description": "链上可信 + 链下高效 的科研数据平台",
        "creator_wallet_address": "'"$WALLET"'",
        "visibility": "Public",
        "status": "Active",
        "category": "Blockchain"
      }'
```

记录返回的 `id`，用于后续绑定数据集 / NFT。示例中记作：

```bash
export PROJECT_ID=1
```

### 3.3 上传数据集

1. 准备示例数据文件：

```bash
mkdir -p /tmp/verno-demo
cat <<'CSV' > /tmp/verno-demo/synthetic-dataset.csv
sample_id,value,quality
1,10.5,A
2,11.2,A
3,12.0,B
CSV
```

2. 调用上传接口（多文件亦可，本文示例单文件）：

```bash
curl -s -X POST "$API/api/datasets/upload" \
  -H "Accept: application/json" \
  -F "datasets=@/tmp/verno-demo/synthetic-dataset.csv" \
  -F 'name=合成实验数据集' \
  -F 'description=用于 CCF Demo 的样例数据集' \
  -F "owner_wallet_address=$WALLET" \
  -F "project_id=$PROJECT_ID" \
  -F "privacy_level=public" \
  -F 'category=Experiment' \
  -F 'tags=["demo","public"]' \
  -F "status=ready"
```

3. 查询确认：

```bash
curl -s "$API/api/datasets?wallet_address=$WALLET" | jq '.[0] | {id,name,privacy_level,total_files,total_size}'
```

链下服务会把新数据通过事件/轮询写入 SQLite，可观察：

```bash
docker compose logs chain-api | grep DatasetUploaded
```

或直接查询链下聚合结果：

```bash
curl -s "$CHAIN_API/api/dataset/$datasetId" | jq
```

### 3.4 提交科研成果（PDF）

1. 生成最小 PDF 文件（仅用于 Demo）：

```bash
cat <<'EOF' > /tmp/verno-demo/paper.pdf
%PDF-1.4
1 0 obj <<>> endobj
2 0 obj << /Length 44 >> stream
BT /F1 24 Tf 100 700 Td (Verno Demo Paper) Tj ET
endstream endobj
3 0 obj << /Type /Catalog /Pages 4 0 R >> endobj
4 0 obj << /Type /Pages /Kids [5 0 R] /Count 1 >> endobj
5 0 obj << /Type /Page /Parent 4 0 R /MediaBox [0 0 612 792]
/Contents 2 0 R /Resources << /Font << /F1 6 0 R >> >> >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 3 0 R >>
%%EOF
EOF
```

2. 调用出版接口（摘要 / 关键词可按需调整）：

```bash
curl -s -X POST "$API/api/publications/submit" \
  -H "Accept: application/json" \
  -F "pdf=@/tmp/verno-demo/paper.pdf;type=application/pdf" \
  -F "title=Verno Demo Paper" \
  -F 'authors=["Alice Zhang","Bob Li"]' \
  -F "abstract=展示链上写、链下读的 CC Demo" \
  -F 'keywords=["DeSci","ZK-Proof","CCF"]' \
  -F "category=Blockchain" \
  -F "walletAddress=$WALLET"
```

3. 确认成果：

```bash
curl -s "$API/api/publications/user/$WALLET" | jq '.[0] | {id,title,status,createdAt}'
```

链下 Go 服务会消费合约事件写入 `research_data` 表，检查：

```bash
docker compose logs chain-api | grep ResearchMinted
```

或通过 REST：

```bash
curl -s "$CHAIN_API/api/research/latest?limit=3" | jq
```

### 3.5 链上结果校验（监听与验证）

#### 健康检查

```bash
curl -s "$CHAIN_API/health" | jq
curl -s "$API/api/chain/health" | jq
```

#### 查询最新科研成果 + 验证哈希

```bash
curl -s "$API/api/chain/research/latest?limit=1" | jq

TOKEN_ID=demo-token-123   # 根据上一步输出或实际 tokenId
curl -s -X POST "$API/api/chain/research/$TOKEN_ID/verify" \
  -H "Content-Type: application/json" \
  -d '{"rawContent":"Verno Demo Paper"}'
```

返回 `{"match": true}` 代表链上哈希验证通过。

---

## 4. 其他常用 API 场景

| 场景 | 说明 | 前端页面 | 后端 REST | 链下事件 / 合约交互 |
| --- | --- | --- | --- | --- |
| 项目协作 | 添加 / 移除协作者，记录角色 | Projects → Collaborators | `POST /api/projects/:id/collaborators`<br>`DELETE /api/projects/:id/collaborators/:userId` | 暂存 SQLite，可扩展写入合约 ACL |
| 数据隐私管理 | 设置访问权限、生成对称密钥 | Dataset Detail → Permissions | `POST /api/datasets/:id/permissions`<br>`POST /api/datasets/:id/encrypt` | 链下记录加密信息，计划同步哈希上链 |
| ZK 证明 | 上传或校验零知识证明文件 | Dataset → Privacy | `POST /api/datasets/:id/zk-proof`<br>`POST /api/datasets/zk-proof/:proofId/verify` | 监听 `ProofSubmitted` 并写入 `zk_proofs` 表 |
| NFT 铸造 | 将论文 / 数据集铸造成 NFT | NFT Studio | `POST /api/nfts/mint` | 合约 `ResearchNFT.mintResearch` → 事件 `ResearchMinted` |
| 影响力榜单 | 拉取贡献指标 | Influence Dashboard | `GET /api/chain/research/latest`, `GET /api/chain/research/by-author/:address` | 链下聚合事件数据，后续可写回 `InfluenceRanking` |
| 审稿管理 | 创建/提交评审任务 | Reviews | `POST /api/reviews`<br>`POST /api/reviews/:id/submit` | 当前链下实现，计划与合约奖励结算对接 |

> **监听说明**  
> `services/chain-api/internal/listener` 订阅 `UserRegistered`、`DatasetUploaded`、`ResearchMinted` 等事件，统一写入 `event_logs` 并驱动 `service.Service` 更新 `research_data`、`dataset_records` 等表。

---

## 5. Web3 取舍与现状

| 模块 | 处理方式 | 上链价值 | 当前取舍 / 计划 |
| --- | --- | --- | --- |
| 身份与 DID | 链上注册 + 链下缓存 | 身份可信、可审计 | 链下缓存便于查询；后续接入 DID Resolver |
| 数据集 | 文件链下，哈希上链 | 确保溯源与不可篡改 | 牺牲全链存储换取性能，支持 IPFS/加密访问 |
| 科研成果 | NFT 铸造、链下 PDF | 确权、激励发放 | 评审意见暂链下；下一阶段接入奖励结算 |
| 影响力评分 | 链下聚合 + 链上事件 | 可随时重建、确保排名可信 | 权重与得分暂链下保存，准备同步至合约 |
| 审稿流程 | 目前链下 | - | 结合 `InfluenceRanking` 合约实现结算/积分上链 |
| 日志跟踪 | 链下 | 快速排错 | 与合约事件对照，保证审计链闭环 |

---

## 6. 日志定位与排错

| 组件 | 查看方式 | 说明 |
| --- | --- | --- |
| Hardhat 节点 | `docker compose logs hardhat` | 合约部署、事件及 RPC 调试信息 |
| 合约部署容器 | `docker compose logs contracts` | `deployEnhancedDeSci.js` 输出的地址与同步结果 |
| 链下 Go API | `docker compose logs chain-api` | 事件监听、写库情况、REST 访问日志 |
| Node/Express | `docker compose logs backend` | API 请求、SQLite 操作与错误 |
| 前端（若使用） | `docker compose logs frontend` | Vite dev server 请求记录 |

如需观察实时日志，可追加 `-f` 参数。

---

## 7. 清理与重置

1. 停止服务：

```bash
docker compose down
```

2. 删除持久化卷（彻底重置数据）：

```bash
docker volume rm \
  de-sci-app__verno_backend-data \
  de-sci-app__verno_chain-api-data \
  de-sci-app__verno_contracts-data \
  de-sci-app__verno_hardhat-artifacts \
  de-sci-app__verno_hardhat-cache
```

3. 清空临时文件：

```bash
rm -rf /tmp/verno-demo
```

---

通过全流程 API 调用与日志对照，可验证 Verno 平台在 CCF 竞赛场景下的链上可信、链下高效协同能力。如需进一步演示 NFT 铸造、评审打分等功能，可在上述基础上继续调用 `/api/nfts/mint`、`/api/reviews` 等接口，或直接在前端界面进行操作。***
