#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 已知的测试文件及其对应的源文件
const KNOWN_TESTS = {
  // Stores
  'stores/__tests__/authStore.test.ts': 'stores/authStore.ts',
  'stores/__tests__/backgroundStore.test.ts': 'stores/backgroundStore.ts',
  'stores/__tests__/languageStore.test.ts': 'stores/languageStore.ts',
  'stores/__tests__/musicStore.test.ts': 'stores/musicStore.ts',
  'stores/__tests__/projectCoverStore.test.ts': 'stores/projectCoverStore.ts',
  'stores/__tests__/themeStore.test.ts': 'stores/themeStore.ts',

  // Hooks
  'hooks/__tests__/useAudioManager.test.ts': 'hooks/useAudioManager.ts',
  'hooks/__tests__/useAuthGuard.test.ts': 'hooks/useAuthGuard.ts',
  'hooks/__tests__/useAvatarImage.test.ts': 'hooks/useAvatarImage.ts',
  'hooks/__tests__/useBackgroundManager.test.ts': 'hooks/useBackgroundManager.ts',
  'hooks/__tests__/useLanguageTransition.test.ts': 'hooks/useLanguageTransition.ts',
  'hooks/__tests__/useTranslation.test.ts': 'hooks/useTranslation.ts',

  // Components
  'components/ui/__tests__/avatar.test.tsx': 'components/ui/avatar.tsx',
  'components/ui/__tests__/button.test.tsx': 'components/ui/button.tsx',
  'components/ui/__tests__/confirm-dialog.test.tsx': 'components/ui/confirm-dialog.tsx',
  'components/ui/__tests__/DeleteConfirmationDialog.test.tsx':
    'components/ui/DeleteConfirmationDialog.tsx',
  'components/ui/__tests__/dropdown-menu.test.tsx': 'components/ui/dropdown-menu.tsx',
  'components/ui/__tests__/form.test.tsx': 'components/ui/form.tsx',
  'components/ui/__tests__/form-simple.test.tsx': 'components/ui/form.tsx',
  'components/ui/__tests__/input.test.tsx': 'components/ui/input.tsx',
  'components/ui/__tests__/language-selector.test.tsx': 'components/ui/language-selector.tsx',
  'components/ui/__tests__/skeleton.test.tsx': 'components/ui/skeleton.tsx',

  'components/app/__tests__/ThemeProvider.test.tsx': 'components/app/ThemeProvider.tsx',
  'components/provider/__tests__/SWRProvider.test.tsx': 'components/provider/SWRProvider.tsx',
  'components/provider/__tests__/LanguageProvider.test.tsx':
    'components/provider/LanguageProvider.tsx',
  'components/provider/__tests__/theme-provider.test.tsx': 'components/provider/theme-provider.tsx',

  // App
  'app/chat/components/__tests__/MentionHighlight.test.tsx':
    'app/chat/components/MentionHighlight.tsx',

  // Lib
  'lib/helpers/__tests__/colorUtils.test.ts': 'lib/helpers/colorUtils.ts',
  'lib/helpers/__tests__/dateUtils.test.ts': 'lib/helpers/dateUtils.ts',
  'lib/helpers/__tests__/mathUtils.test.ts': 'lib/helpers/mathUtils.ts',
  'lib/helpers/__tests__/index.test.ts': 'lib/helpers/index.ts',
  'lib/i18n/__tests__/utils.test.ts': 'lib/i18n/utils.ts',
  'lib/i18n/__tests__/dev-tools.test.ts': 'lib/i18n/dev-tools.ts',
  'lib/i18n/__tests__/index.test.ts': 'lib/i18n/index.ts',
}

function findSourceFiles(dir, baseDir = '') {
  const files = []

  try {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const relativePath = path.join(baseDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        if (!relativePath.includes('__tests__') && !relativePath.includes('node_modules')) {
          files.push(...findSourceFiles(fullPath, relativePath))
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item)
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
          if (!item.includes('.test.') && !item.includes('.spec.')) {
            files.push(relativePath)
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message)
  }

  return files
}

function main() {
  console.log('🔍 Checking test coverage...\n')

  const sourceFiles = []

  // 查找所有源文件
  const COVERAGE_DIRS = ['app', 'components', 'hooks', 'lib', 'stores']
  for (const dir of COVERAGE_DIRS) {
    if (fs.existsSync(dir)) {
      sourceFiles.push(...findSourceFiles(dir, dir))
    }
  }

  console.log(
    `📊 Found ${sourceFiles.length} source files and ${Object.keys(KNOWN_TESTS).length} test files\n`
  )

  // 分析测试覆盖情况
  const coveredFiles = new Set(Object.values(KNOWN_TESTS))
  const missingTests = []

  for (const sourceFile of sourceFiles) {
    if (!coveredFiles.has(sourceFile)) {
      missingTests.push(sourceFile)
    }
  }

  console.log('✅ Files with tests:')
  for (const file of sourceFiles) {
    if (coveredFiles.has(file)) {
      console.log(`  ✓ ${file}`)
    }
  }

  console.log('\n❌ Files missing tests:')
  for (const file of missingTests) {
    console.log(`  ✗ ${file}`)
  }

  console.log(`\n📈 Coverage Summary:`)
  console.log(`  Total source files: ${sourceFiles.length}`)
  console.log(`  Files with tests: ${sourceFiles.length - missingTests.length}`)
  console.log(`  Files missing tests: ${missingTests.length}`)
  console.log(
    `  Coverage: ${(((sourceFiles.length - missingTests.length) / sourceFiles.length) * 100).toFixed(1)}%`
  )

  if (missingTests.length > 0) {
    console.log('\n💡 To achieve 100% coverage, you need to create tests for:')
    missingTests.slice(0, 20).forEach(file => {
      console.log(`  - ${file}`)
    })
    if (missingTests.length > 20) {
      console.log(`  ... and ${missingTests.length - 20} more files`)
    }
  } else {
    console.log('\n🎉 Congratulations! You have 100% test coverage!')
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }
