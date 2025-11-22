// main.ts - Main entry point for Red Team MCP Testing

import 'dotenv/config';
import { RedTeamAgent } from './red-team-agent.js';
import { MCPTestHarness } from './harness.js';
import { TestCase } from './types.js';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         🎯 RED TEAM MCP VULNERABILITY TESTING 🎯         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const redTeamAgent = new RedTeamAgent();
  const harness = new MCPTestHarness();

  try {
    // Step 1: Generate malicious test cases using red team agent
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 1: Generating Malicious Test Cases');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testCases: TestCase[] = await redTeamAgent.generateTestCases(15);

    console.log('📝 Generated test cases by attack type:');
    const attackTypeCounts = testCases.reduce((acc, tc) => {
      acc[tc.attackType] = (acc[tc.attackType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(attackTypeCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} test(s)`);
    });
    console.log('');

    // Step 2: Connect to vulnerable MCP server
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2: Connecting to Vulnerable MCP Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await harness.connect();

    // Step 3: Run tests through harness
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 3: Executing Tests Against MCP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const summary = await harness.runTests(testCases);

    // Step 4: Display results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 4: Analysis & Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    harness.printSummary(summary);

    // Cleanup
    await harness.disconnect();

    // Final assessment
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                   SECURITY ASSESSMENT                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    if (summary.passRate >= 90) {
      console.log('🛡️  EXCELLENT: MCP server has strong protections');
    } else if (summary.passRate >= 70) {
      console.log('⚠️  GOOD: MCP server has some protections but needs improvement');
    } else if (summary.passRate >= 50) {
      console.log('⚠️  WARNING: MCP server has significant vulnerabilities');
    } else {
      console.log('🚨 CRITICAL: MCP server is highly vulnerable to attacks');
    }

    console.log(`\n   Pass Rate: ${summary.passRate.toFixed(1)}%`);
    console.log(`   Vulnerabilities Found: ${summary.failed} out of ${summary.total} tests\n`);

    if (summary.failed > 0) {
      console.log('💡 RECOMMENDATION: Implement input validation, output sanitization,');
      console.log('   timeout protection, and injection detection before production use.\n');
    }

    console.log('✅ Red team testing completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    await harness.disconnect();
    process.exit(1);
  }
}

main();
