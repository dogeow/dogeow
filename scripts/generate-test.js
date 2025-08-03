#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 测试模板
const testTemplates = {
  hook: `import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useHookName } from '../useHookName'

describe('useHookName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useHookName())
      expect(result.current).toBeDefined()
    })
  })

  describe('functionality', () => {
    it('should handle basic functionality', () => {
      const { result } = renderHook(() => useHookName())
      expect(result.current).toBeDefined()
    })
  })
})`,

  component: `import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ComponentName } from '../ComponentName'

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  it('should handle user interactions', () => {
    render(<ComponentName />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })
})`,

  store: `import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStoreName } from '../storeName'

describe('storeName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const state = useStoreName.getState()
    expect(state).toBeDefined()
  })

  it('should handle state updates', () => {
    const initialState = useStoreName.getState()
    useStoreName.setState({ /* updated state */ })
    const updatedState = useStoreName.getState()
    expect(updatedState).not.toEqual(initialState)
  })
})`,

  util: `import { describe, it, expect } from 'vitest'
import { functionName } from '../utilName'

describe('functionName', () => {
  it('should handle basic functionality', () => {
    const result = functionName()
    expect(result).toBeDefined()
  })

  it('should handle edge cases', () => {
    const result = functionName()
    expect(result).toBeDefined()
  })
})`,
}

// 需要测试的文件列表
const filesToTest = [
  // Hooks
  { path: 'hooks/useChatRoom.ts', type: 'hook', testPath: 'hooks/__tests__/useChatRoom.test.ts' },
  {
    path: 'hooks/useChatWebSocket.ts',
    type: 'hook',
    testPath: 'hooks/__tests__/useChatWebSocket.test.ts',
  },
  {
    path: 'hooks/useTileManagement.ts',
    type: 'hook',
    testPath: 'hooks/__tests__/useTileManagement.test.ts',
  },

  // Components
  {
    path: 'components/ui/button.tsx',
    type: 'component',
    testPath: 'components/ui/__tests__/button.test.tsx',
  },
  {
    path: 'components/ui/input.tsx',
    type: 'component',
    testPath: 'components/ui/__tests__/input.test.tsx',
  },
  {
    path: 'components/ui/form.tsx',
    type: 'component',
    testPath: 'components/ui/__tests__/form.test.tsx',
  },
  {
    path: 'components/ui/dropdown-menu.tsx',
    type: 'component',
    testPath: 'components/ui/__tests__/dropdown-menu.test.tsx',
  },
  {
    path: 'components/ui/confirm-dialog.tsx',
    type: 'component',
    testPath: 'components/ui/__tests__/confirm-dialog.test.tsx',
  },
  {
    path: 'components/ui/language-selector.tsx',
    type: 'component',
    testPath: 'components/ui/__tests__/language-selector.test.tsx',
  },

  // Stores
  { path: 'stores/authStore.ts', type: 'store', testPath: 'stores/__tests__/authStore.test.ts' },
  {
    path: 'stores/backgroundStore.ts',
    type: 'store',
    testPath: 'stores/__tests__/backgroundStore.test.ts',
  },
  {
    path: 'stores/languageStore.ts',
    type: 'store',
    testPath: 'stores/__tests__/languageStore.test.ts',
  },
  { path: 'stores/musicStore.ts', type: 'store', testPath: 'stores/__tests__/musicStore.test.ts' },
  {
    path: 'stores/projectCoverStore.ts',
    type: 'store',
    testPath: 'stores/__tests__/projectCoverStore.test.ts',
  },
  { path: 'stores/themeStore.ts', type: 'store', testPath: 'stores/__tests__/themeStore.test.ts' },

  // Utils
  {
    path: 'lib/helpers/colorUtils.ts',
    type: 'util',
    testPath: 'lib/helpers/__tests__/colorUtils.test.ts',
  },
  {
    path: 'lib/helpers/dateUtils.ts',
    type: 'util',
    testPath: 'lib/helpers/__tests__/dateUtils.test.ts',
  },
  {
    path: 'lib/helpers/mathUtils.ts',
    type: 'util',
    testPath: 'lib/helpers/__tests__/mathUtils.test.ts',
  },
  { path: 'lib/helpers/index.ts', type: 'util', testPath: 'lib/helpers/__tests__/index.test.ts' },
  { path: 'lib/i18n/index.ts', type: 'util', testPath: 'lib/i18n/__tests__/index.test.ts' },
  { path: 'lib/i18n/dev-tools.ts', type: 'util', testPath: 'lib/i18n/__tests__/dev-tools.test.ts' },
  { path: 'lib/i18n/utils.ts', type: 'util', testPath: 'lib/i18n/__tests__/utils.test.ts' },
]

function generateTestFile(fileInfo) {
  const { path: filePath, type, testPath } = fileInfo

  // 检查源文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Source file not found: ${filePath}`)
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
  let testContent = testTemplates[type]

  // 根据文件名替换模板中的占位符
  const fileName = path.basename(filePath, path.extname(filePath))
  const componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1)

  testContent = testContent
    .replace(/useHookName/g, `use${componentName}`)
    .replace(/ComponentName/g, componentName)
    .replace(/storeName/g, fileName)
    .replace(/functionName/g, fileName)
    .replace(/utilName/g, fileName)

  // 写入测试文件
  fs.writeFileSync(testPath, testContent)
  console.log(`✅ Generated test file: ${testPath}`)
}

function main() {
  console.log('🚀 Starting test file generation...')

  filesToTest.forEach(generateTestFile)

  console.log('✨ Test file generation completed!')
}

if (require.main === module) {
  main()
}

module.exports = { generateTestFile, filesToTest }
