# 数据库同步解决方案

## 🎯 问题描述

之前遇到的问题：NFT在Node.js数据库中创建成功，但在Go链下服务的区块链验证中显示"No blockchain data found"，导致数据验证失败。

## 🔧 根本原因

1. **数据库路径不一致**：Go服务使用 `../../desci.db`，Node.js使用 `./desci.db`
2. **缺少自动同步**：NFT创建时没有自动创建对应的区块链记录
3. **数据孤立**：链上链下数据不同步

## ✅ 解决方案

### 1. 统一数据库配置
- 修改Go服务配置使用统一数据库路径
- 创建软链接确保数据库一致性

### 2. 自动同步机制
- NFT创建时自动生成区块链记录
- 包含内容哈希、元数据哈希、区块号等

### 3. 数据库同步脚本
- `scripts/sync-databases.js`：同步现有NFT到区块链记录
- 自动创建缺失的表结构

### 4. 服务管理脚本
- `scripts/start-services.sh`：统一启动所有服务
- `scripts/stop-services.sh`：安全停止所有服务

## 🚀 使用方法

### 启动服务
```bash
./scripts/start-services.sh
```

### 停止服务
```bash
./scripts/stop-services.sh
```

### 手动同步数据库
```bash
node scripts/sync-databases.js
```

## 📊 验证数据一致性

1. **检查NFT记录**：
```bash
sqlite3 desci.db "SELECT COUNT(*) FROM nfts WHERE token_id IS NOT NULL;"
```

2. **检查区块链记录**：
```bash
sqlite3 desci.db "SELECT COUNT(*) FROM research_data;"
```

3. **API验证**：
```bash
curl "http://localhost:8088/api/hybrid/verify/TOKEN_ID"
```

## 🛡️ 预防措施

### 自动同步
- 每次创建NFT时自动创建区块链记录
- 包含错误处理，不影响NFT创建流程

### 数据库一致性
- Go服务使用软链接指向主数据库
- 统一的数据库配置管理

### 监控和日志
- 详细的同步日志
- 数据一致性验证

## 🔍 故障排除

### 验证失败
1. 检查Go服务是否运行：`curl http://localhost:8088/health`
2. 检查数据库连接：确认软链接存在
3. 手动同步：运行 `node scripts/sync-databases.js`

### 服务启动失败
1. 检查端口占用：`lsof -i :8088`
2. 查看日志文件：`tail -f go-service.log`
3. 重新同步数据库

## 📈 性能优化

- 使用 `INSERT OR REPLACE` 避免重复记录
- 批量同步减少数据库操作
- 异步处理不阻塞主流程

## 🔄 未来改进

1. **实时同步**：使用数据库触发器
2. **分布式同步**：支持多节点数据同步
3. **数据验证**：定期校验数据一致性
4. **备份恢复**：自动备份和恢复机制
