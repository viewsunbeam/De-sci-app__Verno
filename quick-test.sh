#!/bin/bash

echo "🧪 快速测试DeSci平台..."

# 检查依赖是否已安装
echo "📦 检查依赖..."

if [ ! -d "node_modules" ]; then
    echo "📥 安装根目录依赖..."
    npm install --silent
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📥 安装前端依赖..."
    cd frontend && npm install --silent && cd ..
fi

echo "✅ 依赖检查完成"

# 测试后端启动
echo "🔧 测试后端启动..."
npm start &
BACKEND_PID=$!

sleep 3

# 检查后端是否正常响应
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 后端启动成功"
else
    echo "❌ 后端启动失败"
fi

# 停止后端
kill $BACKEND_PID 2>/dev/null

echo "🎯 测试完成！如果没有错误，可以运行 ./start-platform.sh"