#!/usr/bin/env node

/**
 * Test performance monitoring script
 * Runs tests and reports performance metrics
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runTestsWithTiming(command, label) {
  console.log(`\n🚀 Running ${label}...`)
  const startTime = Date.now()

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd(),
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`✅ ${label} completed in ${duration}ms`)

    // Extract test count from output
    const testMatch = output.match(/Tests\s+(\d+)\s+passed/)
    const testCount = testMatch ? parseInt(testMatch[1]) : 0

    return {
      label,
      duration,
      testCount,
      avgTimePerTest: testCount > 0 ? duration / testCount : 0,
      success: true,
    }
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`❌ ${label} failed after ${duration}ms`)
    console.log(error.stdout || error.message)

    return {
      label,
      duration,
      testCount: 0,
      avgTimePerTest: 0,
      success: false,
      error: error.message,
    }
  }
}

function main() {
  console.log('📊 Vitest Performance Monitoring')
  console.log('================================')

  const results = []

  // Test different configurations
  const testConfigs = [
    { command: 'npm test', label: 'Standard Test Run' },
    { command: 'npm run test:coverage', label: 'Coverage Test Run' },
    { command: 'npm run test:changed', label: 'Changed Files Only' },
  ]

  for (const config of testConfigs) {
    const result = runTestsWithTiming(config.command, config.label)
    results.push(result)
  }

  // Generate performance report
  console.log('\n📈 Performance Summary')
  console.log('=====================')

  results.forEach(result => {
    if (result.success) {
      console.log(`${result.label}:`)
      console.log(`  Duration: ${result.duration}ms`)
      console.log(`  Tests: ${result.testCount}`)
      console.log(`  Avg per test: ${result.avgTimePerTest.toFixed(2)}ms`)
    } else {
      console.log(`${result.label}: FAILED`)
    }
    console.log('')
  })

  // Save results to file
  const reportPath = path.join(process.cwd(), 'test-performance-report.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results,
      },
      null,
      2
    )
  )

  console.log(`📄 Detailed report saved to: ${reportPath}`)
}

if (require.main === module) {
  main()
}

module.exports = { runTestsWithTiming }
