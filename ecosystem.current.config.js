// 用于「发布目录 + 符号链接」部署时，PM2 的 cwd 指向 current，切换发布后 reload 即用新版本
// 服务器上启动前需设置环境变量 APP_ROOT（应用根目录），cwd 将为 APP_ROOT/current
module.exports = {
  apps: [
    {
      name: 'dogeow-nextjs',
      script: 'npm',
      args: 'run start',
      cwd: process.env.APP_ROOT ? `${process.env.APP_ROOT}/current` : undefined,
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      max_memory_restart: '2G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
      restart_delay: 3000,
    },
  ],
}
