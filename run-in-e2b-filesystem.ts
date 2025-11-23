// run-in-e2b-filesystem.ts - Run filesystem MCP testing in E2B sandbox with Docker MCP hub

import 'dotenv/config';
import { Sandbox } from 'e2b';
import fs from 'fs';
import path from 'path';

async function runFilesystemInE2B() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🗂️  FILESYSTEM MCP IN E2B - DOCKER HUB EDITION  🗂️    ║');
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
      IN_E2B_SANDBOX: 'true', // Flag to indicate we're running in E2B
    },
    timeoutMs: 600_000, // 10 minutes
  });

  console.log(`✅ Sandbox created: ${sandbox.sandboxId}`);
  console.log(`🌐 Sandbox URL: https://${sandbox.sandboxId}.e2b.dev\n`);

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 2: Uploading Source Files');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Upload shared files
    console.log('📦 Uploading shared files...');
    const sharedFiles = [
      { local: 'shared/types.ts', remote: '/app/shared/types.ts' },
      { local: 'shared/validators.ts', remote: '/app/shared/validators.ts' },
      { local: 'shared/protective-wrapper.ts', remote: '/app/shared/protective-wrapper.ts' },
      {
        local: 'shared/agents/red-team-agent.ts',
        remote: '/app/shared/agents/red-team-agent.ts',
      },
      {
        local: 'shared/agents/blue-team-agent.ts',
        remote: '/app/shared/agents/blue-team-agent.ts',
      },
    ];

    for (const file of sharedFiles) {
      if (fs.existsSync(file.local)) {
        const content = fs.readFileSync(file.local, 'utf-8');
        await sandbox.files.write(file.remote, content);
        console.log(`   ✓ ${file.local}`);
      }
    }

    // Upload filesystem demo files
    console.log('\n📦 Uploading filesystem demo files...');
    const demoFiles = [
      {
        local: 'demos/filesystem/main.ts',
        remote: '/app/demos/filesystem/main.ts',
      },
      {
        local: 'demos/filesystem/harness-filesystem.ts',
        remote: '/app/demos/filesystem/harness-filesystem.ts',
      },
    ];

    for (const file of demoFiles) {
      if (fs.existsSync(file.local)) {
        const content = fs.readFileSync(file.local, 'utf-8');
        await sandbox.files.write(file.remote, content);
        console.log(`   ✓ ${file.local}`);
      }
    }

    // Upload package files
    console.log('\n📦 Uploading package files...');
    const configFiles = ['package.json', 'tsconfig.json'];
    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        await sandbox.files.write(`/app/${file}`, content);
        console.log(`   ✓ ${file}`);
      }
    }

    // Upload package-lock.json if exists
    if (fs.existsSync('package-lock.json')) {
      const lockContent = fs.readFileSync('package-lock.json', 'utf-8');
      await sandbox.files.write('/app/package-lock.json', lockContent);
      console.log('   ✓ package-lock.json');
    }

    console.log('\n✅ All files uploaded successfully\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 3: Installing Dependencies');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📥 Installing dependencies...');
    const install = await sandbox.commands.run('cd /app && npm install --quiet', {
      timeoutMs: 180_000, // 3 minutes
    });

    if (install.exitCode !== 0) {
      console.error('❌ Failed to install dependencies');
      console.error(install.stderr);
      throw new Error('npm install failed');
    }
    console.log('✅ Dependencies installed\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 4: Installing Docker in E2B Sandbox');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🐋 Installing Docker...');
    const dockerInstall = await sandbox.commands.run(
      'curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh',
      {
        timeoutMs: 300_000, // 5 minutes
        onStdout: (output) => {
          // Show installation progress (can be verbose)
          if (output.includes('Docker') || output.includes('version')) {
            process.stdout.write(output);
          }
        },
        onStderr: (output) => {
          // Show errors
          process.stderr.write(output);
        },
      }
    );

    if (dockerInstall.exitCode !== 0) {
      console.error('❌ Failed to install Docker');
      console.error(dockerInstall.stderr);
      throw new Error('Docker installation failed');
    }
    console.log('✅ Docker installed\n');

    console.log('🔧 Starting Docker daemon...');
    // Start dockerd in background using nohup for better process management
    const dockerStart = await sandbox.commands.run(
      'nohup sudo dockerd > /tmp/dockerd.log 2>&1 &',
      { timeoutMs: 5000 }
    );
    console.log(`   Docker daemon start command exit code: ${dockerStart.exitCode}`);

    // Wait for Docker daemon to initialize
    console.log('⏳ Waiting for Docker daemon to be ready (10 seconds)...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check if dockerd process is running
    const processCheck = await sandbox.commands.run('pgrep -f dockerd', {
      timeoutMs: 5000,
    });
    console.log(`   dockerd process check: ${processCheck.exitCode === 0 ? 'running' : 'not found'}`);

    // Try to verify Docker is accessible
    console.log('🔍 Verifying Docker daemon connection...');
    let retries = 3;
    let dockerReady = false;

    for (let i = 0; i < retries; i++) {
      const dockerCheck = await sandbox.commands.run('sudo docker ps', {
        timeoutMs: 5000,
      });

      if (dockerCheck.exitCode === 0) {
        dockerReady = true;
        console.log('✅ Docker daemon is ready and responding\n');
        break;
      } else {
        console.log(`   Attempt ${i + 1}/${retries} failed, waiting 5 seconds...`);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    if (!dockerReady) {
      console.error('❌ Docker daemon failed to start after multiple attempts');
      console.log('\n📋 Docker daemon logs:');
      const logs = await sandbox.commands.run('cat /tmp/dockerd.log', { timeoutMs: 5000 });
      console.log(logs.stdout || logs.stderr);
      throw new Error('Docker daemon not running');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 5: Pulling Docker MCP Image');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🐋 Pulling mcp/filesystem from Docker Hub...');
    const dockerPull = await sandbox.commands.run('sudo docker pull mcp/filesystem:latest', {
      timeoutMs: 180_000, // 3 minutes
      onStdout: (output) => {
        // Show Docker pull progress
        process.stdout.write(output);
      },
      onStderr: (output) => {
        process.stderr.write(output);
      },
    });

    if (dockerPull.exitCode !== 0) {
      console.error('❌ Failed to pull Docker image');
      console.error(dockerPull.stderr);
      throw new Error('Docker pull failed');
    }
    console.log('✅ Docker image pulled\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PHASE 6: Running Filesystem MCP Security Testing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 Executing Red Team + Blue Team + Verification...\n');

    // Create test directory in sandbox
    await sandbox.commands.run('mkdir -p /tmp/mcp-test && chmod 777 /tmp/mcp-test', {
      timeoutMs: 5000,
    });

    // Run the filesystem demo with real-time output streaming
    const result = await sandbox.commands.run('cd /app && npx tsx demos/filesystem/main.ts', {
      timeoutMs: 300_000, // 5 minutes for test execution
      onStdout: (output) => {
        process.stdout.write(output);
      },
      onStderr: (output) => {
        process.stderr.write(output);
      },
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('EXECUTION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Exit Code: ${result.exitCode}`);
    console.log(`Sandbox ID: ${sandbox.sandboxId}\n`);

    if (result.exitCode === 0) {
      console.log('✅ Filesystem MCP security testing completed successfully in E2B!\n');
      console.log('🎉 Fully meets hackathon requirements:');
      console.log('   ✓ E2B sandbox isolation');
      console.log('   ✓ Docker MCP hub (mcp/filesystem)');
      console.log('   ✓ AI-powered security testing\n');
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
    console.log('║          FILESYSTEM E2B EXECUTION COMPLETE               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
  }
}

// Run the application
runFilesystemInE2B().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
