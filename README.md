# Red Team MCP Vulnerability Testing Agent

An automated red team testing system that uses AI to generate malicious inputs and test MCP (Model Context Protocol) servers for security vulnerabilities. **Runs entirely in E2B sandbox for true cloud isolation.**

## Features

### 🎯 Red Team Testing (Main Feature)
- **E2B Sandbox Execution**: Entire application runs in isolated cloud sandbox
- **Automated Vulnerability Discovery**: AI-powered test case generation using Groq
- **Intentionally Vulnerable MCP**: Echo server with no protections for testing
- **Comprehensive Test Harness**: Automated testing framework with pass/fail detection
- **Multi-Vector Attacks**: Tests for XSS, SQL injection, prompt injection, timeout attacks, and more
- **Detailed Reporting**: Full analysis with vulnerability breakdown by attack type
- **Real-time Output Streaming**: See test results as they happen in the cloud

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

### 🚀 Red Team MCP Testing in E2B Sandbox (Main)

Run the full red team vulnerability testing in E2B cloud sandbox:

```bash
npm start
```

This will:
1. **Create E2B sandbox** in the cloud
2. **Upload all source files** to the sandbox
3. **Install dependencies** inside the sandbox
4. **Build echo MCP server** inside the sandbox
5. **Generate 15 malicious test cases** using Groq
6. **Execute all tests** against the vulnerable MCP
7. **Stream results** in real-time from the cloud
8. **Provide comprehensive security assessment**
9. **Clean up sandbox** automatically

**Benefits of E2B Mode:**
- ✅ True cloud isolation
- ✅ No local MCP process needed
- ✅ Fits hackathon theme
- ✅ Scalable for testing multiple MCPs

### 💻 Local Mode (Alternative)

For faster iteration during development:

```bash
npm run start:local
```

Runs everything locally without E2B sandbox (requires manual echo-mcp build).

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
║         🎯 RED TEAM MCP VULNERABILITY TESTING 🎯         ║
╚══════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Generating Malicious Test Cases
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Red Team Agent: Generating 15 malicious test cases...
✅ Generated 15 test cases

📝 Generated test cases by attack type:
   - xss: 2 test(s)
   - prompt_injection: 5 test(s)
   - schema_break: 6 test(s)
   - timeout: 1 test(s)
   - normal: 1 test(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: Connecting to Vulnerable MCP Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Connecting to MCP server...
✅ Connected to MCP server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: Executing Tests Against MCP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 Running 15 test cases...

[1/15] Running: XSS via script tag
❌ FAIL: Injection detected: <script, </script>
   Execution time: 2ms

[2/15] Running: Long string buffer
✅ PASS: All validation checks passed
   Execution time: 0ms

...

============================================================
📊 TEST SUMMARY
============================================================
Total Tests:  15
✅ Passed:    8 (53.3%)
❌ Failed:    7 (46.7%)
============================================================

🔍 FAILED TESTS:

1. XSS via script tag
   Type: xss
   Reason: Injection detected
   Time: 2ms

...

📈 RESULTS BY ATTACK TYPE:
  xss: 0/2 passed (0.0%)
  prompt_injection: 4/5 passed (80.0%)
  schema_break: 3/6 passed (50.0%)
  timeout: 0/1 passed (0.0%)
  normal: 1/1 passed (100.0%)

╔══════════════════════════════════════════════════════════╗
║                   SECURITY ASSESSMENT                    ║
╚══════════════════════════════════════════════════════════╝

⚠️  WARNING: MCP server has significant vulnerabilities

   Pass Rate: 53.3%
   Vulnerabilities Found: 7 out of 15 tests

💡 RECOMMENDATION: Implement input validation, output sanitization,
   timeout protection, and injection detection before production use.

✅ Red team testing completed!
```

## Architecture

### E2B Cloud Execution Model

```
┌──────────────────────────────────────────────────────┐
│ LOCAL MACHINE                                        │
│                                                      │
│  run-in-e2b.ts (Orchestrator)                       │
│    │                                                 │
│    ├─ Creates E2B Sandbox                           │
│    ├─ Uploads source files                          │
│    ├─ Installs dependencies                         │
│    └─ Executes application                          │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │ HTTPS
          ▼
┌──────────────────────────────────────────────────────┐
│ E2B SANDBOX (Cloud)                                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ main.ts (Red Team Pipeline)                   │ │
│  │                                                │ │
│  │  ┌──────────────────┐                         │ │
│  │  │  Groq LLM        │ Generate test cases     │ │
│  │  │  (via API)       │                         │ │
│  │  └────────┬─────────┘                         │ │
│  │           │                                    │ │
│  │           ▼                                    │ │
│  │  ┌──────────────────┐                         │ │
│  │  │  Test Harness    │ Execute & validate      │ │
│  │  └────────┬─────────┘                         │ │
│  │           │ STDIO                              │ │
│  │           ▼                                    │ │
│  │  ┌──────────────────┐                         │ │
│  │  │  Echo MCP Server │ Vulnerable (intentional)│ │
│  │  │  • No validation │                         │ │
│  │  │  • No sanitize   │                         │ │
│  │  │  • No timeout    │                         │ │
│  │  └──────────────────┘                         │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Results streamed back to local machine via HTTPS   │
└──────────────────────────────────────────────────────┘
```

**Key Points:**
- 🌐 Everything runs in E2B cloud sandbox
- 📤 Local machine just uploads code and streams output
- 🔒 True isolation - no local MCP processes
- 🚀 Scalable for testing multiple MCPs in parallel

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
├── run-in-e2b.ts          # E2B orchestrator (main entry point)
├── main.ts                # Red team testing pipeline (runs in E2B)
├── red-team-agent.ts      # AI-powered test case generator
├── harness.ts             # Test execution harness
├── validators.ts          # Pass/fail detection logic
├── types.ts               # Shared TypeScript types
├── echo-mcp/              # Vulnerable MCP server for testing
│   ├── src/server.ts      # Intentionally vulnerable echo server
│   └── package.json
├── test-harness.ts        # Hardcoded test runner (local only)
├── test-echo-mcp.ts       # Echo MCP verification (local only)
└── index.ts               # Original research agent (separate feature)
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
