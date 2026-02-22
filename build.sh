#!/bin/bash
set -euo pipefail

# 更新代码
git pull

# 清除构建缓存（可选，如果有问题时启用）
# rm -rf .next

# 构建项目
# ANALYZE=1 时先构建再跑实验性 bundle 分析（next experimental-analyze）
if [ -n "${ANALYZE:-}" ]; then
    echo "ANALYZE is set, running build then bundle analysis"
    npx next build
    npm run analyze
else
    npx next build
fi

# 检查PM2进程是否存在
if pm2 info dogeow-nextjs >/dev/null 2>&1; then
    echo "PM2进程dogeow-nextjs已存在，正在重启..."
    pm2 reload dogeow-nextjs
else
    echo "PM2进程dogeow-nextjs不存在，正在启动..."
    pm2 start ecosystem.config.js --only dogeow-nextjs
fi

# 显示PM2状态
pm2 status
