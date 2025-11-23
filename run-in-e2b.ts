// run-in-e2b.ts - Run the entire red team testing application in E2B sandbox

import 'dotenv/config';
import { Sandbox } from 'e2b';
import fs from 'fs';
import path from 'path';

async function runInE2BSandbox() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 AI-POWERED MCP SECURITY - E2B SANDBOX MODE 🚀       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Validate environment variables
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required in .env file');
  }
  if (!process.env.E2B_API_KEY) {
    throw new Error('E2B_API_KEY is required in .env file');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 1: Creating E2B Sandbox');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sandbox = await Sandbox.create('base', {
    envs: {
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    },
    timeoutMs: 600_000, // 10 minutes
  });

  console.log(`✅ Sandbox created: ${sandbox.sandboxId}`);
  console.log(`🌐 Sandbox URL: https://${sandbox.sandboxId}.e2b.dev\n`);

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 2: Uploading Source Files');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Upload main application files
    const sourceFiles = [
      'main.ts',
      'harness.ts',
      'red-team-agent.ts',
      'blue-team-agent.ts',
      'protective-wrapper.ts',
      'types.ts',
      'validators.ts',
      'package.json',
      'tsconfig.json',
    ];

    console.log('📦 Uploading main application files...');
    for (const file of sourceFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        await sandbox.files.write(`/app/${file}`, content);
        console.log(`   ✓ ${file}`);
      }
    }

    // Upload package-lock.json if it exists
    if (fs.existsSync('package-lock.json')) {
      const lockContent = fs.readFileSync('package-lock.json', 'utf-8');
      await sandbox.files.write('/app/package-lock.json', lockContent);
      console.log('   ✓ package-lock.json');
    }

    // Upload echo-mcp directory
    console.log('\n📦 Uploading echo-mcp server files...');
    const echoMcpFiles = [
      { local: 'echo-mcp/package.json', remote: '/app/echo-mcp/package.json' },
      { local: 'echo-mcp/tsconfig.json', remote: '/app/echo-mcp/tsconfig.json' },
      { local: 'echo-mcp/src/server.ts', remote: '/app/echo-mcp/src/server.ts' },
    ];

    for (const file of echoMcpFiles) {
      if (fs.existsSync(file.local)) {
        const content = fs.readFileSync(file.local, 'utf-8');
        await sandbox.files.write(file.remote, content);
        console.log(`   ✓ ${file.local}`);
      }
    }

    console.log('\n✅ All files uploaded successfully\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 3: Installing Dependencies');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📥 Installing main application dependencies...');
    const installMain = await sandbox.commands.run('cd /app && npm install --quiet', {
      timeoutMs: 180_000, // 3 minutes
    });

    if (installMain.exitCode !== 0) {
      console.error('❌ Failed to install main dependencies');
      console.error(installMain.stderr);
      throw new Error('npm install failed for main app');
    }
    console.log('✅ Main dependencies installed\n');

    console.log('📥 Installing echo-mcp dependencies...');
    const installEcho = await sandbox.commands.run('cd /app/echo-mcp && npm install --quiet', {
      timeoutMs: 180_000,
    });

    if (installEcho.exitCode !== 0) {
      console.error('❌ Failed to install echo-mcp dependencies');
      console.error(installEcho.stderr);
      throw new Error('npm install failed for echo-mcp');
    }
    console.log('✅ Echo-mcp dependencies installed\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 4: Building TypeScript');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔨 Building echo-mcp TypeScript...');
    const build = await sandbox.commands.run('cd /app/echo-mcp && npm run build', {
      timeoutMs: 120_000, // 2 minutes
    });

    if (build.exitCode !== 0) {
      console.error('❌ Failed to build echo-mcp');
      console.error(build.stderr);
      throw new Error('TypeScript build failed');
    }
    console.log('✅ Echo-mcp built successfully\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 5: Running AI-Powered Security Testing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 Executing Red Team + Blue Team + Verification...\n');

    // Run the application with real-time output streaming
    const result = await sandbox.commands.run('cd /app && npx tsx main.ts', {
      timeoutMs: 120_000, // 2 minutes for test execution
      onStdout: (output) => {
        // Stream output in real-time
        // E2B sends output as raw data, not structured
        process.stdout.write(output);
      },
      onStderr: (output) => {
        // Stream errors in real-time (echo MCP logs to stderr)
        // Just show everything from stderr
        process.stderr.write(output);
      },
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('EXECUTION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Exit Code: ${result.exitCode}`);
    console.log(`Sandbox ID: ${sandbox.sandboxId}\n`);

    if (result.exitCode === 0) {
      console.log('✅ All tests completed successfully in E2B sandbox!\n');
    } else {
      console.log('⚠️  Tests completed with errors. Check output above.\n');
    }

    return result;
  } catch (error) {
    console.error('\n❌ Error during execution:', error);
    throw error;
  } finally {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CLEANUP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🧹 Cleaning up sandbox...');
    await sandbox.kill();
    console.log('✅ Sandbox terminated\n');

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                 E2B EXECUTION COMPLETE                   ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
  }
}

// Run the application
runInE2BSandbox().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
