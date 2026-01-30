module.exports = {
  apps: [
    {
      name: 'dogeow-nextjs-dev',
      script: 'npx',
      args: 'next dev -p 3001',
      cwd: '/var/www/dogeow-next',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自动重启配置
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // 内存限制（可选）
      max_memory_restart: '1G',
      // 监控配置
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
    },
  ],
}
