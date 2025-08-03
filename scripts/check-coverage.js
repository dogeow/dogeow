#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 定义需要测试覆盖的目录
const COVERAGE_DIRS = ['app', 'components', 'hooks', 'lib', 'stores']

// 定义不需要测试的文件模式
const EXCLUDE_PATTERNS = [
  /\.d\.ts$/,
  /\.test\.(js|ts|jsx|tsx)$/,
  /\.spec\.(js|ts|jsx|tsx)$/,
  /\.config\.(js|ts)$/,
  /\.setup\.(js|ts)$/,
  /index\.(js|ts)$/,
  /types\.(js|ts)$/,
  /__tests__/,
  /node_modules/,
  /\.next/,
  /coverage/,
  /dist/,
  /build/,
]

// 定义不需要测试的文件
const EXCLUDE_FILES = [
  'next-env.d.ts',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'eslint.config.mjs',
  'tsconfig.json',
  'package.json',
  'package-lock.json',
  '.prettierrc',
  '.prettierignore',
  '.gitignore',
  '.editorconfig',
  'README.md',
  'components.json',
  'build.sh',
  'CI_CD_VALIDATION_REPORT.md',
  'VITEST_PERFORMANCE.md',
]

function shouldExcludeFile(filePath) {
  const fileName = path.basename(filePath)

  // 检查排除的文件
  if (EXCLUDE_FILES.includes(fileName)) {
    return true
  }

  // 检查排除的模式
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(filePath)) {
      return true
    }
  }

  return false
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
        if (!shouldExcludeFile(relativePath)) {
          files.push(...findSourceFiles(fullPath, relativePath))
        }
      } else if (stat.isFile()) {
        if (!shouldExcludeFile(relativePath)) {
          const ext = path.extname(item)
          if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
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

function findTestFiles(dir, baseDir = '') {
  const files = []

  try {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const relativePath = path.join(baseDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        files.push(...findTestFiles(fullPath, relativePath))
      } else if (stat.isFile()) {
        const ext = path.extname(item)
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
          if (
            item.includes('.test.') ||
            item.includes('.spec.') ||
            relativePath.includes('__tests__')
          ) {
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

function getSourceFileFromTest(testFile) {
  // 移除扩展名
  const withoutExt = testFile.replace(/\.(js|jsx|ts|tsx)$/, '')

  // 移除 __tests__ 路径部分
  const withoutTestsDir = withoutExt.replace(/\/__tests__\//, '/')

  // 移除 .test 或 .spec 后缀
  const withoutTestSuffix = withoutTestsDir.replace(/\.(test|spec)$/, '')

  return withoutTestSuffix
}

function getTestFileFromSource(sourceFile) {
  // 添加 .test.ts 后缀
  return sourceFile.replace(/\.(js|jsx|ts|tsx)$/, '.test.ts')
}

function main() {
  console.log('🔍 Checking test coverage...\n')

  const sourceFiles = []
  const testFiles = []

  // 查找所有源文件
  for (const dir of COVERAGE_DIRS) {
    if (fs.existsSync(dir)) {
      sourceFiles.push(...findSourceFiles(dir, dir))
    }
  }

  // 查找所有测试文件
  for (const dir of COVERAGE_DIRS) {
    if (fs.existsSync(dir)) {
      testFiles.push(...findTestFiles(dir, dir))
    }
  }

  console.log(`📊 Found ${sourceFiles.length} source files and ${testFiles.length} test files\n`)

  // 分析测试覆盖情况
  const coveredFiles = new Set()
  const missingTests = []

  for (const testFile of testFiles) {
    // 提取测试文件对应的源文件
    const sourceFile = getSourceFileFromTest(testFile)
    coveredFiles.add(sourceFile)
  }

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

module.exports = { main, findSourceFiles, findTestFiles }
