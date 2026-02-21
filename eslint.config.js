// @ts-check
const nextConfig = require('eslint-config-next')

module.exports = [
  ...nextConfig,
  {
    ignores: ['scripts/**/*', 'node_modules/**', '.next/**'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]
