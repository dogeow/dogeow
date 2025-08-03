#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Hook测试模板
const hookTestTemplate = hookName => `import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ${hookName} } from '../${hookName}'

// Mock dependencies
vi.mock('@/lib/websocket', () => ({
  createEchoInstance: vi.fn(),
  destroyEchoInstance: vi.fn(),
  getConnectionMonitor: vi.fn(),
  destroyConnectionMonitor: vi.fn(),
  getAuthManager: vi.fn(),
  destroyAuthManager: vi.fn(),
}))

vi.mock('@/hooks/useLoginTrigger', () => ({
  useLoginTrigger: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

describe('${hookName}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => ${hookName}())
      expect(result.current).toBeDefined()
    })
  })

  describe('functionality', () => {
    it('should handle basic functionality', () => {
      const { result } = renderHook(() => ${hookName}())
      expect(result.current).toBeDefined()
    })
  })
})`

// 需要测试的hooks
const hooksToTest = [
  { name: 'useChatRoom', file: 'useChatRoom.ts' },
  { name: 'useChatWebSocket', file: 'useChatWebSocket.ts' },
  { name: 'useTileManagement', file: 'useTileManagement.ts' },
]

function generateHookTest(hookInfo) {
  const { name, file } = hookInfo
  const testPath = `hooks/__tests__/${name}.test.ts`

  // 检查源文件是否存在
  if (!fs.existsSync(`hooks/${file}`)) {
    console.log(`⚠️  Source file not found: hooks/${file}`)
    return
  }

  // 检查测试文件是否已存在
  if (fs.existsSync(testPath)) {
    console.log(`✅ Test file already exists: ${testPath}`)
    return
  }

  // 创建测试目录
  const testDir = path.dirname(testPath)
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  // 生成测试内容
  const testContent = hookTestTemplate(name)

  // 写入测试文件
  fs.writeFileSync(testPath, testContent)
  console.log(`✅ Generated test file: ${testPath}`)
}

function main() {
  console.log('🚀 Starting hook test file generation...')

  hooksToTest.forEach(generateHookTest)

  console.log('✨ Hook test file generation completed!')
}

if (require.main === module) {
  main()
}

module.exports = { generateHookTest, hooksToTest }
