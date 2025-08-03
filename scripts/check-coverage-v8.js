#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function extractCoverageFromV8Report() {
  const coverageDir = path.join(__dirname, '../coverage')
  const v8File = path.join(coverageDir, 'coverage-final.json')

  if (!fs.existsSync(v8File)) {
    console.log('❌ 覆盖率报告不存在，请先运行: npm run test:coverage')
    return null
  }

  try {
    const v8Data = JSON.parse(fs.readFileSync(v8File, 'utf8'))

    // 计算总体覆盖率
    let totalStatements = 0
    let totalCoveredStatements = 0
    let totalFunctions = 0
    let totalCoveredFunctions = 0
    let totalBranches = 0
    let totalCoveredBranches = 0
    let totalLines = 0
    let totalCoveredLines = 0

    for (const filePath in v8Data) {
      const file = v8Data[filePath]

      // 统计语句覆盖率
      for (const statementId in file.s) {
        const statement = file.s[statementId]
        totalStatements++
        if (statement > 0) {
          totalCoveredStatements++
        }
      }

      // 统计函数覆盖率
      for (const functionId in file.f) {
        const func = file.f[functionId]
        totalFunctions++
        if (func > 0) {
          totalCoveredFunctions++
        }
      }

      // 统计分支覆盖率
      for (const branchId in file.b) {
        const branch = file.b[branchId]
        totalBranches += branch.length
        totalCoveredBranches += branch.filter(hit => hit > 0).length
      }

      // 统计行覆盖率
      for (const lineId in file.l) {
        const line = file.l[lineId]
        totalLines++
        if (line > 0) {
          totalCoveredLines++
        }
      }
    }

    const coverage = {
      statements: {
        total: totalStatements,
        covered: totalCoveredStatements,
        percentage:
          totalStatements > 0 ? ((totalCoveredStatements / totalStatements) * 100).toFixed(2) : 0,
      },
      functions: {
        total: totalFunctions,
        covered: totalCoveredFunctions,
        percentage:
          totalFunctions > 0 ? ((totalCoveredFunctions / totalFunctions) * 100).toFixed(2) : 0,
      },
      branches: {
        total: totalBranches,
        covered: totalCoveredBranches,
        percentage:
          totalBranches > 0 ? ((totalCoveredBranches / totalBranches) * 100).toFixed(2) : 0,
      },
      lines: {
        total: totalLines,
        covered: totalCoveredLines,
        percentage: totalLines > 0 ? ((totalCoveredLines / totalLines) * 100).toFixed(2) : 0,
      },
    }

    return coverage
  } catch (error) {
    console.error('❌ 解析覆盖率报告失败:', error.message)
    return null
  }
}

function main() {
  console.log('🔍 检查前端代码覆盖率...\n')

  const coverage = extractCoverageFromV8Report()

  if (!coverage) {
    process.exit(1)
  }

  console.log('📊 前端代码覆盖率报告:')
  console.log(
    `   语句覆盖率: ${coverage.statements.percentage}% (${coverage.statements.covered}/${coverage.statements.total})`
  )
  console.log(
    `   函数覆盖率: ${coverage.functions.percentage}% (${coverage.functions.covered}/${coverage.functions.total})`
  )
  console.log(
    `   分支覆盖率: ${coverage.branches.percentage}% (${coverage.branches.covered}/${coverage.branches.total})`
  )
  console.log(
    `   行覆盖率: ${coverage.lines.percentage}% (${coverage.lines.covered}/${coverage.lines.total})`
  )

  // 使用语句覆盖率作为主要指标
  const mainCoverage = parseFloat(coverage.statements.percentage)
  console.log(`\n📈 主要覆盖率指标: ${mainCoverage}%`)

  if (mainCoverage >= 100) {
    console.log('✅ 代码覆盖率已达到 100%!')
  } else {
    console.log(`❌ 代码覆盖率未达到 100%，还需要提升 ${(100 - mainCoverage).toFixed(2)}%`)
  }

  // 输出覆盖率数据供脚本使用
  console.log(`\nCoverage: ${mainCoverage}%`)
}

if (require.main === module) {
  main()
}

module.exports = { main, extractCoverageFromV8Report }
