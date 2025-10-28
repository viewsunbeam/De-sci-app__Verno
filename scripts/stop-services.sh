#!/bin/bash

# 停止服务脚本
echo "🛑 停止Verno平台服务..."

cd "$(dirname "$0")/.."

# 读取PID并停止服务
if [ -f .hardhat.pid ]; then
    HARDHAT_PID=$(cat .hardhat.pid)
    echo "🔗 停止Hardhat网络 (PID: $HARDHAT_PID)..."
    kill $HARDHAT_PID 2>/dev/null || echo "  Hardhat进程已停止"
    rm .hardhat.pid
fi

if [ -f .go-service.pid ]; then
    GO_PID=$(cat .go-service.pid)
    echo "🔄 停止Go链下服务 (PID: $GO_PID)..."
    kill $GO_PID 2>/dev/null || echo "  Go服务进程已停止"
    rm .go-service.pid
fi

if [ -f .nodejs.pid ]; then
    NODEJS_PID=$(cat .nodejs.pid)
    echo "🌐 停止Node.js主服务 (PID: $NODEJS_PID)..."
    kill $NODEJS_PID 2>/dev/null || echo "  Node.js进程已停止"
    rm .nodejs.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    echo "🎨 停止前端服务 (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || echo "  前端进程已停止"
    rm .frontend.pid
fi

# 强制清理可能残留的进程
echo "🧹 清理残留进程..."
pkill -f "hardhat node" 2>/dev/null || true
pkill -f "go run cmd/server/main.go" 2>/dev/null || true
pkill -f "node index.js" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

echo "✅ 所有服务已停止"
