module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复
        'docs',     // 文档
        'style',    // 格式
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'chore',    // 构建过程或辅助工具的变动
        'revert',   // 回滚
        'build',    // 构建系统或外部依赖项的更改
        'ci',       // CI配置文件和脚本的更改
      ],
    ],
    'subject-case': [0], // 允许任何大小写
    'subject-max-length': [2, 'always', 100],
  },
}; 