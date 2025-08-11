#!/usr/bin/env node

import { execSync } from 'child_process'
import { performance } from 'perf_hooks'

interface TestSuite {
  name: string
  command: string
  timeout: number
  critical: boolean
}

interface TestResult {
  suite: string
  passed: boolean
  duration: number
  output: string
  error?: string
}

class TestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      command: 'npm run test -- --reporter=verbose src/test --exclude="**/performance/**" --exclude="**/integration/**"',
      timeout: 60000,
      critical: true
    },
    {
      name: 'Integration Tests',
      command: 'npm run test -- --reporter=verbose src/test/integration',
      timeout: 120000,
      critical: true
    },
    {
      name: 'Performance Tests',
      command: 'npm run test:performance',
      timeout: 180000,
      critical: false
    },
    {
      name: 'End-to-End Tests',
      command: 'npm run test:e2e',
      timeout: 300000,
      critical: true
    }
  ]

  private results: TestResult[] = []

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting comprehensive test suite...\n')
    
    const startTime = performance.now()
    
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite)
    }
    
    const endTime = performance.now()
    const totalDuration = Math.round(endTime - startTime)
    
    this.printSummary(totalDuration)
    
    const hasFailures = this.results.some(r => !r.passed && this.testSuites.find(s => s.name === r.suite)?.critical)
    
    if (hasFailures) {
      process.exit(1)
    }
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`📋 Running ${suite.name}...`)
    
    const startTime = performance.now()
    
    try {
      const output = execSync(suite.command, {
        encoding: 'utf8',
        timeout: suite.timeout,
        stdio: 'pipe'
      })
      
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      this.results.push({
        suite: suite.name,
        passed: true,
        duration,
        output
      })
      
      console.log(`✅ ${suite.name} passed (${duration}ms)\n`)
      
    } catch (error: any) {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        output: error.stdout || '',
        error: error.stderr || error.message
      })
      
      const status = suite.critical ? '❌' : '⚠️'
      console.log(`${status} ${suite.name} failed (${duration}ms)`)
      
      if (error.stdout) {
        console.log('Output:', error.stdout)
      }
      
      if (error.stderr) {
        console.log('Error:', error.stderr)
      }
      
      console.log('')
    }
  }

  private printSummary(totalDuration: number): void {
    console.log('📊 Test Summary')
    console.log('================')
    
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const criticalFailed = this.results.filter(r => 
      !r.passed && this.testSuites.find(s => s.name === r.suite)?.critical
    ).length
    
    console.log(`Total Suites: ${this.results.length}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Critical Failures: ${criticalFailed}`)
    console.log(`Total Duration: ${totalDuration}ms`)
    console.log('')
    
    // Detailed results
    this.results.forEach(result => {
      const suite = this.testSuites.find(s => s.name === result.suite)
      const status = result.passed ? '✅' : (suite?.critical ? '❌' : '⚠️')
      console.log(`${status} ${result.suite}: ${result.duration}ms`)
    })
    
    console.log('')
    
    if (criticalFailed > 0) {
      console.log('❌ Test suite failed due to critical test failures')
    } else if (failed > 0) {
      console.log('⚠️ Test suite completed with non-critical failures')
    } else {
      console.log('🎉 All tests passed!')
    }
  }

  async runSpecificSuite(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => s.name.toLowerCase().includes(suiteName.toLowerCase()))
    
    if (!suite) {
      console.error(`❌ Test suite "${suiteName}" not found`)
      console.log('Available suites:')
      this.testSuites.forEach(s => console.log(`  - ${s.name}`))
      process.exit(1)
    }
    
    console.log(`🚀 Running ${suite.name}...\n`)
    await this.runTestSuite(suite)
    
    const result = this.results[0]
    if (!result.passed && suite.critical) {
      process.exit(1)
    }
  }
}

// CLI interface
const args = process.argv.slice(2)
const runner = new TestRunner()

if (args.length === 0) {
  runner.runAllTests().catch(console.error)
} else {
  const suiteName = args[0]
  runner.runSpecificSuite(suiteName).catch(console.error)
}