#!/bin/bash

# 部署脚本 - 将项目部署到服务器
# 使用方法: ./deploy.sh

echo "🚀 开始部署 AI 模型管理前端项目..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目（如果需要）
if [ -f "tailwind.config.js" ]; then
    echo "🔨 构建 CSS..."
    npx tailwindcss -i ./src/input.css -o ./src/output.css --watch &
    TAILWIND_PID=$!
    sleep 3
    kill $TAILWIND_PID
fi

# 创建部署目录
DEPLOY_DIR="/var/www/myapi-front"
echo "📁 创建部署目录: $DEPLOY_DIR"
sudo mkdir -p $DEPLOY_DIR

# 复制文件到部署目录
echo "📋 复制文件..."
sudo cp -r src/* $DEPLOY_DIR/
sudo cp package.json $DEPLOY_DIR/
sudo cp README.md $DEPLOY_DIR/

# 设置权限
echo "🔐 设置权限..."
sudo chown -R www-data:www-data $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

echo "✅ 部署完成！"
echo "🌐 访问地址: http://your-server-ip"
echo "�� 部署目录: $DEPLOY_DIR" 