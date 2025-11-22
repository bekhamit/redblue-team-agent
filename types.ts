// types.ts - Shared types for red team testing

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input: {
    message: string;
    delay?: number;
  };
  expectedOutcome: 'pass' | 'fail';
  attackType: 'prompt_injection' | 'xss' | 'timeout' | 'schema_break' | 'normal';
}

export interface TestResult {
  testCase: TestCase;
  status: 'pass' | 'fail';
  reason?: string;
  actualOutput?: any;
  executionTime: number;
  error?: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  results: TestResult[];
}

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}
