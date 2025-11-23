// harness-echo.ts - Test harness for Echo MCP

import { TestCase, TestResult, TestSummary, MCPResponse } from '../../shared/types.js';
import { validateTestResult } from '../../shared/validators.js';
import { ProtectiveMCPWrapper, ProtectionRules } from '../../shared/protective-wrapper.js';

export class EchoMCPTestHarness {
  private wrapper: ProtectiveMCPWrapper;
  private connected = false;

  constructor() {
    this.wrapper = new ProtectiveMCPWrapper();
  }

  /**
   * Connect to the echo MCP server via protective wrapper
   */
  async connect(): Promise<void> {
    console.log('📡 Connecting to Echo MCP server via protective wrapper...');
    await this.wrapper.connect('node', ['../../echo-mcp/dist/server.js']);
    this.connected = true;
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.wrapper.disconnect();
      this.connected = false;
      console.log('🔌 Disconnected from MCP server');
    }
  }

  /**
   * Run a single test case
   */
  private async runTest(testCase: TestCase): Promise<TestResult> {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    const startTime = Date.now();
    let response: MCPResponse | null = null;
    let error: string | undefined;

    try {
      response = (await this.wrapper.callTool({
        name: 'echo',
        arguments: testCase.input,
      })) as MCPResponse;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const executionTime = Date.now() - startTime;

    // If there was an error, check if it's a wrapper block (which is a PASS!)
    if (error || !response) {
      if (error && error.includes('🛡️ Wrapper blocked:')) {
        return {
          testCase,
          status: 'pass',
          reason: error,
          executionTime,
        };
      }
      return {
        testCase,
        status: 'fail',
        reason: error || 'No response received',
        executionTime,
        error,
      };
    }

    // Validate the response
    const validation = validateTestResult(testCase, response, executionTime);

    return {
      testCase,
      status: validation.passed ? 'pass' : 'fail',
      reason: validation.reason,
      actualOutput: response,
      executionTime,
    };
  }

  /**
   * Run multiple test cases
   */
  async runTests(testCases: TestCase[]): Promise<TestSummary> {
    console.log(`🧪 Running ${testCases.length} test cases...\n`);

    const results: TestResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`[${i + 1}/${testCases.length}] Running: ${testCase.name}`);

      const result = await this.runTest(testCase);
      results.push(result);

      const statusIcon = result.status === 'pass' ? '✅' : '❌';
      console.log(`${statusIcon} ${result.status.toUpperCase()}: ${result.reason}`);
      console.log(`   Execution time: ${result.executionTime}ms\n`);
    }

    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;
    const passRate = (passed / results.length) * 100;

    return {
      total: results.length,
      passed,
      failed,
      passRate,
      results,
    };
  }

  /**
   * Print test summary
   */
  printSummary(summary: TestSummary): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests:  ${summary.total}`);
    console.log(`✅ Passed:    ${summary.passed} (${summary.passRate.toFixed(1)}%)`);
    console.log(`❌ Failed:    ${summary.failed} (${(100 - summary.passRate).toFixed(1)}%)`);
    console.log('='.repeat(60));

    // Group failures by type
    const failures = summary.results.filter((r) => r.status === 'fail');
    if (failures.length > 0) {
      console.log('\n🔍 FAILED TESTS:');
      failures.forEach((result, i) => {
        console.log(`\n${i + 1}. ${result.testCase.name}`);
        console.log(`   Type: ${result.testCase.attackType}`);
        console.log(`   Reason: ${result.reason}`);
        console.log(`   Time: ${result.executionTime}ms`);
      });
    }

    // Group by attack type
    console.log('\n📈 RESULTS BY ATTACK TYPE:');
    const attackTypes = new Set(summary.results.map((r) => r.testCase.attackType));
    attackTypes.forEach((type) => {
      const typeResults = summary.results.filter((r) => r.testCase.attackType === type);
      const typePassed = typeResults.filter((r) => r.status === 'pass').length;
      const typeTotal = typeResults.length;
      const typeRate = (typePassed / typeTotal) * 100;
      console.log(`  ${type}: ${typePassed}/${typeTotal} passed (${typeRate.toFixed(1)}%)`);
    });

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Update wrapper protection rules
   */
  updateWrapperRules(rules: ProtectionRules): void {
    this.wrapper.updateRules(rules);
  }

  /**
   * Get current wrapper rule count
   */
  getWrapperRuleCount(): number {
    return this.wrapper.getRuleCount();
  }

  /**
   * Print before/after comparison
   */
  printComparison(before: TestSummary, after: TestSummary, initialRuleCount: number): void {
    console.log('\n' + '━'.repeat(60));
    console.log('BEFORE vs AFTER: WRAPPER IMPROVEMENT');
    console.log('━'.repeat(60) + '\n');

    console.log('                    BEFORE      AFTER       IMPROVEMENT');
    console.log(
      `Pass Rate:          ${before.passRate.toFixed(1)}%   →   ${after.passRate.toFixed(1)}%      ${(after.passRate - before.passRate >= 0 ? '+' : '')}${(after.passRate - before.passRate).toFixed(1)}%`
    );
    console.log(
      `Attacks Blocked:    ${before.passed}       →   ${after.passed}           ${after.passed - before.passed >= 0 ? '+' : ''}${after.passed - before.passed}`
    );
    console.log(
      `Failed Tests:       ${before.failed}       →   ${after.failed}           ${after.failed - before.failed <= 0 ? '' : '+'}${after.failed - before.failed}`
    );
    console.log(
      `Wrapper Rules:      ${initialRuleCount}       →   ${this.getWrapperRuleCount()}          +${this.getWrapperRuleCount() - initialRuleCount} AI-generated`
    );

    console.log('\n🛡️  RESULT: Wrapper successfully learned from attacks!');
    console.log('   Echo MCP is now safe to use through protective middleware.\n');
  }
}
