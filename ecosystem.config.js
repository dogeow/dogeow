module.exports = {
  apps: [
    {
      name: 'dogeow-nextjs',
      script: 'npm',
      args: 'run start',
      cwd: process.env.PM2_CWD || process.env.APP_ROOT,
      instances: 'max', // 自动检测CPU核心数
      exec_mode: 'cluster', // 集群模式，充分利用多核CPU
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // 可扩展性：加入更多环境变量按需配置
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true, // 推荐合并所有实例日志到同一文件，便于查看
      autorestart: true,
      max_restarts: 5, // 一般无需过高，建议减少异常重启风险
      min_uptime: '30s', // 提高微服务容错窗口，建议略增
      max_memory_restart: '2G', // 4G可能过高，2G能及早发现泄漏
      watch: false, // 生产环境必须为 false, 放置代码热更新风险
      ignore_watch: ['node_modules', 'logs', '.next'],
      // 其他可选优化项：
      restart_delay: 3000, // 异常重启时增加延迟，防止死循环
    },
  ],
}
