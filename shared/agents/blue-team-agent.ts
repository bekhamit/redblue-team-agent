// blue-team-agent.ts - Blue team agent that generates protective rules from vulnerabilities

import 'dotenv/config';
import { OpenAI } from 'openai';
import { TestSummary, TestResult } from './types.js';
import { ProtectionRules, ValidationResult } from './protective-wrapper.js';

interface VulnerabilityAnalysis {
  attackType: string;
  count: number;
  examples: Array<{
    input: any;
    reason: string;
  }>;
}

export class BlueTeamAgent {
  private groqClient: OpenAI;

  constructor() {
    this.groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  /**
   * Analyze test failures and generate protection rules
   */
  async analyzeAndGenerateFixes(summary: TestSummary): Promise<ProtectionRules> {
    console.log(`🔵 Blue Team Agent: Analyzing ${summary.failed} vulnerabilities...\n`);

    // Step 1: Get failed tests and analyze them
    const failedTests = summary.results.filter((r) => r.status === 'fail');
    const analysis = this.analyzeFailures(failedTests);

    // Step 2: Generate protection rules using AI
    const rules = await this.generateProtectionRules(analysis);

    console.log(`\n✅ Generated ${rules.inputValidators.length} validators and ${rules.inputSanitizers.length + rules.outputSanitizers.length} sanitizers\n`);

    return rules;
  }

  /**
   * Analyze failed tests to understand vulnerability patterns
   */
  private analyzeFailures(failedTests: TestResult[]): VulnerabilityAnalysis[] {
    // Group by attack type
    const grouped = new Map<string, VulnerabilityAnalysis>();

    for (const test of failedTests) {
      const type = test.testCase.attackType;
      if (!grouped.has(type)) {
        grouped.set(type, {
          attackType: type,
          count: 0,
          examples: [],
        });
      }

      const analysis = grouped.get(type)!;
      analysis.count++;
      analysis.examples.push({
        input: test.testCase.input,
        reason: test.reason || 'Unknown',
      });
    }

    return Array.from(grouped.values());
  }

  /**
   * Generate protection rules using Groq LLM
   */
  private async generateProtectionRules(analysis: VulnerabilityAnalysis[]): Promise<ProtectionRules> {
    const prompt = `You are a security expert. Analyze these vulnerabilities and generate TypeScript protection code.

VULNERABILITIES FOUND:
${JSON.stringify(analysis, null, 2)}

Your task: Generate protection rules as TypeScript code that can be used in validators and sanitizers.

REQUIREMENTS:
1. Input validators: Functions that return {safe: boolean, reason?: string}
2. Input sanitizers: Functions that clean/remove dangerous content
3. Output sanitizers: Functions that strip dangerous markers from responses

PATTERNS TO DETECT AND BLOCK:
- XSS: <script>, </script>, onerror=, onclick=, javascript:
- SQL Injection: DROP TABLE, UNION SELECT, '; DROP
- Path Traversal: ../, /etc/passwd
- Command Injection: ;, |, eval(, exec(
- Template Injection: {{, }}, \${

EXAMPLE OUTPUT FORMAT (respond with ONLY this JSON structure):
{
  "inputValidators": [
    {
      "name": "detectXSS",
      "code": "(input) => { if (input.message?.match(/<script|onerror=|onclick=/i)) { return { safe: false, reason: 'XSS attempt detected' }; } return { safe: true }; }"
    },
    {
      "name": "detectSQLInjection",
      "code": "(input) => { if (input.message?.match(/DROP TABLE|UNION SELECT|'; DROP/i)) { return { safe: false, reason: 'SQL injection detected' }; } return { safe: true }; }"
    }
  ],
  "inputSanitizers": [
    {
      "name": "removeScriptTags",
      "code": "(input) => { if (input.message) { return { ...input, message: input.message.replace(/<script[^>]*>.*?<\\/script>/gi, '') }; } return input; }"
    }
  ],
  "outputSanitizers": [
    {
      "name": "stripDangerousMarkers",
      "code": "(output) => { if (typeof output === 'string') { return output.replace(/<script[^>]*>.*?<\\/script>/gi, ''); } return output; }"
    }
  ]
}

Generate comprehensive protection rules based on the vulnerabilities. Return ONLY valid JSON, no extra text.`;

    try {
      const response = await this.groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a security expert specializing in generating protection rules. Respond only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for precise security rules
        max_tokens: 3000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from Groq');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️  Could not parse LLM response, using fallback rules');
        return this.getFallbackRules(analysis);
      }

      const rulesData = JSON.parse(jsonMatch[0]);

      // Convert string code to actual functions
      const protectionRules: ProtectionRules = {
        timeoutMs: 5000,
        inputValidators: rulesData.inputValidators.map((rule: any) => {
          try {
            // eslint-disable-next-line no-eval
            return eval(rule.code);
          } catch (error) {
            console.warn(`⚠️  Could not parse validator: ${rule.name}`);
            return (input: any) => ({ safe: true });
          }
        }),
        inputSanitizers: rulesData.inputSanitizers.map((rule: any) => {
          try {
            // eslint-disable-next-line no-eval
            return eval(rule.code);
          } catch (error) {
            console.warn(`⚠️  Could not parse sanitizer: ${rule.name}`);
            return (input: any) => input;
          }
        }),
        outputSanitizers: rulesData.outputSanitizers.map((rule: any) => {
          try {
            // eslint-disable-next-line no-eval
            return eval(rule.code);
          } catch (error) {
            console.warn(`⚠️  Could not parse output sanitizer: ${rule.name}`);
            return (output: any) => output;
          }
        }),
      };

      return protectionRules;
    } catch (error) {
      console.error('❌ Error generating rules with AI:', error);
      console.log('⚠️  Using fallback rules...\n');
      return this.getFallbackRules(analysis);
    }
  }

  /**
   * Fallback protection rules if LLM fails
   */
  private getFallbackRules(analysis: VulnerabilityAnalysis[]): ProtectionRules {
    const rules: ProtectionRules = {
      timeoutMs: 5000,
      inputValidators: [],
      inputSanitizers: [],
      outputSanitizers: [],
    };

    // Check if we have XSS vulnerabilities
    if (analysis.some((a) => a.attackType === 'xss')) {
      rules.inputValidators.push((input: any): ValidationResult => {
        if (input.message?.match(/<script|onerror=|onclick=|javascript:/i)) {
          return { safe: false, reason: 'XSS attempt detected' };
        }
        return { safe: true };
      });

      rules.inputSanitizers.push((input: any) => {
        if (input.message && typeof input.message === 'string') {
          return {
            ...input,
            message: input.message.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]+>/g, ''),
          };
        }
        return input;
      });
    }

    // Check if we have prompt injection vulnerabilities
    if (analysis.some((a) => a.attackType === 'prompt_injection')) {
      rules.inputValidators.push((input: any): ValidationResult => {
        if (
          input.message?.match(/DROP TABLE|UNION SELECT|'; DROP|\.\.\/|\/etc\/passwd|eval\(|exec\(/i)
        ) {
          return { safe: false, reason: 'Injection attempt detected' };
        }
        return { safe: true };
      });

      rules.inputSanitizers.push((input: any) => {
        if (input.message && typeof input.message === 'string') {
          return {
            ...input,
            message: input.message
              .replace(/DROP TABLE/gi, '')
              .replace(/UNION SELECT/gi, '')
              .replace(/\.\.\//g, '')
              .replace(/\/etc\/passwd/gi, ''),
          };
        }
        return input;
      });
    }

    // Check if we have timeout vulnerabilities
    if (analysis.some((a) => a.attackType === 'timeout')) {
      rules.inputValidators.push((input: any): ValidationResult => {
        if (input.delay && input.delay > 5000) {
          return { safe: false, reason: 'Timeout attack detected (delay > 5s)' };
        }
        return { safe: true };
      });
    }

    // Check if we have schema_break vulnerabilities
    if (analysis.some((a) => a.attackType === 'schema_break')) {
      rules.inputValidators.push((input: any): ValidationResult => {
        if (input.message?.match(/\{\{|\}\}|\$\{/)) {
          return { safe: false, reason: 'Template injection detected' };
        }
        return { safe: true };
      });

      rules.inputSanitizers.push((input: any) => {
        if (input.message && typeof input.message === 'string') {
          return {
            ...input,
            message: input.message.replace(/\{\{|\}\}|\$\{/g, ''),
          };
        }
        return input;
      });
    }

    // Check if we have path_traversal vulnerabilities (filesystem)
    if (analysis.some((a) => a.attackType === 'path_traversal')) {
      rules.inputValidators.push((input: any): ValidationResult => {
        if (input.path?.match(/\.\.|%2e|%2f|%5c|\\\.\\\.|\\\\|\.\\\//i)) {
          return { safe: false, reason: 'Path traversal detected' };
        }
        return { safe: true };
      });

      rules.inputSanitizers.push((input: any) => {
        if (input.path && typeof input.path === 'string') {
          return {
            ...input,
            path: input.path.replace(/\.\.\//g, '').replace(/\.\.\\/g, ''),
          };
        }
        return input;
      });
    }

    // Check if we have unauthorized_access vulnerabilities (filesystem)
    if (analysis.some((a) => a.attackType === 'unauthorized_access')) {
      rules.inputValidators.push((input: any): ValidationResult => {
        if (
          input.path?.match(/\/etc\/|\/root\/|\/proc\/|\/sys\/|\.ssh|\.env|\.git|authorized_keys/i)
        ) {
          return { safe: false, reason: 'Unauthorized file access detected' };
        }
        return { safe: true };
      });

      rules.inputSanitizers.push((input: any) => {
        if (input.path && typeof input.path === 'string') {
          // Block access to sensitive paths
          if (input.path.match(/\/etc\/|\/root\/|\.ssh|\.env|\.git/i)) {
            return { ...input, path: '/allowed/blocked.txt' };
          }
        }
        return input;
      });
    }

    // Check if we have file_overwrite vulnerabilities (filesystem)
    if (analysis.some((a) => a.attackType === 'file_overwrite')) {
      rules.inputValidators.push((input: any): ValidationResult => {
        if (input.content && input.path?.match(/\/etc\/|\/root\/|authorized_keys|\.bashrc/i)) {
          return { safe: false, reason: 'File overwrite attack detected' };
        }
        return { safe: true };
      });
    }

    return rules;
  }
}
