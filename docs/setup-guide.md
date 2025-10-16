# Verno 平台启动指引

- **建议优先使用 Docker Compose：** `cp .env.example .env && docker compose up --build --detach`
- 如需纯本地开发，请按以下步骤操作。

## 1. 环境准备
- Node.js 20+
- Go 1.23+
- npm / pnpm / yarn 任一
- 本地 Hardhat 网络（`npx hardhat node`）

```bash
cp .env.example .env
cd services/chain-api && cp .env.example .env
```

## 2. 安装依赖
```bash
npm run install-all
cd services/chain-api && go mod download
```

## 3. 启动区块链与部署合约
```bash
npm run start-blockchain            # 终端1：Hardhat 本地链
npm run deploy-contracts            # 终端2：编译 + 部署 + 同步 ABI
# 若后续重部署合约，可单独运行
npm run sync-contracts
```

## 4. 启动后端/前端/链下服务
```bash
npm start                           # 终端3：Express API
cd services/chain-api && go run cmd/server/main_simple.go   # 终端4：Go 链下 API
cd frontend && npm run dev          # 终端5：Vue 前端
```

## 5. 快速验证
```bash
curl http://localhost:3000/api/blockchain/status
curl http://localhost:3000/api/chain/health
curl "http://localhost:3000/api/chain/research/latest?limit=3"
```

若需重置 ABI，请运行 `npm run sync-contracts`。

## 6. Docker Compose 快速启动

```bash
cp .env.example .env
docker compose up --build --detach
```

服务启动后：

- 前端：<http://localhost:5173>
- 后端：<http://localhost:3000>
- 链下服务：<http://localhost:8088/health>
- Hardhat RPC：<http://localhost:8545>

`contracts.json`、部署信息等会保存在共享 volume `contracts-data` 中，重新部署可运行：

```bash
docker compose run --rm contracts
docker compose restart backend
```
