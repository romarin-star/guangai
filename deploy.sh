#!/bin/bash

# 智能灌溉器 - 快速部署脚本

echo "======================================"
echo "  智能灌溉器 - 服务器部署脚本"
echo "======================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    echo "请先安装 Node.js (推荐 v16 或更高版本)"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 安装依赖
echo "📦 正在安装依赖..."
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装完成"
echo ""

# 构建前端（如果 dist 目录不存在）
if [ ! -d "dist" ]; then
    echo "🔨 正在构建前端..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 前端构建失败"
        exit 1
    fi
    echo "✅ 前端构建完成"
    echo ""
else
    echo "✅ 检测到已构建的前端文件 (dist/)"
    echo ""
fi

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "📦 正在安装 PM2..."
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "⚠️  PM2 安装失败，将使用普通方式启动"
        PM2_AVAILABLE=false
    else
        echo "✅ PM2 安装完成"
        PM2_AVAILABLE=true
    fi
else
    echo "✅ PM2 已安装"
    PM2_AVAILABLE=true
fi
echo ""

# 启动应用
PORT=${PORT:-3000}
echo "🚀 正在启动应用 (端口: $PORT)..."

if [ "$PM2_AVAILABLE" = true ]; then
    # 停止旧实例
    pm2 delete irrigation-controller 2>/dev/null
    
    # 启动新实例
    pm2 start server.js --name irrigation-controller --env production
    
    # 保存 PM2 配置
    pm2 save
    
    echo "✅ 应用已通过 PM2 启动"
    echo ""
    echo "📊 查看状态: pm2 status"
    echo "📝 查看日志: pm2 logs irrigation-controller"
    echo "🔄 重启应用: pm2 restart irrigation-controller"
    echo "⏹️  停止应用: pm2 stop irrigation-controller"
else
    # 使用普通方式启动
    nohup node server.js > app.log 2>&1 &
    echo $! > app.pid
    echo "✅ 应用已启动 (PID: $(cat app.pid))"
    echo "📝 日志文件: app.log"
    echo "⏹️  停止应用: kill \$(cat app.pid)"
fi

echo ""
echo "======================================"
echo "  部署完成！"
echo "  访问地址: http://your-server-ip:$PORT"
echo "======================================"
echo ""
