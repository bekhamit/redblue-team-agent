# Red Team MCP Vulnerability Testing Agent

An automated red team testing system that uses AI to generate malicious inputs and test MCP (Model Context Protocol) servers for security vulnerabilities.

## Features

### 🎯 Red Team Testing (Main Feature)
- **Automated Vulnerability Discovery**: AI-powered test case generation using Groq
- **Intentionally Vulnerable MCP**: Echo server with no protections for testing
- **Comprehensive Test Harness**: Automated testing framework with pass/fail detection
- **Multi-Vector Attacks**: Tests for XSS, SQL injection, prompt injection, timeout attacks, and more
- **Detailed Reporting**: Full analysis with vulnerability breakdown by attack type

## Prerequisites

You'll need API keys from:
- [Groq](https://console.groq.com) - For LLM-powered test generation
- [E2B](https://e2b.dev) - For sandbox environment (optional for research mode)
- [Exa AI](https://exa.ai) - For web search (optional for research mode)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bekhamit/redblue-team-agent.git
   cd redblue-team-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd echo-mcp && npm install && cd ..
   ```

3. **Build the echo MCP server**
   ```bash
   cd echo-mcp && npm run build && cd ..
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   E2B_API_KEY=your_e2b_api_key_here  # Optional
   EXA_API_KEY=your_exa_api_key_here  # Optional
   ```

## Usage

### Red Team MCP Testing (Main)

Run the full red team vulnerability testing:

```bash
npm start
```

This will:
1. Generate 15 malicious test cases using Groq
2. Connect to the vulnerable echo MCP server
3. Execute all tests and detect vulnerabilities
4. Provide comprehensive security assessment

### Test Harness with Hardcoded Tests

Test the harness with predefined test cases:

```bash
npm run test:harness
```

### Test Echo MCP Server

Test the echo MCP server directly:

```bash
npm run test:echo
```

### Research Agent

Run the AI research agent (original functionality):

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

### Red Team Testing System

```
┌─────────────────┐
│   Groq LLM      │  Generate malicious test cases
│  (Red Team AI)  │
└────────┬────────┘
         │
         │ Test cases
         ▼
┌─────────────────┐
│  Test Harness   │  Execute tests & validate results
└────────┬────────┘
         │
         │ MCP calls
         ▼
┌─────────────────┐
│   Echo MCP      │  Vulnerable echo server
│  (INTENTIONAL)  │  • No input validation
│                 │  • No output sanitization
│                 │  • No timeout protection
└─────────────────┘
```

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
├── echo-mcp/              # Vulnerable MCP server for testing
│   ├── src/server.ts      # Intentionally vulnerable echo server
│   └── package.json
├── main.ts                # Main entry point for red team testing
├── red-team-agent.ts      # AI-powered test case generator
├── harness.ts             # Test execution harness
├── validators.ts          # Pass/fail detection logic
├── types.ts               # Shared TypeScript types
├── test-harness.ts        # Hardcoded test runner
├── test-echo-mcp.ts       # Echo MCP verification
└── index.ts               # Original research agent

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
