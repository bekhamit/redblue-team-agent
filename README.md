# AI-Powered MCP Security Wrapper

An AI-powered protective middleware that automatically learns from attacks and makes MCP servers safe to use. **Self-improving security through Red Team + Blue Team AI agents, running entirely in E2B sandbox.**

## Features

### 🛡️ Self-Improving Protective Wrapper
- **AI-Powered Middleware**: Sits between your app and any MCP server
- **Red Team Agent**: Generates creative attacks using Groq AI (XSS, SQL injection, prompt injection, etc.)
- **Blue Team Agent**: Analyzes vulnerabilities and auto-generates protection rules
- **Automatic Learning**: Wrapper improves itself based on attack patterns
- **Before/After Metrics**: Clear demonstration of security improvement
- **E2B Sandbox Execution**: Entire system runs in isolated cloud environment
- **Real-time Output Streaming**: Watch the AI learn and improve in real-time

### 🎯 What It Does
1. **Phase 1 - Red Team Attack**: Tests MCP through basic wrapper, finds vulnerabilities
2. **Phase 2 - Blue Team Defense**: AI generates protection rules from failures
3. **Phase 3 - Verification**: Re-tests with updated wrapper, all attacks blocked!

## Prerequisites

You'll need API keys from:
- [Groq](https://console.groq.com) - For LLM-powered test generation (required)
- [E2B](https://e2b.dev) - For sandbox environment (required)
- [Exa AI](https://exa.ai) - For web search (optional, only for research mode)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bekhamit/redblue-team-agent.git
   cd redblue-team-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key_here        # Required
   E2B_API_KEY=your_e2b_api_key_here          # Required
   EXA_API_KEY=your_exa_api_key_here          # Optional (for research mode)
   ```

**Note**: The echo MCP server is automatically built inside the E2B sandbox - no local build needed!

## Usage

### 🎯 Main Demos (Choose Your Path)

#### For Hackathon Judges - Full Cloud Demo:
```bash
npm run start:filesystem:e2b
```
**✅ Meets ALL hackathon requirements:**
- E2B sandbox isolation (full cloud execution)
- Docker MCP hub (`mcp/filesystem`)
- AI-powered security testing (Red Team + Blue Team)
- Before/after improvement metrics

#### For Quick Local Testing:
```bash
npm run start:filesystem    # Filesystem MCP locally (Docker required)
npm run start:echo          # Echo MCP locally (simple baseline)
```

### 📋 All Available Commands:

| Command | Description | Location | Requirements |
|---------|-------------|----------|--------------|
| `npm run start:filesystem:e2b` | 🏆 **Hackathon Demo** - Filesystem MCP in E2B | Cloud | E2B API key, Groq API key |
| `npm start` | Echo MCP in E2B sandbox | Cloud | E2B API key, Groq API key |
| `npm run start:filesystem` | Filesystem MCP locally | Local | Docker, Groq API key |
| `npm run start:echo` | Echo MCP locally | Local | Groq API key |

### 🚀 Recommended Flow:

1. **Development**: `npm run start:filesystem` (fast local testing)
2. **Demo**: `npm run start:filesystem:e2b` (full cloud hackathon submission)

---

## What Each Demo Does

### Filesystem MCP Demo (Docker Hub)
- Path traversal attacks (`../../etc/passwd`)
- Directory escape attempts
- Unauthorized file access (`.env`, `.ssh/`, `.git/`)
- Absolute path attacks (`/etc/shadow`)
- Encoded path traversal (`..%2F..%2F`)
- File overwrite attacks

**Requirements:**
- Docker installed and running
- Internet connection (to pull `mcp/filesystem` image)

**Benefits:**
- ✅ Uses official Docker MCP hub server
- ✅ Real-world filesystem security testing
- ✅ Path traversal and directory escape protection
- ✅ Shows wrapper works with any MCP, not just toy examples

### Other Commands

**Test Harness with Hardcoded Tests:**
```bash
npm run test:harness
```

**Test Echo MCP Server Directly:**
```bash
npm run test:echo
```

**Research Agent (Original Feature):**
```bash
npm run research
```

## Example Output

```
╔══════════════════════════════════════════════════════════╗
║   🎯 AI-POWERED MCP SECURITY: SELF-IMPROVING WRAPPER 🎯  ║
╚══════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: RED TEAM ATTACK (Initial Testing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 Red Team: Generating malicious test cases...
✅ Generated 15 test cases

🛡️  Protective wrapper connected to MCP
📋 Active rules: 2 validators, 2 sanitizers

🔴 Red Team: Attacking MCP through basic wrapper...

[1/15] Running: XSS via script tag
❌ FAIL: Injection detected: <script, </script>

[2/15] Running: SQL injection with DROP TABLE
❌ FAIL: Injection detected: DROP TABLE

... (7 vulnerabilities found)

============================================================
📊 INITIAL TEST SUMMARY
============================================================
Total Tests:  15
✅ Passed:    8 (53.3%)
❌ Failed:    7 (46.7%)
============================================================

⚠️  Found 7 vulnerabilities. Activating Blue Team...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: BLUE TEAM DEFENSE (Auto-Fix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 Blue Team Agent: Analyzing 7 vulnerabilities...
✅ Generated 6 validators and 8 sanitizers

🔵 Wrapper updated!
   New validators: 6
   New input sanitizers: 5
   New output sanitizers: 3
   Total rules: 8 validators, 10 sanitizers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: VERIFICATION (Re-Testing with Updated Wrapper)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 Red Team: Re-running same attacks against updated wrapper...

[1/15] Running: XSS via script tag
✅ PASS: 🛡️ Wrapper blocked: XSS attempt detected

[2/15] Running: SQL injection with DROP TABLE
✅ PASS: 🛡️ Wrapper blocked: SQL injection detected

... (all attacks now blocked!)

============================================================
📊 FINAL TEST SUMMARY
============================================================
Total Tests:  15
✅ Passed:    15 (100.0%)
❌ Failed:    0 (0.0%)
============================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEFORE vs AFTER: WRAPPER IMPROVEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    BEFORE      AFTER       IMPROVEMENT
Pass Rate:          53.3%   →   100.0%      +46.7%
Attacks Blocked:    8       →   15          +7
Failed Tests:       7       →   0           -7
Wrapper Rules:      4       →   18          +14 AI-generated

🛡️  RESULT: Wrapper successfully learned from attacks!
   Echo MCP is now safe to use through protective middleware.

╔══════════════════════════════════════════════════════════╗
║                   SECURITY ASSESSMENT                    ║
╚══════════════════════════════════════════════════════════╝

🛡️  EXCELLENT: Wrapper provides strong protection
   ✅ Pass rate improved by 46.7%

   Initial Pass Rate: 53.3%
   Final Pass Rate: 100.0%
   Vulnerabilities Fixed: 7 out of 7

✅ AI-powered security testing completed!
```

## Architecture

### Self-Improving Security Wrapper

```
┌─────────────────────────────────────────────────────┐
│ YOUR APPLICATION                                    │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ 🛡️ PROTECTIVE WRAPPER (Our Product)                │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Input Validation Rules (AI-Generated)       │   │
│ │ • Block XSS: <script>, onerror=, onclick=   │   │
│ │ • Block SQL: DROP TABLE, UNION SELECT       │   │
│ │ • Block Path Traversal: ../                 │   │
│ │ • Block Command Injection: ;, |, eval(      │   │
│ │ • Timeout Protection: 5s limit              │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ 🤖 Updated by Blue Team Agent                      │
└───────────────────┬─────────────────────────────────┘
                    │ STDIO (protected calls)
                    ▼
┌─────────────────────────────────────────────────────┐
│ ECHO MCP SERVER (Unsafe, Unmodified)               │
│ • No validation                                     │
│ • No sanitization                                   │
│ • No timeout protection                             │
│ • BUT SAFE TO USE via wrapper!                      │
└─────────────────────────────────────────────────────┘
```

### E2B Cloud Execution

```
LOCAL MACHINE → E2B SANDBOX (Cloud)
                  ├─ Red Team Agent (Groq AI)
                  ├─ Blue Team Agent (Groq AI)
                  ├─ Protective Wrapper
                  └─ Echo MCP Server
```

**Key Points:**
- 🛡️ Wrapper sits between app and MCP (middleware pattern)
- 🤖 AI learns from attacks and updates protection rules
- 🔒 Works with any MCP without modifying its code
- 🚀 True cloud isolation in E2B sandbox

### Validation Rules

Tests **FAIL** if:
1. **Timeout**: Execution time > 5 seconds
2. **Schema violation**: Invalid response format
3. **Injection detected**: Response contains dangerous markers:
   - XSS: `<script>`, `onerror=`, `javascript:`
   - SQL: `DROP TABLE`, `UNION SELECT`
   - Template: `{{`, `}}`
   - Path traversal: `../`, `/etc/passwd`
   - Command injection: `;`, `|`, `eval(`

Tests **PASS** if:
- Fast execution (< 5s)
- Valid schema
- No injection markers OR safe refusal detected

## Project Structure

```
redblue-agent/
├── demos/
│   ├── echo/
│   │   ├── main.ts                 # Echo MCP demo entry point
│   │   └── harness-echo.ts         # Echo-specific test harness
│   └── filesystem/
│       ├── main.ts                 # Filesystem MCP demo entry point
│       └── harness-filesystem.ts   # Filesystem-specific test harness
├── shared/
│   ├── agents/
│   │   ├── red-team-agent.ts       # AI-powered attack generator
│   │   └── blue-team-agent.ts      # AI-powered defense generator
│   ├── protective-wrapper.ts       # Self-improving security middleware
│   ├── validators.ts               # Pass/fail detection logic
│   └── types.ts                    # Shared TypeScript types
├── echo-mcp/                       # Vulnerable echo MCP server
│   ├── src/server.ts               # Intentionally vulnerable echo server
│   └── package.json
├── run-in-e2b.ts                   # E2B sandbox orchestrator
└── package.json
```

## Customization

### Adjust Number of Test Cases

Edit `main.ts`:

```typescript
const testCases: TestCase[] = await redTeamAgent.generateTestCases(20); // Generate 20 instead of 15
```

### Modify Validation Rules

Edit `validators.ts` to adjust:
- Timeout threshold (default: 5000ms)
- Injection markers to detect
- Safe refusal keywords

### Add Custom Attack Types

Edit `types.ts` to add new attack types:

```typescript
attackType: 'prompt_injection' | 'xss' | 'timeout' | 'schema_break' | 'normal' | 'your_new_type';
```

## Future Enhancements (Not in MVP)

- **Blue Team Agent**: Automatically fix vulnerabilities based on test results
- **E2B Sandbox Integration**: Run tests in isolated E2B environment
- **Custom MCP Testing**: Test any MCP server, not just echo server
- **Persistent Results**: Save test results to database for tracking
- **CI/CD Integration**: Automated security testing in pipelines

## Tech Stack

- **TypeScript**: Type-safe development
- **Groq**: Fast LLM inference (llama-3.3-70b-versatile)
- **MCP SDK**: Model Context Protocol client/server
- **OpenAI SDK**: Compatible API for Groq
- **Node.js**: Runtime environment

## Security Notice

⚠️ **WARNING**: The echo MCP server (`echo-mcp/`) is **intentionally vulnerable** for testing purposes. It has NO security protections:
- No input validation
- No output sanitization
- No timeout protection
- No injection detection
- No rate limiting

**DO NOT** use the echo MCP server in production or with untrusted inputs outside of controlled testing environments.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
