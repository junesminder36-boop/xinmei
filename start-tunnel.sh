#!/bin/bash
set -e

export PATH="/Users/caiyue/.local/bin:$PATH"

# 检查 cloudflared
if ! command -v cloudflared > /dev/null 2>&1; then
    echo "错误：未找到 cloudflared"
    echo "路径：/Users/caiyue/.local/bin/cloudflared"
    exit 1
fi

# 检查 Next.js 是否在运行
if ! lsof -i :3000 > /dev/null 2>&1; then
    echo "Next.js 未运行，正在启动..."
    npm run dev > /tmp/next-dev.log 2>&1 &
    sleep 5
fi

# 清理旧隧道
killall cloudflared 2> /dev/null || true
sleep 1

# 启动 Cloudflare Tunnel
echo "正在启动 Cloudflare Tunnel..."
cloudflared tunnel --protocol http2 --url http://localhost:3000 2>&1 | while read line; do
    echo "$line"
    if echo "$line" | grep -q "trycloudflare.com"; then
        echo ""
        echo "=== 新媒智检已上线 ==="
        echo "$line" | grep -o 'https://[^ ]*'
        echo "======================="
        echo ""
    fi
done
