#!/bin/bash

# 更新代码
git pull

# 清除构建缓存（可选，如果有问题时启用）
# rm -rf .next

# 构建项目
npm run build

# 重启PM2进程（使用restart而不是reload）
pm2 restart nextjs

# 显示PM2状态
pm2 status