module.exports = {
  apps: [
    {
      name: 'dogeow-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/dogeow-next',
      instances: 'max', // 或者使用 'max' 自动检测CPU核心数
      exec_mode: 'cluster', // 集群模式，充分利用多核CPU
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
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
      watch: false, // 生产环境建议设为 false
      ignore_watch: ['node_modules', 'logs', '.next'],
    },
  ],
}
