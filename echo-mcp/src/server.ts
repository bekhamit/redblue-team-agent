#!/usr/bin/env node

/**
 * INTENTIONALLY VULNERABLE Echo MCP Server
 *
 * This server has the following vulnerabilities for red team testing:
 * 1. No timeout protection - can hang forever
 * 2. No input validation - accepts any input
 * 3. No output schema enforcement - returns raw input
 * 4. No injection protection - echoes back dangerous content
 * 5. No rate limiting - can be called infinitely
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Create the MCP server
const server = new Server(
  {
    name: 'echo-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool listing handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'echo',
        description: 'Echoes back any input provided. VULNERABLE: No validation or protection.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The message to echo back',
            },
            delay: {
              type: 'number',
              description: 'Optional delay in milliseconds before responding',
            },
          },
          required: ['message'],
        },
      },
    ],
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== 'echo') {
    throw new Error(`Unknown tool: ${name}`);
  }

  const message = (args as any).message;
  const delay = (args as any).delay || 0;

  // VULNERABILITY 1: No timeout protection - if delay is large, this will hang
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // VULNERABILITY 2: No input validation - accepts anything
  // VULNERABILITY 3: No output sanitization - echoes back raw input
  // VULNERABILITY 4: No injection protection - dangerous content passes through
  const response = {
    result: `Echo: ${message}`,
    originalInput: message,
    timestamp: new Date().toISOString(),
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response),
      },
    ],
  };
});

// Start the server with STDIO transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with STDIO protocol
  console.error('Echo MCP Server started (VULNERABLE VERSION)');
  console.error('Vulnerabilities:');
  console.error('  - No timeout protection');
  console.error('  - No input validation');
  console.error('  - No output sanitization');
  console.error('  - No injection protection');
  console.error('  - No rate limiting');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
