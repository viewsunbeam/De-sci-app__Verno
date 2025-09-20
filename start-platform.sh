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

# 1. 启动Hardhat网络
echo "🔗 启动Hardhat本地区块链网络..."
npx hardhat node &
HARDHAT_PID=$!

# 等待网络启动
echo "⏳ 等待区块链网络启动..."
sleep 5

# 2. 部署智能合约
echo "📝 部署智能合约..."
npx hardhat run deployEnhancedDeSci.js --network localhost

if [ $? -eq 0 ]; then
    echo "✅ 智能合约部署成功"
else
    echo "⚠️  智能合约部署失败，将使用传统模式"
fi

# 3. 启动后端服务
echo "🔧 启动Node.js后端..."
npm start &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 4. 启动前端服务
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