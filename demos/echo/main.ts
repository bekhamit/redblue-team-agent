// main.ts - Main entry point for Echo MCP Security Testing

import 'dotenv/config';
import { RedTeamAgent } from '../../shared/agents/red-team-agent.js';
import { BlueTeamAgent } from '../../shared/agents/blue-team-agent.js';
import { EchoMCPTestHarness } from './harness-echo.js';
import { TestCase } from '../../shared/types.js';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🎯 AI-POWERED MCP SECURITY: SELF-IMPROVING WRAPPER 🎯  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const redTeamAgent = new RedTeamAgent();
  const blueTeamAgent = new BlueTeamAgent();
  const harness = new EchoMCPTestHarness();

  try {
    // Step 1: Generate malicious test cases using red team agent
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 1: RED TEAM ATTACK (Initial Testing)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔴 Red Team: Generating malicious test cases...\n');
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

    // Connect to MCP via basic wrapper
    await harness.connect();
    const initialRuleCount = harness.getWrapperRuleCount();

    // Run initial tests
    console.log('🔴 Red Team: Attacking MCP through basic wrapper...\n');
    const initialSummary = await harness.runTests(testCases);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('INITIAL TEST RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    harness.printSummary(initialSummary);

    // Check if we have vulnerabilities to fix
    if (initialSummary.failed === 0) {
      console.log('\n✅ No vulnerabilities found! Wrapper is already secure.\n');
      await harness.disconnect();
      process.exit(0);
    }

    console.log(`\n⚠️  Found ${initialSummary.failed} vulnerabilities. Activating Blue Team...\n`);

    // Step 2: Blue Team analyzes and generates fixes
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 2: BLUE TEAM DEFENSE (Auto-Fix)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const newRules = await blueTeamAgent.analyzeAndGenerateFixes(initialSummary);

    // Update wrapper with new rules
    harness.updateWrapperRules(newRules);

    // Step 3: Verification - re-run tests with updated wrapper
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 3: VERIFICATION (Re-Testing with Updated Wrapper)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔴 Red Team: Re-running same attacks against updated wrapper...\n');
    const finalSummary = await harness.runTests(testCases);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FINAL TEST RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    harness.printSummary(finalSummary);

    // Step 4: Show before/after comparison
    harness.printComparison(initialSummary, finalSummary, initialRuleCount);

    // Cleanup
    await harness.disconnect();

    // Final assessment
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                   SECURITY ASSESSMENT                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const improvement = finalSummary.passRate - initialSummary.passRate;

    if (finalSummary.passRate >= 90) {
      console.log('🛡️  EXCELLENT: Wrapper provides strong protection');
      console.log(`   ✅ Pass rate improved by ${improvement.toFixed(1)}%`);
    } else if (finalSummary.passRate >= 70) {
      console.log('⚠️  GOOD: Wrapper improved but needs more work');
      console.log(`   ⚠️  Pass rate improved by ${improvement.toFixed(1)}%`);
    } else {
      console.log('🚨 WARNING: Wrapper still has vulnerabilities');
      console.log(`   ⚠️  Pass rate improved by ${improvement.toFixed(1)}%`);
      console.log('   💡 Consider running blue team again for additional improvements');
    }

    console.log(`\n   Initial Pass Rate: ${initialSummary.passRate.toFixed(1)}%`);
    console.log(`   Final Pass Rate: ${finalSummary.passRate.toFixed(1)}%`);
    console.log(
      `   Vulnerabilities Fixed: ${initialSummary.failed - finalSummary.failed} out of ${initialSummary.failed}\n`
    );

    console.log('✅ AI-powered security testing completed!\ n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    await harness.disconnect();
    process.exit(1);
  }
}

main();
