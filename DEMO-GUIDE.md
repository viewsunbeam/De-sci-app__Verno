# 🎯 影响力积分系统 - 完整演示指南

## 📋 演示准备

### 1. 确保服务运行
```bash
# 后端服务 (端口3000)
node index.js

# 前端服务 (端口5173) 
cd frontend && npm run dev
```

### 2. 验证API工作正常
```bash
# 测试用户数据
curl http://localhost:3000/api/influence/user/6 | jq '.username, .totalScore'

# 测试排行榜
curl http://localhost:3000/api/influence/leaderboard | jq '.leaderboard[0:3]'
```

## 🎬 分屏演示流程

### 左侧 - 前端页面
1. **打开浏览器** 访问: `http://localhost:5173/influence`
2. **查看页面内容**:
   - 用户钱包地址: `0x742d35Cc6634C0532925a3b8D4f25177F9E5C4B8`
   - 综合影响力得分: 实时计算显示
   - 各项贡献详细分解
   - 权重配置和计算公式

3. **操作演示**:
   - 点击"刷新影响力"按钮
   - 查看控制台日志输出
   - 观察数据更新过程

### 右侧 - 终端命令

#### **第一步: 查看用户详情**
```bash
# 查看dr_alice_ai的完整影响力数据
curl -X GET http://localhost:3000/api/influence/user/6 | jq '{
  username: .username,
  walletAddress: .walletAddress,
  totalScore: .totalScore,
  level: .level.name,
  rank: .rank.current,
  scores: .scores
}'
```

#### **第二步: 查看排行榜**
```bash
# 获取前5名排行榜
curl -X GET http://localhost:3000/api/influence/leaderboard?limit=5 | jq '.leaderboard[] | {
  rank: .rank,
  username: .username,
  totalScore: .totalScore,
  level: .level.name
}'
```

#### **第三步: 模拟新活动**
```bash
# 模拟发表新论文 (+100分)
curl -X POST http://localhost:3000/api/influence/user/6/activity \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "PUBLICATION_PUBLISHED",
    "details": {
      "title": "Advanced AI Research in DeSci",
      "field": "Computer Science"
    }
  }' | jq '.'
```

#### **第四步: 验证积分变化**
```bash
# 再次查看用户积分
curl -X GET http://localhost:3000/api/influence/user/6 | jq '.totalScore'
```

#### **第五步: 实时监控**
```bash
# 每3秒监控积分变化
watch -n 3 'curl -s http://localhost:3000/api/influence/user/6 | jq ".totalScore"'
```

## 📊 演示数据说明

### 真实用户数据
- **dr_alice_ai (用户6)**: 2篇已发表论文，65分，Contributor等级
- **blockchain_bob (用户7)**: 1篇已发表论文，35分，Newcomer等级
- **MainUser**: 245分，Active Contributor等级，排名第1

### 积分计算规则
```
论文发表: 100分/篇
数据集上传: 80分/个
项目完成: 120分/个
NFT铸造: 60分/个
基础治理: 50分

总积分 = (各项得分 × 权重) ÷ 10000
```

### 权重配置
```
论文发表: 30% (3000/10000)
同行评审: 20% (2000/10000)
数据贡献: 25% (2500/10000)
协同合作: 15% (1500/10000)
治理参与: 10% (1000/10000)
```

## 🎯 演示要点

### 1. 数据真实性
- ✅ 基于真实数据库数据
- ✅ 实时计算积分
- ✅ 完整的贡献记录

### 2. 系统完整性
- ✅ 前后端数据一致
- ✅ 实时API响应
- ✅ 完整的错误处理

### 3. 功能演示
- ✅ 用户影响力查询
- ✅ 排行榜系统
- ✅ 活动模拟
- ✅ 实时积分更新

## 🔧 故障排除

### 前端问题
```bash
# 检查前端服务
curl http://localhost:5173

# 查看浏览器控制台日志
# 检查网络请求状态
```

### 后端问题
```bash
# 检查后端服务
curl http://localhost:3000/api/influence/user/6

# 查看服务器日志
# 检查数据库连接
```

### 数据问题
```bash
# 验证数据库数据
sqlite3 desci.db "SELECT id, username FROM users WHERE wallet_address IS NOT NULL;"

# 验证API响应
curl -s http://localhost:3000/api/influence/user/6 | jq '.scores, .contributions'
```

## 🚀 快速演示脚本

### 完整演示
```bash
./demo-real-influence.sh
```

### 数据结构测试
```bash
./test-frontend-data.sh
```

### 前端测试页面
访问: `http://localhost:8081/test-influence-frontend.html`

## 📝 演示脚本

### 开场白
"这是基于真实数据库数据的影响力积分系统，左侧是前端页面，右侧是API调用演示。"

### 演示流程
1. "首先查看dr_alice_ai的影响力数据..."
2. "可以看到她有2篇已发表论文，总积分65分..."
3. "现在模拟她发表一篇新论文..."
4. "积分立即增加了100分，前端页面也会同步更新..."
5. "排行榜显示了所有用户的实时排名..."

### 技术亮点
- 基于真实数据库数据计算
- 前后端数据完全一致
- 支持实时活动模拟
- 完整的积分计算公式
- 多维度贡献评估

## ⚠️ 注意事项

1. **服务状态**: 确保前后端服务都在运行
2. **端口冲突**: 检查3000和5173端口是否可用
3. **数据库**: 确保SQLite数据库文件存在且可访问
4. **网络**: 确保前端能访问后端API
5. **浏览器**: 建议使用Chrome或Firefox最新版本
