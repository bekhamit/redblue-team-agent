// index.ts
import 'dotenv/config'
import { Sandbox } from 'e2b'
import { OpenAI } from 'openai'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

async function runGroqExaExample() {
  console.log('Creating E2B sandbox with Exa MCP server...')

  // Create E2B sandbox with Exa MCP server
  const sandbox = await Sandbox.create({
    mcp: {
      exa: {
        apiKey: process.env.EXA_API_KEY!,
      },
    },
    timeoutMs: 600_000, // 10 minutes
  })

  console.log('Sandbox created successfully')
  console.log(`MCP URL: ${sandbox.getMcpUrl()}`)

  // Connect to MCP server to get available tools
  const mcpClient = new Client({
    name: 'groq-exa-client',
    version: '1.0.0',
  })

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

  await mcpClient.connect(transport)
  console.log('Connected to MCP server')

  // Get available MCP tools
  const toolsList = await mcpClient.listTools()
  console.log('Available Exa tools:', toolsList.tools.map(t => t.name).join(', '))

  // Convert MCP tools to OpenAI function format
  const openaiTools = toolsList.tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description || '',
      parameters: tool.inputSchema || {
        type: 'object',
        properties: {},
      },
    },
  }))

  // Create Groq client (using OpenAI SDK with Groq base URL)
  const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })

  console.log('\nStarting AI research with Groq and Exa...\n')

  const researchPrompt = 'What happened last week in AI? Use the available search tools to find recent AI developments and provide a comprehensive summary with specific examples and details.'

  // Initial message
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: researchPrompt,
    },
  ]

  // Agentic loop for tool calling
  let continueLoop = true
  let iterationCount = 0
  const maxIterations = 5

  while (continueLoop && iterationCount < maxIterations) {
    iterationCount++
    console.log(`\n--- Iteration ${iterationCount} ---`)

    const response = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      tools: openaiTools,
      tool_choice: iterationCount === 1 ? 'required' : 'auto', // Force tool use on first iteration
    })

    const assistantMessage = response.choices[0].message

    // Add assistant's response to messages
    messages.push(assistantMessage)

    // Check if there are tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`\nAssistant is calling ${assistantMessage.tool_calls.length} tool(s)...`)

      // Execute each tool call via MCP
      for (const toolCall of assistantMessage.tool_calls) {
        console.log(`\nCalling tool: ${toolCall.function.name}`)
        const args = JSON.parse(toolCall.function.arguments)
        console.log('Arguments:', JSON.stringify(args, null, 2))

        try {
          // Call the MCP tool
          const toolResult = await mcpClient.callTool({
            name: toolCall.function.name,
            arguments: args,
          })

          // Extract text content from MCP response
          let resultText = ''
          if (Array.isArray(toolResult.content)) {
            resultText = toolResult.content
              .map(item => item.type === 'text' ? item.text : '')
              .join('\n')
          } else {
            resultText = JSON.stringify(toolResult.content)
          }

          console.log(`Tool result (${resultText.length} chars): ${resultText.substring(0, 200)}...`)

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: resultText,
          })
        } catch (error) {
          console.error(`Error calling tool ${toolCall.function.name}:`, error)
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
        }
      }
    } else {
      // No more tool calls, we have the final response
      continueLoop = false
      console.log('\n=== Research Results ===\n')
      console.log(assistantMessage.content)
    }
  }

  if (iterationCount >= maxIterations) {
    console.log('\n⚠️  Reached maximum iterations')
  }

  // Cleanup
  console.log('\nCleaning up...')
  await mcpClient.close()
  await sandbox.kill()
  console.log('Sandbox closed successfully')
}

// Run the Groq Exa example
runGroqExaExample().catch((error) => {
  console.error('Failed to run Groq Exa example:', error)
  process.exit(1)
})
