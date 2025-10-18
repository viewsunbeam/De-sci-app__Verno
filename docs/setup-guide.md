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

## 6. Docker Compose 启动与重启

```bash
cp .env.example .env
# 首次或需要重建镜像
docker compose up --build -d

# 如果你刚执行过 docker compose down，需要重新启动：
docker compose up -d
```

服务启动后：

- 前端：<http://localhost:5173>
- 后端：<http://localhost:3000>
- 链下服务：<http://localhost:8088/health>
- Hardhat RPC：<http://localhost:8545>

### 仅启动基础服务（无前端）
仅用于链下验证，不需要前端：
```bash
docker compose up --build -d hardhat contracts chain-api backend
```

### 重新部署合约/刷新 ABI
`contracts.json`、部署信息等保存在共享 volume `contracts-data` 中。重部署并同步到共享配置：
```bash
docker compose run --rm contracts
# 如需让后端重新读取共享配置
docker compose restart backend
```

## 7. 端到端验证（可选）

### 7.1 授权 + 触发链上事件（一次性脚本）
在项目根目录执行，按顺序完成：授权 `ResearchNFT` → 触发 `UserRegistered`、`DatasetUploaded`、`ResearchMinted`：
```bash
docker compose exec hardhat bash -lc 'node - <<'"'"'JS'"'"'
const fs = require("fs");
const { ethers } = require("ethers");
async function waitFor(p,h){for(;;){const r=await p.send("eth_getTransactionReceipt",[h]);if(r)return r;await new Promise(r=>setTimeout(r,1000));}}
(async () => {
  const cfg=JSON.parse(fs.readFileSync("/shared/contracts/contracts.json","utf8"));
  const platformAddr=cfg.contracts.DeSciPlatform.address, platformAbi=cfg.contracts.DeSciPlatform.abi;
  const researchAddr=cfg.contracts.ResearchNFT.address, researchAbi=cfg.contracts.ResearchNFT.abi;
  const provider=new ethers.JsonRpcProvider("http://hardhat:8545");
  const [from]=(await provider.send("eth_accounts",[]));
  console.log("Using signer:", from);

  // authorize platform on ResearchNFT
  const researchIface=new ethers.Interface(researchAbi);
  let txHash=await provider.send("eth_sendTransaction",[ {from,to:researchAddr,data:researchIface.encodeFunctionData("addAuthorizedContract",[platformAddr])} ]);
  await waitFor(provider,txHash); console.log("addAuthorizedContract done", txHash);

  // register user
  const platformIface=new ethers.Interface(platformAbi);
  txHash=await provider.send("eth_sendTransaction",[ {from,to:platformAddr,data:platformIface.encodeFunctionData("registerUserWithReward",["Alice","Org","alice@example.com","AI","ipfs://creds",1])} ]);
  await waitFor(provider,txHash); console.log("registerUserWithReward done", txHash);

  // upload dataset
  txHash=await provider.send("eth_sendTransaction",[ {from,to:platformAddr,data:platformIface.encodeFunctionData("uploadDatasetWithReward",["Genome Data","desc",[],0,1024,"ipfs://data","ipfs://meta","",0,0])} ]);
  await waitFor(provider,txHash); console.log("uploadDatasetWithReward done", txHash);

  // publish research (emits ResearchMinted -> normalized to ResearchCreated)
  txHash=await provider.send("eth_sendTransaction",[ {from,to:platformAddr,data:platformIface.encodeFunctionData("publishResearchWithReward",[[from],[10000],"Paper Title","Abstract",[],["General"],0,"0xAAA","0xBBB",true,0,""])} ]);
  await waitFor(provider,txHash); console.log("publishResearchWithReward done", txHash);
  process.exit(0);
})().catch(e=>{console.error("SCRIPT_ERROR:",e);process.exit(1);});
JS'
```

### 7.2 观察链下服务日志
```bash
docker compose logs -f chain-api
```
预期看到：
- **[订阅成功]** Subscribed to new events…
- **[事件处理]** 📡 Processing blockchain event: …
- **[入库日志]** 📝 Event log inserted: ResearchCreated / DatasetCreated
- **[服务处理]** ✅ Service processed and marked event: …

### 7.3 通过后端代理验证 REST
```bash
curl -fsS http://localhost:3000/api/chain/health | jq
curl -fsS "http://localhost:3000/api/chain/research/latest?limit=10" | jq
curl -fsS "http://localhost:3000/api/chain/research/by-author/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266?limit=10" | jq
curl -fsS "http://localhost:3000/api/chain/dataset/1" | jq
```

## 8. 常见问题

- **[重启续扫]** `chain-api` 会从数据库记录的最后区块高度+1 继续扫描；可通过 `docker compose restart chain-api` 验证。
- **[前端可选]** 仅做链下验证时，可以不启动 `frontend`。
- **[权限要求]** 未授权 `DeSciPlatform` 给 `ResearchNFT` 时，`publishResearchWithReward` 会失败（内部调用 `mintResearch` 需要作者或授权合约）。
