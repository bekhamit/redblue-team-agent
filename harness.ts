// harness.ts - Test harness for running MCP vulnerability tests

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { TestCase, TestResult, TestSummary, MCPResponse } from './types.js';
import { validateTestResult } from './validators.js';

export class MCPTestHarness {
  private client: Client | null = null;
  private connected = false;

  constructor() {}

  /**
   * Connect to the echo MCP server
   */
  async connect(): Promise<void> {
    console.log('📡 Connecting to MCP server...');

    this.client = new Client(
      {
        name: 'red-team-harness',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    const transport = new StdioClientTransport({
      command: 'node',
      args: ['./echo-mcp/dist/server.js'],
    });

    await this.client.connect(transport);
    this.connected = true;
    console.log('✅ Connected to MCP server\n');
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.close();
      this.connected = false;
      console.log('🔌 Disconnected from MCP server');
    }
  }

  /**
   * Run a single test case
   */
  private async runTest(testCase: TestCase): Promise<TestResult> {
    if (!this.client || !this.connected) {
      throw new Error('Not connected to MCP server');
    }

    const startTime = Date.now();
    let response: MCPResponse | null = null;
    let error: string | undefined;

    try {
      // Call the MCP tool with the test input
      response = (await this.client.callTool({
        name: 'echo',
        arguments: testCase.input,
      })) as MCPResponse;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const executionTime = Date.now() - startTime;

    // If there was an error, it's a fail
    if (error || !response) {
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
}
