#!/bin/bash
set -e

echo "=== 新媒智检网站部署脚本 ==="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误：未安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误：未安装 docker-compose"
    exit 1
fi

# 创建数据目录
mkdir -p data

# 读取 API Key
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "警告：未设置 DEEPSEEK_API_KEY，AI 功能将无法使用"
    echo "请在 .env.production 中设置 DEEPSEEK_API_KEY"
fi

# 构建并启动
echo "正在构建 Docker 镜像..."
docker-compose build --no-cache

echo "正在启动服务..."
docker-compose up -d

echo ""
echo "=== 部署完成 ==="
echo "网站地址：http://localhost:3000"
echo "数据库文件：./data/xinmei.db"
echo ""
echo "常用命令："
echo "  查看日志：docker-compose logs -f"
echo "  停止服务：docker-compose down"
echo "  重启服务：docker-compose restart"
