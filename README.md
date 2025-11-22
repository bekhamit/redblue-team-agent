# redblue-team-agent

An AI-powered research agent that combines Groq's LLM with Exa AI web search through E2B's Model Context Protocol (MCP) server.

## Features

- **Groq Integration**: Uses Groq's llama-3.3-70b-versatile model for intelligent reasoning
- **Exa AI Search**: Real-time web search capabilities via MCP
- **E2B Sandbox**: Secure, isolated environment for tool execution
- **Agentic Loop**: Autonomous decision-making for when to search and synthesize information

## Prerequisites

You'll need API keys from:
- [E2B](https://e2b.dev) - For sandbox environment
- [Groq](https://console.groq.com) - For LLM access
- [Exa AI](https://exa.ai) - For web search capabilities

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
   E2B_API_KEY=your_e2b_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   EXA_API_KEY=your_exa_api_key_here
   ```

## Usage

Run the research agent:

```bash
npm start
```

Or with tsx:

```bash
npx tsx ./index.ts
```

## How It Works

1. **Sandbox Creation**: Creates an E2B sandbox with Exa MCP server
2. **MCP Connection**: Connects to the MCP server to access Exa tools
3. **Tool Conversion**: Converts MCP tools to OpenAI function calling format
4. **Agentic Loop**:
   - Groq analyzes the research question
   - Decides when to use search tools
   - Executes searches via MCP
   - Synthesizes results into comprehensive answers

## Example Output

```
Creating E2B sandbox with Exa MCP server...
Sandbox created successfully
Connected to MCP server
Available Exa tools: exa-web_search_exa

Starting AI research with Groq and Exa...

--- Iteration 1 ---
Assistant is calling 1 tool(s)...
Calling tool: exa-web_search_exa

--- Iteration 2 ---
=== Research Results ===

Recent developments in AI include the release of GPT-5.1 by OpenAI...
[comprehensive summary with specific examples and details]
```

## Architecture

```
┌─────────────────┐
│   Groq LLM      │  Intelligent reasoning & decision making
└────────┬────────┘
         │
         │ Function calling
         ▼
┌─────────────────┐
│  E2B Sandbox    │  Secure execution environment
│   with MCP      │
└────────┬────────┘
         │
         │ MCP Protocol
         ▼
┌─────────────────┐
│   Exa AI        │  Web search & content extraction
└─────────────────┘
```

## Customization

Modify the research prompt in `index.ts`:

```typescript
const researchPrompt = 'Your custom research question here'
```

## Tech Stack

- **TypeScript**: Type-safe development
- **E2B**: Sandbox environment for secure code execution
- **Groq**: Fast LLM inference
- **Exa AI**: Semantic web search
- **MCP SDK**: Model Context Protocol client
- **OpenAI SDK**: Compatible with Groq API

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
