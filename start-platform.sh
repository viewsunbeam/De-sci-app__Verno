#!/bin/bash

echo "🚀 启动DeSci平台（含智能合约支持）..."

# 检查是否安装了所需依赖
echo "📦 检查依赖..."

# 安装根目录依赖
if [ ! -d "node_modules" ]; then
    echo "📥 安装根目录依赖..."
    npm install
fi

# 安装前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📥 安装前端依赖..."
    cd frontend && npm install && cd ..
fi

echo "✅ 依赖检查完成"

# 0. 数据库同步和健康检查
echo "🔄 同步数据库..."
if [ -f "scripts/sync-databases.js" ]; then
    node scripts/sync-databases.js
    if [ $? -eq 0 ]; then
        echo "✅ 数据库同步成功"
    else
        echo "⚠️  数据库同步失败，继续启动..."
    fi
else
    echo "⚠️  数据库同步脚本不存在，跳过同步"
fi

# 1. 启动Hardhat网络
echo "🔗 启动Hardhat本地区块链网络..."
# 禁用遥测提示
export HARDHAT_DISABLE_TELEMETRY_PROMPT=true
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!

# 等待网络启动并检查状态
echo "⏳ 等待区块链网络启动..."
sleep 8

# 检查网络是否启动成功
echo "🔍 检查区块链网络状态..."
for i in {1..10}; do
    if curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1; then
        echo "✅ 区块链网络启动成功"
        break
    else
        echo "⏳ 等待网络启动... ($i/10)"
        sleep 2
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ 区块链网络启动失败"
        echo "📋 查看日志: tail -20 hardhat.log"
    fi
done

# 2. 部署智能合约
echo "📝 部署智能合约..."
# 检查部署脚本是否存在
if [ -f "deployEnhancedDeSci.js" ]; then
    HARDHAT_DISABLE_TELEMETRY_PROMPT=true npx hardhat run deployEnhancedDeSci.js --network localhost
    if [ $? -eq 0 ]; then
        echo "✅ 智能合约部署成功"
    else
        echo "⚠️  智能合约部署失败，将使用传统模式"
    fi
else
    echo "⚠️  部署脚本不存在，跳过智能合约部署"
fi

# 3. 启动Go链下服务
echo "🔄 启动Go链下服务..."
if [ -d "services/chain-api" ]; then
    cd services/chain-api
    PORT=8088 go run cmd/server/main.go > ../../go-service.log 2>&1 &
    GO_PID=$!
    cd ../..
    echo "✅ Go链下服务已启动 (PID: $GO_PID)"
    sleep 3
else
    echo "⚠️  Go链下服务目录不存在，跳过启动"
fi

# 4. 启动后端服务
echo "🔧 启动Node.js后端..."
npm start &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 5. 启动前端服务
echo "🌐 启动Vue前端..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# 等待前端启动
echo "⏳ 等待前端服务启动..."
sleep 5

echo ""
echo "🎉 DeSci平台启动完成！"
echo "=================================="
echo "📱 前端界面: http://localhost:5173"
echo "🔧 后端API:  http://localhost:3000"
echo "🔄 链下服务: http://localhost:8088"
echo "⛓️  区块链:   http://localhost:8545"
echo "=================================="
echo ""
echo "🔗 钱包网络配置信息："
echo "=================================="
echo "Network name:       Hardhat Local"
echo "Default RPC URL:    http://localhost:8545"
echo "Chain ID:           31337"
echo "Currency symbol:    ETH"
echo "Block explorer URL: (本地测试网络，无区块浏览器)"
echo "=================================="
echo ""
echo "💡 提示："
echo "   - 前端界面支持所有原有功能"
echo "   - 如果智能合约部署成功，将获得区块链支持"
echo "   - Go链下服务提供数据验证和同步功能"
echo "   - 请将上述网络配置添加到您的钱包中"
echo "   - 按 Ctrl+C 停止所有服务"
echo ""

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."

    if [ ! -z "$HARDHAT_PID" ]; then
        kill $HARDHAT_PID 2>/dev/null
        echo "   ✅ 区块链网络已停止"
    fi

    if [ ! -z "$GO_PID" ]; then
        kill $GO_PID 2>/dev/null
        echo "   ✅ Go链下服务已停止"
    fi

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "   ✅ 后端服务已停止"
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "   ✅ 前端服务已停止"
    fi

    echo "👋 再见！"
    exit 0
}

# 捕获中断信号
trap cleanup SIGINT SIGTERM

# 等待用户中断
echo "⏳ 服务正在运行，按 Ctrl+C 停止..."
wait