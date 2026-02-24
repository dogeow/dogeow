#!/bin/bash
# 零停机部署脚本
# 原理：在独立目录构建，完成后原子切换，避免 next build 覆盖正在服务的 .next
#
# 两种模式：
# 1) 发布目录+符号链接：存在 current 时，在 releases/时间戳 构建，再 ln -sfn 切换，零停机可回滚。
# 2) 临时目录+原子替换：无 current 时，在 .build-staging 构建，再原子替换 .next。
#
# 首次用模式 1 需在服务器初始化（一次）：
#   mkdir -p releases && r=releases/$(date +%Y%m%d%H%M%S) && rsync -a --exclude=node_modules --exclude=.next . "$r"/ && ln -sfn "$(pwd)/$r" current
#   cd "$r" && npm ci && npx next build
# PM2 使用 ecosystem.config.js，模式 1 下通过 PM2_CWD 指定 current 为 cwd。
set -euo pipefail

# 应用根目录，由调用方通过环境变量传入（如 workflow 里用 secrets.APP_ROOT），不写死在脚本中
if [ -z "${APP_ROOT:-}" ]; then
  echo "错误：请设置环境变量 APP_ROOT（应用在服务器上的根目录），例: APP_ROOT=/path/to/app $0"
  exit 1
fi
RELEASES_DIR="${APP_ROOT}/releases"
CURRENT_LINK="${APP_ROOT}/current"

RUN_ANALYZE="${ANALYZE:-}"

cd "$APP_ROOT"

# ---------- 模式一：发布目录 + 符号链接（推荐，零停机 + 可回滚）----------
if [ -L "$CURRENT_LINK" ] || [ -d "$CURRENT_LINK" ]; then
  echo "[deploy] 使用发布目录模式（零停机）"

  [ -d "$RELEASES_DIR" ] || mkdir -p "$RELEASES_DIR"
  NEW_RELEASE="${RELEASES_DIR}/$(date +%Y%m%d%H%M%S)"
  CURRENT_RELEASE=""
  if [ -L "$CURRENT_LINK" ]; then
    CURRENT_RELEASE="$(readlink "$CURRENT_LINK")"
    [ "${CURRENT_RELEASE#/}" = "$CURRENT_RELEASE" ] && CURRENT_RELEASE="$APP_ROOT/$CURRENT_RELEASE"
  elif [ -d "$CURRENT_LINK" ]; then
    CURRENT_RELEASE="$CURRENT_LINK"
  fi

  # 从当前发布复制出新发布（不复制 node_modules 和 .next，加快且避免覆盖中文件）
  echo "[deploy] 创建新发布目录: $NEW_RELEASE"
  mkdir -p "$NEW_RELEASE"
  rsync -a --exclude='node_modules' --exclude='.next' --exclude='releases' --exclude='current' \
    "${CURRENT_RELEASE:-.}/" "$NEW_RELEASE/" 2>/dev/null || rsync -a --exclude='node_modules' --exclude='.next' --exclude='releases' --exclude='current' ./ "$NEW_RELEASE/"

  cd "$NEW_RELEASE"
  git pull
  npm ci
  if [ -n "$RUN_ANALYZE" ]; then
    echo "[deploy] 构建并执行 bundle 分析"
    npx next build && npm run analyze
  else
    npx next build
  fi

  # 原子切换 current 指向新发布
  ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"
  echo "[deploy] 已切换 current -> $NEW_RELEASE"

  # 可选：只保留最近 5 个发布，节省磁盘
  KEEP=5
  (cd "$RELEASES_DIR" && ls -1t | tail -n +$((KEEP + 1)) | while read -r d; do [ -n "$d" ] && rm -rf "$RELEASES_DIR/$d"; done)

  if pm2 info dogeow-nextjs >/dev/null 2>&1; then
    pm2 reload dogeow-nextjs
  else
    PM2_CWD="${CURRENT_LINK}" pm2 start "$APP_ROOT/ecosystem.config.js" --only dogeow-nextjs
  fi
  pm2 status
  echo "[deploy] 完成（零停机）"
  exit 0
fi

# ---------- 模式二：无 current 时，构建到临时目录再原子替换 .next ----------
echo "[deploy] 使用临时目录构建 + 原子替换 .next（避免构建期间覆盖线上）"
BUILD_STAGING="${APP_ROOT}/.build-staging.$$"
trap "rm -rf '$BUILD_STAGING'" EXIT

mkdir -p "$BUILD_STAGING"
rsync -a --exclude='node_modules' --exclude='.next' --exclude='.build-staging.*' \
  ./ "$BUILD_STAGING/"
cd "$BUILD_STAGING"
git pull
npm ci
if [ -n "$RUN_ANALYZE" ]; then
  npx next build && npm run analyze
else
  npx next build
fi

# 原子替换 .next：先放到 .next.new，再重命名
echo "[deploy] 原子替换 .next"
rsync -a --delete "$BUILD_STAGING/.next/" "$APP_ROOT/.next.new/"
cd "$APP_ROOT"
[ -d ".next.old" ] && rm -rf ".next.old"
[ -d ".next" ] && mv .next .next.old
mv .next.new .next
rm -rf .next.old

if pm2 info dogeow-nextjs >/dev/null 2>&1; then
  pm2 reload dogeow-nextjs
else
  pm2 start ecosystem.config.js --only dogeow-nextjs
fi
pm2 status
echo "[deploy] 完成"
