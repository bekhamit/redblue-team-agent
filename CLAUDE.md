# Red Team MCP Testing Agent - Complete Documentation

## Project Overview

An automated security testing system that uses AI to generate malicious inputs and test MCP (Model Context Protocol) servers for vulnerabilities. Built as a one-day hackathon MVP.

---

## Architecture & Execution Environment

### Where Everything Runs

**ALL components run locally on your machine (NOT in E2B sandbox for MVP):**

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL MACHINE                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ main.ts (Orchestrator)                             │    │
│  │ - Coordinates all components                       │    │
│  │ - Runs in Node.js process                          │    │
│  └──┬────────────────────────────────────────────┬────┘    │
│     │                                             │         │
│     ▼                                             ▼         │
│  ┌──────────────────────┐          ┌─────────────────────┐ │
│  │ Red Team Agent       │          │ Test Harness        │ │
│  │ (red-team-agent.ts)  │          │ (harness.ts)        │ │
│  │                      │          │                     │ │
│  │ - Calls Groq API ────┼──────────┼─► Groq Cloud       │ │
│  │   (over internet)    │          │                     │ │
│  │ - Generates tests    │          │ - Spawns MCP client │ │
│  │ - Returns JSON       │          │ - Runs validators   │ │
│  └──────────────────────┘          └──────┬──────────────┘ │
│                                            │                │
│                                            │ STDIO          │
│                                            │ (stdin/stdout) │
│                                            ▼                │
│                            ┌───────────────────────────┐   │
│                            │ Echo MCP Server           │   │
│                            │ (echo-mcp/dist/server.js) │   │
│                            │                           │   │
│                            │ - Separate Node process   │   │
│                            │ - Listens on STDIO        │   │
│                            │ - Echoes back inputs      │   │
│                            │ - INTENTIONALLY VULNERABLE│   │
│                            └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Why No E2B Sandbox in MVP?

For simplicity and speed in the hackathon, we run everything locally:
- ✅ Faster development iteration
- ✅ No sandbox setup overhead
- ✅ Easier debugging
- ✅ No additional costs

**Future Enhancement**: The echo MCP server could be deployed to E2B sandbox for true isolation, but it's not required for the MVP.

---

## How It Works: Step-by-Step Flow

### 1️⃣ Startup (`npm start` runs `main.ts`)

```typescript
// main.ts orchestrates everything

const redTeamAgent = new RedTeamAgent()  // Creates Groq client
const harness = new MCPTestHarness()     // Creates MCP test runner
```

### 2️⃣ Test Generation (Red Team Agent)

```
main.ts calls:
  ↓
redTeamAgent.generateTestCases(15)
  ↓
Creates chat completion with Groq API:
  - System prompt: "You are a red team security researcher..."
  - User prompt: "Generate 15 malicious test cases..."
  - Temperature: 0.9 (high creativity)
  ↓
Groq responds with JSON array of test cases
  ↓
Fallback to hardcoded tests if JSON parsing fails
  ↓
Returns: TestCase[] (15 malicious inputs)
```

**Example Generated Test Case:**
```typescript
{
  id: "test-1",
  name: "XSS via script tag",
  description: "Tests if XSS payloads are sanitized",
  input: { message: "<script>alert('XSS')</script>" },
  expectedOutcome: "fail",
  attackType: "xss"
}
```

### 3️⃣ MCP Server Connection (Test Harness)

```
harness.connect()
  ↓
Creates MCP Client:
  - Name: "red-team-harness"
  - Version: "1.0.0"
  ↓
Creates STDIO Transport:
  - Command: "node"
  - Args: ["./echo-mcp/dist/server.js"]
  ↓
Spawns child process running echo MCP server
  ↓
Connects via stdin/stdout (STDIO protocol)
  ↓
Echo MCP server starts listening
```

**What is STDIO Transport?**
- Communication method for MCP servers
- Server reads from stdin, writes to stdout
- Client sends JSON-RPC messages over stdin
- Server responds with JSON-RPC over stdout
- No HTTP, no network sockets - just process I/O

### 4️⃣ Test Execution (For Each Test Case)

```
harness.runTests(testCases)
  ↓
For each test case:
  ↓
1. Record start time
  ↓
2. Call MCP tool via client:
   client.callTool({
     name: "echo",
     arguments: { message: "<script>alert('XSS')</script>" }
   })
  ↓
3. Message flows:
   Client → [STDIO] → Echo MCP Server

   Server receives:
   {
     "jsonrpc": "2.0",
     "method": "tools/call",
     "params": {
       "name": "echo",
       "arguments": { "message": "<script>alert('XSS')</script>" }
     }
   }

   Server processes (NO VALIDATION - intentional):
   - Accepts any input
   - Echoes back: { result: "Echo: <script>...", ... }

   Server responds:
   {
     "jsonrpc": "2.0",
     "result": {
       "content": [
         {
           "type": "text",
           "text": "{\"result\":\"Echo: <script>alert('XSS')</script>\",...}"
         }
       ]
     }
   }

   Echo MCP Server → [STDIO] → Client
  ↓
4. Record end time (executionTime = end - start)
  ↓
5. Validate response with validators.ts
```

### 5️⃣ Validation (Pass/Fail Detection)

```
validateTestResult(testCase, response, executionTime)
  ↓
Check 1: Timeout?
  if (executionTime > 5000ms) → FAIL
  ↓
Check 2: Schema Valid?
  - Parse JSON from response.content[0].text
  - Verify fields: result, originalInput, timestamp
  - Missing fields? → FAIL
  ↓
Check 3: Injection Detected?
  - Search response for dangerous markers:
    * <script>, </script>, onerror=, onclick=
    * DROP TABLE, UNION SELECT, '; DROP
    * {{, }}, eval(, __import__
    * ../, /etc/passwd
  - Found markers? → FAIL
  ↓
Check 4: Safe Refusal?
  - Search for keywords: "cannot", "refuse", "unsafe"
  - If injection + refusal → PASS (safely refused)
  - If injection + no refusal → FAIL (vulnerability)
  ↓
All checks pass → PASS
```

**Example Validation Flow:**

Test: `<script>alert('XSS')</script>`

1. ✅ Timeout: 2ms (< 5000ms)
2. ✅ Schema: Valid JSON with all fields
3. ❌ Injection: Found `<script>` and `</script>` markers
4. ❌ Refusal: No refusal keywords found

**Result: FAIL** - "Injection detected: Response contains dangerous markers: <script>, </script>"

### 6️⃣ Reporting

```
harness.printSummary(summary)
  ↓
Aggregates results:
  - Total tests: 15
  - Passed: 8 (53.3%)
  - Failed: 7 (46.7%)
  ↓
Groups by attack type:
  - xss: 0/2 passed (0.0%)
  - prompt_injection: 4/5 passed (80.0%)
  - timeout: 0/1 passed (0.0%)
  ↓
Generates security assessment:
  - Pass rate < 50% → "CRITICAL"
  - Pass rate 50-70% → "WARNING"
  - Pass rate 70-90% → "GOOD"
  - Pass rate > 90% → "EXCELLENT"
  ↓
Displays detailed failure list with reasons
```

---

## Component Details

### Echo MCP Server (`echo-mcp/src/server.ts`)

**Purpose**: Intentionally vulnerable MCP server for testing

**Vulnerabilities (BY DESIGN):**
```typescript
// 1. NO TIMEOUT PROTECTION
if (delay > 0) {
  await new Promise((resolve) => setTimeout(resolve, delay))
  // Can wait forever if delay is huge!
}

// 2. NO INPUT VALIDATION
const message = (args as any).message
// Accepts ANYTHING - no checks!

// 3. NO OUTPUT SANITIZATION
const response = {
  result: `Echo: ${message}`,  // Raw injection of user input
  originalInput: message,
  timestamp: new Date().toISOString(),
}

// 4. NO INJECTION PROTECTION
// Returns dangerous content unchanged
```

**How It Starts:**
```bash
node ./echo-mcp/dist/server.js
```

**What It Does:**
1. Creates MCP Server instance
2. Registers `ListToolsRequestSchema` handler → Returns tool list
3. Registers `CallToolRequestSchema` handler → Executes echo
4. Connects to STDIO transport
5. Waits for JSON-RPC messages on stdin
6. Responds with results on stdout

### Red Team Agent (`red-team-agent.ts`)

**Purpose**: Generate diverse malicious test cases using AI

**How It Generates Tests:**
```typescript
// Prompt engineering is key!
const prompt = `
You are a red team security researcher...

Generate ${numTests} diverse test cases covering:
- Prompt injection (system override, jailbreaks)
- XSS injection (script tags, event handlers)
- SQL injection (DROP TABLE, UNION SELECT)
- Template injection ({{7*7}}, \${7*7})
- Path traversal (../../../etc/passwd)
- Command injection (; ls, | cat)
- Timeout attacks (very long delays)

Return ONLY valid JSON...
`
```

**Fallback Mechanism:**
```typescript
try {
  // Parse LLM response
  const testCases = JSON.parse(jsonString)
  return testCases
} catch (error) {
  // If LLM fails, use hardcoded tests
  console.error('⚠️  Falling back to hardcoded test cases...')
  return this.getFallbackTestCases(numTests)
}
```

**Why Fallback?**
- LLMs sometimes generate invalid JSON
- Include JavaScript code like `.repeat(10000)`
- Safety net ensures tests always run

### Test Harness (`harness.ts`)

**Purpose**: Execute tests and collect results

**Key Methods:**

```typescript
class MCPTestHarness {
  async connect()
    // Spawn echo MCP server process
    // Create MCP client with STDIO transport
    // Establish connection

  async runTest(testCase: TestCase)
    // Start timer
    // Call MCP tool with test input
    // Stop timer
    // Validate response
    // Return TestResult

  async runTests(testCases: TestCase[])
    // Loop through all test cases
    // Run each test sequentially
    // Aggregate results
    // Return TestSummary

  printSummary(summary: TestSummary)
    // Display pass/fail counts
    // List failed tests
    // Group by attack type
    // Show statistics
}
```

**Why Sequential Not Parallel?**
- STDIO transport uses single process
- Can't run multiple tests simultaneously on same MCP instance
- Sequential execution is simpler and clearer for MVP

### Validators (`validators.ts`)

**Purpose**: Determine if test passed or failed

**Detection Functions:**

```typescript
checkTimeout(executionTime)
  // executionTime > 5000ms → FAIL

checkSchema(response)
  // Parse JSON
  // Verify required fields
  // Missing/invalid → FAIL

checkInjection(response)
  // Search for dangerous markers
  // Found markers → FAIL

checkSafeRefusal(response)
  // Search for refusal keywords
  // Found refusal → PASS

validateTestResult(testCase, response, executionTime)
  // Run all checks
  // Combine results
  // Return final verdict
```

**Injection Markers:**
```typescript
const INJECTION_MARKERS = [
  '<script', '</script>', 'javascript:', 'onerror=', 'onclick=',
  "'; DROP", 'DROP TABLE', '{{', '}}', 'eval(', 'exec(',
  '__import__', 'os.system', '/etc/passwd', '../',
  'UNION SELECT',
]
```

---

## Data Flow Diagram

```
┌──────────┐
│  User    │
│ runs     │
│ npm start│
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ main.ts                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Step 1: Generate Test Cases         │ │
│ │                                     │ │
│ │ redTeamAgent.generateTestCases(15) │ │
│ │         ↓                           │ │
│ │   Groq API Call                     │ │
│ │         ↓                           │ │
│ │   Returns: TestCase[]               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Step 2: Connect to MCP              │ │
│ │                                     │ │
│ │ harness.connect()                   │ │
│ │         ↓                           │ │
│ │   Spawns: node echo-mcp/server.js   │ │
│ │         ↓                           │ │
│ │   STDIO connection established      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Step 3: Run Tests                   │ │
│ │                                     │ │
│ │ harness.runTests(testCases)         │ │
│ │         ↓                           │ │
│ │   For each test:                    │ │
│ │     1. Call MCP tool                │ │
│ │     2. Measure time                 │ │
│ │     3. Validate response            │ │
│ │     4. Record result                │ │
│ │         ↓                           │ │
│ │   Returns: TestSummary              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Step 4: Display Results             │ │
│ │                                     │ │
│ │ harness.printSummary(summary)       │ │
│ │         ↓                           │ │
│ │   Console output with stats         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ harness.disconnect()                    │
│         ↓                               │
│   Closes MCP client                     │
│   Kills echo server process             │
└─────────────────────────────────────────┘
```

---

## Message Format Examples

### MCP Tool Call (Client → Server)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "message": "<script>alert('XSS')</script>",
      "delay": 0
    }
  }
}
```

### MCP Tool Response (Server → Client)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"result\":\"Echo: <script>alert('XSS')</script>\",\"originalInput\":\"<script>alert('XSS')</script>\",\"timestamp\":\"2025-11-22T22:28:57.701Z\"}"
      }
    ]
  }
}
```

### Test Result Object

```typescript
{
  testCase: {
    id: "test-1",
    name: "XSS via script tag",
    description: "Tests if XSS payloads are sanitized",
    input: { message: "<script>alert('XSS')</script>" },
    expectedOutcome: "fail",
    attackType: "xss"
  },
  status: "fail",
  reason: "Injection detected: Response contains dangerous markers: <script>, </script>",
  actualOutput: { /* MCP response */ },
  executionTime: 2
}
```

---

## Testing Strategy

### Attack Vectors Covered

1. **XSS (Cross-Site Scripting)**
   - `<script>` tags
   - Event handlers (`onerror`, `onclick`)
   - JavaScript protocols (`javascript:`)

2. **SQL Injection**
   - `DROP TABLE`
   - `UNION SELECT`
   - Comment injection (`--`, `/*`)

3. **Prompt Injection**
   - System override attempts
   - Instruction manipulation
   - Jailbreak attempts

4. **Template Injection**
   - `{{expression}}`
   - `${expression}`

5. **Path Traversal**
   - `../` sequences
   - `/etc/passwd` access

6. **Command Injection**
   - Shell operators (`;`, `|`, `&`)
   - Command chaining

7. **Timeout/DoS**
   - Long delays
   - Resource exhaustion

8. **Normal Input**
   - Safe baseline test

### Pass/Fail Criteria

| Check | Condition | Result |
|-------|-----------|--------|
| Timeout | Execution > 5s | FAIL |
| Schema | Missing/invalid fields | FAIL |
| Injection | Dangerous markers present | FAIL |
| Safe Refusal | Injection + refusal detected | PASS |
| All Clear | No issues found | PASS |

---

## Future Enhancements

### 1. E2B Sandbox Integration

**Goal**: Run echo MCP server in isolated E2B sandbox

**Changes needed:**
```typescript
// In harness.ts
const sandbox = await Sandbox.create({
  mcp: {
    'github/your-org/echo-mcp': {
      installCmd: 'npm install',
      runCmd: 'npm run build && node dist/server.js',
    },
  },
})

// Use HTTP transport instead of STDIO
const transport = new StreamableHTTPClientTransport(
  new URL(sandbox.getMcpUrl()),
  {
    requestInit: {
      headers: {
        'Authorization': `Bearer ${await sandbox.getMcpToken()}`,
      },
    },
  }
)
```

### 2. Blue Team Agent

**Goal**: Automatically fix vulnerabilities

**Workflow:**
```
Red Team finds vulnerabilities
  ↓
Blue Team Agent (LLM) analyzes failures
  ↓
Generates protective wrapper code:
  - Input validation
  - Output sanitization
  - Timeout guards
  ↓
Re-run tests to verify fixes
  ↓
Iterate until pass rate > 90%
```

### 3. Custom MCP Testing

**Goal**: Test any MCP server, not just echo

**Changes:**
- Make MCP server configurable
- Allow custom tool selection
- Adapt validators to different response formats

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Install all dependencies
npm install
cd echo-mcp && npm install && cd ..
```

### "Sandbox.create is not a function"
- Not using E2B in MVP, but if you are:
```typescript
import { Sandbox } from 'e2b'  // Named import, not default
```

### Echo MCP not responding
```bash
# Rebuild echo MCP
cd echo-mcp
npm run build
cd ..
```

### Groq API errors
```bash
# Check .env has valid key
cat .env | grep GROQ_API_KEY

# Test Groq connection
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

### Tests timing out
- Echo MCP may have crashed
- Restart by killing Node processes:
```bash
pkill -f "echo-mcp"
npm start  # Restart
```

---

## Performance Notes

- **Test Generation**: ~2-5 seconds (Groq API call)
- **Per Test Execution**: ~0-3ms (local STDIO)
- **Timeout Tests**: Up to 60 seconds (intentional delay)
- **Total Runtime**: ~15-90 seconds for 15 tests

---

## Summary

**What runs in E2B sandbox?**
- **Nothing in MVP!** Everything runs locally.

**What runs locally?**
- ✅ main.ts (orchestrator)
- ✅ red-team-agent.ts (calls Groq API)
- ✅ harness.ts (test runner)
- ✅ validators.ts (pass/fail logic)
- ✅ echo-mcp server (separate Node process)

**How do they communicate?**
- main.ts → red-team-agent: Direct function calls
- main.ts → harness: Direct function calls
- harness → echo-mcp: STDIO transport (stdin/stdout)
- red-team-agent → Groq: HTTPS API calls

**Why this architecture?**
- 🚀 Fast development for hackathon
- 🐛 Easy debugging on local machine
- 💰 No E2B costs
- 📦 Simple to run: `npm start`

**Future: E2B integration for true isolation and cloud deployment**
