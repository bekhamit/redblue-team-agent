// protective-wrapper.ts - AI-powered protective middleware for MCP servers

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface ValidationResult {
  safe: boolean;
  reason?: string;
}

export interface ProtectionRules {
  timeoutMs: number;
  inputValidators: Array<(input: any) => ValidationResult>;
  inputSanitizers: Array<(input: any) => any>;
  outputSanitizers: Array<(output: any) => any>;
}

export class ProtectiveMCPWrapper {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private protectionRules: ProtectionRules;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client(
      {
        name: 'protective-wrapper-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Initialize with basic default rules
    this.protectionRules = this.getDefaultRules();
  }

  /**
   * Default protection rules (basic, intentionally minimal)
   * Blue agent will add more sophisticated rules
   */
  private getDefaultRules(): ProtectionRules {
    return {
      timeoutMs: 5000,
      inputValidators: [
        // Basic length check
        (input: any) => {
          if (input.message && input.message.length > 10000) {
            return { safe: false, reason: 'Input too long (>10000 chars)' };
          }
          return { safe: true };
        },
      ],
      inputSanitizers: [
        // Basic null byte removal
        (input: any) => {
          if (input.message && typeof input.message === 'string') {
            return { ...input, message: input.message.replace(/\0/g, '') };
          }
          return input;
        },
      ],
      outputSanitizers: [
        // Basic null byte removal from output
        (output: any) => {
          if (typeof output === 'string') {
            return output.replace(/\0/g, '');
          }
          return output;
        },
      ],
    };
  }

  /**
   * Connect to the underlying MCP server
   */
  async connect(command: string = 'node', args: string[] = ['./echo-mcp/dist/server.js']): Promise<void> {
    this.transport = new StdioClientTransport({
      command,
      args,
    });

    await this.client.connect(this.transport);
    this.isConnected = true;
    console.log('🛡️  Protective wrapper connected to MCP');
    console.log(`📋 Active rules: ${this.protectionRules.inputValidators.length} validators, ${this.protectionRules.inputSanitizers.length} sanitizers\n`);
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  /**
   * Call MCP tool with protection
   */
  async callTool(options: { name: string; arguments: any }): Promise<any> {
    // STEP 1: Validate input
    const validationResult = this.validateInput(options.arguments);
    if (!validationResult.safe) {
      throw new Error(`🛡️ Wrapper blocked: ${validationResult.reason}`);
    }

    // STEP 2: Sanitize input
    const sanitizedArgs = this.sanitizeInput(options.arguments);

    // STEP 3: Call MCP with timeout protection
    let result;
    try {
      result = await this.callWithTimeout(
        () =>
          this.client.callTool({
            name: options.name,
            arguments: sanitizedArgs,
          }),
        this.protectionRules.timeoutMs
      );
    } catch (error: any) {
      // Wrapper caught an error from MCP
      throw new Error(`🛡️ Wrapper caught MCP error: ${error.message}`);
    }

    // STEP 4: Sanitize output
    const sanitizedOutput = this.sanitizeOutput(result);

    return sanitizedOutput;
  }

  /**
   * Validate input against all validators
   */
  private validateInput(input: any): ValidationResult {
    for (const validator of this.protectionRules.inputValidators) {
      const result = validator(input);
      if (!result.safe) {
        return result;
      }
    }
    return { safe: true };
  }

  /**
   * Sanitize input using all sanitizers
   */
  private sanitizeInput(input: any): any {
    let sanitized = { ...input };
    for (const sanitizer of this.protectionRules.inputSanitizers) {
      sanitized = sanitizer(sanitized);
    }
    return sanitized;
  }

  /**
   * Sanitize output using all sanitizers
   */
  private sanitizeOutput(output: any): any {
    let sanitized = output;
    for (const sanitizer of this.protectionRules.outputSanitizers) {
      sanitized = sanitizer(sanitized);
    }
    return sanitized;
  }

  /**
   * Call function with timeout protection
   */
  private async callWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Update protection rules (called by Blue Team Agent)
   */
  updateRules(newRules: Partial<ProtectionRules>): void {
    if (newRules.timeoutMs) {
      this.protectionRules.timeoutMs = newRules.timeoutMs;
    }

    if (newRules.inputValidators) {
      this.protectionRules.inputValidators.push(...newRules.inputValidators);
    }

    if (newRules.inputSanitizers) {
      this.protectionRules.inputSanitizers.push(...newRules.inputSanitizers);
    }

    if (newRules.outputSanitizers) {
      this.protectionRules.outputSanitizers.push(...newRules.outputSanitizers);
    }

    console.log(`\n🔵 Wrapper updated!`);
    console.log(`   New validators: ${newRules.inputValidators?.length || 0}`);
    console.log(`   New input sanitizers: ${newRules.inputSanitizers?.length || 0}`);
    console.log(`   New output sanitizers: ${newRules.outputSanitizers?.length || 0}`);
    console.log(
      `   Total rules: ${this.protectionRules.inputValidators.length} validators, ${this.protectionRules.inputSanitizers.length + this.protectionRules.outputSanitizers.length} sanitizers\n`
    );
  }

  /**
   * Get current rule count
   */
  getRuleCount(): number {
    return (
      this.protectionRules.inputValidators.length +
      this.protectionRules.inputSanitizers.length +
      this.protectionRules.outputSanitizers.length
    );
  }

  /**
   * Get MCP client (for listing tools, etc.)
   */
  getClient(): Client {
    return this.client;
  }
}
