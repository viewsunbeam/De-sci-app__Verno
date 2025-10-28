#!/bin/bash

# 启动服务脚本 - 确保数据库同步
echo "🚀 启动Verno平台服务..."

# 检查依赖
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "❌ Go 未安装"
    exit 1
fi

# 进入项目根目录
cd "$(dirname "$0")/.."

# 1. 同步数据库
echo "🔄 同步数据库..."
node scripts/sync-databases.js

if [ $? -ne 0 ]; then
    echo "❌ 数据库同步失败"
    exit 1
fi

# 2. 启动Hardhat本地网络 (后台)
echo "🔗 启动Hardhat本地网络..."
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!
echo "Hardhat PID: $HARDHAT_PID"

# 等待Hardhat启动
sleep 5

# 3. 启动Go链下服务 (后台)
echo "🔄 启动Go链下服务..."
cd services/chain-api
PORT=8088 go run cmd/server/main.go > ../../go-service.log 2>&1 &
GO_PID=$!
echo "Go服务 PID: $GO_PID"
cd ../..

# 等待Go服务启动
sleep 3

# 4. 启动Node.js主服务 (后台)
echo "🌐 启动Node.js主服务..."
node index.js > nodejs.log 2>&1 &
NODEJS_PID=$!
echo "Node.js PID: $NODEJS_PID"

# 等待Node.js服务启动
sleep 3

# 5. 启动前端开发服务器
echo "🎨 启动前端开发服务器..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"
cd ..

# 保存PID到文件，方便停止服务
echo "$HARDHAT_PID" > .hardhat.pid
echo "$GO_PID" > .go-service.pid  
echo "$NODEJS_PID" > .nodejs.pid
echo "$FRONTEND_PID" > .frontend.pid

echo ""
echo "🎉 所有服务已启动！"
echo "📊 服务状态:"
echo "  - Hardhat网络: http://localhost:8545 (PID: $HARDHAT_PID)"
echo "  - Go链下服务: http://localhost:8088 (PID: $GO_PID)"  
echo "  - Node.js主服务: http://localhost:3000 (PID: $NODEJS_PID)"
echo "  - 前端服务: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "📋 日志文件:"
echo "  - Hardhat: hardhat.log"
echo "  - Go服务: go-service.log"
echo "  - Node.js: nodejs.log"
echo ""
echo "🛑 停止所有服务: ./scripts/stop-services.sh"

# 等待用户中断
echo "按 Ctrl+C 停止所有服务..."
wait
