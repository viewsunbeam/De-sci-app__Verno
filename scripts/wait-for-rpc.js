#!/usr/bin/env node
const { JsonRpcProvider } = require("ethers");

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const timeoutMs = parseInt(process.env.RPC_WAIT_TIMEOUT || "120000", 10);
const intervalMs = parseInt(process.env.RPC_WAIT_INTERVAL || "2000", 10);

async function waitForRpc() {
  const provider = new JsonRpcProvider(rpcUrl);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      await provider.getNetwork();
      console.log(`✅ RPC 节点已就绪：${rpcUrl}`);
      return;
    } catch (err) {
      const remaining = timeoutMs - (Date.now() - start);
      console.log(`⏳ 等待区块链节点启动 (${remaining}ms 剩余)...`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`RPC 节点在 ${timeoutMs}ms 内未就绪：${rpcUrl}`);
}

waitForRpc().catch((err) => {
  console.error(`❌ 等待区块链节点失败: ${err.message}`);
  process.exit(1);
});
